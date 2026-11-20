import { api } from "@/api";
import type { RecentInvoice } from "@/types/home";

interface InvoiceRow {
  public_ref: string;
  invoice_id: string;
  invoice_type?: string | null;
  shipment_id?: string | null;
  amount: string | number | null;
  status: string | null;
  due_at: string | null;
  created_at: string | null;
}

/** Same paid/unpaid rule the Invoices screen uses. */
export const isPaidStatus = (status?: string | null) => {
  const s = (status ?? "").toLowerCase();
  return s.includes("paid") && !s.includes("unpaid");
};

/**
 * Every invoice of the customer, newest first. Used by the dashboard so its
 * counts always agree with the Invoices screen.
 */
export async function fetchCustomerInvoices(
  customerId: string | number,
): Promise<RecentInvoice[]> {
  try {
    const { data } = await api.get(`/invoices/${customerId}`);
    if (!data?.success) return [];

    const rows: InvoiceRow[] = data.data ?? [];
    return rows
      .map((row) => ({
        id: row.public_ref,
        invoice_id: row.invoice_id,
        created_at: row.created_at ?? row.due_at ?? "",
        due_at: row.due_at,
        status: isPaidStatus(row.status) ? "paid" : "unpaid",
        amount: Number(row.amount) || 0,
      }))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  } catch (err: any) {
    if (err?.response?.status === 404) return [];
    throw err;
  }
}
