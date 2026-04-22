export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketCategory = "booking" | "payment" | "account" | "technical" | "general";
export type SenderRole = "user" | "agent";

export interface TicketMessage {
  id: string;
  senderRole: SenderRole;
  senderId: string | null;
  senderName: string | null;
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketWithDetails extends SupportTicket {
  ticketNumber: string;
  user: { name: string; email: string; phone: string; avatar: string };
  messages: TicketMessage[];
}

export interface ReplyTicketDto {
  body: string;
}

export interface UpdateTicketStatusDto {
  status: TicketStatus;
}
