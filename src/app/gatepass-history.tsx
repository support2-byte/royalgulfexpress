import { api } from "@/api";
import Header from "@/components/ui/Header";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/useAppTheme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
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

interface GatepassRow {
  collection_id: string;
  order_id: string;
  rgl_booking_number: string;
  receiver_id: string;
  collection_method: string;
  delivery_date: string;
  gatepass_id: string;
  url: string;
  originalname: string;
  mimetype: string;
  uploaded_at: string;
  item_ref: string | null;
  category: string | null;
  subcategory: string | null;
  status: string | null;
  total_numner: number | null;
  weight: number | null;
}

interface CollectionGroup {
  collection_id: string;
  order_id: string;
  rgl_booking_number: string;
  collection_method: string;
  delivery_date: string;
  gatepass: {
    id: string;
    url: string;
    originalname: string;
    mimetype: string;
    uploaded_at: string;
  };
  items: {
    item_ref: string;
    category: string | null;
    subcategory: string | null;
    status: string | null;
  }[];
}

function groupByCollection(rows: GatepassRow[]): CollectionGroup[] {
  const map = new Map<string, CollectionGroup>();

  for (const row of rows) {
    if (!map.has(row.collection_id)) {
      map.set(row.collection_id, {
        collection_id: row.collection_id,
        order_id: row.order_id,
        rgl_booking_number: row.rgl_booking_number,
        collection_method: row.collection_method,
        delivery_date: row.delivery_date,
        gatepass: {
          id: row.gatepass_id,
          url: row.url,
          originalname: row.originalname,
          mimetype: row.mimetype,
          uploaded_at: row.uploaded_at,
        },
        items: [],
      });
    }

    if (row.item_ref) {
      const group = map.get(row.collection_id)!;
      if (!group.items.some((i) => i.item_ref === row.item_ref)) {
        group.items.push({
          item_ref: row.item_ref,
          category: row.category,
          subcategory: row.subcategory,
          status: row.status,
        });
      }
    }
  }

  return Array.from(map.values());
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isImageMime(mimetype: string) {
  return mimetype?.startsWith("image/");
}

function statusColor(status: string | null, colors: any) {
  switch ((status || "").toLowerCase()) {
    case "delivered":
    case "collected":
      return "#2E9E5B";
    case "pending":
      return "#C08A2E";
    case "cancelled":
      return "#C0392B";
    default:
      return colors.textSecondary;
  }
}

export default function GatepassHistory() {
  const { user } = useAuth();
  const { colors, fontSize, fonts } = useAppTheme();
  const styles = createStyles(colors, fontSize, fonts);

  const id = user?.customer_id;

  const [rows, setRows] = useState<GatepassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const groups = useMemo(() => groupByCollection(rows), [rows]);

  useEffect(() => {
    if (!id) return;

    const fetchGatepasses = async () => {
      try {
        const response = await api.get(`/shipments/gatepass/${id}`);
        const result = response.data;

        if (!result?.success) {
          Toast.show({
            type: "error",
            text1: "Failed to load gatepasses",
            text2: result?.message || "Something went wrong.",
          });
          return;
        }

        setRows(result.gatepass ?? []);
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Failed to load gatepasses",
          text2:
            error?.response?.data?.message ||
            error?.message ||
            "Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGatepasses();
  }, [id]);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        name="Gatepass History"
        description="View all your past gatepasses"
        icon="document-text"
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.text} />
      ) : groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="document-text-outline"
            size={40}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>No gatepasses yet</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.bodyContainer}
        >
          {groups.map((group, index) => (
            <CollectionCard
              key={group.collection_id}
              group={group}
              index={index}
              styles={styles}
              colors={colors}
              onPreview={setPreviewUrl}
            />
          ))}
        </ScrollView>
      )}

      <Modal
        visible={!!previewUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewUrl(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setPreviewUrl(null)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {previewUrl && (
            <Image
              source={{ uri: previewUrl }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}

          {previewUrl && (
            <TouchableOpacity
              style={styles.modalOpenExternal}
              onPress={() => Linking.openURL(previewUrl)}
            >
              <Text style={styles.modalOpenExternalText}>Open in browser</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function CollectionCard({
  group,
  index,
  styles,
  colors,
  onPreview,
}: {
  group: CollectionGroup;
  index: number;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useAppTheme>["colors"];
  onPreview: (url: string) => void;
}) {
  const isImage = isImageMime(group.gatepass.mimetype);

  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(index * 80)}
      style={styles.card}
    >
      <View style={styles.cardHeaderRow}>
        <View>
          <Text style={styles.orderId}>Order {group.rgl_booking_number}</Text>
          <View style={styles.methodRow}>
            <Ionicons
              name={
                group.collection_method?.toLowerCase() === "pickup"
                  ? "walk-outline"
                  : "car-outline"
              }
              size={13}
              color={colors.textSecondary}
            />
            <Text style={styles.methodText}>
              {group.collection_method || "—"}
            </Text>
          </View>
        </View>
        <Text style={styles.dateText}>{formatDate(group.delivery_date)}</Text>
      </View>

      <View style={styles.attachmentRow}>
        {isImage ? (
          <TouchableOpacity
            style={styles.thumbWrapper}
            activeOpacity={0.85}
            onPress={() => onPreview(group.gatepass.url)}
          >
            <Image
              source={{ uri: group.gatepass.url }}
              style={styles.thumb}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.fileIconBox}
            activeOpacity={0.85}
            onPress={() => Linking.openURL(group.gatepass.url)}
          >
            <Ionicons
              name="document-text"
              size={26}
              color={colors.primary ?? "#0d6c6a"}
            />
          </TouchableOpacity>
        )}

        <View style={styles.attachmentMeta}>
          <Text style={styles.attachmentName} numberOfLines={1}>
            {group.gatepass.originalname || "Gatepass document"}
          </Text>
          <Text style={styles.attachmentSub}>
            Uploaded {formatDate(group.gatepass.uploaded_at)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => Linking.openURL(group.gatepass.url)}
        >
          <Ionicons
            name="download-outline"
            size={18}
            color={colors.primary ?? "#0d6c6a"}
          />
        </TouchableOpacity>
      </View>

      {/* Items */}
      {group.items.length > 0 && (
        <View style={styles.itemsSection}>
          {group.items.map((item) => (
            <View key={item.item_ref} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemCategory}>
                  {item.category}
                  {item.subcategory ? ` · ${item.subcategory}` : ""}
                </Text>
                <Text style={styles.itemRef}>{item.item_ref}</Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  { borderColor: statusColor(item.status, colors) },
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    { color: statusColor(item.status, colors) },
                  ]}
                >
                  {item.status || "—"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const THUMB_SIZE = 56;

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
      paddingBottom: 40,
      gap: 12,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingBottom: 80,
    },
    emptyText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.md,
      color: colors.textSecondary,
    },
    card: {
      borderRadius: 18,
      padding: 16,
      backgroundColor: colors.background,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    orderId: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.lg,
      color: colors.text,
      marginBottom: 3,
    },
    methodRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    methodText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textTransform: "capitalize",
    },
    dateText: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    attachmentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 10,
      borderRadius: 14,
      backgroundColor: (colors.primary ?? "#0d6c6a") + "0D",
      marginBottom: 4,
    },
    thumbWrapper: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: 10,
      overflow: "hidden",
    },
    thumb: {
      width: "100%",
      height: "100%",
    },
    fileIconBox: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: 10,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    attachmentMeta: {
      flex: 1,
    },
    attachmentName: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.md,
      color: colors.text,
    },
    attachmentSub: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    downloadBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    itemsSection: {
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.borderColor,
      paddingTop: 10,
      gap: 8,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    itemLeft: {
      flex: 1,
    },
    itemCategory: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.sm,
      color: colors.text,
      textTransform: "capitalize",
    },
    itemRef: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs ?? fontSize.sm,
      color: colors.textSecondary,
      marginTop: 1,
    },
    statusPill: {
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    statusPillText: {
      fontFamily: fonts.semiBold,
      fontSize: fontSize.xs ?? fontSize.sm,
      textTransform: "capitalize",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.92)",
      alignItems: "center",
      justifyContent: "center",
    },
    modalClose: {
      position: "absolute",
      top: 50,
      right: 20,
      zIndex: 1,
      padding: 8,
    },
    modalImage: {
      width: "100%",
      height: "80%",
    },
    modalOpenExternal: {
      position: "absolute",
      bottom: 40,
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 24,
    },
    modalOpenExternalText: {
      color: "#fff",
      fontWeight: "600",
    },
  });
