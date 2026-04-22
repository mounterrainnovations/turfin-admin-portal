import { authenticatedFetch } from "@/features/auth/request";

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
    let msg = "An unexpected error occurred";
    if (typeof payload === "object" && payload !== null) {
      msg =
        (payload as any).error?.message ||
        (payload as any).message ||
        JSON.stringify(payload);
    } else if (typeof payload === "string" && payload.trim()) {
      msg = payload;
    }
    throw new Error(msg);
  }
  return payload;
}

function extractItems(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (typeof payload !== "object" || payload === null) return [];
  for (const key of ["items", "data", "results"]) {
    if (Array.isArray((payload as any)[key])) return (payload as any)[key];
  }
  return [];
}

function extractTotal(payload: any, fallback: number): number {
  if (typeof payload !== "object" || payload === null) return fallback;
  if (typeof (payload as any).total === "number") return (payload as any).total;
  const meta = (payload as any).meta ?? (payload as any).pagination;
  if (typeof meta === "object" && meta !== null) {
    if (typeof meta.total === "number") return meta.total;
    if (typeof meta.count === "number") return meta.count;
  }
  return fallback;
}

const KYC_PROGRESS: Record<string, number> = {
  not_started: 0,
  pending: 30,
  in_review: 70,
  verified: 100,
  rejected: 20,
};

const KYC_STAGE: Record<string, string> = {
  not_started: "Not Started",
  pending: "Pending Documents",
  in_review: "Documents Under Review",
  verified: "Identity Verified",
  rejected: "Rejected — Resubmit",
};

const fmt = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// ── Public types ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalTurfs: number;
  activeTurfs: number;
  pendingKyc: number;
  openTickets: number;
  inProgressTickets: number;
}

export interface KycVendorSummary {
  id: string;
  name: string;
  kycStatus: string;
  stage: string;
  progress: number;
}

export interface TurfStatusSummary {
  id: string;
  name: string;
  status: string;
  city: string;
}

export interface RecentTicketSummary {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
}

export interface DashboardData {
  stats: DashboardStats;
  kycVendors: KycVendorSummary[];
  turfs: TurfStatusSummary[];
  recentTickets: RecentTicketSummary[];
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

export async function fetchDashboardData(): Promise<DashboardData> {
  const base = getApiUrl();

  const [usersRes, vendorsRes, turfsRes, ticketsRes] = await Promise.all([
    authenticatedFetch(`${base}/admin/users?limit=1`, { cache: "no-store" }),
    authenticatedFetch(`${base}/admin/vendors?limit=100`, { cache: "no-store" }),
    authenticatedFetch(`${base}/admin/turfs?limit=100`, { cache: "no-store" }),
    authenticatedFetch(`${base}/admin/support/tickets`, { cache: "no-store" }),
  ]);

  const [usersPayload, vendorsPayload, turfsPayload, ticketsPayload] =
    await Promise.all([
      handleResponse(usersRes),
      handleResponse(vendorsRes),
      handleResponse(turfsRes),
      handleResponse(ticketsRes),
    ]);

  // ── Users ──────────────────────────────────────────────────────────────────
  const userItems = extractItems(usersPayload);
  const totalUsers = extractTotal(usersPayload, userItems.length);

  // ── Vendors + KYC ─────────────────────────────────────────────────────────
  const vendorItems = extractItems(vendorsPayload);
  const totalVendors = extractTotal(vendorsPayload, vendorItems.length);

  const pendingKyc = vendorItems.filter((v: any) => {
    const s = (v.kycStatus ?? v.kyc?.status ?? "not_started").toLowerCase();
    return s === "pending" || s === "in_review";
  }).length;

  const kycVendors: KycVendorSummary[] = vendorItems.slice(0, 8).map((v: any) => {
    const raw = (v.kycStatus ?? v.kyc?.status ?? "not_started").toLowerCase();
    return {
      id: v.id,
      name: v.businessName ?? v.ownerFullName ?? "Unknown Vendor",
      kycStatus: raw,
      stage: KYC_STAGE[raw] ?? raw,
      progress: KYC_PROGRESS[raw] ?? 0,
    };
  });

  // ── Turfs ─────────────────────────────────────────────────────────────────
  const turfItems = extractItems(turfsPayload);
  const totalTurfs = extractTotal(turfsPayload, turfItems.length);
  const activeTurfs = turfItems.filter(
    (t: any) => (t.status ?? "").toLowerCase() === "active",
  ).length;

  const turfs: TurfStatusSummary[] = turfItems.slice(0, 8).map((t: any) => ({
    id: t.id,
    name: t.name ?? "Unnamed Turf",
    status: (t.status ?? "inactive").toLowerCase(),
    city: t.address?.city ?? t.city ?? "—",
  }));

  // ── Support tickets ───────────────────────────────────────────────────────
  const rawTickets = extractItems(ticketsPayload);
  const openTickets = rawTickets.filter((t: any) => t.status === "open").length;
  const inProgressTickets = rawTickets.filter(
    (t: any) => t.status === "in_progress",
  ).length;

  const recentTickets: RecentTicketSummary[] = [...rawTickets]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5)
    .map((t: any) => ({
      id: t.id,
      ticketNumber: `TKT-${t.id.substring(0, 4).toUpperCase()}`,
      subject: t.subject ?? "—",
      category: t.category ?? "general",
      status: t.status ?? "open",
      createdAt: t.createdAt ? fmt(t.createdAt) : "—",
    }));

  return {
    stats: {
      totalUsers,
      totalVendors,
      totalTurfs,
      activeTurfs,
      pendingKyc,
      openTickets,
      inProgressTickets,
    },
    kycVendors,
    turfs,
    recentTickets,
  };
}
