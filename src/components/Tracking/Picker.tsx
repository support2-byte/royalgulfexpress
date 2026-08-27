import { createStyles } from "@/app/tracking";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";

interface OrderItemOption {
  order_item_id: number;
  item_ref: string;
}

interface OrderOption {
  order_id: number;
  booking_number: string;
  items: OrderItemOption[];
}

interface Props {
  orderOptions: OrderOption[];
  selectedOrder: OrderOption | undefined;
  selectedItemRef: string | null;
  onSelectOrder: (order: OrderOption) => void;
  onSelectItem: (item: OrderItemOption) => void;
  styles: ReturnType<typeof createStyles>;
}

export default function Picker({
  orderOptions,
  selectedOrder,
  selectedItemRef,
  onSelectOrder,
  onSelectItem,
  styles,
}: Props) {
  const { colors } = useAppTheme();
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);

  return (
    <>
      <View style={styles.pickerRow}>
        <TouchableOpacity
          style={styles.pickerField}
          onPress={() => setOrderPickerOpen(true)}
        >
          <Text style={styles.pickerLabel}>Order</Text>
          <View style={styles.pickerValueRow}>
            <Text style={styles.pickerValue} numberOfLines={1}>
              {selectedOrder?.booking_number ?? "Select order"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.pickerField,
            !selectedOrder && styles.pickerFieldDisabled,
          ]}
          disabled={!selectedOrder}
          onPress={() => setItemPickerOpen(true)}
        >
          <Text style={styles.pickerLabel}>Item</Text>
          <View style={styles.pickerValueRow}>
            <Text style={styles.pickerValue} numberOfLines={1}>
              {selectedItemRef ?? "Select item"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>

      <PickerModal
        visible={orderPickerOpen}
        title="Select Order"
        onClose={() => setOrderPickerOpen(false)}
        data={orderOptions}
        keyExtractor={(o: OrderOption) => String(o.order_id)}
        renderLabel={(o: OrderOption) => o.booking_number}
        onSelect={(o: OrderOption) => {
          onSelectOrder(o);
          setOrderPickerOpen(false);
        }}
        styles={styles}
      />

      <PickerModal
        visible={itemPickerOpen}
        title="Select Item"
        onClose={() => setItemPickerOpen(false)}
        data={selectedOrder?.items ?? []}
        keyExtractor={(i: OrderItemOption) => String(i.order_item_id)}
        renderLabel={(i: OrderItemOption) => i.item_ref}
        onSelect={(i: OrderItemOption) => {
          onSelectItem(i);
          setItemPickerOpen(false);
        }}
        styles={styles}
      />
    </>
  );
}

function PickerModal<T>({
  visible,
  title,
  onClose,
  data,
  keyExtractor,
  renderLabel,
  onSelect,
  styles,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  data: T[];
  keyExtractor: (item: T) => string;
  renderLabel: (item: T) => string;
  onSelect: (item: T) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={data}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={() => (
              <View style={styles.modalSeparator} />
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalRow}
                onPress={() => onSelect(item)}
              >
                <Text style={styles.modalRowText}>{renderLabel(item)}</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No options available</Text>
            }
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
