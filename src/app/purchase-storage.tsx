import { ls, tr, useI18n } from "@/i18n";
import { api } from "@/api";
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
import Ionicons from "@react-native-vector-icons/ionicons";
import { router, useLocalSearchParams } from "expo-router";
import moment from "moment";
import { useFeatureGuard } from "@/hooks/useFeatureGuard";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, TextInput } from "@/components/ui/Text";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const DAY_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);
const MIN_CARTONS = 1;
const SIZE_UNITS = ["CBM", "Sq ft", "Sq m"];

const uniq = (values: (string | null)[]) =>
  Array.from(new Set(values.filter(Boolean))).join(", ");

const PurchaseStorage = () => {
  const { bookingNumber } = useLocalSearchParams<{ bookingNumber?: string }>();
  const { user } = useAuth();
  const { ordersFor, rates } = useAppContext();
  useFeatureGuard("storage");
  const orders = useMemo(() => ordersFor("storage"), [ordersFor]);
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);
  const sheet = useSheetStyle();

  const COST_PER_CARTON_PER_DAY = rates.storage_rate;

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(
    new Set(),
  );
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);

  const [days, setDays] = useState<number>(5);
  const [cartons, setCartons] = useState<number>(MIN_CARTONS);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [storageType, setStorageType] = useState<RateOption | null>(null);
  const [storageSize, setStorageSize] = useState<RateOption | null>(null);
  const [requiredFrom, setRequiredFrom] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [sizePickerOpen, setSizePickerOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const { lang } = useI18n();
  const dateOptions = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = moment().add(i, "days");
        return {
          value: d.format("YYYY-MM-DD"),
          label: d.format("ddd, D MMM YYYY"),
        };
      }),
    [lang],
  );

  const selectedOrder = useMemo(
    () => orders.find((o) => o.order_id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const selectedItems = useMemo(
    () =>
      selectedOrder?.items.filter((i) =>
        selectedItemIds.has(i.order_item_id),
      ) ?? [],
    [selectedOrder, selectedItemIds],
  );

  const maxCartons = useMemo(
    () => selectedItems.reduce((sum, i) => sum + Number(i.boxes || 0), 0),
    [selectedItems],
  );

  const categoryText = uniq(selectedItems.map((i) => i.category));
  const subcategoryText = uniq(selectedItems.map((i) => i.subcategory));

  useEffect(() => {
    setCartons(maxCartons > 0 ? maxCartons : MIN_CARTONS);
  }, [maxCartons]);

  useEffect(() => {
    if (!bookingNumber || selectedOrderId !== null || orders.length === 0)
      return;

    const match = orders.find(
      (o) =>
        o.booking_number.toLowerCase() === bookingNumber.trim().toLowerCase(),
    );

    if (match) {
      setSelectedOrderId(match.order_id);
      setSelectedItemIds(new Set());
    }
  }, [bookingNumber, orders, selectedOrderId]);

  const totalCost = useMemo(
    () => days * cartons * COST_PER_CARTON_PER_DAY,
    [days, cartons, COST_PER_CARTON_PER_DAY],
  );

  const isFormValid =
    selectedOrderId !== null &&
    selectedItemIds.size > 0 &&
    storageSize !== null &&
    requiredFrom !== null &&
    cartons >= MIN_CARTONS &&
    cartons <= maxCartons;

  const handleIncrementCartons = () =>
    setCartons((prev) => Math.min(prev + 10, maxCartons));

  const handleDecrementCartons = () =>
    setCartons((prev) => Math.max(prev - 10, MIN_CARTONS));

  const handleSelectDays = (value: number) => {
    setDays(value);
    setDayPickerOpen(false);
  };

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setSelectedItemIds(new Set());
    setOrderPickerOpen(false);
  };

  const toggleItem = (itemId: number) => {
    setSelectedItemIds(new Set([itemId]));
    setItemPickerOpen(false);
  };

  const handlePurchase = async () => {
    if (!isFormValid || !selectedOrder) return;

    setSubmitting(true);

    try {
      const selectedItems = selectedOrder.items.filter((i) =>
        selectedItemIds.has(i.order_item_id),
      );

      const uniq = (values: (string | null)[]) =>
        Array.from(new Set(values.filter(Boolean))).join(", ");

      const response = await api.post(
        `/shipments/purchase-storage/${user.customer_id}`,
        {
          days,
          cartons,
          totalCost,
          orderId: selectedOrder.order_id,
          orderItemIds: Array.from(selectedItemIds),
          selectedShipment: selectedItems[0].item_ref,
          sizeValue: Number(storageSize?.key.split("_")[0]),
          sizeUnit: storageSize?.key.split("_")[1],
          requiredFrom,
          notes: notes.trim(),
        },
        {
          validateStatus: () => true,
        },
      );

      const result = response.data;

      if (result.success) {
        Toast.show({
          text1: tr("Successful"),
          text2: result.message,
          type: "success",
        });
        router.replace("/home");
      } else {
        Toast.show({
          text1: tr("Failed"),
          text2: result.message,
          type: "error",
        });
      }
    } catch (err: any) {
      Toast.show({
        text1: tr("Failed"),
        text2: err.message,
        type: "error",
      });
    } finally {
      setSubmitting(false);
      setDays(5);
      setCartons(500);
      setSelectedOrderId(null);
      setSelectedItemIds(new Set());
      setStorageType(null);
      setStorageSize(null);
      setRequiredFrom(null);
      setNotes("");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <Header
        name="Storage"
        description={tr("Need more time? Buy extra storage days")}
        icon="storefront"
      />

      <View style={sheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bodyContainer}
        >
          <Animated.View
            entering={FadeInDown.duration(340)}
            style={styles.notice}
          >
            <View style={styles.noticeIcon}>
              <Ionicons name="alert-circle-outline" size={18} color="#B4690E" />
            </View>
            <Text style={styles.noticeText}>
              Storage charges active, 2 days overdue. AED {rates.storage_rate}{" "}
              charged so far
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(340).delay(40)}>
            <FormLabel>{tr("Shipment")}</FormLabel>
            <SelectField
              icon="albums-outline"
              value={selectedOrder?.booking_number}
              placeholder={tr("Select order")}
              onPress={() => setOrderPickerOpen(true)}
            />
            <SelectField
              icon="cube-outline"
              value={selectedItems[0] ? itemLabel(selectedItems[0]) : undefined}
              placeholder={
                selectedOrder ? "Select item" : "Select an order first"
              }
              onPress={() => selectedOrder && setItemPickerOpen(true)}
              disabled={!selectedOrder}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(340).delay(80)}>
            <FormLabel>{tr("Extra days to buy")}</FormLabel>
            <SelectField
              icon="calendar-outline"
              value={`${days} ${tr(days === 1 ? "day" : "days")}`}
              placeholder={tr("Choose days")}
              onPress={() => setDayPickerOpen(true)}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(340).delay(120)}>
            <FormLabel>{tr("Quantity to store")}</FormLabel>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={[
                  styles.stepperBtn,
                  cartons <= MIN_CARTONS && styles.stepperBtnDisabled,
                ]}
                activeOpacity={0.7}
                onPress={handleDecrementCartons}
                disabled={cartons <= MIN_CARTONS}
              >
                <Ionicons name="remove" size={22} color={colors.ink} />
              </TouchableOpacity>
              <View style={styles.stepperValueBox}>
                <TextInput
                  style={styles.stepperInput}
                  value={String(cartons)}
                  onChangeText={(text) => {
                    const digitsOnly = text.replace(/[^0-9]/g, "");
                    if (digitsOnly === "") {
                      setCartons(MIN_CARTONS);
                      return;
                    }
                    setCartons(
                      Math.min(
                        Number(digitsOnly),
                        Math.max(maxCartons, MIN_CARTONS),
                      ),
                    );
                  }}
                  onBlur={() =>
                    setCartons((prev) =>
                      Math.min(
                        Math.max(prev, MIN_CARTONS),
                        Math.max(maxCartons, MIN_CARTONS),
                      ),
                    )
                  }
                  keyboardType="number-pad"
                  maxLength={Math.max(String(maxCartons).length, 1)}
                  selectTextOnFocus
                />
                <Text style={styles.stepperUnitText}>{tr("cartons")}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.stepperBtn,
                  cartons >= maxCartons && styles.stepperBtnDisabled,
                ]}
                activeOpacity={0.7}
                onPress={handleIncrementCartons}
                disabled={cartons >= maxCartons}
              >
                <Ionicons name="add" size={22} color={colors.ink} />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              {maxCartons > 0
                ? tr("Min {min} · Max {max} cartons (item total)", { min: MIN_CARTONS, max: maxCartons })
                : "Select item(s) to set the quantity"}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(340).delay(140)}>
            <FormLabel>{tr("Storage type")}</FormLabel>
            <SelectField
              icon="snow-outline"
              value={storageType?.label}
              placeholder={tr("Select storage type")}
              onPress={() => setTypePickerOpen(true)}
            />

            <FormLabel>{tr("Storage size")}</FormLabel>
            <SelectField
              icon="resize-outline"
              value={storageSize?.label}
              placeholder={tr("Select storage size")}
              onPress={() => setSizePickerOpen(true)}
            />

            <FormLabel>{tr("Required from")}</FormLabel>
            <SelectField
              icon="calendar-number-outline"
              value={
                requiredFrom
                  ? dateOptions.find((d) => d.value === requiredFrom)?.label
                  : undefined
              }
              placeholder={tr("Select start date")}
              onPress={() => setDatePickerOpen(true)}
            />

            <FormLabel>{tr("Notes (optional)")}</FormLabel>
            <TextField
              icon="document-text-outline"
              placeholder={tr("Any special instructions")}
              value={notes}
              onChangeText={setNotes}
              maxLength={200}
              editable={!submitting}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(340).delay(160)}
            style={styles.summary}
          >
            <SummaryRow
              label="Shipment"
              value={selectedOrder ? selectedOrder.booking_number : "—"}
            />
            <SummaryRow label="Category" value={categoryText || "—"} />
            <SummaryRow label="Subcategory" value={subcategoryText || "—"} />
            <SummaryRow label="Cartons" value={String(cartons)} />
            <SummaryRow
              label="Days"
              value={`${days} ${tr(days === 1 ? "day" : "days")}`}
            />
            <SummaryRow label="Size" value={storageSize?.label ?? "—"} />
            <SummaryRow label="Start date" value={requiredFrom ?? "—"} />
            <SummaryRow
              label="Rate"
              value={`AED ${COST_PER_CARTON_PER_DAY.toFixed(2)} / ${tr("carton")} / ${tr("day")}`}
            />
            <View style={styles.totalDivider} />
            <SummaryRow
              label="Total"
              value={`AED ${totalCost.toFixed(2)}`}
              strong
            />
            <SummaryRow
              label="Total (Estimated)"
              value={`AED ${totalCost.toFixed(2)}`}
              strong
            />
            <Text style={styles.estimateNote}>
              {tr("* This is an estimated amount only. The final amount will be confirmed once our team assigns the storage type for your shipment. Each type carries its own rate, which will be added to this total.")}
            </Text>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Confirm & purchase"
            icon="lock-closed"
            variant="accent"
            loading={submitting}
            disabled={!isFormValid}
            onPress={handlePurchase}
          />
          {!isFormValid && !submitting && (
            <Text style={styles.validationHint}>
              {tr("Select a shipment, item, storage size and start date to continue")}
            </Text>
          )}
        </View>
      </View>

      <SheetModal
        visible={dayPickerOpen}
        title={tr("Choose extra days")}
        onClose={() => setDayPickerOpen(false)}
      >
        <ScrollView>
          {DAY_OPTIONS.map((option) => (
            <OptionRow
              key={option}
              title={`${option} ${tr(option === 1 ? "day" : "days")}`}
              selected={option === days}
              onPress={() => handleSelectDays(option)}
            />
          ))}
        </ScrollView>
      </SheetModal>

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
      <SheetModal
        visible={typePickerOpen}
        title={tr("Select storage type")}
        onClose={() => setTypePickerOpen(false)}
      >
        <ScrollView>
          {rates.storage_types.map((opt) => (
            <OptionRow
              key={opt.key}
              title={opt.label}
              subtitle={`AED ${opt.value.toFixed(2)} / ${tr("day")}`}
              selected={opt.key === storageType?.key}
              onPress={() => {
                setStorageType(opt);
                setTypePickerOpen(false);
              }}
            />
          ))}
        </ScrollView>
      </SheetModal>

      <SheetModal
        visible={sizePickerOpen}
        title={tr("Select storage size")}
        onClose={() => setSizePickerOpen(false)}
      >
        <ScrollView>
          {rates.storage_sizes.map((opt) => (
            <OptionRow
              key={opt.key}
              title={opt.label}
              subtitle={`AED ${opt.value.toFixed(2)} / ${tr("day")}`}
              selected={opt.key === storageSize?.key}
              onPress={() => {
                setStorageSize(opt);
                setSizePickerOpen(false);
              }}
            />
          ))}
        </ScrollView>
      </SheetModal>

      <SheetModal
        visible={datePickerOpen}
        title={tr("Required from")}
        onClose={() => setDatePickerOpen(false)}
      >
        <ScrollView>
          {dateOptions.map((opt) => (
            <OptionRow
              key={opt.value}
              title={opt.label}
              selected={opt.value === requiredFrom}
              onPress={() => {
                setRequiredFrom(opt.value);
                setDatePickerOpen(false);
              }}
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
    bodyContainer: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
    notice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingBottom: 4,
    },
    sizeRow: { flexDirection: "row", gap: 8 },
    noticeIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#FEF1E6",
      alignItems: "center",
      justifyContent: "center",
    },
    noticeText: {
      flex: 1,
      fontFamily: fonts.medium,
      fontSize: fontSize.xs,
      lineHeight: 17,
      color: "#B4690E",
    },
    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    stepperBtn: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperBtnDisabled: { opacity: 0.35 },
    stepperValueBox: { flex: 1, alignItems: "center" },
    stepperInput: {
      fontFamily: fonts.bold,
      fontSize: 36,
      color: colors.ink,
      letterSpacing: ls(-1),
      padding: 0,
      textAlign: "center",
      minWidth: 120,
    },
    stepperUnitText: {
      fontFamily: fonts.medium,
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: 2,
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
    helperText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.lightText,
      paddingHorizontal: 6,
      marginTop: 2,
    },
    estimateNote: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: colors.error,
      marginTop: 10,
      lineHeight: 16,
    },
  });

export default PurchaseStorage;
