import { tr } from "@/i18n";
import { api } from "@/api";
import AddressPicker from "@/components/ui/AddressPicker";
import { Button } from "@/components/ui/Button";
import {
  CheckBox,
  FormLabel,
  OptionRow,
  SelectField,
  SheetModal,
  SummaryRow,
  TextField,
} from "@/components/ui/Form";
import Header, { useSheetStyle } from "@/components/ui/Header";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { itemLabel } from "@/lib/shipmentApi";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useFeatureGuard } from "@/hooks/useFeatureGuard";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

type Contact = {
  name: string;
  phone_number: string;
  delivery_address: string;
};

const OPTIONS_CONFIG = [
  {
    key: "offloading" as const,
    label: "Offloading Support",
    description: "Team unloads cartons at destination",
    price: 80,
    icon: "cube-outline",
  },
  {
    key: "markingRequired" as const,
    label: "Marking Required",
    description: "Labeling each carton before delivery",
    price: 20,
    icon: "pricetag-outline",
  },
  {
    key: "expressDelivery" as const,
    label: "Express Delivery",
    description: "Priority delivery within 24 hours",
    price: 70,
    icon: "flash-outline",
  },
];

const DeliveryOptions = () => {
  const { ordersFor, rates } = useAppContext();
  useFeatureGuard("delivery");
  const orders = useMemo(() => ordersFor("delivery"), [ordersFor]);
  const { bookingNumber } = useLocalSearchParams<{ bookingNumber?: string }>();
  const { user } = useAuth();
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const sheet = useSheetStyle();
  const [headerH, setHeaderH] = useState(0);

  const [contact, setContact] = useState<Contact>({
    name: "",
    phone_number: "",
    delivery_address: "",
  });

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(
    new Set(),
  );
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);

  const [deliveryOptions, setDeliveryOptions] = useState({
    offloading: false,
    markingRequired: false,
    expressDelivery: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const DELIVERY_RATE = rates?.delivery_rate;

  // Opened from an order's details: jump straight to that booking.
  useEffect(() => {
    if (!bookingNumber || selectedOrderId !== null) return;
    const match = orders.find(
      (o) => o.booking_number.toLowerCase() === bookingNumber.trim().toLowerCase(),
    );
    if (match) setSelectedOrderId(match.order_id);
  }, [bookingNumber, orders, selectedOrderId]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.order_id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const selectedItem = useMemo(
    () =>
      selectedOrder?.items.find((i) => selectedItemIds.has(i.order_item_id)) ??
      null,
    [selectedOrder, selectedItemIds],
  );

  const toggleDeliveryOption = (option: keyof typeof deliveryOptions) => {
    setDeliveryOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const toggleItem = (itemId: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setSelectedItemIds(new Set());
    setOrderPickerOpen(false);
  };

  const totalCost = useMemo(() => {
    let total = DELIVERY_RATE;
    OPTIONS_CONFIG.forEach((opt) => {
      if (deliveryOptions[opt.key]) total += opt.price;
    });
    return total;
  }, [deliveryOptions, DELIVERY_RATE]);

  const isFormValid =
    contact.name.trim().length > 0 &&
    contact.phone_number.trim().length > 0 &&
    contact.delivery_address.trim().length > 0 &&
    selectedOrderId !== null &&
    selectedItemIds.size > 0;

  const handleCreateDelivery = async () => {
    if (!isFormValid || isSubmitting || !selectedOrder || !selectedItem) return;

    setIsSubmitting(true);
    try {
      const selectedAddons = OPTIONS_CONFIG.filter(
        (opt) => deliveryOptions[opt.key],
      ).map((opt) => ({
        label: opt.label,
        price: opt.price,
      }));

      await api.post(`/shipments/delivery/${user.customer_id}`, {
        name: contact.name.trim(),
        contact_number: contact.phone_number.trim(),
        delivery_address: contact.delivery_address.trim(),
        addons: selectedAddons,
        orderId: selectedOrder.order_id,
        orderItemIds: Array.from(selectedItemIds),
        selectedShipment: selectedItem.item_ref,
      });

      Toast.show({
        text1: tr("Success!"),
        text2: tr("Delivery request has been created."),
        type: "success",
      });

      setContact({ name: "", phone_number: "", delivery_address: "" });
      setDeliveryOptions({
        offloading: false,
        markingRequired: false,
        expressDelivery: false,
      });
      setSelectedOrderId(null);
      setSelectedItemIds(new Set());

      router.replace("/home");
    } catch (error: any) {
      Toast.show({
        text1: tr("Failed!"),
        text2:
          error?.response?.data?.message ??
          error?.message ??
          "Something went wrong. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}>
        <Header
          name="Delivery options"
          description={`Door delivery from AED ${DELIVERY_RATE.toFixed(2)}`}
          icon="bus"
        />
      </View>

      <KeyboardAvoidingView
        style={sheet}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerH : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bodyContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(340)}>
            <FormLabel>{tr("Shipment")}</FormLabel>
            <SelectField
              icon="albums-outline"
              value={selectedOrder?.booking_number}
              placeholder={tr("Select order")}
              onPress={() => setOrderPickerOpen(true)}
              disabled={isSubmitting}
            />
            <SelectField
              icon="cube-outline"
              value={selectedItem ? itemLabel(selectedItem) : undefined}
              placeholder={
                selectedOrder ? "Select item" : "Select an order first"
              }
              onPress={() => selectedOrder && setItemPickerOpen(true)}
              disabled={isSubmitting || !selectedOrder}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(340).delay(60)}>
            <FormLabel>{tr("Who receives it")}</FormLabel>
            <TextField
              icon="person-outline"
              placeholder={tr("Contact name")}
              value={contact.name}
              onChangeText={(name) => setContact((prev) => ({ ...prev, name }))}
              autoCapitalize="words"
              editable={!isSubmitting}
            />
            <TextField
              icon="call-outline"
              placeholder={tr("Phone")}
              value={contact.phone_number}
              onChangeText={(phone_number) =>
                setContact((prev) => ({ ...prev, phone_number }))
              }
              keyboardType="phone-pad"
              editable={!isSubmitting}
            />
            <FormLabel>{tr("Delivery address")}</FormLabel>
            <AddressPicker
              value={contact.delivery_address}
              onChangeText={(delivery_address) =>
                setContact((prev) => ({ ...prev, delivery_address }))
              }
              disabled={isSubmitting}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(340).delay(120)}>
            <FormLabel>{tr("Add-on services")}</FormLabel>
            {OPTIONS_CONFIG.map((opt) => {
              const checked = deliveryOptions[opt.key];
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={styles.optionRow}
                  activeOpacity={0.7}
                  disabled={isSubmitting}
                  onPress={() => toggleDeliveryOption(opt.key)}
                >
                  <View
                    style={[styles.optionIcon, checked && styles.optionIconOn]}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={18}
                      color={checked ? "#fff" : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionText}>{opt.label}</Text>
                    <Text style={styles.optionDescription}>
                      {opt.description}
                    </Text>
                  </View>
                  <Text style={styles.optionPrice}>
                    +{opt.price.toFixed(0)}
                  </Text>
                  <CheckBox checked={checked} />
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(340).delay(180)}
            style={styles.summary}
          >
            <SummaryRow
              label="Base rate"
              value={`AED ${DELIVERY_RATE.toFixed(2)}`}
            />
            {OPTIONS_CONFIG.filter((opt) => deliveryOptions[opt.key]).map(
              (opt) => (
                <SummaryRow
                  key={opt.key}
                  label={opt.label}
                  value={`AED ${opt.price.toFixed(2)}`}
                />
              ),
            )}
            <View style={styles.totalDivider} />
            <SummaryRow
              label="Total"
              value={`AED ${totalCost.toFixed(2)}`}
              strong
            />
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={isSubmitting ? "Requesting..." : "Confirm & request"}
            icon="lock-closed"
            variant="accent"
            loading={isSubmitting}
            disabled={!isFormValid}
            onPress={handleCreateDelivery}
          />
          {!isFormValid && !isSubmitting && (
            <Text style={styles.validationHint}>
              {tr("Select a shipment and fill in all fields")}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>

      <SheetModal
        visible={orderPickerOpen}
        title={tr("Select order")}
        onClose={() => setOrderPickerOpen(false)}
      >
        <ScrollView>
          {orders.length === 0 ? (
            <Text style={styles.modalEmpty}>{tr("No shipments available")}</Text>
          ) : (
            orders.map((order) => (
              <OptionRow
                key={order.order_id}
                title={order.booking_number}
                subtitle={`${order.pol} → ${order.pod} · ${tr(order.items.length === 1 ? "{n} item" : "{n} items", { n: order.items.length })}`}
                selected={selectedOrderId === order.order_id}
                onPress={() => handleSelectOrder(order.order_id)}
              />
            ))
          )}
        </ScrollView>
      </SheetModal>

      <SheetModal
        visible={itemPickerOpen}
        title={tr("Select item")}
        onClose={() => setItemPickerOpen(false)}
      >
        <ScrollView>
          {selectedOrder?.items.map((item) => (
            <OptionRow
              key={item.order_item_id}
              title={itemLabel(item)}
              subtitle={`${tr("{n} boxes", { n: item.boxes })} · ${item.weight} kg${item.status ? ` · ${item.status}` : ""}`}
              selected={selectedItemIds.has(item.order_item_id)}
              onPress={() => toggleItem(item.order_item_id)}
            />
          ))}
        </ScrollView>
      </SheetModal>
    </SafeAreaView>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"], fontSize: ReturnType<typeof useAppTheme>["fontSize"], fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    bodyContainer: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.hairline,
    },
    optionIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    optionIconOn: { backgroundColor: colors.primary },
    optionText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.ink,
    },
    optionDescription: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
    },
    optionPrice: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    summary: {
      marginTop: 28,
      paddingTop: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairline,
    },
    totalDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderColor,
      marginVertical: 4,
    },
    footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
    validationHint: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 10,
    },
    modalEmpty: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: "center",
      paddingVertical: 24,
    },
  });

export default DeliveryOptions;
