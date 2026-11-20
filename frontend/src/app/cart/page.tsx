"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Info,
  Minus,
  Palette,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { validateCartItems } from "@/lib/checkout-utils";
import { useFitloom } from "@/components/providers/fitloom-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const {
    cart,
    eligibleCustomerGarments,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartCount,
    toast,
  } = useFitloom();

  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const validation = useMemo(
    () => validateCartItems(cart, eligibleCustomerGarments),
    [cart, eligibleCustomerGarments]
  );

  function handleDecreaseQty(id: string, name: string, currentQty: number) {
    updateCartQty(id, -1);
    if (currentQty <= 1) {
      toast({
        type: "info",
        title: "Item Removed",
        message: `${name} removed from your shopping bag.`,
      });
    }
  }

  function handleIncreaseQty(id: string, name: string, currentQty: number) {
    if (currentQty >= 10) {
      toast({
        type: "info",
        title: "Maximum Quantity Reached",
        message: `Demo bag supports up to 10 units per line item (${name}).`,
      });
      return;
    }
    updateCartQty(id, 1);
  }

  function handleRemoveItem(id: string, name: string) {
    removeFromCart(id);
    toast({
      type: "info",
      title: "Removed from Bag",
      message: `${name} removed from your shopping bag.`,
    });
  }

  function handleClearCart() {
    clearCart();
    toast({
      type: "info",
      title: "Shopping Bag Cleared",
      message: "All items removed from your session shopping bag.",
    });
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-violet-100 pb-6 sm:flex-row sm:items-end">
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            Your Shopping Bag {cartCount > 0 ? `(${cartCount})` : ""}
          </h1>
          <p className="text-sm text-slate-600">
            Review garments, exact selected sizes, unit prices, and quantities
            before proceeding to demo checkout.
          </p>
        </div>

        {!validation.isEmpty && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearCart}
            className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear Bag
          </Button>
        )}
      </header>

      {/* Empty Cart */}
      {validation.isEmpty ? (
        <div className="rounded-3xl border border-dashed border-violet-200 bg-white/90 p-10 text-center shadow-2xs sm:p-12">
          <ShoppingBag
            className="mx-auto h-10 w-10 text-violet-300"
            aria-hidden="true"
          />
          <h2 className="mt-3 text-lg font-extrabold text-slate-950">
            Your shopping bag is empty
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Explore ready-to-wear silhouettes in the Shop, evaluate your fit in
            Fit Intelligence, or configure a CUSTOMFIT piece.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/shop">
              <Button>
                Browse Shop Catalogue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/saved-looks">
              <Button variant="outline">View Saved Looks</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-12">
          {/* Cart Items */}
          <section
            aria-label="Shopping bag items"
            className="min-w-0 space-y-4 lg:col-span-8"
          >
            {!validation.isValid && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800"
              >
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <p className="font-extrabold">
                    Action Needed Before Checkout
                  </p>
                  <p>
                    One or more items in your bag have an unavailable product or
                    size. FITLOOM preserves your original selection and will not
                    auto-switch sizes — remove the flagged item or choose a
                    valid size from Product Details.
                  </p>
                </div>
              </div>
            )}

            {validation.resolvedItems.map(
              ({ item, garment, isValid, error }) => {
                const showImg =
                  Boolean(garment?.image) &&
                  !failedImages[garment?.id ?? item.garmentId];
                const lineSubtotal = item.priceInr * item.quantity;

                return (
                  <article
                    key={item.id}
                    className={cn(
                      "rounded-3xl border bg-white/95 p-4 shadow-2xs sm:p-5",
                      isValid
                        ? "border-slate-200/80"
                        : "border-red-300 bg-red-50/20"
                    )}
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          {showImg && garment?.image ? (
                            <Image
                              src={garment.image}
                              alt={`${item.name} garment preview`}
                              fill
                              sizes="80px"
                              onError={() =>
                                setFailedImages((prev) => ({
                                  ...prev,
                                  [garment.id]: true,
                                }))
                              }
                              className="object-cover object-top"
                            />
                          ) : (
                            <div
                              className="flex h-full w-full items-center justify-center"
                              style={{
                                backgroundColor: garment?.swatchHex || "#EDE9FE",
                              }}
                            >
                              <Palette
                                className="h-5 w-5 text-slate-700/70"
                                aria-hidden="true"
                              />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-base font-extrabold text-slate-950">
                              {garment ? (
                                <Link
                                  href={`/shop/${encodeURIComponent(
                                    garment.id
                                  )}`}
                                  className="hover:text-[#6633EE] hover:underline"
                                >
                                  {item.name}
                                </Link>
                              ) : (
                                item.name
                              )}
                            </h2>
                            <Badge
                              variant={
                                !isValid
                                  ? "destructive"
                                  : item.size === "CUSTOMFIT"
                                  ? "default"
                                  : "neutral"
                              }
                              size="sm"
                            >
                              Size: {item.size}
                            </Badge>
                          </div>

                          <p className="text-xs text-slate-600">
                            {garment ? `${garment.category} · ` : ""}Unit
                            Price: ₹{item.priceInr.toLocaleString("en-IN")}
                          </p>

                          {item.tailorName && (
                            <p className="text-xs font-medium text-[#4C1D95]">
                              Tailor: {item.tailorName}
                              {item.customFitNotes
                                ? ` · ${item.customFitNotes}`
                                : ""}
                            </p>
                          )}

                          <p className="pt-0.5 text-sm font-extrabold text-slate-950">
                            Item Subtotal: ₹
                            {lineSubtotal.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white">
                          <button
                            type="button"
                            aria-label={`Decrease quantity for ${item.name}`}
                            onClick={() =>
                              handleDecreaseQty(
                                item.id,
                                item.name,
                                item.quantity
                              )
                            }
                            className="cursor-pointer rounded-l-xl p-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span
                            aria-label={`Quantity: ${item.quantity}`}
                            className="min-w-[2.25rem] px-2 text-center text-sm font-bold text-slate-950"
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity for ${item.name}`}
                            onClick={() =>
                              handleIncreaseQty(
                                item.id,
                                item.name,
                                item.quantity
                              )
                            }
                            className="cursor-pointer rounded-r-xl p-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6633EE]"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${item.name} from bag`}
                          onClick={() => handleRemoveItem(item.id, item.name)}
                        >
                          <Trash2
                            className="h-4 w-4 text-red-600"
                            aria-hidden="true"
                          />
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-800"
                      >
                        <span>{error}</span>
                        {garment && (
                          <Link
                            href={`/shop/${encodeURIComponent(garment.id)}`}
                            className="underline hover:text-red-950"
                          >
                            Select valid size on Product Details →
                          </Link>
                        )}
                      </div>
                    )}
                  </article>
                );
              }
            )}
          </section>

          {/* Order Summary */}
          <aside
            aria-labelledby="cart-summary-heading"
            className="h-fit space-y-5 rounded-3xl border border-violet-200/80 bg-white/95 p-6 shadow-xs lg:col-span-4"
          >
            <h2
              id="cart-summary-heading"
              className="text-lg font-extrabold text-slate-950"
            >
              Order Summary
            </h2>

            <div className="space-y-2.5 border-b border-slate-100 pb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">
                  Items ({validation.totalUnits})
                </span>
                <span className="font-semibold text-slate-900">
                  ₹{validation.subtotalInr.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Shipping / Taxes / Discounts</span>
                <span>Not calculated in demo</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-extrabold text-slate-950">
              <span>Total</span>
              <span>₹{validation.subtotalInr.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/50 p-3 text-[11px] leading-relaxed text-slate-600">
              <Info
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6633EE]"
                aria-hidden="true"
              />
              <span>
                Frontend demo bag only. No shipping fee, tax rate, or real
                payment gateway is connected.
              </span>
            </div>

            {validation.isValid ? (
              <Link href="/checkout" className="block">
                <Button size="lg" className="w-full">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            ) : (
              <Button type="button" size="lg" className="w-full" disabled>
                Fix Bag Issues to Checkout
              </Button>
            )}

            <Link
              href="/shop"
              className="block text-center text-xs font-semibold text-[#6633EE] hover:underline"
            >
              Continue Shopping →
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
