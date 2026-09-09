import { api } from "@/api";

export async function createNgeniusOrder(invoiceId: string) {
  const { data } = await api.post(`/invoices/${invoiceId}/ngenius/order`);

  if (!data?.success) {
    throw new Error(data?.message ?? "Failed to start payment.");
  }

  return data.data as { paymentUrl: string; orderReferenceId: string };
}

export async function confirmNgeniusPayment(orderReferenceId: string) {
  const { data } = await api.get(`/invoices/${orderReferenceId}/confirm`);

  if (!data?.success) {
    throw new Error(data?.message ?? "Failed to confirm payment.");
  }

  return data.data as { state: string };
}
