import { tr } from "@/i18n";
import type { Feature } from "@/constants/permissions";
import { useAppContext } from "@/context/AppContext";
import AlertsIcon from "@assets/icons/alert.png";
import DeliveryOptionsIcon from "@assets/icons/delivery.png";
import GatepassIcon from "@assets/icons/gatepass.png";
import InvoicesIcon from "@assets/icons/invoice.png";
import ShipmentsIcon from "@assets/icons/shipments.png";
import StorageIcon from "@assets/icons/storage.png";
import SupportIcon from "@assets/icons/support.png";
import TrackingIcon from "@assets/icons/tracking.png";
import { router } from "expo-router";
import React from "react";
import { QuickAction } from "./QuickAction";
import { SectionHeader } from "./SectionHeader";

type Item = {
  icon: any;
  label: string;
  description: string;
  path: string;
  feature?: Feature;
};

const CARGO: Item[] = [
  {
    icon: ShipmentsIcon,
    label: "Shipments",
    description: "Every booking in one list",
    path: "/shipments",
  },
  {
    icon: TrackingIcon,
    label: "Tracking",
    description: "Follow your cargo step by step",
    path: "/tracking",
  },
  {
    icon: DeliveryOptionsIcon,
    label: "Delivery options",
    description: "Choose how you receive it",
    path: "/delivery-options",
    feature: "delivery",
  },
  {
    icon: DeliveryOptionsIcon,
    label: "Drop-off",
    description: "Schedule a pickup from sender",
    path: "/drop-off",
    feature: "drop-off",
  },
  {
    icon: StorageIcon,
    label: "Storage",
    description: "Buy extra storage time",
    path: "/purchase-storage",
    feature: "storage",
  },
  {
    icon: GatepassIcon,
    label: "Gatepass history",
    description: "Past gatepasses",
    path: "/gatepass-history",
    feature: "gatepass",
  },
];

const ACCOUNT: Item[] = [
  {
    icon: InvoicesIcon,
    label: "Invoices",
    description: "Bills and payments",
    path: "/invoices",
  },
  {
    icon: AlertsIcon,
    label: "Alerts",
    description: "Updates about your cargo",
    path: "/alerts",
  },
  {
    icon: SupportIcon,
    label: "Support",
    description: "Talk to our team",
    path: "/support",
  },
];

export const ServicesTab: React.FC = () => {
  const { canUseFeature } = useAppContext();

  const visible = (items: Item[]) =>
    items.filter((item) => !item.feature || canUseFeature(item.feature));

  const cargo = visible(CARGO);
  const account = visible(ACCOUNT);

  return (
    <>
      <SectionHeader title={tr("Cargo")} />
      {cargo.map((item, index) => (
        <QuickAction
          key={item.path}
          icon={item.icon}
          label={item.label}
          description={item.description}
          index={index}
          onPress={() => router.navigate(item.path as any)}
        />
      ))}
      <SectionHeader title={tr("Account")} />
      {account.map((item, index) => (
        <QuickAction
          key={item.path}
          icon={item.icon}
          label={item.label}
          description={item.description}
          index={index + cargo.length}
          onPress={() => router.navigate(item.path as any)}
        />
      ))}
    </>
  );
};
