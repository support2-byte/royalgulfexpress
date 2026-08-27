import socketApi from "@/socketApi";

export const getMyNotifications = (targetType: string, targetId: number) =>
  socketApi.get("/api/notifications", { params: { targetType, targetId } });

export const markNotificationRead = (id: number) =>
  socketApi.patch(`/api/notifications/${id}/read`);

export const markAllNotificationsRead = (
  targetType: string,
  targetId: number,
) => socketApi.patch("/api/notifications/read-all", { targetType, targetId });
