/**
 * Partial-assignment helpers. An item can be split across several containers,
 * each travelling on its own, so one item may have several "shipments".
 * Mirrors the admin TrackingPage (normalizeShipments / earliestEta).
 */

export interface RawShipmentHistory {
  status: string;
  time: string;
  eta?: string | null;
}

export interface RawShipment {
  qty?: number | string | null;
  weight?: number | string | null;
  container?: string | null;
  status?: string | null;
  eta?: string | null;
  history?: RawShipmentHistory[] | null;
}

export interface ShipmentPart {
  qty: number;
  weight: number;
  container: string | null;
  status: string;
  idx: number;
  delivered: boolean;
  eta: string | null;
  history: RawShipmentHistory[];
}

const EXCLUDED_STEPS = ["Rejected", "Canceled", "Cancelled"];

/** Ordered happy-path steps (rejected / cancelled are not part of the journey). */
export const journeySteps = (sequence?: string[] | null): string[] =>
  (sequence ?? []).filter((s) => !EXCLUDED_STEPS.includes(s));

export const normalizeShipments = (
  item: { shipments?: RawShipment[] | null } | null | undefined,
  steps: string[],
): ShipmentPart[] => {
  const last = steps.length - 1;
  return (item?.shipments ?? []).map((sh) => {
    const idx = Math.max(steps.indexOf(sh.status ?? ""), 0);
    return {
      qty: Number(sh.qty) || 0,
      weight: Number(sh.weight) || 0,
      container: sh.container || null,
      status: sh.status || steps[0] || "Created",
      idx,
      delivered: last >= 0 && idx === last,
      eta: sh.eta || null,
      history: (sh.history ?? [])
        .filter((h) => h.status)
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()),
    };
  });
};

export const earliestEta = (parts: ShipmentPart[]): string | null =>
  parts
    .filter((p) => !p.delivered && p.eta)
    .map((p) => p.eta as string)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

export const isPartial = (parts: ShipmentPart[]) => parts.length > 1;
