import { ReactElementType } from "react";

export type AudienceKey = "all" | "active" | "inactive" | "vip" | "city" | "sport";
export type NotifStatus = "sent" | "scheduled" | "failed";

export interface SentNotif {
  id: string;
  title: string;
  message: string;
  audience: string;
  reach: number;
  opened: number;
  openRate: number;
  sentAt: string;
  status: NotifStatus;
}

export interface NotifTemplate {
  name: string;
  icon: ReactElementType;
  color: string;
  title: string;
  message: string;
  audience: AudienceKey;
}

export interface InboxNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "booking" | "system" | "vendor";
}
