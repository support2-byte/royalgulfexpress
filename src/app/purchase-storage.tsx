import { api } from "@/api";
import Header from "@/components/ui/Header";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const DAY_OPTIONS = [1, 2, 3, 4, 5, 7, 10, 14];
const MIN_CARTONS = 1;
const MAX_CARTONS = 5000;

const PurchaseStorage = () => {
  const { user } = useAuth();
  const { orders, rates } = useAppContext();
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const COST_PER_CARTON_PER_DAY = rates.storage_rate;

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(
    new Set(),
  );
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);

  const [days, setDays] = useState<number>(5);
  const [cartons, setCartons] = useState<number>(500);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.order_id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const totalCost = useMemo(
    () => days * cartons * COST_PER_CARTON_PER_DAY,
    [days, cartons],
  );

  const isFormValid = selectedOrderId !== null && selectedItemIds.size > 0;

  const handleIncrementCartons = () =>
    setCartons((prev) => Math.min(prev + 10, MAX_CARTONS));

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
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  const handlePurchase = async () => {
    if (!isFormValid || !selectedOrder) return;

    setSubmitting(true);

    try {
      const selectedItems = selectedOrder.items.filter((i) =>
        selectedItemIds.has(i.order_item_id),
      );

      const response = await api.post(
        `/shipments/purchase-storage/${user.customer_id}`,
        {
          days,
          cartons,
          totalCost,
          orderId: selectedOrder.order_id,
          orderItemIds: Array.from(selectedItemIds),
          selectedShipment: selectedItems.map((i) => i.item_ref),
        },
        {
          validateStatus: () => true,
        },
      );

      const result = response.data;

      if (result.success) {
        Toast.show({
          text1: "Successful",
          text2: result.message,
          type: "success",
        });
        router.replace("/home");
      } else {
        Toast.show({
          text1: "Failed",
          text2: result.message,
          type: "error",
        });
      }
    } catch (err: any) {
      Toast.show({
        text1: "Failed",
        text2: err.message,
        type: "error",
      });
    } finally {
      setSubmitting(false);
      setDays(5);
      setCartons(500);
      setSelectedOrderId(null);
      setSelectedItemIds(new Set());
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        name="Storage"
        description="Need more time? Buy Extra Storage"
        icon="storefront"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.bodyContainer}
      >
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={styles.infoCard}
        >
          <Ionicons name="alert-circle-outline" size={15} color="#B4690E" />
          <Text style={styles.infoText}>
            Storage charges active, 2 days overdue. AED {rates.storage_rate}{" "}
            charged so far
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(300).delay(30)}
          style={styles.inputContainer}
        >
          <Text style={styles.label}>Select Shipment</Text>
          <TouchableOpacity
            style={styles.dropdown}
            activeOpacity={0.7}
            onPress={() => setOrderPickerOpen(true)}
          >
            <View style={styles.dropdownLeft}>
              <Ionicons
                name="albums-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  styles.dropdownText,
                  !selectedOrder && { color: colors.lightText },
                ]}
                numberOfLines={1}
              >
                {selectedOrder ? selectedOrder.booking_number : "Select order"}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdown, { marginTop: 8 }]}
            activeOpacity={0.7}
            onPress={() => selectedOrder && setItemPickerOpen(true)}
            disabled={!selectedOrder}
          >
            <View style={styles.dropdownLeft}>
              <Ionicons
                name="cube-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  styles.dropdownText,
                  selectedItemIds.size === 0 && { color: colors.lightText },
                ]}
                numberOfLines={1}
              >
                {selectedItemIds.size > 0
                  ? `${selectedItemIds.size} item${selectedItemIds.size !== 1 ? "s" : ""} selected`
                  : selectedOrder
                    ? "Select item(s)"
                    : "Select an order first"}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(300).delay(60)}
          style={styles.inputContainer}
        >
          <Text style={styles.label}>Choose Extra Days to Buy</Text>
          <TouchableOpacity
            style={styles.dropdown}
            activeOpacity={0.7}
            onPress={() => setDayPickerOpen(true)}
          >
            <View style={styles.dropdownLeft}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.dropdownText}>
                {days} {days === 1 ? "day" : "days"}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(300).delay(90)}
          style={styles.inputContainer}
        >
          <Text style={styles.label}>Quantity to Store</Text>
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
              <Ionicons name="remove" size={16} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.stepperValueBox}>
              <Ionicons
                name="cube-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={styles.stepperValueText}>{cartons} cartons</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.stepperBtn,
                cartons >= MAX_CARTONS && styles.stepperBtnDisabled,
              ]}
              activeOpacity={0.7}
              onPress={handleIncrementCartons}
              disabled={cartons >= MAX_CARTONS}
            >
              <Ionicons name="add" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(300).delay(120)}
          style={styles.card}
        >
          <View style={styles.cardLabelRow}>
            <Ionicons
              name="receipt-outline"
              size={14}
              color={colors.secondary}
            />
            <Text style={styles.cardLabel}>Order Summary</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={styles.cardTextLeft}>Shipment</Text>
            <Text style={styles.cardTextRight}>
              {selectedOrder ? selectedOrder.booking_number : "—"}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardTextLeft}>Items</Text>
            <Text style={styles.cardTextRight}>
              {selectedItemIds.size > 0 ? selectedItemIds.size : "—"}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardTextLeft}>Cartons</Text>
            <Text style={styles.cardTextRight}>{cartons}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardTextLeft}>Days</Text>
            <Text style={styles.cardTextRight}>
              {days} {days === 1 ? "day" : "days"}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardTextLeft}>Cost per day</Text>
            <Text style={styles.cardTextRight}>
              AED {COST_PER_CARTON_PER_DAY.toFixed(2)} / carton
            </Text>
          </View>

          <View style={styles.totalDivider} />

          <View style={styles.cardRow}>
            <Text style={styles.totalLabel}>Total Cost</Text>
            <Text style={styles.totalValue}>AED {totalCost.toFixed(2)}</Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            (!isFormValid || submitting) && { opacity: 0.5 },
          ]}
          activeOpacity={0.85}
          onPress={handlePurchase}
          disabled={!isFormValid || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Ionicons
                name="lock-closed"
                size={15}
                color={colors.background}
              />
              <Text style={styles.buttonText}>Confirm & Purchase</Text>
            </>
          )}
        </TouchableOpacity>
        {!isFormValid && !submitting && (
          <Text style={styles.validationHint}>
            Select a shipment and item(s) to continue
          </Text>
        )}
      </View>

      {/* Day picker */}
      <Modal
        visible={dayPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDayPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDayPickerOpen(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose Extra Days</Text>
            {DAY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.modalOption}
                activeOpacity={0.7}
                onPress={() => handleSelectDays(option)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    option === days && {
                      color: colors.primary,
                      fontFamily: fonts.semiBold,
                    },
                  ]}
                >
                  {option} {option === 1 ? "day" : "days"}
                </Text>
                {option === days && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Order picker */}
      <Modal
        visible={orderPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setOrderPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOrderPickerOpen(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Order</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {orders.length === 0 ? (
                <Text style={styles.modalEmpty}>No shipments available</Text>
              ) : (
                orders.map((order) => (
                  <TouchableOpacity
                    key={order.order_id}
                    style={styles.modalOption}
                    activeOpacity={0.7}
                    onPress={() => handleSelectOrder(order.order_id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalOptionText}>
                        {order.booking_number}
                      </Text>
                      <Text style={styles.modalOptionSub} numberOfLines={1}>
                        {order.pol} → {order.pod} · {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    {selectedOrderId === order.order_id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Item picker */}
      <Modal
        visible={itemPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setItemPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setItemPickerOpen(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Item(s)</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {selectedOrder?.items.map((item) => {
                const checked = selectedItemIds.has(item.order_item_id);
                return (
                  <TouchableOpacity
                    key={item.order_item_id}
                    style={styles.modalOption}
                    activeOpacity={0.7}
                    onPress={() => toggleItem(item.order_item_id)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        checked && styles.checkboxChecked,
                      ]}
                    >
                      {checked && (
                        <Ionicons
                          name="checkmark"
                          size={12}
                          color={colors.background}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.modalOptionText} numberOfLines={1}>
                        {item.item_ref}
                      </Text>
                      <Text style={styles.modalOptionSub}>
                        {item.boxes} boxes · {item.weight} KG
                        {item.status ? ` · ${item.status}` : ""}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setItemPickerOpen(false)}
            >
              <Text style={styles.modalDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (
  colors: ReturnType<typeof useAppTheme>["colors"],
  fontSize: ReturnType<typeof useAppTheme>["fontSize"],
  fonts: ReturnType<typeof useAppTheme>["fonts"],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    bodyContainer: {
      padding: 16,
      paddingBottom: 16,
    },
    infoCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 14,
      paddingHorizontal: 12,
      paddingVertical: 9,
      backgroundColor: "#FFF3E0",
      borderRadius: 10,
      borderLeftWidth: 3,
      borderColor: "#B4690E",
    },
    infoText: {
      flex: 1,
      fontSize: fontSize.xs ?? 12,
      fontFamily: fonts.medium,
      color: "#B4690E",
    },
    inputContainer: {
      width: "100%",
      marginBottom: 12,
    },
    label: {
      color: colors.text,
      fontSize: fontSize.xs ?? 11,
      fontFamily: fonts.semiBold,
      marginBottom: 6,
    },
    dropdown: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 10,
    },
    dropdownLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    dropdownText: {
      fontSize: fontSize.sm,
      fontFamily: fonts.medium ?? fonts.regular,
      color: colors.text,
    },
    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    stepperBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderColor,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperBtnDisabled: {
      opacity: 0.4,
    },
    stepperValueBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 11,
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 10,
    },
    stepperValueText: {
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 13,
      marginTop: 2,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    cardLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 10,
    },
    cardLabel: {
      fontFamily: fonts.bold,
      fontSize: 10,
      color: colors.secondary,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    cardRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    cardTextRight: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.xs ?? 12,
      color: colors.text,
    },
    cardTextLeft: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? 12,
      color: colors.textSecondary,
    },
    totalDivider: {
      height: 1,
      backgroundColor: colors.borderColor,
      marginVertical: 8,
    },
    totalLabel: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.text,
    },
    totalValue: {
      fontFamily: fonts.bold,
      fontSize: fontSize.lg,
      color: colors.primary,
    },
    footer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.borderColor,
    },
    button: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      backgroundColor: colors.primary,
      borderRadius: 10,
    },
    buttonText: {
      color: colors.background,
      textAlign: "center",
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
    },
    validationHint: {
      textAlign: "center",
      marginTop: 6,
      fontSize: 10,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 5,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 24,
    },
    modalHandle: {
      alignSelf: "center",
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderColor,
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: fontSize.sm,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: 6,
    },
    modalEmpty: {
      textAlign: "center",
      paddingVertical: 20,
      fontSize: fontSize.sm,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    modalOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderColor: colors.borderColor,
    },
    modalOptionText: {
      fontSize: fontSize.sm,
      fontFamily: fonts.regular,
      color: colors.text,
    },
    modalOptionSub: {
      fontSize: 11,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 1,
    },
    modalDoneBtn: {
      marginTop: 10,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: "center",
    },
    modalDoneBtnText: {
      color: colors.background,
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
    },
  });

export default PurchaseStorage;
