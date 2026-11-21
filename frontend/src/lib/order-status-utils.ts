import type { BadgeVariant } from "@/components/ui/badge";
import type {
  MockCartItem,
  MockOrder,
  OrderStage,
} from "@/components/providers/fitloom-provider";
import { MOCK_GARMENTS, type MockGarment } from "@/lib/mock-data";

export type OrderFilterKey =
  | "all"
  | "pending"
  | "processing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled_or_returned";

export type OrderSortKey = "newest" | "oldest" | "amount_desc" | "amount_asc";

export interface OrderFilterTabOption {
  key: OrderFilterKey;
  label: string;
}

export const ORDER_FILTER_TABS: readonly OrderFilterTabOption[] = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Placed & Pending" },
  { key: "processing", label: "In Progress" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled_or_returned", label: "Cancelled & Returns" },
];

export interface OrderSortOption {
  value: OrderSortKey;
  label: string;
}

export const ORDER_SORT_OPTIONS: readonly OrderSortOption[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount_desc", label: "Highest amount" },
  { value: "amount_asc", label: "Lowest amount" },
];

export interface OrderStageMeta {
  stage: string;
  label: string;
  shortLabel: string;
  description: string;
  badgeVariant: BadgeVariant;
  category: Exclude<OrderFilterKey, "all">;
  isTerminalException: boolean;
  canCancel: boolean;
  canRequestReturn: boolean;
}

const STAGE_META_MAP: Record<OrderStage, OrderStageMeta> = {
  "Pending Tailor Acceptance": {
    stage: "Pending Tailor Acceptance",
    label: "Pending Tailor Acceptance",
    shortLabel: "Pending Tailor",
    description:
      "Your CUSTOMFIT measurements and garment notes are awaiting tailor acceptance.",
    badgeVariant: "amber",
    category: "pending",
    isTerminalException: false,
    canCancel: true,
    canRequestReturn: false,
  },
  Placed: {
    stage: "Placed",
    label: "Order Placed",
    shortLabel: "Placed",
    description:
      "Your order is recorded and queued for garment preparation.",
    badgeVariant: "info",
    category: "pending",
    isTerminalException: false,
    canCancel: true,
    canRequestReturn: false,
  },
  Cutting: {
    stage: "Cutting",
    label: "Fabric Cutting",
    shortLabel: "Cutting",
    description:
      "Fabric patterns are being prepared for your selected garment specifications.",
    badgeVariant: "info",
    category: "processing",
    isTerminalException: false,
    canCancel: true,
    canRequestReturn: false,
  },
  "Stitching in Progress": {
    stage: "Stitching in Progress",
    label: "Stitching in Progress",
    shortLabel: "Stitching",
    description:
      "Your assigned FITLOOM tailor is crafting and stitching your custom fit.",
    badgeVariant: "default",
    category: "processing",
    isTerminalException: false,
    canCancel: false,
    canRequestReturn: false,
  },
  "Quality Check": {
    stage: "Quality Check",
    label: "Quality Check",
    shortLabel: "Quality Check",
    description:
      "Seam finish, garment measurements, and styling details are undergoing inspection.",
    badgeVariant: "default",
    category: "processing",
    isTerminalException: false,
    canCancel: false,
    canRequestReturn: false,
  },
  "Out for Delivery": {
    stage: "Out for Delivery",
    label: "Out for Delivery",
    shortLabel: "Out for Delivery",
    description:
      "Your order is marked as out for delivery to your listed city.",
    badgeVariant: "amber",
    category: "out_for_delivery",
    isTerminalException: false,
    canCancel: false,
    canRequestReturn: false,
  },
  Delivered: {
    stage: "Delivered",
    label: "Delivered",
    shortLabel: "Delivered",
    description:
      "Order has been delivered. You can request a return with a reason if needed.",
    badgeVariant: "success",
    category: "delivered",
    isTerminalException: false,
    canCancel: false,
    canRequestReturn: true,
  },
  Cancelled: {
    stage: "Cancelled",
    label: "Cancelled",
    shortLabel: "Cancelled",
    description: "This order was cancelled before final fulfillment.",
    badgeVariant: "destructive",
    category: "cancelled_or_returned",
    isTerminalException: true,
    canCancel: false,
    canRequestReturn: false,
  },
  "Rejected by Tailor": {
    stage: "Rejected by Tailor",
    label: "Rejected by Tailor",
    shortLabel: "Rejected",
    description:
      "A tailor could not accept this custom tailoring request as submitted.",
    badgeVariant: "destructive",
    category: "cancelled_or_returned",
    isTerminalException: true,
    canCancel: false,
    canRequestReturn: false,
  },
  "Return Requested": {
    stage: "Return Requested",
    label: "Return Requested",
    shortLabel: "Return Requested",
    description:
      "A return request has been logged against this delivered order.",
    badgeVariant: "amber",
    category: "cancelled_or_returned",
    isTerminalException: true,
    canCancel: false,
    canRequestReturn: false,
  },
};

const FALLBACK_STAGE_META: OrderStageMeta = {
  stage: "Unknown",
  label: "Status Unavailable",
  shortLabel: "Pending Update",
  description: "Current fulfillment status is awaiting synchronization.",
  badgeVariant: "neutral",
  category: "pending",
  isTerminalException: false,
  canCancel: false,
  canRequestReturn: false,
};

export function getOrderStageMeta(stage: OrderStage | string): OrderStageMeta {
  if (stage in STAGE_META_MAP) {
    return STAGE_META_MAP[stage as OrderStage];
  }
  return {
    ...FALLBACK_STAGE_META,
    stage: stage || "Unknown",
    label: stage || FALLBACK_STAGE_META.label,
    shortLabel: stage || FALLBACK_STAGE_META.shortLabel,
  };
}

export function formatOrderInr(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `₹${safeAmount.toLocaleString("en-IN")}`;
}

export function formatOrderDate(dateInput: string): string {
  if (!dateInput) return "Date unavailable";
  const parsed = Date.parse(dateInput);
  if (Number.isNaN(parsed)) return dateInput;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(parsed));
}

export function countOrderUnits(items: readonly MockCartItem[]): number {
  return items.reduce((sum, item) => sum + Math.max(0, item.quantity || 0), 0);
}

export interface GarmentLookupEntry {
  garment: MockGarment;
  isEligible: boolean;
}

export function buildGarmentLookup(
  eligibleCustomerGarments: readonly MockGarment[] = []
): Map<string, GarmentLookupEntry> {
  const map = new Map<string, GarmentLookupEntry>();
  for (const garment of MOCK_GARMENTS) {
    map.set(garment.id, { garment, isEligible: false });
  }
  for (const garment of eligibleCustomerGarments) {
    map.set(garment.id, { garment, isEligible: true });
  }
  return map;
}

export interface ResolvedOrderItem {
  item: MockCartItem;
  image: string | null;
  swatchHex: string;
  color: string | null;
  category: string | null;
  fabric: string | null;
  productHref: string | null;
  lineTotalInr: number;
}

export function resolveOrderItem(
  item: MockCartItem,
  lookup: ReadonlyMap<string, GarmentLookupEntry>
): ResolvedOrderItem {
  const match = lookup.get(item.garmentId);
  const garment = match?.garment;
  return {
    item,
    image: garment?.image ?? null,
    swatchHex: garment?.swatchHex ?? "#EDE9FE",
    color: garment?.color ?? null,
    category: garment?.category ?? null,
    fabric: garment?.fabric ?? null,
    productHref: match?.isEligible
      ? `/shop/${encodeURIComponent(item.garmentId)}`
      : null,
    lineTotalInr: item.priceInr * item.quantity,
  };
}

export function computeOrderFilterCounts(
  orders: readonly MockOrder[]
): Record<OrderFilterKey, number> {
  const counts: Record<OrderFilterKey, number> = {
    all: orders.length,
    pending: 0,
    processing: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled_or_returned: 0,
  };

  for (const order of orders) {
    const meta = getOrderStageMeta(order.stage);
    counts[meta.category] += 1;
  }

  return counts;
}

export function filterAndSortOrders(
  orders: readonly MockOrder[],
  options: {
    filter: OrderFilterKey;
    searchQuery: string;
    sort: OrderSortKey;
  },
  lookup: ReadonlyMap<string, GarmentLookupEntry>
): MockOrder[] {
  const query = options.searchQuery.trim().toLowerCase();

  const indexed = orders
    .map((order, index) => ({ order, index }))
    .filter(({ order }) => {
      if (options.filter !== "all") {
        const meta = getOrderStageMeta(order.stage);
        if (meta.category !== options.filter) return false;
      }

      if (!query) return true;

      const stageMeta = getOrderStageMeta(order.stage);
      const orderFields = [
        order.id,
        order.shippingCity,
        order.tailorName ?? "",
        order.paymentLabel ?? "",
        stageMeta.stage,
        stageMeta.label,
      ];

      if (orderFields.some((val) => val.toLowerCase().includes(query))) {
        return true;
      }

      return order.items.some((item) => {
        const resolved = lookup.get(item.garmentId)?.garment;
        return [
          item.name,
          item.garmentId,
          item.size,
          item.tailorName ?? "",
          resolved?.category ?? "",
          resolved?.color ?? "",
        ].some((val) => val.toLowerCase().includes(query));
      });
    });

  indexed.sort((a, b) => {
    if (options.sort === "amount_desc") {
      const diff = b.order.totalInr - a.order.totalInr;
      return diff !== 0 ? diff : a.index - b.index;
    }
    if (options.sort === "amount_asc") {
      const diff = a.order.totalInr - b.order.totalInr;
      return diff !== 0 ? diff : a.index - b.index;
    }

    const timeA = Date.parse(a.order.createdAt);
    const timeB = Date.parse(b.order.createdAt);
    const validA = !Number.isNaN(timeA);
    const validB = !Number.isNaN(timeB);

    if (validA && validB && timeA !== timeB) {
      return options.sort === "newest" ? timeB - timeA : timeA - timeB;
    }

    return options.sort === "newest" ? a.index - b.index : b.index - a.index;
  });

  return indexed.map((entry) => entry.order);
}

export type TimelineStepStatus =
  | "completed"
  | "current"
  | "pending"
  | "halted";

export interface OrderTimelineStep {
  key: string;
  label: string;
  description: string;
  status: TimelineStepStatus;
}

export interface OrderTimelineTerminalNotice {
  kind: "cancelled" | "rejected" | "return_requested";
  title: string;
  description: string;
  reason?: string;
}

export interface OrderTimelineResult {
  steps: OrderTimelineStep[];
  terminalNotice: OrderTimelineTerminalNotice | null;
}

interface StageBlueprint {
  stage: OrderStage;
  label: string;
  description: string;
}

const STANDARD_LIFECYCLE: readonly StageBlueprint[] = [
  {
    stage: "Placed",
    label: "Order Placed",
    description: "Order captured in your active customer session.",
  },
  {
    stage: "Cutting",
    label: "Processing & Cutting",
    description: "Garment specifications and fabric pattern prepared.",
  },
  {
    stage: "Quality Check",
    label: "Quality Check",
    description: "Final sizing, stitching, and garment finish inspection.",
  },
  {
    stage: "Out for Delivery",
    label: "Out for Delivery",
    description: "Order marked ready for handoff to your delivery city.",
  },
  {
    stage: "Delivered",
    label: "Delivered",
    description: "Delivery completed for this order.",
  },
];

const CUSTOM_LIFECYCLE: readonly StageBlueprint[] = [
  {
    stage: "Pending Tailor Acceptance",
    label: "Order Placed & Awaiting Tailor",
    description: "Measurement profile and custom notes sent to tailor.",
  },
  {
    stage: "Cutting",
    label: "Fabric Cutting",
    description: "Custom pattern drafted to your measurement snapshot.",
  },
  {
    stage: "Stitching in Progress",
    label: "Stitching in Progress",
    description: "Dedicated artisan tailoring underway.",
  },
  {
    stage: "Quality Check",
    label: "Quality Check",
    description: "Custom garment measurements verified against profile.",
  },
  {
    stage: "Out for Delivery",
    label: "Out for Delivery",
    description: "Custom piece marked out for delivery.",
  },
  {
    stage: "Delivered",
    label: "Delivered",
    description: "Delivered to your specified destination.",
  },
];

export function buildOrderTimeline(order: MockOrder): OrderTimelineResult {
  const lifecycle = order.isCustomFit ? CUSTOM_LIFECYCLE : STANDARD_LIFECYCLE;

  if (order.stage === "Cancelled" || order.stage === "Rejected by Tailor") {
    const isRejected = order.stage === "Rejected by Tailor";
    const steps: OrderTimelineStep[] = lifecycle.map((bp, idx) => ({
      key: bp.stage,
      label: bp.label,
      description: bp.description,
      status: idx === 0 ? "completed" : "halted",
    }));

    return {
      steps,
      terminalNotice: {
        kind: isRejected ? "rejected" : "cancelled",
        title: isRejected ? "Rejected by Tailor" : "Order Cancelled",
        description: isRejected
          ? "The assigned tailor declined this CUSTOMFIT request before production completed."
          : "This order was cancelled and will not proceed further.",
        reason: isRejected
          ? order.rejectionReason || order.cancelOrReturnReason
          : order.cancelOrReturnReason,
      },
    };
  }

  if (order.stage === "Return Requested") {
    const steps: OrderTimelineStep[] = [
      ...lifecycle.map((bp) => ({
        key: bp.stage,
        label: bp.label,
        description: bp.description,
        status: "completed" as const,
      })),
      {
        key: "Return Requested",
        label: "Return Requested",
        description: "Return request logged for this delivered order.",
        status: "current" as const,
      },
    ];

    return {
      steps,
      terminalNotice: {
        kind: "return_requested",
        title: "Return Request Submitted",
        description:
          "Your return request has been recorded against this order in the current session.",
        reason: order.cancelOrReturnReason,
      },
    };
  }

  let activeIdx = lifecycle.findIndex((bp) => bp.stage === order.stage);
  if (activeIdx === -1 && order.isCustomFit && order.stage === "Placed") {
    activeIdx = 0;
  }

  const steps: OrderTimelineStep[] = lifecycle.map((bp, idx) => {
    let status: TimelineStepStatus = "pending";
    if (activeIdx === -1) {
      status = idx === 0 ? "current" : "pending";
    } else if (order.stage === "Delivered" || idx < activeIdx) {
      status = "completed";
    } else if (idx === activeIdx) {
      status = "current";
    }
    return {
      key: bp.stage,
      label: bp.label,
      description: bp.description,
      status,
    };
  });

  return { steps, terminalNotice: null };
}

export interface ShipmentTrackingInfo {
  hasTrackingDetails: boolean;
  carrier: string | null;
  trackingNumber: string | null;
  shipmentDate: string | null;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
}

export function extractShipmentTrackingInfo(
  order: MockOrder
): ShipmentTrackingInfo {
  const extended = order as MockOrder & {
    carrier?: string;
    trackingNumber?: string;
    shipmentDate?: string;
    estimatedDeliveryDate?: string;
    actualDeliveryDate?: string;
  };

  const carrier = extended.carrier?.trim() || null;
  const trackingNumber = extended.trackingNumber?.trim() || null;
  const shipmentDate = extended.shipmentDate?.trim() || null;
  const estimatedDeliveryDate = extended.estimatedDeliveryDate?.trim() || null;
  const actualDeliveryDate = extended.actualDeliveryDate?.trim() || null;

  return {
    hasTrackingDetails: Boolean(
      carrier || trackingNumber || shipmentDate || estimatedDeliveryDate || actualDeliveryDate
    ),
    carrier,
    trackingNumber,
    shipmentDate,
    estimatedDeliveryDate,
    actualDeliveryDate,
  };
}

export interface OrderPricingSummary {
  itemsSubtotalInr: number;
  totalInr: number;
  adjustmentInr: number;
  totalUnits: number;
}

export function computeOrderPricingSummary(
  order: MockOrder
): OrderPricingSummary {
  const itemsSubtotalInr = order.items.reduce(
    (sum, item) => sum + item.priceInr * item.quantity,
    0
  );
  const totalInr = order.totalInr;
  return {
    itemsSubtotalInr,
    totalInr,
    adjustmentInr: totalInr - itemsSubtotalInr,
    totalUnits: countOrderUnits(order.items),
  };
}
