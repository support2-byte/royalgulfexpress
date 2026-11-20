export type AccountType = "receiver" | "sender" | "both";
export type Feature = "drop-off" | "storage" | "delivery" | "gatepass";

/** The part the logged-in customer plays in one specific order. */
export type OrderRole = "receiver" | "sender" | "both";

const ACCESS: Record<AccountType, Feature[]> = {
  receiver: ["storage", "delivery", "gatepass"],
  sender: ["drop-off"],
  both: ["drop-off", "storage", "delivery", "gatepass"],
};

export const canAccess = (
  type: string | null | undefined,
  feature: Feature,
): boolean => ACCESS[type as AccountType]?.includes(feature) ?? false;

/** Per-order access: sender -> drop-off only, receiver -> everything but drop-off. */
export const roleCan = (
  role: OrderRole | null | undefined,
  feature: Feature,
): boolean => (role ? ACCESS[role].includes(feature) : false);

export const isOrderRole = (v: unknown): v is OrderRole =>
  v === "receiver" || v === "sender" || v === "both";
