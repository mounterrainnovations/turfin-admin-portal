import { authenticatedFetch } from "@/features/auth/request";
import {
  SupportTicketWithDetails,
  TicketMessage,
  ReplyTicketDto,
  UpdateTicketStatusDto,
  TicketStatus,
} from "./types";

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("Missing NEXT_PUBLIC_API_URL.");
  return apiUrl.replace(/\/$/, "");
}

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    let errorMsg = "An unexpected error occurred";
    if (typeof payload === "object" && payload !== null) {
      errorMsg =
        (payload as any).error?.message ||
        (payload as any).message ||
        JSON.stringify(payload);
    } else if (typeof payload === "string" && payload.trim()) {
      errorMsg = payload;
    }
    throw new Error(errorMsg);
  }
  return payload;
}

// Unwraps the backend's { success: true, data: T } envelope.
function unwrap<T>(payload: any): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data as T;
  }
  return payload as T;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} — ${date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
};

export async function getAllTickets(): Promise<SupportTicketWithDetails[]> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/support/tickets?limit=1000`,
    { cache: "no-store" },
  );
  const payload = await handleResponse(response);
  const rawTickets: any[] = unwrap<any[]>(payload) ?? [];

  return rawTickets.map((t: any) => ({
    id: t.id,
    userId: t.userId ?? "",
    ticketNumber: `TKT-${t.id.substring(0, 4).toUpperCase()}`,
    user: {
      name: t.user?.displayName ?? t.user?.firstName
        ? `${t.user.firstName} ${t.user.lastName ?? ""}`.trim()
        : "Customer",
      email: t.user?.email ?? "—",
      phone: (t.user?.addresses as any[])?.[0]?.contactPhone ?? "—",
      avatar: t.user?.displayName
        ? t.user.displayName.substring(0, 2).toUpperCase()
        : t.user?.firstName
        ? `${t.user.firstName[0]}${t.user.lastName?.[0] ?? ""}`.toUpperCase()
        : "CU",
    },
    category: t.category,
    subject: t.subject,
    description: t.description,
    status: t.status as TicketStatus,
    createdAt: t.createdAt ? formatDate(t.createdAt) : "—",
    updatedAt: t.updatedAt ? formatDate(t.updatedAt) : "—",
    messages: [],
  }));
}

export async function getTicketMessages(
  ticketId: string,
): Promise<TicketMessage[]> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/support/tickets/${ticketId}/messages`,
    { cache: "no-store" },
  );
  const payload = await handleResponse(response);
  const rawMessages: any[] = unwrap<any[]>(payload) ?? [];

  return rawMessages.map((m: any) => ({
    id: m.id,
    senderRole: m.senderRole,
    senderId: m.senderId ?? null,
    senderName: m.senderName ?? null,
    body: m.body,
    createdAt: m.createdAt
      ? formatDate(m.createdAt).split("—")[1]?.trim() ?? ""
      : "",
  }));
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
): Promise<void> {
  const dto: UpdateTicketStatusDto = { status };
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/support/tickets/${ticketId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    },
  );
  await handleResponse(response);
}

export async function addAgentMessage(
  ticketId: string,
  body: string,
): Promise<TicketMessage> {
  const dto: ReplyTicketDto = { body };
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/support/tickets/${ticketId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    },
  );
  const payload = await handleResponse(response);
  const m: any = unwrap(payload);
  return {
    id: m.id,
    senderRole: m.senderRole,
    senderId: m.senderId ?? null,
    senderName: m.senderName ?? null,
    body: m.body,
    createdAt: m.createdAt
      ? formatDate(m.createdAt).split("—")[1]?.trim() ?? ""
      : "",
  };
}
