import { api } from "@/api";

export interface ShipmentRow {
  order_id: number;
  rgl_booking_number: string;
  place_of_loading: number;
  final_destination: string;
  order_item_id: number;
  item_ref: string;
  item_tracking_id: string | null;
  order_tracking_id: string | null;
  category: string | null;
  subcategory: string | null;
  status: string | null;
  total_number: string;
  weight: string;
  eta: string | null;
  loading_place_name: string | null;
  destination_place_name: string | null;
  created_at: string;
}

export interface OrderItemLine {
  order_item_id: number;
  item_ref: string;
  tracking_id: string | null;
  category: string | null;
  subcategory: string | null;
  status: string | null;
  boxes: number;
  weight: number;
  eta: string | null;
}

export interface OrderGroup {
  order_id: number;
  booking_number: string;
  pol: string;
  pod: string;
  created_at: string;
  items: OrderItemLine[];
}

export function groupByOrder(rows: ShipmentRow[]): OrderGroup[] {
  const map = new Map<number, OrderGroup>();

  for (const row of rows) {
    if (!map.has(row.order_id)) {
      map.set(row.order_id, {
        order_id: row.order_id,
        booking_number: row.rgl_booking_number,
        pol: row.loading_place_name ?? "—",
        pod: row.destination_place_name ?? "—",
        created_at: row.created_at,
        items: [],
      });
    }

    map.get(row.order_id)!.items.push({
      order_item_id: row.order_item_id,
      item_ref: row.item_ref,
      tracking_id: row.item_tracking_id,
      category: row.category,
      subcategory: row.subcategory,
      status: row.status,
      boxes: Number(row.total_number) || 0,
      weight: Number(row.weight) || 0,
      eta: row.eta,
    });
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function fetchShipmentsForReceiver(
  id: string | number,
): Promise<{ success: boolean; orders: OrderGroup[]; message?: string }> {
  const response = await api.get(`/shipments/${id}`, {
    validateStatus: () => true,
  });

  if (response.data.success) {
    return {
      success: true,
      orders: groupByOrder(response.data.data as ShipmentRow[]),
    };
  }

  return {
    success: false,
    orders: [],
    message: response.data.message,
  };
}

export const itemLabel = (item: {
  category: string | null;
  subcategory: string | null;
}) => [item.category, item.subcategory].filter(Boolean).join(" · ") || "Item";

const STAGE_ORDER = [
  "Created",
  "Under Processing",
  "Ready for Loading",
  "Loaded into Container",
  "Shipment Processing",
  "Shipment In Transit",
  "Arrived at Sort Facility",
  "Ready for Delivery",
  "Shipment Delivered",
];

/** An order is only as far along as its least advanced item. */
export const orderStatusOf = (order: OrderGroup): string => {
  const known = order.items
    .map((i) => i.status)
    .filter((s): s is string => !!s && STAGE_ORDER.includes(s))
    .sort((a, b) => STAGE_ORDER.indexOf(a) - STAGE_ORDER.indexOf(b));
  return known[0] ?? order.items[0]?.status ?? "Created";
};
