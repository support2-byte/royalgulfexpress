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
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
  const { orders, rates } = useAppContext();
  const { user } = useAuth();
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

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

  const selectedOrder = useMemo(
    () => orders.find((o) => o.order_id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
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
  }, [deliveryOptions]);

  const isFormValid =
    contact.name.trim().length > 0 &&
    contact.phone_number.trim().length > 0 &&
    contact.delivery_address.trim().length > 0 &&
    selectedOrderId !== null &&
    selectedItemIds.size > 0;

  const handleCreateDelivery = async () => {
    if (!isFormValid || isSubmitting || !selectedOrder) return;

    setIsSubmitting(true);
    try {
      const selectedAddons = OPTIONS_CONFIG.filter(
        (opt) => deliveryOptions[opt.key],
      ).map((opt) => ({
        label: opt.label,
        price: opt.price,
      }));

      const selectedItems = selectedOrder.items.filter((i) =>
        selectedItemIds.has(i.order_item_id),
      );

      await api.post(`/shipments/delivery/${user.id}`, {
        name: contact.name.trim(),
        contact_number: contact.phone_number.trim(),
        delivery_address: contact.delivery_address.trim(),
        addons: selectedAddons,
        totalAmount: totalCost,
        orderId: selectedOrder.order_id,
        orderItemIds: Array.from(selectedItemIds),
        selectedShipment: selectedItems.map((i) => i.item_ref),
      });

      Toast.show({
        text1: "Success!",
        text2: "Delivery request has been created.",
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
        text1: "Failed!",
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        name="Delivery Options"
        description="Book your delivery"
        icon="bus"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bodyContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.infoCard}
          >
            <Ionicons name="bus-outline" size={15} color="#00a1ce" />
            <Text style={styles.infoText}>
              Base rate: AED {DELIVERY_RATE.toFixed(2)}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(40)}>
            <Text style={styles.sectionTitle}>Select Shipment</Text>

            <TouchableOpacity
              style={styles.dropdown}
              activeOpacity={0.7}
              onPress={() => setOrderPickerOpen(true)}
              disabled={isSubmitting}
            >
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
              disabled={isSubmitting || !selectedOrder}
            >
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
              <Ionicons
                name="chevron-down"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(80)}>
            <Text style={styles.sectionTitle}>Contact Details</Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Contact name *"
                  placeholderTextColor={colors.lightText}
                  value={contact.name}
                  onChangeText={(name) =>
                    setContact((prev) => ({ ...prev, name }))
                  }
                  autoCapitalize="words"
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="call-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone *"
                  placeholderTextColor={colors.lightText}
                  value={contact.phone_number}
                  onChangeText={(phone_number) =>
                    setContact((prev) => ({ ...prev, phone_number }))
                  }
                  keyboardType="phone-pad"
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Delivery address *"
                  placeholderTextColor={colors.lightText}
                  value={contact.delivery_address}
                  onChangeText={(delivery_address) =>
                    setContact((prev) => ({ ...prev, delivery_address }))
                  }
                  editable={!isSubmitting}
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(300).delay(120)}>
            <Text style={styles.sectionTitle}>Add-on Services</Text>
            <View style={styles.optionsCard}>
              {OPTIONS_CONFIG.map((opt, index) => {
                const checked = deliveryOptions[opt.key];
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.optionRow,
                      index === OPTIONS_CONFIG.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                    activeOpacity={0.7}
                    disabled={isSubmitting}
                    onPress={() => toggleDeliveryOption(opt.key)}
                  >
                    <View style={styles.optionLeft}>
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
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionText}>{opt.label}</Text>
                        <Text style={styles.optionDescription}>
                          {opt.description}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.optionPrice}>
                      +{opt.price.toFixed(0)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(160)}
            style={styles.summaryCard}
          >
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Base Rate</Text>
              <Text style={styles.summaryValue}>
                AED {DELIVERY_RATE.toFixed(2)}
              </Text>
            </View>
            {OPTIONS_CONFIG.filter((opt) => deliveryOptions[opt.key]).map(
              (opt) => (
                <View style={styles.summaryRow} key={opt.key}>
                  <Text style={styles.summaryLabel}>{opt.label}</Text>
                  <Text style={styles.summaryValue}>
                    AED {opt.price.toFixed(2)}
                  </Text>
                </View>
              ),
            )}
            <View style={styles.totalDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Cost</Text>
              <Text style={styles.totalValue}>AED {totalCost.toFixed(2)}</Text>
            </View>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.button,
              (!isFormValid || isSubmitting) && { opacity: 0.5 },
            ]}
            activeOpacity={0.85}
            disabled={!isFormValid || isSubmitting}
            onPress={handleCreateDelivery}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons
                name="lock-closed"
                size={15}
                color={colors.background}
              />
            )}
            <Text style={styles.buttonText}>
              {isSubmitting ? "Requesting..." : "Confirm & Request"}
            </Text>
          </TouchableOpacity>
          {!isFormValid && !isSubmitting && (
            <Text style={styles.validationHint}>
              Select a shipment and fill in all required fields
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Order picker */}
      <Modal
        visible={orderPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setOrderPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setOrderPickerOpen(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Order</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {orders.length === 0 ? (
                <Text style={styles.modalEmpty}>No shipments available</Text>
              ) : (
                orders.map((order) => (
                  <TouchableOpacity
                    key={order.order_id}
                    style={styles.modalRow}
                    onPress={() => handleSelectOrder(order.order_id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalRowTitle}>
                        {order.booking_number}
                      </Text>
                      <Text style={styles.modalRowSub} numberOfLines={1}>
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
        animationType="slide"
        transparent
        onRequestClose={() => setItemPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setItemPickerOpen(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Item(s)</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {selectedOrder?.items.map((item) => {
                const checked = selectedItemIds.has(item.order_item_id);
                return (
                  <TouchableOpacity
                    key={item.order_item_id}
                    style={styles.modalRow}
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
                      <Text style={styles.modalRowTitle} numberOfLines={1}>
                        {item.item_ref}
                      </Text>
                      <Text style={styles.modalRowSub}>
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
      backgroundColor: colors.info,
      borderRadius: 10,
      borderLeftWidth: 3,
      borderColor: "#00a1ce",
    },
    infoText: {
      flex: 1,
      fontSize: fontSize.xs ?? 12,
      fontFamily: fonts.medium,
      color: colors.background,
    },
    sectionTitle: {
      fontSize: fontSize.xs ?? 11,
      fontFamily: fonts.bold,
      color: colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 8,
      marginTop: 2,
    },
    dropdown: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 10,
    },
    dropdownText: {
      flex: 1,
      fontSize: fontSize.sm,
      fontFamily: fonts.medium ?? fonts.regular,
      color: colors.text,
    },
    inputContainer: {
      width: "100%",
      marginBottom: 10,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderColor,
      borderRadius: 10,
    },
    input: {
      flex: 1,
      paddingVertical: 10,
      color: colors.text,
      fontSize: fontSize.sm,
      fontFamily: fonts.regular,
    },
    optionsCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderColor,
      paddingHorizontal: 12,
      marginBottom: 14,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
      gap: 8,
    },
    optionLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 8,
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
    optionText: {
      fontSize: fontSize.xs ?? 12,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: 1,
    },
    optionDescription: {
      fontSize: 10,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    optionPrice: {
      fontSize: fontSize.xs ?? 12,
      fontFamily: fonts.semiBold,
      color: colors.text,
    },
    summaryCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.borderColor,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 7,
    },
    summaryLabel: {
      fontSize: fontSize.xs ?? 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: fontSize.xs ?? 12,
      fontFamily: fonts.medium ?? fonts.semiBold,
      color: colors.text,
    },
    totalDivider: {
      height: 1,
      backgroundColor: colors.borderColor,
      marginVertical: 6,
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
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 16,
      paddingBottom: 24,
    },
    modalTitle: {
      fontSize: fontSize.md,
      fontFamily: fonts.semiBold,
      color: colors.text,
      marginBottom: 10,
    },
    modalEmpty: {
      textAlign: "center",
      paddingVertical: 20,
      fontSize: fontSize.sm,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    modalRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderColor,
    },
    modalRowTitle: {
      fontSize: fontSize.sm,
      fontFamily: fonts.medium ?? fonts.semiBold,
      color: colors.text,
    },
    modalRowSub: {
      fontSize: 11,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 1,
    },
    modalDoneBtn: {
      marginTop: 12,
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

export default DeliveryOptions;
