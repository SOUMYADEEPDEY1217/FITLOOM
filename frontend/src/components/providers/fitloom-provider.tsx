"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BodyProfile,
  BodyProfileSchema,
  BodyType,
  FitPreference,
  INITIAL_MOCK_BODY_PROFILE,
  MOCK_GARMENTS,
  type MockGarment,
} from "@/lib/mock-data";
import {
  api,
  ApiError,
  type UserMeResponse,
  type BodyProfilePayload,
  type BodyProfileResponse,
  type AvatarStatusResponse,
  type AvatarPresetResponse,
} from "@/lib/api";
import {
  ToastInput,
  ToastItem,
  ToastViewport,
} from "@/components/ui/toast";
import { buildValidatedMockOrder } from "@/lib/checkout-utils";
import {
  MAX_COMPARE_ITEMS,
  toggleCompareIds,
  toggleWishlistIds,
} from "@/lib/compare-wishlist-utils";
import {
  INITIAL_TAILOR_WORKSHOP_PROFILE,
  type TailorWorkshopProfile,
  type TailorWorkshopProfileInput,
  TailorWorkshopProfileSchema,
  isOrderOwnedByTailorWorkshop,
  validateTailorAcceptOrder,
  validateTailorAdvanceStage,
  validateTailorRejectOrder,
} from "@/lib/tailor-workspace-utils";
import {
  type SellerCatalogProduct,
  type SellerProductFormInput,
  type SellerProductStatus,
  SellerProductFormSchema,
  buildInitialSellerProducts,
  generateUniqueProductId,
  isProductOwnedBySeller,
  isProductReferencedByOrders,
  resolveSellerId,
  selectEligibleCustomerGarments,
  validateSellerAdvanceStandardOrder,
  validateSellerCancelStandardOrder,
} from "@/lib/seller-workspace-utils";
import {
  type AdminAuditEntry,
  type CatalogModerationAction,
  type DemoPartnerRecord,
  AdminOversightNoteSchema,
  buildInitialPartners,
  evaluatePartnerSuspension,
  findMatchingPartnerForUser,
  validateCatalogModerationAction,
  validatePartnerTransition,
} from "@/lib/admin-workspace-utils";

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export type MockRole = "guest" | "customer" | "seller" | "tailor" | "admin";

export interface MockUser {
  id?: string;
  name: string;
  email: string;
  role: MockRole;
  phone?: string;
  city?: string;
  memberSince?: string;
  capabilities?: string[];
  partners?: Array<{
    type: string;
    verificationStatus: string;
    operationalStatus: string;
  }>;
}

export interface MockCartItem {
  id: string;
  garmentId: string;
  name: string;
  size: "S" | "M" | "L" | "XL" | "CUSTOMFIT";
  priceInr: number;
  quantity: number;
  customFitNotes?: string;
  customFitMeasurements?: BodyProfile;
  tailorName?: string;
}

export interface MockSavedLook {
  id: string;
  title: string;
  garmentIds: string[];
  createdAt: string;
  source: "Style Studio" | "Virtual Try-On (Mock)";
}

export type OrderStage =
  | "Pending Tailor Acceptance"
  | "Placed"
  | "Cutting"
  | "Stitching in Progress"
  | "Quality Check"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Rejected by Tailor"
  | "Return Requested";

export interface MockOrder {
  id: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt: string;
  items: MockCartItem[];
  totalInr: number;
  shippingCity: string;
  shippingAddress?: string;
  shippingState?: string;
  shippingPincode?: string;
  paymentLabel?: string;
  isCustomFit: boolean;
  tailorName?: string;
  stage: OrderStage;
  rejectionReason?: string;
  cancelOrReturnReason?: string;
  measurementsSnapshot?: BodyProfile;
}

export interface PlaceMockOrderInput {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingCity: string;
  shippingState?: string;
  shippingPincode?: string;
  paymentLabel: string;
}

export type PlaceMockOrderResult =
  | { ok: true; order: MockOrder }
  | { ok: false; error: string };

interface FitloomContextValue {
  user: MockUser;
  loginMock: (user: MockUser) => void;
  logoutMock: () => void;
  switchRole: (role: MockRole) => void;
  updateUserProfile: (
    updates: Partial<Pick<MockUser, "name" | "email" | "phone" | "city">>
  ) => { ok: boolean; error?: string };

  signIn: (
    email: string,
    password: string
  ) => Promise<{
    ok: boolean;
    error?: string;
    fieldErrors?: Record<string, string>;
  }>;
  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<{
    ok: boolean;
    error?: string;
    fieldErrors?: Record<string, string>;
  }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isLoadingAuth: boolean;

  avatarId: string | null;
  avatarAssets: {
    apose: string;
    tpose: string;
    measurements: string;
  } | null;
  avatarServiceOffline: boolean;
  isGeneratingAvatar: boolean;
  checkAvatarStatus: () => Promise<boolean>;
  generateAvatarPreset: (
    gender?: "female" | "male" | "neutral"
  ) => Promise<{ ok: boolean; error?: string; avatarId?: string }>;

  bodyProfile: BodyProfile;
  hasBodyProfile: boolean;
  measurementHistory: Array<{ date: string; chestCm: number; waistCm: number; note: string }>;
  updateBodyProfile: (
    next: BodyProfile,
    note?: string
  ) => Promise<{
    ok: boolean;
    error?: string;
    fieldErrors?: Partial<Record<string, string>>;
  }>;
  updateFitPreference: (fitPreference: FitPreference) => { ok: boolean; error?: string };
  clearBodyProfile: () => void;

  cart: MockCartItem[];
  addToCart: (item: Omit<MockCartItem, "id" | "quantity">) => void;
  updateCartQty: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;

  wishlistIds: string[];
  toggleWishlist: (garmentId: string) => void;
  clearWishlist: () => void;
  pruneInvalidWishlistRefs: () => void;

  savedLooks: MockSavedLook[];
  saveLook: (look: Omit<MockSavedLook, "id" | "createdAt">) => MockSavedLook;
  updateSavedLook: (
    id: string,
    updates: Omit<MockSavedLook, "id" | "createdAt">
  ) => void;
  deleteSavedLook: (id: string) => void;

  compareIds: string[];
  toggleCompare: (garmentId: string) => void;
  clearCompare: () => void;
  pruneInvalidCompareRefs: () => void;

  orders: MockOrder[];
  placeMockOrder: (input: PlaceMockOrderInput) => PlaceMockOrderResult;
  cancelMockOrder: (orderId: string, reason: string) => void;
  requestReturnMockOrder: (orderId: string, reason: string) => void;
  tailorAcceptOrder: (orderId: string) => {
    ok: boolean;
    error?: string;
    stage?: OrderStage;
  };
  tailorRejectOrder: (
    orderId: string,
    reason: string
  ) => {
    ok: boolean;
    error?: string;
    stage?: OrderStage;
  };
  advanceOrderStage: (
    orderId: string,
    stage: OrderStage
  ) => {
    ok: boolean;
    error?: string;
    stage?: OrderStage;
  };
  tailorWorkshopProfile: TailorWorkshopProfile;
  updateTailorWorkshopProfile: (input: TailorWorkshopProfileInput) => {
    ok: boolean;
    error?: string;
    fieldErrors?: Partial<Record<keyof TailorWorkshopProfileInput, string>>;
    profile?: TailorWorkshopProfile;
  };

  sellerProducts: SellerCatalogProduct[];
  eligibleCustomerGarments: MockGarment[];
  createSellerProduct: (input: SellerProductFormInput) => {
    ok: boolean;
    error?: string;
    fieldErrors?: Partial<Record<keyof SellerProductFormInput, string>>;
    product?: SellerCatalogProduct;
  };
  updateSellerProduct: (
    productId: string,
    input: SellerProductFormInput
  ) => {
    ok: boolean;
    error?: string;
    fieldErrors?: Partial<Record<keyof SellerProductFormInput, string>>;
    product?: SellerCatalogProduct;
  };
  setSellerProductStatus: (
    productId: string,
    status: SellerProductStatus
  ) => { ok: boolean; error?: string; product?: SellerCatalogProduct };
  deleteSellerProduct: (
    productId: string
  ) => { ok: boolean; error?: string; archivedInstead?: boolean };
  advanceSellerOrderStage: (
    orderId: string,
    stage: OrderStage
  ) => { ok: boolean; error?: string; stage?: OrderStage };
  cancelSellerStandardOrder: (
    orderId: string,
    reason: string
  ) => { ok: boolean; error?: string };

  partners: DemoPartnerRecord[];
  adminAuditLog: AdminAuditEntry[];
  verifyPartnerDemo: (
    partnerId: string
  ) => { ok: boolean; error?: string };
  rejectPartnerDemo: (
    partnerId: string,
    reason: string
  ) => { ok: boolean; error?: string };
  suspendPartnerDemo: (
    partnerId: string,
    reason: string
  ) => { ok: boolean; error?: string };
  reactivatePartnerDemo: (
    partnerId: string
  ) => { ok: boolean; error?: string };
  moderateCatalogProduct: (
    productId: string,
    action: CatalogModerationAction,
    reason?: string
  ) => { ok: boolean; error?: string };
  logAdminOrderOversightNote: (
    orderId: string,
    note: string
  ) => { ok: boolean; error?: string };

  toasts: ToastItem[];
  toast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
}

const FitloomContext = createContext<FitloomContextValue | null>(null);

const INITIAL_ORDERS: MockOrder[] = [
  {
    id: "FT-1042",
    customerId: "customer-riya-demo",
    customerName: "Riya S.",
    createdAt: "2026-11-15",
    items: [
      {
        id: "item-init-1",
        garmentId: "sky-oxford-shirt",
        name: "Sky Oxford Shirt",
        size: "CUSTOMFIT",
        priceInr: 1949,
        quantity: 1,
        customFitNotes: "Slightly tapered waist (-2 cm)",
        tailorName: "Atelier Arjun & Co.",
      },
    ],
    totalInr: 1949,
    shippingCity: "Kolkata",
    isCustomFit: true,
    tailorName: "Atelier Arjun & Co.",
    stage: "Stitching in Progress",
    measurementsSnapshot: INITIAL_MOCK_BODY_PROFILE,
  },
  {
    id: "FT-1043",
    customerId: "customer-arjun-k",
    customerName: "Arjun K.",
    createdAt: "2026-11-16",
    items: [
      {
        id: "item-init-2",
        garmentId: "classic-navy-shirt",
        name: "Classic Navy Shirt",
        size: "CUSTOMFIT",
        priceInr: 1849,
        quantity: 1,
        customFitNotes: "Slim sleeve cuff",
        tailorName: "Atelier Arjun & Co.",
      },
    ],
    totalInr: 1849,
    shippingCity: "Mumbai",
    isCustomFit: true,
    tailorName: "Atelier Arjun & Co.",
    stage: "Pending Tailor Acceptance",
    measurementsSnapshot: INITIAL_MOCK_BODY_PROFILE,
  },
  {
    id: "FT-1044",
    customerId: "customer-riya-demo",
    customerName: "Riya S.",
    createdAt: "2026-11-10",
    items: [
      {
        id: "item-init-3",
        garmentId: "olive-linen-shirt",
        name: "Olive Linen Shirt",
        size: "M",
        priceInr: 1299,
        quantity: 1,
      },
    ],
    totalInr: 1299,
    shippingCity: "Kolkata",
    isCustomFit: false,
    stage: "Delivered",
  },
];

export function applyClearBodyProfileReset(currentProfile: BodyProfile): BodyProfile {
  return {
    ...INITIAL_MOCK_BODY_PROFILE,
    fitPreference: currentProfile.fitPreference,
  };
}

export function applyFitPreferenceChange(params: {
  bodyProfile: BodyProfile;
  hasBodyProfile: boolean;
  fitPreference: FitPreference;
}): {
  bodyProfile: BodyProfile;
  hasBodyProfile: boolean;
} {
  return {
    bodyProfile: {
      ...params.bodyProfile,
      fitPreference: params.fitPreference,
    },
    hasBodyProfile: params.hasBodyProfile,
  };
}

/**
 * Returns orders associated with the currently active user session.
 */
export function getCustomerOrders(
  orders: MockOrder[],
  user: MockUser
): MockOrder[] {
  if (user.role === "guest") return [];
  const activeId =
    user.id ?? (user.email ? `user-${user.email.trim().toLowerCase()}` : "");
  const normalizedName = user.name.trim().toLowerCase();

  return orders.filter((order) => {
    if (order.customerId && activeId) {
      return order.customerId === activeId;
    }
    return (
      Boolean(normalizedName) &&
      order.customerName.trim().toLowerCase() === normalizedName
    );
  });
}

export function FitloomProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser>({
    id: undefined,
    name: "Guest",
    email: "",
    role: "guest",
  });
  const [bodyProfile, setBodyProfile] = useState<BodyProfile>(
    INITIAL_MOCK_BODY_PROFILE
  );
  const [hasBodyProfile, setHasBodyProfile] = useState<boolean>(true);
  const [measurementHistory, setMeasurementHistory] = useState([
    {
      date: "2026-11-17",
      chestCm: INITIAL_MOCK_BODY_PROFILE.chestCm,
      waistCm: INITIAL_MOCK_BODY_PROFILE.waistCm,
      note: "Initial Demo Calibration",
    },
  ]);
  const [cart, setCart] = useState<MockCartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([
    "sky-oxford-shirt",
    "structured-atelier-bomber",
  ]);
  const [savedLooks, setSavedLooks] = useState<MockSavedLook[]>([
    {
      id: "look-01",
      title: "Atelier Smart Casual",
      garmentIds: ["sky-oxford-shirt", "architectural-pleated-trouser"],
      createdAt: "2026-11-16",
      source: "Style Studio",
    },
  ]);
  const [compareIds, setCompareIds] = useState<string[]>([
    "sky-oxford-shirt",
    "olive-linen-shirt",
    "classic-navy-shirt",
  ]);
  const [orders, setOrders] = useState<MockOrder[]>(INITIAL_ORDERS);
  const [tailorWorkshopProfile, setTailorWorkshopProfile] =
    useState<TailorWorkshopProfile>(INITIAL_TAILOR_WORKSHOP_PROFILE);
  const [sellerProducts, setSellerProducts] = useState<SellerCatalogProduct[]>(
    () => buildInitialSellerProducts()
  );
  const [partners, setPartners] = useState<DemoPartnerRecord[]>(() =>
    buildInitialPartners()
  );
  const [adminAuditLog, setAdminAuditLog] = useState<AdminAuditEntry[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const placingOrderRef = useRef<boolean>(false);

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [avatarAssets, setAvatarAssets] = useState<{
    apose: string;
    tpose: string;
    measurements: string;
  } | null>(null);
  const [avatarServiceOffline, setAvatarServiceOffline] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  const fetchBodyProfile = useCallback(async () => {
    try {
      const res = await api.get<BodyProfileResponse>("/api/body-profile");
      if (res?.profile) {
        setBodyProfile({
          heightCm: res.profile.heightCm,
          weightKg: res.profile.weightKg ?? undefined,
          bodyType: (res.profile.bodyType as BodyType) ?? undefined,
          chestCm: res.profile.chestCm,
          waistCm: res.profile.waistCm,
          hipCm: res.profile.hipCm ?? INITIAL_MOCK_BODY_PROFILE.hipCm,
          shoulderCm:
            res.profile.shoulderCm ?? INITIAL_MOCK_BODY_PROFILE.shoulderCm,
          sleeveCm: res.profile.sleeveCm ?? INITIAL_MOCK_BODY_PROFILE.sleeveCm,
          inseamCm: res.profile.inseamCm ?? INITIAL_MOCK_BODY_PROFILE.inseamCm,
          fitPreference:
            (res.profile.fitPreference as FitPreference) ?? "regular",
        });
        setHasBodyProfile(true);
      } else {
        setHasBodyProfile(false);
      }
      if (res?.history && res.history.length > 0) {
        setMeasurementHistory(
          res.history.map((h) => ({
            date: h.recordedAt ? h.recordedAt.slice(0, 10) : getTodayIsoDate(),
            chestCm: h.chestCm,
            waistCm: h.waistCm,
            note: h.note || "Recorded measurement",
          }))
        );
      }
    } catch {
      // Unauthenticated or profile fetch failed
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const res = await api.get<UserMeResponse>("/api/users/me");
      if (res?.user) {
        let role: MockRole = "customer";
        if (res.capabilities?.includes("admin")) role = "admin";
        else if (res.capabilities?.includes("seller")) role = "seller";
        else if (res.capabilities?.includes("tailor")) role = "tailor";

        setUser({
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone ?? undefined,
          city: res.user.city ?? undefined,
          role,
          capabilities: res.capabilities,
          partners: res.partners,
        });
        await fetchBodyProfile();
      }
    } catch {
      // 401 or no active session
      setUser({
        id: undefined,
        name: "Guest",
        email: "",
        role: "guest",
      });
      setHasBodyProfile(false);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [fetchBodyProfile]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        await api.post("/api/auth/sign-in/email", { email, password });
        await refreshSession();
        return { ok: true };
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          return {
            ok: false,
            error: err.message,
            fieldErrors: err.fieldErrors,
          };
        }
        return {
          ok: false,
          error: "Sign-in failed. Please check your credentials.",
        };
      }
    },
    [refreshSession]
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        await api.post("/api/auth/sign-up/email", { name, email, password });
        await refreshSession();
        return { ok: true };
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          return {
            ok: false,
            error: err.message,
            fieldErrors: err.fieldErrors,
          };
        }
        return {
          ok: false,
          error: "Registration failed. Please check your details.",
        };
      }
    },
    [refreshSession]
  );

  const signOut = useCallback(async () => {
    try {
      await api.post("/api/auth/sign-out", {});
    } catch {
      // Ignore network errors on signout
    }
    setUser({ id: undefined, name: "Guest", email: "", role: "guest" });
    setHasBodyProfile(false);
    setAvatarId(null);
    setAvatarAssets(null);
  }, []);

  const checkAvatarStatus = useCallback(async () => {
    try {
      const res = await api.get<AvatarStatusResponse>("/api/avatar/status");
      if (res?.status === "ok") {
        setAvatarServiceOffline(false);
        return true;
      }
      setAvatarServiceOffline(true);
      return false;
    } catch {
      setAvatarServiceOffline(true);
      return false;
    }
  }, []);

  const generateAvatarPreset = useCallback(
    async (gender: "female" | "male" | "neutral" = "neutral") => {
      setIsGeneratingAvatar(true);
      try {
        const res = await api.post<AvatarPresetResponse>("/api/avatar/preset", {
          gender,
        });
        setAvatarId(res.avatarId);
        setAvatarAssets(res.assets);
        setAvatarServiceOffline(false);
        return { ok: true, avatarId: res.avatarId };
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          if (err.status === 503) {
            setAvatarServiceOffline(true);
          }
          return { ok: false, error: err.message };
        }
        setAvatarServiceOffline(true);
        return { ok: false, error: "Avatar service temporarily unavailable" };
      } finally {
        setIsGeneratingAvatar(false);
      }
    },
    []
  );

  useEffect(() => {
    placingOrderRef.current = false;
  }, [orders]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const nextItem: ToastItem = {
      ...input,
      id,
      type: input.type ?? "info",
      createdAt: Date.now(),
    };
    setToasts((prev) => [...prev.slice(-3), nextItem]);
    return id;
  }, []);

  function loginMock(nextUser: MockUser) {
    const normalizedEmail = nextUser.email.trim().toLowerCase();
    const resolvedId =
      nextUser.id ??
      (normalizedEmail === "riya.demo@fitloom.local"
        ? "customer-riya-demo"
        : normalizedEmail === "tailor.demo@fitloom.local"
        ? "tailor-arjun-demo"
        : normalizedEmail === "seller.demo@fitloom.local"
        ? "seller-verve-demo"
        : normalizedEmail === "admin.demo@fitloom.local"
        ? "admin-platform-demo"
        : normalizedEmail
        ? `user-${normalizedEmail}`
        : `user-${nextUser.role}`);

    setUser({
      phone: "+91 98765 43210",
      city: "Kolkata",
      memberSince: "November 2026",
      ...nextUser,
      id: resolvedId,
    });
    if (
      normalizedEmail !== "riya.demo@fitloom.local" &&
      normalizedEmail !== "tailor.demo@fitloom.local"
    ) {
      setHasBodyProfile(false);
    } else {
      setHasBodyProfile(true);
    }

    if (nextUser.role === "tailor") {
      if (normalizedEmail === "tailor.demo@fitloom.local") {
        setTailorWorkshopProfile(INITIAL_TAILOR_WORKSHOP_PROFILE);
      } else {
        setTailorWorkshopProfile({
          ...INITIAL_TAILOR_WORKSHOP_PROFILE,
          workshopName: nextUser.name.trim() || "Partner Tailor Workshop",
          city: nextUser.city?.trim() || "Kolkata",
          updatedAt: getTodayIsoDate(),
        });
      }
    }

    if (nextUser.role === "seller" || nextUser.role === "tailor") {
      const candidateUser: MockUser = {
        ...nextUser,
        id: resolvedId,
      };
      setPartners((prev) => {
        if (findMatchingPartnerForUser(candidateUser, prev)) {
          return prev;
        }
        return [
          ...prev,
          {
            id: resolvedId,
            name: nextUser.name.trim() || "Demo Partner",
            type: nextUser.role === "seller" ? "seller" : "tailor",
            city: nextUser.city?.trim() || "Kolkata",
            specialtyOrCategory:
              nextUser.role === "seller"
                ? "Ready-to-Wear Apparel"
                : "Bespoke Tailoring",
            email: nextUser.email.trim() || undefined,
            registrationSource: "Session Onboarding",
            verificationStatus: "pending_demo",
            operationalStatus: "active",
            updatedAt: getTodayIsoDate(),
          },
        ];
      });
    }
  }

  function logoutMock() {
    signOut();
  }

  function switchRole(role: MockRole) {
    if (role === "guest") {
      logoutMock();
      return;
    }

    const presets: Record<Exclude<MockRole, "guest">, MockUser> = {
      customer: {
        id: "customer-riya-demo",
        name: "Riya Sharma",
        email: "riya.demo@fitloom.local",
        role: "customer",
        phone: "+91 98765 43210",
        city: "Kolkata",
        memberSince: "November 2026",
      },
      tailor: {
        id: "tailor-arjun-demo",
        name: "Atelier Arjun (Demo Tailor)",
        email: "tailor.demo@fitloom.local",
        role: "tailor",
        phone: "+91 98300 12345",
        city: "Kolkata",
        memberSince: "October 2026",
      },
      seller: {
        id: "seller-verve-demo",
        name: "Verve Studio (Demo Seller)",
        email: "seller.demo@fitloom.local",
        role: "seller",
        phone: "+91 98301 54321",
        city: "Mumbai",
        memberSince: "November 2026",
      },
      admin: {
        id: "admin-platform-demo",
        name: "FITLOOM Ops (Demo Admin)",
        email: "admin.demo@fitloom.local",
        role: "admin",
        phone: "+91 98302 00001",
        city: "Bengaluru",
        memberSince: "October 2026",
      },
    };

    setUser(presets[role]);
    setHasBodyProfile(role === "customer" || role === "tailor");
    if (role === "tailor") {
      setTailorWorkshopProfile(INITIAL_TAILOR_WORKSHOP_PROFILE);
    }
  }

  function updateUserProfile(
    updates: Partial<Pick<MockUser, "name" | "email" | "phone" | "city">>
  ): { ok: boolean; error?: string } {
    if (updates.name !== undefined && updates.name.trim().length < 2) {
      return { ok: false, error: "Full name must be at least 2 characters." };
    }
    if (
      updates.email !== undefined &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email.trim())
    ) {
      return { ok: false, error: "Invalid email format." };
    }
    setUser((prev) => ({
      ...prev,
      ...updates,
      name: updates.name ? updates.name.trim() : prev.name,
      email: updates.email ? updates.email.trim() : prev.email,
      phone: updates.phone !== undefined ? updates.phone.trim() : prev.phone,
      city: updates.city !== undefined ? updates.city.trim() : prev.city,
    }));
    return { ok: true };
  }

  const updateBodyProfile = useCallback(
    async (next: BodyProfile, note = "Updated profile") => {
      const parsed = BodyProfileSchema.safeParse(next);
      if (!parsed.success) {
        return {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Invalid measurements",
        };
      }

      // If user is guest or demo without real DB account, update local state
      if (
        user.role === "guest" ||
        !user.id ||
        user.id.startsWith("customer-riya-demo") ||
        user.id.startsWith("user-")
      ) {
        setBodyProfile(parsed.data);
        setHasBodyProfile(true);
        setMeasurementHistory((prev) => [
          {
            date: getTodayIsoDate(),
            chestCm: parsed.data.chestCm,
            waistCm: parsed.data.waistCm,
            note,
          },
          ...prev.slice(0, 4),
        ]);
      }

      try {
        const payload: BodyProfilePayload = {
          heightCm: parsed.data.heightCm,
          weightKg: parsed.data.weightKg,
          bodyType: parsed.data.bodyType,
          chestCm: parsed.data.chestCm,
          waistCm: parsed.data.waistCm,
          hipCm: parsed.data.hipCm,
          shoulderCm: parsed.data.shoulderCm,
          sleeveCm: parsed.data.sleeveCm,
          inseamCm: parsed.data.inseamCm,
          fitPreference: parsed.data.fitPreference,
        };

        const res = await api.put<BodyProfileResponse>(
          "/api/body-profile",
          payload
        );
        setBodyProfile(parsed.data);
        setHasBodyProfile(true);
        if (res?.history && res.history.length > 0) {
          setMeasurementHistory(
            res.history.map((h) => ({
              date: h.recordedAt ? h.recordedAt.slice(0, 10) : getTodayIsoDate(),
              chestCm: h.chestCm,
              waistCm: h.waistCm,
              note: h.note || note,
            }))
          );
        } else {
          setMeasurementHistory((prev) => [
            {
              date: getTodayIsoDate(),
              chestCm: parsed.data.chestCm,
              waistCm: parsed.data.waistCm,
              note,
            },
            ...prev.slice(0, 4),
          ]);
        }
        return { ok: true };
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          return {
            ok: false,
            error: err.message,
            fieldErrors: err.fieldErrors as Partial<Record<string, string>>,
          };
        }
        return { ok: false, error: "Failed to save profile to server." };
      }
    },
    [user.id, user.role]
  );

  function updateFitPreference(fitPreference: FitPreference): {
    ok: boolean;
    error?: string;
  } {
    const allowed: readonly FitPreference[] = [
      "slim",
      "regular",
      "relaxed",
      "oversized",
    ];
    if (!allowed.includes(fitPreference)) {
      return { ok: false, error: "Invalid fit preference selection." };
    }
    const nextState = applyFitPreferenceChange({
      bodyProfile,
      hasBodyProfile,
      fitPreference,
    });
    setBodyProfile(nextState.bodyProfile);
    // Preserve cleared state: updating fit preference alone must never reactivate hasBodyProfile.
    if (hasBodyProfile) {
      setMeasurementHistory((prev) => [
        {
          date: getTodayIsoDate(),
          chestCm: nextState.bodyProfile.chestCm,
          waistCm: nextState.bodyProfile.waistCm,
          note: "Updated fit preference",
        },
        ...prev.slice(0, 4),
      ]);
    }
    return { ok: true };
  }

  function clearBodyProfile() {
    setHasBodyProfile(false);
    setBodyProfile((prev) => applyClearBodyProfileReset(prev));
    setMeasurementHistory([]);
  }

  function addToCart(item: Omit<MockCartItem, "id" | "quantity">) {
    setCart((prev) => {
      const nextSerializedMeasures = item.customFitMeasurements
        ? JSON.stringify(item.customFitMeasurements)
        : "";
      const existing = prev.find(
        (c) =>
          c.garmentId === item.garmentId &&
          c.size === item.size &&
          c.customFitNotes === item.customFitNotes &&
          (c.customFitMeasurements
            ? JSON.stringify(c.customFitMeasurements)
            : "") === nextSerializedMeasures
      );
      if (existing) {
        return prev.map((c) =>
          c.id === existing.id
            ? { ...c, quantity: Math.min(10, c.quantity + 1) }
            : c
        );
      }
      return [
        ...prev,
        {
          ...item,
          id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          quantity: 1,
        },
      ];
    });
  }

  function updateCartQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === id ? { ...c, quantity: Math.min(10, c.quantity + delta) } : c
        )
        .filter((c) => c.quantity > 0)
    );
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  function toggleWishlist(garmentId: string) {
    setWishlistIds((prev) => toggleWishlistIds(prev, garmentId));
  }

  function clearWishlist() {
    setWishlistIds([]);
  }

  function pruneInvalidWishlistRefs() {
    const validCatalogIds = new Set(MOCK_GARMENTS.map((g) => g.id));
    setWishlistIds((prev) => prev.filter((id) => validCatalogIds.has(id)));
  }

  function saveLook(
    look: Omit<MockSavedLook, "id" | "createdAt">
  ): MockSavedLook {
    const created: MockSavedLook = {
      ...look,
      id: `look-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      createdAt: getTodayIsoDate(),
    };
    setSavedLooks((prev) => [created, ...prev]);
    return created;
  }

  function updateSavedLook(
    id: string,
    updates: Omit<MockSavedLook, "id" | "createdAt">
  ) {
    setSavedLooks((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              title: updates.title,
              garmentIds: updates.garmentIds,
              source: updates.source,
            }
          : l
      )
    );
  }

  function deleteSavedLook(id: string) {
    setSavedLooks((prev) => prev.filter((l) => l.id !== id));
  }

  function toggleCompare(garmentId: string) {
    setCompareIds((prev) =>
      toggleCompareIds(prev, garmentId, MAX_COMPARE_ITEMS)
    );
  }

  function clearCompare() {
    setCompareIds([]);
  }

  function pruneInvalidCompareRefs() {
    const validCatalogIds = new Set(MOCK_GARMENTS.map((g) => g.id));
    setCompareIds((prev) =>
      prev.filter((id) => validCatalogIds.has(id)).slice(-MAX_COMPARE_ITEMS)
    );
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.priceInr * item.quantity,
    0
  );

  function placeMockOrder(input: PlaceMockOrderInput): PlaceMockOrderResult {
    if (placingOrderRef.current) {
      return {
        ok: false,
        error: "An order submission is already in progress.",
      };
    }

    const currentSuspendedSellerIds = new Set(
      partners
        .filter((p) => p.type === "seller" && p.operationalStatus === "suspended")
        .map((p) => p.id)
    );
    const currentEligibleCatalogue = selectEligibleCustomerGarments(
      sellerProducts,
      currentSuspendedSellerIds
    );

    const result = buildValidatedMockOrder({
      user,
      cart,
      existingOrders: orders,
      bodyProfile,
      hasBodyProfile,
      input,
      createdAt: getTodayIsoDate(),
      catalogue: currentEligibleCatalogue,
    });

    if (!result.ok) {
      return result;
    }

    placingOrderRef.current = true;
    setOrders((prev) => [result.order, ...prev]);
    clearCart();
    return result;
  }

  function cancelMockOrder(orderId: string, reason: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, stage: "Cancelled", cancelOrReturnReason: reason }
          : o
      )
    );
  }

  function requestReturnMockOrder(orderId: string, reason: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, stage: "Return Requested", cancelOrReturnReason: reason }
          : o
      )
    );
  }

  function updateTailorWorkshopProfile(input: TailorWorkshopProfileInput): {
    ok: boolean;
    error?: string;
    fieldErrors?: Partial<Record<keyof TailorWorkshopProfileInput, string>>;
    profile?: TailorWorkshopProfile;
  } {
    const tailorSuspension = evaluatePartnerSuspension(user, "tailor", partners);
    if (tailorSuspension.suspended) {
      return {
        ok: false,
        error:
          tailorSuspension.reason ||
          "This partner workshop is currently suspended in demo admin state.",
      };
    }
    const parsed = TailorWorkshopProfileSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Partial<
        Record<keyof TailorWorkshopProfileInput, string>
      > = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof TailorWorkshopProfileInput | undefined;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      return {
        ok: false,
        error:
          parsed.error.issues[0]?.message ??
          "Please fix the highlighted workshop profile fields.",
        fieldErrors,
      };
    }

    const nextProfile: TailorWorkshopProfile = {
      ...parsed.data,
      updatedAt: getTodayIsoDate(),
    };
    setTailorWorkshopProfile(nextProfile);
    setUser((prev) =>
      prev.role === "tailor"
        ? {
            ...prev,
            city: nextProfile.city,
          }
        : prev
    );
    return { ok: true, profile: nextProfile };
  }

  function tailorAcceptOrder(orderId: string): {
    ok: boolean;
    error?: string;
    stage?: OrderStage;
  } {
    if (user.role !== "tailor") {
      return {
        ok: false,
        error: "Tailor role is required to accept workshop orders.",
      };
    }
    const tailorSuspension = evaluatePartnerSuspension(user, "tailor", partners);
    if (tailorSuspension.suspended) {
      return {
        ok: false,
        error:
          tailorSuspension.reason ||
          "This partner workshop is currently suspended in demo admin state.",
      };
    }
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { ok: false, error: `Order ${orderId} was not found.` };
    }
    if (!isOrderOwnedByTailorWorkshop(targetOrder, user, tailorWorkshopProfile)) {
      return {
        ok: false,
        error: `Order ${orderId} belongs to ${
          targetOrder.tailorName ?? "another workshop"
        }.`,
      };
    }
    const validation = validateTailorAcceptOrder(targetOrder);
    if (!validation.ok) {
      return validation;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, stage: validation.nextStage } : o
      )
    );
    return { ok: true, stage: validation.nextStage };
  }

  function tailorRejectOrder(
    orderId: string,
    reason: string
  ): {
    ok: boolean;
    error?: string;
    stage?: OrderStage;
  } {
    if (user.role !== "tailor") {
      return {
        ok: false,
        error: "Tailor role is required to reject workshop orders.",
      };
    }
    const tailorSuspension = evaluatePartnerSuspension(user, "tailor", partners);
    if (tailorSuspension.suspended) {
      return {
        ok: false,
        error:
          tailorSuspension.reason ||
          "This partner workshop is currently suspended in demo admin state.",
      };
    }
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { ok: false, error: `Order ${orderId} was not found.` };
    }
    if (!isOrderOwnedByTailorWorkshop(targetOrder, user, tailorWorkshopProfile)) {
      return {
        ok: false,
        error: `Order ${orderId} belongs to ${
          targetOrder.tailorName ?? "another workshop"
        }.`,
      };
    }
    const validation = validateTailorRejectOrder(targetOrder, reason);
    if (!validation.ok) {
      return validation;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              stage: "Rejected by Tailor",
              rejectionReason: validation.reason,
            }
          : o
      )
    );
    return { ok: true, stage: "Rejected by Tailor" };
  }

  function advanceOrderStage(
    orderId: string,
    stage: OrderStage
  ): {
    ok: boolean;
    error?: string;
    stage?: OrderStage;
  } {
    if (user.role !== "tailor") {
      return {
        ok: false,
        error: "Tailor role is required to update production stages.",
      };
    }
    const tailorSuspension = evaluatePartnerSuspension(user, "tailor", partners);
    if (tailorSuspension.suspended) {
      return {
        ok: false,
        error:
          tailorSuspension.reason ||
          "This partner workshop is currently suspended in demo admin state.",
      };
    }
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { ok: false, error: `Order ${orderId} was not found.` };
    }
    if (!isOrderOwnedByTailorWorkshop(targetOrder, user, tailorWorkshopProfile)) {
      return {
        ok: false,
        error: `Order ${orderId} belongs to ${
          targetOrder.tailorName ?? "another workshop"
        }.`,
      };
    }
    const validation = validateTailorAdvanceStage(targetOrder, stage);
    if (!validation.ok) {
      return validation;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, stage: validation.nextStage } : o
      )
    );
    return { ok: true, stage: validation.nextStage };
  }

  const suspendedSellerIds = useMemo(
    () =>
      new Set(
        partners
          .filter((p) => p.type === "seller" && p.operationalStatus === "suspended")
          .map((p) => p.id)
      ),
    [partners]
  );

  const eligibleCustomerGarments = useMemo(
    () => selectEligibleCustomerGarments(sellerProducts, suspendedSellerIds),
    [sellerProducts, suspendedSellerIds]
  );

  function appendAdminAudit(
    area: AdminAuditEntry["area"],
    targetId: string,
    action: string,
    note?: string
  ) {
    const entry: AdminAuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: getTodayIsoDate(),
      area,
      targetId,
      action,
      note,
    };
    setAdminAuditLog((prev) => [entry, ...prev.slice(0, 29)]);
  }

  function createSellerProduct(input: SellerProductFormInput): {
    ok: boolean;
    error?: string;
    fieldErrors?: Partial<Record<keyof SellerProductFormInput, string>>;
    product?: SellerCatalogProduct;
  } {
    if (user.role !== "seller") {
      return { ok: false, error: "Seller role is required to create products." };
    }
    const suspension = evaluatePartnerSuspension(user, "seller", partners);
    if (suspension.suspended) {
      return {
        ok: false,
        error:
          suspension.reason ||
          "This seller account is currently suspended in demo admin state.",
      };
    }

    const parsed = SellerProductFormSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof SellerProductFormInput, string>> =
        {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof SellerProductFormInput | undefined;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      return {
        ok: false,
        error:
          parsed.error.issues[0]?.message ??
          "Please fix the highlighted product fields.",
        fieldErrors,
      };
    }

    const existingIds = new Set(sellerProducts.map((p) => p.id));
    const normalizedStatus: SellerProductStatus =
      parsed.data.inventoryQty === 0 && parsed.data.status === "active"
        ? "out_of_stock"
        : parsed.data.status;

    const created: SellerCatalogProduct = {
      id: generateUniqueProductId(parsed.data.name, existingIds),
      sellerId: resolveSellerId(user),
      sellerName: user.name.trim() || "Demo Seller",
      sellerCity: user.city?.trim() || "Mumbai",
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      fitType: parsed.data.fitType,
      occasion: parsed.data.occasion,
      color: parsed.data.color,
      swatchHex: parsed.data.swatchHex,
      image: parsed.data.image?.trim() || undefined,
      fabric: parsed.data.fabric,
      stretchNote: parsed.data.stretchNote,
      priceInr: parsed.data.priceInr,
      sizes: [...parsed.data.sizes],
      chestMapCm: { ...parsed.data.chestMapCm },
      waistMapCm: { ...parsed.data.waistMapCm },
      inventoryQty: parsed.data.inventoryQty,
      status: normalizedStatus,
      moderationStatus: "pending_review",
      customFitEligible: parsed.data.customFitEligible,
      rating: 0,
      reviewCount: 0,
      updatedAt: getTodayIsoDate(),
    };

    setSellerProducts((prev) => [created, ...prev]);
    return { ok: true, product: created };
  }

  function updateSellerProduct(
    productId: string,
    input: SellerProductFormInput
  ): {
    ok: boolean;
    error?: string;
    fieldErrors?: Partial<Record<keyof SellerProductFormInput, string>>;
    product?: SellerCatalogProduct;
  } {
    if (user.role !== "seller") {
      return { ok: false, error: "Seller role is required to edit products." };
    }
    const suspension = evaluatePartnerSuspension(user, "seller", partners);
    if (suspension.suspended) {
      return {
        ok: false,
        error:
          suspension.reason ||
          "This seller account is currently suspended in demo admin state.",
      };
    }

    const target = sellerProducts.find((p) => p.id === productId);
    if (!target) {
      return { ok: false, error: `Product ${productId} was not found.` };
    }
    if (!isProductOwnedBySeller(target, user)) {
      return {
        ok: false,
        error: `You can only edit your own listings. "${target.name}" belongs to ${target.sellerName}.`,
      };
    }

    const parsed = SellerProductFormSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof SellerProductFormInput, string>> =
        {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof SellerProductFormInput | undefined;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      return {
        ok: false,
        error:
          parsed.error.issues[0]?.message ??
          "Please fix the highlighted product fields.",
        fieldErrors,
      };
    }

    const normalizedStatus: SellerProductStatus =
      parsed.data.inventoryQty === 0 && parsed.data.status === "active"
        ? "out_of_stock"
        : parsed.data.status;

    const updated: SellerCatalogProduct = {
      ...target,
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      fitType: parsed.data.fitType,
      occasion: parsed.data.occasion,
      color: parsed.data.color,
      swatchHex: parsed.data.swatchHex,
      image: parsed.data.image?.trim() || undefined,
      fabric: parsed.data.fabric,
      stretchNote: parsed.data.stretchNote,
      priceInr: parsed.data.priceInr,
      sizes: [...parsed.data.sizes],
      chestMapCm: { ...parsed.data.chestMapCm },
      waistMapCm: { ...parsed.data.waistMapCm },
      inventoryQty: parsed.data.inventoryQty,
      status: normalizedStatus,
      customFitEligible: parsed.data.customFitEligible,
      updatedAt: getTodayIsoDate(),
    };

    setSellerProducts((prev) =>
      prev.map((p) => (p.id === productId ? updated : p))
    );
    return { ok: true, product: updated };
  }

  function setSellerProductStatus(
    productId: string,
    status: SellerProductStatus
  ): { ok: boolean; error?: string; product?: SellerCatalogProduct } {
    if (user.role !== "seller") {
      return {
        ok: false,
        error: "Seller role is required to update availability.",
      };
    }
    const suspension = evaluatePartnerSuspension(user, "seller", partners);
    if (suspension.suspended) {
      return {
        ok: false,
        error:
          suspension.reason ||
          "This seller account is currently suspended in demo admin state.",
      };
    }
    const target = sellerProducts.find((p) => p.id === productId);
    if (!target) {
      return { ok: false, error: `Product ${productId} was not found.` };
    }
    if (!isProductOwnedBySeller(target, user)) {
      return {
        ok: false,
        error: `Cannot modify "${target.name}" owned by ${target.sellerName}.`,
      };
    }
    if (status === "active" && target.inventoryQty === 0) {
      return {
        ok: false,
        error:
          "Cannot set a zero-stock product Active. Update inventory quantity first.",
      };
    }

    const updated: SellerCatalogProduct = {
      ...target,
      status,
      updatedAt: getTodayIsoDate(),
    };
    setSellerProducts((prev) =>
      prev.map((p) => (p.id === productId ? updated : p))
    );
    return { ok: true, product: updated };
  }

  function deleteSellerProduct(productId: string): {
    ok: boolean;
    error?: string;
    archivedInstead?: boolean;
  } {
    if (user.role !== "seller") {
      return { ok: false, error: "Seller role is required to remove listings." };
    }
    const suspension = evaluatePartnerSuspension(user, "seller", partners);
    if (suspension.suspended) {
      return {
        ok: false,
        error:
          suspension.reason ||
          "This seller account is currently suspended in demo admin state.",
      };
    }
    const target = sellerProducts.find((p) => p.id === productId);
    if (!target) {
      return { ok: false, error: `Product ${productId} was not found.` };
    }
    if (!isProductOwnedBySeller(target, user)) {
      return {
        ok: false,
        error: `Cannot delete "${target.name}" owned by ${target.sellerName}.`,
      };
    }

    const referencingOrderIds = isProductReferencedByOrders(productId, orders);
    if (referencingOrderIds.length > 0) {
      // Preserve historical order snapshots by deactivating instead of erasing referenced records
      setSellerProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, status: "inactive", updatedAt: getTodayIsoDate() }
            : p
        )
      );
      return {
        ok: true,
        archivedInstead: true,
        error: `Referenced by order(s) ${referencingOrderIds.join(
          ", "
        )}; marked Inactive to preserve order history.`,
      };
    }

    setSellerProducts((prev) => prev.filter((p) => p.id !== productId));
    return { ok: true, archivedInstead: false };
  }

  function advanceSellerOrderStage(
    orderId: string,
    stage: OrderStage
  ): { ok: boolean; error?: string; stage?: OrderStage } {
    if (user.role !== "seller") {
      return {
        ok: false,
        error: "Seller role is required to update standard orders.",
      };
    }
    const suspension = evaluatePartnerSuspension(user, "seller", partners);
    if (suspension.suspended) {
      return {
        ok: false,
        error:
          suspension.reason ||
          "This seller account is currently suspended in demo admin state.",
      };
    }
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { ok: false, error: `Order ${orderId} was not found.` };
    }
    const validation = validateSellerAdvanceStandardOrder(targetOrder, stage);
    if (!validation.ok) {
      return validation;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, stage: validation.nextStage } : o
      )
    );
    return { ok: true, stage: validation.nextStage };
  }

  function cancelSellerStandardOrder(
    orderId: string,
    reason: string
  ): { ok: boolean; error?: string } {
    if (user.role !== "seller") {
      return {
        ok: false,
        error: "Seller role is required to cancel standard orders.",
      };
    }
    const suspension = evaluatePartnerSuspension(user, "seller", partners);
    if (suspension.suspended) {
      return {
        ok: false,
        error:
          suspension.reason ||
          "This seller account is currently suspended in demo admin state.",
      };
    }
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { ok: false, error: `Order ${orderId} was not found.` };
    }
    const validation = validateSellerCancelStandardOrder(targetOrder, reason);
    if (!validation.ok) {
      return validation;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, stage: "Cancelled", cancelOrReturnReason: validation.reason }
          : o
      )
    );
    return { ok: true };
  }

  function verifyPartnerDemo(partnerId: string): { ok: boolean; error?: string } {
    if (user.role !== "admin") {
      return { ok: false, error: "Admin role is required for partner oversight." };
    }
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) {
      return { ok: false, error: `Partner ${partnerId} was not found.` };
    }
    const validation = validatePartnerTransition(partner, "verify");
    if (!validation.ok) {
      return validation;
    }

    setPartners((prev) =>
      prev.map((p) =>
        p.id === partnerId
          ? {
              ...p,
              verificationStatus: "verified_demo",
              rejectionReason: undefined,
              updatedAt: getTodayIsoDate(),
            }
          : p
      )
    );
    appendAdminAudit("partners", partnerId, "Partner Verified (Demo)", partner.name);
    return { ok: true };
  }

  function rejectPartnerDemo(
    partnerId: string,
    reason: string
  ): { ok: boolean; error?: string } {
    if (user.role !== "admin") {
      return { ok: false, error: "Admin role is required for partner oversight." };
    }
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) {
      return { ok: false, error: `Partner ${partnerId} was not found.` };
    }
    const validation = validatePartnerTransition(partner, "reject", reason);
    if (!validation.ok) {
      return validation;
    }

    setPartners((prev) =>
      prev.map((p) =>
        p.id === partnerId
          ? {
              ...p,
              verificationStatus: "rejected_demo",
              rejectionReason: validation.reason,
              updatedAt: getTodayIsoDate(),
            }
          : p
      )
    );
    appendAdminAudit(
      "partners",
      partnerId,
      "Verification Rejected (Demo)",
      `${partner.name}: ${validation.reason}`
    );
    return { ok: true };
  }

  function suspendPartnerDemo(
    partnerId: string,
    reason: string
  ): { ok: boolean; error?: string } {
    if (user.role !== "admin") {
      return { ok: false, error: "Admin role is required for partner suspension." };
    }
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) {
      return { ok: false, error: `Partner ${partnerId} was not found.` };
    }
    const validation = validatePartnerTransition(partner, "suspend", reason);
    if (!validation.ok) {
      return validation;
    }

    setPartners((prev) =>
      prev.map((p) =>
        p.id === partnerId
          ? {
              ...p,
              operationalStatus: "suspended",
              suspensionReason: validation.reason,
              updatedAt: getTodayIsoDate(),
            }
          : p
      )
    );
    appendAdminAudit(
      "partners",
      partnerId,
      "Partner Suspended (Demo)",
      `${partner.name}: ${validation.reason}`
    );
    return { ok: true };
  }

  function reactivatePartnerDemo(
    partnerId: string
  ): { ok: boolean; error?: string } {
    if (user.role !== "admin") {
      return { ok: false, error: "Admin role is required to reactivate partners." };
    }
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) {
      return { ok: false, error: `Partner ${partnerId} was not found.` };
    }
    const validation = validatePartnerTransition(partner, "reactivate");
    if (!validation.ok) {
      return validation;
    }

    setPartners((prev) =>
      prev.map((p) =>
        p.id === partnerId
          ? {
              ...p,
              operationalStatus: "active",
              suspensionReason: undefined,
              updatedAt: getTodayIsoDate(),
            }
          : p
      )
    );
    appendAdminAudit("partners", partnerId, "Partner Reactivated (Demo)", partner.name);
    return { ok: true };
  }

  function moderateCatalogProduct(
    productId: string,
    action: CatalogModerationAction,
    reason?: string
  ): { ok: boolean; error?: string } {
    if (user.role !== "admin") {
      return {
        ok: false,
        error: "Admin role is required for catalogue moderation.",
      };
    }
    const product = sellerProducts.find((p) => p.id === productId);
    if (!product) {
      return { ok: false, error: `Listing ${productId} was not found.` };
    }
    const validation = validateCatalogModerationAction(product, action, reason);
    if (!validation.ok) {
      return validation;
    }

    setSellerProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              moderationStatus: validation.nextStatus,
              moderationReason:
                validation.nextStatus === "approved"
                  ? undefined
                  : validation.reason,
              updatedAt: getTodayIsoDate(),
            }
          : p
      )
    );
    appendAdminAudit(
      "catalogue",
      productId,
      `Listing ${validation.nextStatus}`,
      validation.reason ? `${product.name}: ${validation.reason}` : product.name
    );
    return { ok: true };
  }

  function logAdminOrderOversightNote(
    orderId: string,
    note: string
  ): { ok: boolean; error?: string } {
    if (user.role !== "admin") {
      return {
        ok: false,
        error: "Admin role is required to record oversight notes.",
      };
    }
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) {
      return { ok: false, error: `Order ${orderId} was not found.` };
    }
    const parsed = AdminOversightNoteSchema.safeParse(note);
    if (!parsed.success) {
      return {
        ok: false,
        error:
          parsed.error.issues[0]?.message ??
          "Enter an oversight note (minimum 5 characters).",
      };
    }

    appendAdminAudit("orders", orderId, "Order Oversight Note", parsed.data);
    return { ok: true };
  }

  return (
    <FitloomContext.Provider
      value={{
        user,
        loginMock,
        logoutMock,
        switchRole,
        updateUserProfile,
        signIn,
        signUp,
        signOut,
        refreshSession,
        isLoadingAuth,
        avatarId,
        avatarAssets,
        avatarServiceOffline,
        isGeneratingAvatar,
        checkAvatarStatus,
        generateAvatarPreset,
        bodyProfile,
        hasBodyProfile,
        measurementHistory,
        updateBodyProfile,
        updateFitPreference,
        clearBodyProfile,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        wishlistIds,
        toggleWishlist,
        clearWishlist,
        pruneInvalidWishlistRefs,
        savedLooks,
        saveLook,
        updateSavedLook,
        deleteSavedLook,
        compareIds,
        toggleCompare,
        clearCompare,
        pruneInvalidCompareRefs,
        orders,
        placeMockOrder,
        cancelMockOrder,
        requestReturnMockOrder,
        tailorAcceptOrder,
        tailorRejectOrder,
        advanceOrderStage,
        tailorWorkshopProfile,
        updateTailorWorkshopProfile,
        sellerProducts,
        eligibleCustomerGarments,
        createSellerProduct,
        updateSellerProduct,
        setSellerProductStatus,
        deleteSellerProduct,
        advanceSellerOrderStage,
        cancelSellerStandardOrder,
        partners,
        adminAuditLog,
        verifyPartnerDemo,
        rejectPartnerDemo,
        suspendPartnerDemo,
        reactivatePartnerDemo,
        moderateCatalogProduct,
        logAdminOrderOversightNote,
        toasts,
        toast,
        dismissToast,
      }}
    >
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </FitloomContext.Provider>
  );
}

export function useFitloom() {
  const ctx = useContext(FitloomContext);
  if (!ctx) {
    throw new Error("useFitloom must be used inside FitloomProvider");
  }
  return ctx;
}
