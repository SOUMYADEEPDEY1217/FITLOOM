"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldAlert,
  ShoppingBag,
  Truck,
} from "lucide-react";
import {
  CheckoutCustomerInput,
  CheckoutCustomerSchema,
  CheckoutFieldKey,
  DEMO_PAYMENT_METHODS,
  DemoPaymentMethod,
  validateCartItems,
} from "@/lib/checkout-utils";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FIELD_ORDER: CheckoutFieldKey[] = [
  "fullName",
  "email",
  "phone",
  "street",
  "city",
  "state",
  "pincode",
];

export default function CheckoutPage() {
  const router = useRouter();
  const {
    user,
    cart,
    eligibleCustomerGarments,
    placeMockOrder,
    toast,
  } = useFitloom();

  const cartValidation = useMemo(
    () => validateCartItems(cart, eligibleCustomerGarments),
    [cart, eligibleCustomerGarments]
  );

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customer, setCustomer] = useState<CheckoutCustomerInput>(() => ({
    fullName: user.role !== "guest" ? user.name : "",
    email: user.role !== "guest" ? user.email : "",
    phone: user.role !== "guest" && user.phone ? user.phone : "",
    street: "42 Park Street, Ballygunge",
    city: user.role !== "guest" && user.city ? user.city : "",
    state: "West Bengal",
    pincode: "700019",
  }));
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<CheckoutFieldKey, string>>
  >({});
  const [paymentMethod, setPaymentMethod] = useState<DemoPaymentMethod>(
    DEMO_PAYMENT_METHODS[0]
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submittedOrderRef = useRef(false);

  function updateField(key: CheckoutFieldKey, value: string) {
    setCustomer((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleValidateAndContinue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = CheckoutCustomerSchema.safeParse(customer);

    if (!parsed.success) {
      const nextErrors: Partial<Record<CheckoutFieldKey, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as CheckoutFieldKey | undefined;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);

      const firstInvalidKey = FIELD_ORDER.find((k) => Boolean(nextErrors[k]));
      if (firstInvalidKey) {
        const el = document.getElementById(`checkout-${firstInvalidKey}`);
        el?.focus();
      }
      toast({
        type: "warning",
        title: "Check Delivery Details",
        message: "Please resolve the highlighted customer and address fields.",
      });
      return;
    }

    setCustomer(parsed.data);
    setFieldErrors({});
    setStep(2);
  }

  function handlePlaceDemoOrder() {
    if (isSubmitting || submittedOrderRef.current) return;

    const parsed = CheckoutCustomerSchema.safeParse(customer);
    if (!parsed.success) {
      setStep(1);
      handleValidateAndContinue({
        preventDefault: () => {},
      } as React.FormEvent<HTMLFormElement>);
      return;
    }

    if (!cartValidation.isValid) {
      setSubmitError(
        cartValidation.issues[0]?.reason ??
          "Your shopping bag is empty or contains invalid items."
      );
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    submittedOrderRef.current = true;

    const result = placeMockOrder({
      customerName: parsed.data.fullName,
      customerEmail: parsed.data.email,
      customerPhone: parsed.data.phone,
      shippingAddress: parsed.data.street,
      shippingCity: parsed.data.city,
      shippingState: parsed.data.state,
      shippingPincode: parsed.data.pincode,
      paymentLabel: paymentMethod,
    });

    if (!result.ok) {
      submittedOrderRef.current = false;
      setIsSubmitting(false);
      setSubmitError(result.error);
      toast({
        type: "error",
        title: "Checkout Blocked",
        message: result.error,
      });
      return;
    }

    toast({
      type: "success",
      title: "Demo Order Created",
      message: `Order ${result.order.id} placed in session history (no real charge).`,
    });

    router.push(`/orders/${encodeURIComponent(result.order.id)}?new=1`);
  }

  // 1. Guest Guard
  if (user.role === "guest") {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-violet-200 bg-white/95 p-8 text-center shadow-xs">
        <Lock
          className="mx-auto h-9 w-9 text-[#6633EE]"
          aria-hidden="true"
        />
        <h1 className="mt-3 text-2xl font-extrabold text-slate-950">
          Sign In to Complete Checkout
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to a customer demo account so your order is linked to your
          customer Order History and protected from cross-account access.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/auth/login">
            <Button>Sign In to Continue</Button>
          </Link>
          <Link href="/cart">
            <Button variant="outline">Back to Bag</Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Empty Cart Blocker (BUG-002)
  if (cartValidation.isEmpty) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-amber-300 bg-white/95 p-8 text-center shadow-xs sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <ShoppingBag className="h-7 w-7" aria-hidden="true" />
        </div>
        <Badge variant="amber" className="mt-4">
          Empty Shopping Bag
        </Badge>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-950">
          Cannot Proceed to Checkout
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your shopping bag is currently empty. Add garments with an explicitly
          chosen size before accessing checkout.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/shop">
            <Button>
              Browse Shop Catalogue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="outline">View Shopping Bag</Button>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Invalid Product / Size Blocker
  if (!cartValidation.isValid) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-xl space-y-5 rounded-3xl border border-red-200 bg-white/95 p-8 text-center shadow-xs"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-950">
          Bag Validation Failed
        </h1>
        <p className="text-sm text-slate-600">
          Checkout is blocked because one or more items in your bag have an
          unavailable product or size:
        </p>
        <ul className="space-y-1.5 rounded-2xl border border-red-100 bg-red-50/70 p-4 text-left text-xs font-semibold text-red-800">
          {cartValidation.issues.map((issue) => (
            <li key={issue.itemId}>• {issue.reason}</li>
          ))}
        </ul>
        <Link href="/cart" className="inline-block">
          <Button>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Return to Bag &amp; Fix Items
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Progress */}
      <header className="border-b border-violet-100 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            Checkout
          </h1>
          <Badge variant="amber">
            Demo Checkout — No Real Payment Collected
          </Badge>
        </div>

        <nav aria-label="Checkout progress" className="mt-4">
          <ol className="flex flex-wrap gap-2 text-xs font-bold">
            {[
              { id: 1, label: "1. Delivery Details" },
              { id: 2, label: "2. Delivery & Demo Payment" },
              { id: 3, label: "3. Review & Place Order" },
            ].map((item) => {
              const isCurrent = step === item.id;
              const isCompleted = step > item.id;
              return (
                <li
                  key={item.id}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 transition-colors",
                    isCurrent
                      ? "bg-[#6633EE] text-white"
                      : isCompleted
                      ? "bg-violet-100 text-[#4C1D95]"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {item.label}
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: Checkout Steps */}
        <div className="min-w-0 space-y-6 lg:col-span-7">
          {step === 1 && (
            <form
              aria-labelledby="checkout-address-heading"
              onSubmit={handleValidateAndContinue}
              noValidate
              className="space-y-5 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6"
            >
              <div>
                <h2
                  id="checkout-address-heading"
                  className="flex items-center gap-2 text-lg font-extrabold text-slate-950"
                >
                  <Truck
                    className="h-4 w-4 text-[#6633EE]"
                    aria-hidden="true"
                  />
                  Customer &amp; Delivery Address
                </h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  All fields marked with <span className="text-red-500">*</span>{" "}
                  are required for this demo order record.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="checkout-fullName"
                    className="block text-xs font-bold text-slate-800"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="checkout-fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={customer.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    aria-describedby={
                      fieldErrors.fullName
                        ? "checkout-fullName-err"
                        : undefined
                    }
                  />
                  {fieldErrors.fullName && (
                    <p
                      id="checkout-fullName-err"
                      role="alert"
                      className="text-xs font-medium text-red-600"
                    >
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="checkout-email"
                    className="block text-xs font-bold text-slate-800"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="checkout-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    value={customer.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={
                      fieldErrors.email ? "checkout-email-err" : undefined
                    }
                  />
                  {fieldErrors.email && (
                    <p
                      id="checkout-email-err"
                      role="alert"
                      className="text-xs font-medium text-red-600"
                    >
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-bold text-slate-800"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  id="checkout-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={customer.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={
                    fieldErrors.phone ? "checkout-phone-err" : undefined
                  }
                />
                {fieldErrors.phone && (
                  <p
                    id="checkout-phone-err"
                    role="alert"
                    className="text-xs font-medium text-red-600"
                  >
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="checkout-street"
                  className="block text-xs font-bold text-slate-800"
                >
                  Shipping Street Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="checkout-street"
                  name="street"
                  rows={2}
                  autoComplete="street-address"
                  required
                  value={customer.street}
                  onChange={(e) => updateField("street", e.target.value)}
                  aria-invalid={Boolean(fieldErrors.street)}
                  aria-describedby={
                    fieldErrors.street ? "checkout-street-err" : undefined
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#6633EE] focus:outline-none focus:ring-2 focus:ring-[#6633EE]/20"
                />
                {fieldErrors.street && (
                  <p
                    id="checkout-street-err"
                    role="alert"
                    className="text-xs font-medium text-red-600"
                  >
                    {fieldErrors.street}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="checkout-city"
                    className="block text-xs font-bold text-slate-800"
                  >
                    City <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="checkout-city"
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    required
                    value={customer.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    aria-invalid={Boolean(fieldErrors.city)}
                    aria-describedby={
                      fieldErrors.city ? "checkout-city-err" : undefined
                    }
                  />
                  {fieldErrors.city && (
                    <p
                      id="checkout-city-err"
                      role="alert"
                      className="text-xs font-medium text-red-600"
                    >
                      {fieldErrors.city}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="checkout-state"
                    className="block text-xs font-bold text-slate-800"
                  >
                    State <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="checkout-state"
                    name="state"
                    type="text"
                    autoComplete="address-level1"
                    required
                    value={customer.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    aria-invalid={Boolean(fieldErrors.state)}
                    aria-describedby={
                      fieldErrors.state ? "checkout-state-err" : undefined
                    }
                  />
                  {fieldErrors.state && (
                    <p
                      id="checkout-state-err"
                      role="alert"
                      className="text-xs font-medium text-red-600"
                    >
                      {fieldErrors.state}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="checkout-pincode"
                    className="block text-xs font-bold text-slate-800"
                  >
                    PIN / Postal Code <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="checkout-pincode"
                    name="pincode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    required
                    value={customer.pincode}
                    onChange={(e) => updateField("pincode", e.target.value)}
                    aria-invalid={Boolean(fieldErrors.pincode)}
                    aria-describedby={
                      fieldErrors.pincode ? "checkout-pincode-err" : undefined
                    }
                  />
                  {fieldErrors.pincode && (
                    <p
                      id="checkout-pincode-err"
                      role="alert"
                      className="text-xs font-medium text-red-600"
                    >
                      {fieldErrors.pincode}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link href="/cart">
                  <Button type="button" variant="outline">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Back to Bag
                  </Button>
                </Link>
                <Button type="submit">
                  Proceed to Delivery &amp; Demo Payment
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-5 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6">
              <div
                role="note"
                className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950"
              >
                <ShieldAlert
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <div className="space-y-0.5 leading-relaxed">
                  <p className="font-extrabold">
                    Demo Payment Notice — No Credentials Requested
                  </p>
                  <p>
                    No payment gateway is connected. FITLOOM never requests card
                    numbers, CVV, UPI PINs, or banking credentials, and zero
                    money is charged.
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs">
                <p className="font-bold text-slate-900">
                  Delivery Method (Mock Flow)
                </p>
                <p className="text-slate-600">
                  Standard Demo Dispatch — No external shipping fee or carrier
                  integration in this frontend demo.
                </p>
              </div>

              <fieldset className="space-y-3">
                <legend className="flex items-center gap-2 text-base font-extrabold text-slate-950">
                  <CreditCard
                    className="h-4 w-4 text-[#6633EE]"
                    aria-hidden="true"
                  />
                  Select Demo Payment Option
                </legend>
                <div className="grid gap-2.5">
                  {DEMO_PAYMENT_METHODS.map((method) => {
                    const checked = paymentMethod === method;
                    return (
                      <label
                        key={method}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-sm font-semibold transition-colors",
                          checked
                            ? "border-[#6633EE] bg-violet-50/70 text-slate-950"
                            : "border-slate-200 bg-white text-slate-800 hover:border-violet-300"
                        )}
                      >
                        <input
                          type="radio"
                          name="demoPaymentMethod"
                          value={method}
                          checked={checked}
                          onChange={() => setPaymentMethod(method)}
                          className="h-4 w-4 accent-[#6633EE]"
                        />
                        <span>{method}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex flex-wrap justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Edit Address
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  Review &amp; Confirm Order
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 rounded-3xl border border-violet-200/90 bg-white/95 p-5 shadow-xs sm:p-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-950">
                  Final Order Review
                </h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  Confirm your delivery address and demo payment selection before
                  creating a session order.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <span className="font-bold uppercase tracking-wider text-slate-500">
                    Deliver To
                  </span>
                  <p className="pt-1 font-extrabold text-slate-950">
                    {customer.fullName}
                  </p>
                  <p className="text-slate-700 break-words">
                    {customer.street}
                  </p>
                  <p className="text-slate-700">
                    {customer.city}, {customer.state} – {customer.pincode}
                  </p>
                  <p className="pt-1 text-slate-600">
                    {customer.phone} · {customer.email}
                  </p>
                </div>

                <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <span className="font-bold uppercase tracking-wider text-slate-500">
                    Demo Payment &amp; Dispatch
                  </span>
                  <p className="pt-1 font-extrabold text-slate-950">
                    {paymentMethod}
                  </p>
                  <p className="text-slate-600">
                    Frontend simulation only — ₹0 real transaction.
                  </p>
                  <p className="pt-1 text-slate-700">
                    Total Payable (Demo):{" "}
                    <strong>
                      ₹{cartValidation.subtotalInr.toLocaleString("en-IN")}
                    </strong>
                  </p>
                </div>
              </div>

              {submitError && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700"
                >
                  {submitError}
                </p>
              )}

              <div className="flex flex-wrap justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to Payment
                </Button>
                <Button
                  type="button"
                  size="lg"
                  disabled={isSubmitting}
                  onClick={handlePlaceDemoOrder}
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {isSubmitting
                    ? "Placing Demo Order..."
                    : `Place Demo Order (₹${cartValidation.subtotalInr.toLocaleString(
                        "en-IN"
                      )})`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Always-visible Order Summary */}
        <aside
          aria-labelledby="checkout-review-heading"
          className="h-fit space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xs sm:p-6 lg:col-span-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2
              id="checkout-review-heading"
              className="text-base font-extrabold text-slate-950"
            >
              Order Review ({cartValidation.totalUnits})
            </h2>
            <Link
              href="/cart"
              className="text-xs font-semibold text-[#6633EE] hover:underline"
            >
              Edit Bag
            </Link>
          </div>

          <ul className="divide-y divide-slate-100 text-xs">
            {cartValidation.resolvedItems.map(({ item }) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 py-3 first:pt-0"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate font-bold text-slate-950">
                    {item.name}
                  </p>
                  <p className="text-slate-600">
                    Size: <strong>{item.size}</strong> · Qty: {item.quantity} ·
                    ₹{item.priceInr.toLocaleString("en-IN")} each
                  </p>
                  {item.tailorName && (
                    <p className="text-[11px] text-[#4C1D95]">
                      {item.tailorName}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-extrabold text-slate-950">
                  ₹{(item.priceInr * item.quantity).toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal</span>
              <span>
                ₹{cartValidation.subtotalInr.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Shipping &amp; Taxes</span>
              <span>Excluded in demo</span>
            </div>
            <div className="flex justify-between pt-1 text-base font-extrabold text-[#6633EE]">
              <span>Final Payable (Demo)</span>
              <span>
                ₹{cartValidation.subtotalInr.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
