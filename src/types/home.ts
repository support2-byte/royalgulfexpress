export interface RecentOrder {
  order_id: number | string;
  rgl_booking_number: string;
  place_of_loading: string | number;
  place_of_destination: string | number;
  loading_place_name: string;
  destination_place_name: string;
  eta: string | null;
  status: string;
  created_at: string;
  item_tracking_id?: string;
  order_tracking_id?: string;
}

export interface RecentInvoice {
  id: string;
  invoice_id: string;
  created_at: string;
  due_at: string | null;
  status: "paid" | "unpaid" | string;
  amount: number;
}

export interface DashboardData {
  total_orders: number;
  total_invoices: number;
  recent_orders: RecentOrder[];
  recent_invoices: RecentInvoice[];
  unpaid_count?: number;
  unpaid_total?: number;
}

export type HomeTabKey =
  | "shipments"
  | "invoices"
  | "overview"
  | "services"
  | "alerts";
