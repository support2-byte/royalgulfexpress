import { tr, useI18n } from "@/i18n";
import { api } from "@/api";
import AddressPicker from "@/components/ui/AddressPicker";
import { Button } from "@/components/ui/Button";
import {
  FormLabel,
  OptionRow,
  SelectField,
  SheetModal,
  SummaryRow,
  TextField,
} from "@/components/ui/Form";
import Header, { useSheetStyle } from "@/components/ui/Header";
import { RateOption, useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import { itemLabel } from "@/lib/shipmentApi";
import { router, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { useFeatureGuard } from "@/hooks/useFeatureGuard";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const DropOff = () => {
  const { ordersFor, rates } = useAppContext();
  useFeatureGuard("drop-off");
  const orders = useMemo(() => ordersFor("drop-off"), [ordersFor]);
  const { bookingNumber } = useLocalSearchParams<{ bookingNumber?: string }>();
  const { user } = useAuth();
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const sheet = useSheetStyle();
  const [headerH, setHeaderH] = useState(0);

  const [customerName, setCustomerName] = useState(user?.fullName ?? "");
  const [contactNumber, setContactNumber] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupDate, setPickupDate] = useState<string | null>(null);
  const [zone, setZone] = useState<RateOption | null>(null);

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [zonePickerOpen, setZonePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { lang } = useI18n();
  const dateOptions = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const d = moment().add(i, "days");
        return {
          value: d.format("YYYY-MM-DD"),
          label: d.format("ddd, D MMM YYYY"),
        };
      }),
    [lang],
  );

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
      selectedOrder?.items.find((i) => i.order_item_id === selectedItemId) ??
      null,
    [selectedOrder, selectedItemId],
  );

  const pickupAmount = zone?.value ?? 0;

  const isFormValid =
    selectedItem !== null &&
    customerName.trim().length > 0 &&
    contactNumber.trim().length > 0 &&
    pickupAddress.trim().length > 0 &&
    pickupDate !== null &&
    zone !== null;

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setSelectedItemId(null);
    setOrderPickerOpen(false);
  };

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting || !selectedItem || !zone) return;
    if (!user?.customer_id) return;

    setIsSubmitting(true);
    try {
      await api.post(`/shipments/drop-off/${user.customer_id}`, {
        customerName: customerName.trim(),
        contactNumber: contactNumber.trim(),
        pickupAddress: pickupAddress.trim(),
        pickupDate,
        zone: zone.key,
        selectedShipment: selectedItem.item_ref,
      });

      Toast.show({
        text1: tr("Success!"),
        text2: tr("Drop-off request has been created."),
        type: "success",
      });

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
          name="Drop-off"
          description={tr("Schedule a pickup from the sender")}
          icon="car"
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
            <FormLabel>{tr("Sender details")}</FormLabel>
            <TextField
              icon="person-outline"
              placeholder={tr("Customer name")}
              value={customerName}
              onChangeText={setCustomerName}
              autoCapitalize="words"
              editable={!isSubmitting}
            />
            <TextField
              icon="call-outline"
              placeholder={tr("Contact number")}
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              editable={!isSubmitting}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(340).delay(100)}>
            <FormLabel>{tr("Pickup address")}</FormLabel>
            <AddressPicker
              value={pickupAddress}
              onChangeText={setPickupAddress}
              placeholder={tr("Search or pick pickup address")}
              disabled={isSubmitting}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(340).delay(140)}>
            <FormLabel>{tr("Pickup schedule")}</FormLabel>
            <SelectField
              icon="calendar-number-outline"
              value={
                pickupDate
                  ? dateOptions.find((d) => d.value === pickupDate)?.label
                  : undefined
              }
              placeholder={tr("Select pickup date")}
              onPress={() => setDatePickerOpen(true)}
              disabled={isSubmitting}
            />
            <SelectField
              icon="map-outline"
              value={zone?.label}
              placeholder={tr("Select pickup zone")}
              onPress={() => setZonePickerOpen(true)}
              disabled={isSubmitting}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(340).delay(180)}
            style={styles.summary}
          >
            <SummaryRow label="Pickup zone" value={zone?.label ?? "—"} />
            <View style={styles.totalDivider} />
            <SummaryRow
              label="Pickup amount"
              value={`AED ${pickupAmount.toFixed(2)}`}
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
            onPress={handleSubmit}
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
              subtitle={`${tr("{n} boxes", { n: item.boxes })} · ${item.weight} kg`}
              selected={selectedItemId === item.order_item_id}
              onPress={() => {
                setSelectedItemId(item.order_item_id);
                setItemPickerOpen(false);
              }}
            />
          ))}
        </ScrollView>
      </SheetModal>

      <SheetModal
        visible={datePickerOpen}
        title={tr("Pickup date")}
        onClose={() => setDatePickerOpen(false)}
      >
        <ScrollView>
          {dateOptions.map((opt) => (
            <OptionRow
              key={opt.value}
              title={opt.label}
              selected={opt.value === pickupDate}
              onPress={() => {
                setPickupDate(opt.value);
                setDatePickerOpen(false);
              }}
            />
          ))}
        </ScrollView>
      </SheetModal>

      <SheetModal
        visible={zonePickerOpen}
        title={tr("Select pickup zone")}
        onClose={() => setZonePickerOpen(false)}
      >
        <ScrollView>
          {rates.pickup_zones.length === 0 ? (
            <Text style={styles.modalEmpty}>{tr("No pickup zones available")}</Text>
          ) : (
            rates.pickup_zones.map((opt) => (
              <OptionRow
                key={opt.key}
                title={opt.label}
                subtitle={`AED ${opt.value.toFixed(2)}`}
                selected={opt.key === zone?.key}
                onPress={() => {
                  setZone(opt);
                  setZonePickerOpen(false);
                }}
              />
            ))
          )}
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

export default DropOff;
