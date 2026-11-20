import type { Feature } from "@/constants/permissions";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { useEffect } from "react";

/** Sends the customer home when they have no order they may use this feature on. */
export const useFeatureGuard = (feature: Feature) => {
  const { loading } = useAuth();
  const { canUseFeature, shipmentsLoading } = useAppContext();
  const allowed = canUseFeature(feature);
  const ready = !loading && !shipmentsLoading;

  useEffect(() => {
    if (ready && !allowed) router.replace("/home");
  }, [ready, allowed]);

  return allowed;
};
