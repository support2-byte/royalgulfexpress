import { createStyles } from "@/app/tracking";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import { flipIcon, tr } from "@/i18n";
import { FlatList, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/Text";

interface OrderItemOption {
  order_item_id: number;
  tracking_id: string | null;
  label: string;
}

interface OrderOption {
  order_id: number;
  booking_number: string;
  items: OrderItemOption[];
}

interface Props {
  orderOptions: OrderOption[];
  selectedOrder: OrderOption | undefined;
  selectedItemLabel: string | null;
  onSelectOrder: (order: OrderOption) => void;
  onSelectItem: (item: OrderItemOption) => void;
  styles: ReturnType<typeof createStyles>;
}

export default function Picker({
  orderOptions,
  selectedOrder,
  selectedItemLabel,
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
          <Text style={styles.pickerLabel}>{tr("Order")}</Text>
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
          <Text style={styles.pickerLabel}>{tr("Item")}</Text>
          <View style={styles.pickerValueRow}>
            <Text style={styles.pickerValue} numberOfLines={1}>
              {selectedItemLabel ?? "Select item"}
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
        title={tr("Select Order")}
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
        title={tr("Select Item")}
        onClose={() => setItemPickerOpen(false)}
        data={selectedOrder?.items ?? []}
        keyExtractor={(i: OrderItemOption) => String(i.order_item_id)}
        renderLabel={(i: OrderItemOption) => i.label}
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
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.modalRow}
            activeOpacity={0.6}
            onPress={() => onSelect(item)}
          >
            <Text style={styles.modalRowText}>{renderLabel(item)}</Text>
            <Ionicons name={flipIcon("chevron-forward") as any} size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{tr("No options available")}</Text>
        }
      />
    </BottomSheet>
  );
}
