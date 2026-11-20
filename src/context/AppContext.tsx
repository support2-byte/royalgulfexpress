import { api } from "@/api";
import {
  canAccess,
  isOrderRole,
  roleCan,
  type Feature,
  type OrderRole,
} from "@/constants/permissions";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notificationApi";
import { fetchShipmentsForReceiver, type OrderGroup } from "@/lib/shipmentApi";
import { getSocket } from "@/lib/socket";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

type ChatMessage = {
  id: number;
  chat_room_id: number;
  sender_type: "admin" | "receiver" | "sender" | "system";
  sender_id: number;
  message: string | null;
  attachments: { id: number; url: string }[];
  created_at: string;
};

type AppNotification = {
  id: number;
  target_type: string;
  target_id: number;
  title: string;
  body: string | null;
  type: string | null;
  data: any;
  is_read: boolean;
  created_at: string;
};

export type RateOption = { key: string; label: string; value: number };

export type Rates = {
  delivery_rate: number;
  storage_rate: number;
  tax: number;
  storage_types: RateOption[];
  storage_sizes: RateOption[];
  pickup_zones: RateOption[];
};

type AppContextType = {
  openProfile: boolean;
  setOpenProfile: React.Dispatch<React.SetStateAction<boolean>>;
  chatRoomId: number | null;
  chatStatus: "open" | "closed";
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: number) => void;
  markAllNotificationsAsRead: () => void;
  selectedShipment: string;
  setSelectedShipment: (text: string) => void;
  orders: OrderGroup[];
  shipmentsLoading: boolean;
  shipmentsRefreshing: boolean;
  shipmentsError: string | null;
  refreshShipments: (isRefresh?: boolean) => Promise<void>;
  /** The customer's part (sender / receiver / both) in a booking, if known. */
  roleOf: (bookingNumber?: string | null) => OrderRole | null;
  /** Orders where the customer is allowed to use a feature. */
  ordersFor: (feature: Feature) => OrderGroup[];
  /** Can the customer use a feature on at least one order? */
  canUseFeature: (feature: Feature) => boolean;
  rates: Rates;
  setRates: React.Dispatch<React.SetStateAction<Rates>>;
};

type AppProviderProps = {
  children: ReactNode;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: AppProviderProps) => {
  const [openProfile, setOpenProfile] = useState(false);
  const { user } = useAuth();
  const [rates, setRates] = useState<Rates>({
    delivery_rate: 0,
    storage_rate: 0,
    tax: 0,
    storage_types: [],
    storage_sizes: [],
    pickup_zones: [],
  });
  const [chatRoomId, setChatRoomId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatStatus, setChatStatus] = useState<"open" | "closed">("open");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [selectedShipment, setSelectedShipment] = useState<string>("");

  const [orders, setOrders] = useState<OrderGroup[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);
  const [shipmentsRefreshing, setShipmentsRefreshing] = useState(false);
  const [shipmentsError, setShipmentsError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Record<string, OrderRole>>({});
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const roleKey = (booking?: string | null) => (booking ?? "").trim().toLowerCase();

  // Matches the customer's ref against sender_ref / receiver_ref of each order.
  const fetchRoles = useCallback(async (customerId: string) => {
    try {
      const res = await api.get(`/shipments/${customerId}/roles`, {
        validateStatus: () => true,
      });
      if (res.data?.success && res.data.roles) {
        const next: Record<string, OrderRole> = {};
        Object.entries(res.data.roles as Record<string, unknown>).forEach(
          ([booking, role]) => {
            if (isOrderRole(role)) next[roleKey(booking)] = role;
          },
        );
        setRoles(next);
        setRolesLoaded(true);
        return;
      }
    } catch {
      // fall through - account type is used as the fallback
    }
    setRoles({});
    setRolesLoaded(false);
  }, []);

  const refreshShipments = useCallback(
    async (isRefresh = false) => {
      if (!user?.customer_id) return;

      try {
        isRefresh ? setShipmentsRefreshing(true) : setShipmentsLoading(true);
        setShipmentsError(null);

        const [result] = await Promise.all([
          fetchShipmentsForReceiver(user.customer_id),
          fetchRoles(user.customer_id),
        ]);

        if (result.success) {
          setOrders(result.orders);
        } else {
          setOrders([]);
          setShipmentsError(result.message ?? "Failed to load shipments.");
        }
      } catch (err: any) {
        console.error("Failed to fetch shipments:", err);
        setShipmentsError(
          err.response?.data?.message ||
            "Failed to load shipments. Please try again.",
        );
        setOrders([]);
      } finally {
        setShipmentsLoading(false);
        setShipmentsRefreshing(false);
      }
    },
    [user?.customer_id, fetchRoles],
  );

  const roleOf = useCallback(
    (booking?: string | null): OrderRole | null =>
      roles[roleKey(booking)] ?? null,
    [roles],
  );

  const ordersFor = useCallback(
    (feature: Feature): OrderGroup[] => {
      // Roles unavailable (older backend): fall back to the account type.
      if (!rolesLoaded) return canAccess(user.type, feature) ? orders : [];
      return orders.filter((o) => {
        const role = roles[roleKey(o.booking_number)];
        return role
          ? roleCan(role, feature)
          : canAccess(user.type, feature);
      });
    },
    [orders, roles, rolesLoaded, user.type],
  );

  const canUseFeature = useCallback(
    (feature: Feature) =>
      ordersFor(feature).length > 0 || (!rolesLoaded && canAccess(user.type, feature)),
    [ordersFor, rolesLoaded, user.type],
  );

  useEffect(() => {
    if (user?.customer_id) refreshShipments();
  }, [user?.customer_id, refreshShipments]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    socket.emit("register_receiver", user.id);
    socket.emit("join_own_chat_room", {
      participantType: user.type,
      participantId: user.id,
    });
    socket.on("chat_room_ready", ({ chatRoom }) => {
      setChatRoomId(chatRoom.id);
      setChatStatus(chatRoom.status);
    });
    socket.on("chat_history", ({ messages }) => {
      setChatMessages(messages);
    });
    socket.on("new_message", ({ message }) => {
      setChatMessages((prev) => [...prev, message]);
      if (message.sender_type === "system") {
        setChatStatus(
          message.message === "Chat ended by admin" ? "closed" : "open",
        );
      }
    });
    socket.on("chat_closed", () => {
      setChatStatus("closed");
    });
    socket.on("chat_error", (err) => {
      console.log("CHAT ERROR:", err);
    });
    return () => {
      socket.off("chat_room_ready");
      socket.off("chat_history");
      socket.off("new_message");
      socket.off("chat_closed");
      socket.off("chat_error");
    };
  }, [user?.id, user?.type]);

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket();
    getMyNotifications("receiver", user.id)
      .then((res) => {
        setNotifications(res.data.notifications ?? []);
        setUnreadNotificationCount(res.data.unreadCount ?? 0);
      })
      .catch((err) => {
        console.log("[Notifications] failed:", err.message, err.code);
      });
    socket.on("notification", (notification: AppNotification) => {
      setNotifications((prev) => [notification, ...prev]);
    });
    socket.on("notification_unread_count", ({ count }: { count: number }) => {
      setUnreadNotificationCount(count);
    });
    return () => {
      socket.off("notification");
      socket.off("notification_unread_count");
    };
  }, [user?.id]);

  const markNotificationAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
    markNotificationRead(id);
  };

  const markAllNotificationsAsRead = () => {
    if (!user?.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadNotificationCount(0);
    markAllNotificationsRead("receiver", user.id);
  };

  const sendChatMessage = (text: string) => {
    if (!user?.id || !text.trim()) return;
    const socket = getSocket();
    socket.emit("send_message", {
      senderType: user.type,
      senderId: user.id,
      participantType: user.type,
      participantId: user.id,
      message: text.trim(),
      attachments: [],
    });
  };

  return (
    <AppContext.Provider
      value={{
        openProfile,
        setOpenProfile,
        chatRoomId,
        chatStatus,
        chatMessages,
        sendChatMessage,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        selectedShipment,
        setSelectedShipment,
        orders,
        shipmentsLoading,
        shipmentsRefreshing,
        shipmentsError,
        refreshShipments,
        roleOf,
        ordersFor,
        canUseFeature,
        rates,
        setRates,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return context;
};
