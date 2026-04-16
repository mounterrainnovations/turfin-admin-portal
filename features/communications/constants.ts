import { ElementType } from "react";
import {
  Users, Star, MapPin, SoccerBall, Lightning, Buildings,
  ArrowCounterClockwise, Trophy, Cloud, ClockCountdown,
  CheckCircle, BellRinging, PaperPlaneTilt, CalendarBlank,
  Eye, Clock
} from "@phosphor-icons/react";
import { AudienceKey, NotifStatus, SentNotif, NotifTemplate, InboxNotification } from "./types";

export const INIT_HISTORY: SentNotif[] = [
  { id: "PN-001", title: "Weekend Warriors Deal",            message: "Book this weekend and get 20% off on all turfs! Use code WEEKEND20 at checkout. Valid for 48 hours only.",                         audience: "Active Users",    reach: 834,  opened: 312, openRate: 37, sentAt: "Mar 20, 2026",          status: "sent"      },
  { id: "PN-002", title: "New Venue: Arena Hub Bengaluru",   message: "Exciting news! Arena Hub has just been onboarded. 3 premium turfs now available in Bengaluru — book your slot now.",              audience: "All Users",       reach: 1240, opened: 687, openRate: 55, sentAt: "Mar 18, 2026",          status: "sent"      },
  { id: "PN-003", title: "We Miss You!",                     message: "It's been a while since your last session. Come back and book a turf — your favourite sport is waiting for you!",                 audience: "Inactive Users",  reach: 312,  opened: 89,  openRate: 29, sentAt: "Mar 15, 2026",          status: "sent"      },
  { id: "PN-004", title: "VIP Early Access: Premium Fields", message: "As a Turfin VIP, you get 24-hour early access to new premium slots before they open to everyone else.",                           audience: "VIP Users",       reach: 47,   opened: 38,  openRate: 81, sentAt: "Mar 12, 2026",          status: "sent"      },
  { id: "PN-005", title: "IPL Season — Cricket Offer",       message: "Cricket season is here! Book cricket turfs at special rates all through April. Tap to explore venues near you.",                  audience: "Cricket Players", reach: 380,  opened: 171, openRate: 45, sentAt: "Mar 08, 2026",          status: "sent"      },
  { id: "PN-006", title: "Summer Slots Now Open",            message: "Beat the heat — book early morning slots for the best experience. Full summer schedule is now live on the app.",                  audience: "All Users",       reach: 1240, opened: 0,   openRate: 0,  sentAt: "Mar 25, 2026 10:00 AM", status: "scheduled" },
];

export const AUDIENCE_OPTIONS: {
  key: AudienceKey; label: string; icon: ElementType; reach: number; desc: string;
}[] = [
  { key: "all",      label: "All Users",      icon: Users,          reach: 1240, desc: "Every registered user"       },
  { key: "active",   label: "Active Users",   icon: CheckCircle,    reach: 834,  desc: "Booked in last 30 days"      },
  { key: "inactive", label: "Inactive Users", icon: ClockCountdown, reach: 312,  desc: "No activity for 30+ days"    },
  { key: "vip",      label: "VIP Users",      icon: Star,           reach: 47,   desc: "25+ bookings or ₹40k+ spent" },
  { key: "city",     label: "By City",        icon: MapPin,         reach: 0,    desc: "Target specific cities"      },
  { key: "sport",    label: "By Sport",       icon: SoccerBall,     reach: 0,    desc: "Target sport preference"     },
];

export const CITIES: { name: string; count: number }[] = [
  { name: "Mumbai",    count: 380 }, { name: "Delhi",     count: 290 },
  { name: "Bangalore", count: 210 }, { name: "Pune",      count: 140 },
  { name: "Chennai",   count: 85  }, { name: "Hyderabad", count: 75  },
  { name: "Kolkata",   count: 60  },
];

export const SPORTS: { name: string; count: number }[] = [
  { name: "Football",   count: 445 }, { name: "Cricket",    count: 380 },
  { name: "Badminton",  count: 210 }, { name: "Tennis",     count: 145 },
  { name: "Volleyball", count: 60  }, { name: "Basketball", count: 40  },
];

export const NOTIF_TEMPLATES: NotifTemplate[] = [
  { name: "Flash Sale",    icon: Lightning,            color: "text-amber-500 bg-amber-50",  audience: "all",      title: "Limited Time Offer!",          message: "Book any turf today and get 20% off! Use code TURFIN20 at checkout. Valid for 24 hours only." },
  { name: "New Venue",     icon: Buildings,            color: "text-blue-500 bg-blue-50",    audience: "active",   title: "New Venue Just Launched!",     message: "A new premium turf venue has just been onboarded near you. Check it out and secure your slot before it fills up!" },
  { name: "Re-engage",     icon: ArrowCounterClockwise,color: "text-purple-500 bg-purple-50",audience: "inactive", title: "We Miss You!",                 message: "It's been a while since your last booking. Come back and play — your favourite sport is waiting for you on Turfin!" },
  { name: "Tournament",    icon: Trophy,               color: "text-orange-500 bg-orange-50",audience: "all",      title: "Turfin League — Register Now!",message: "Our city-wide tournament is back! Register your team now and compete for the Turfin Cup. Slots are filling fast." },
  { name: "VIP Perk",      icon: Star,                 color: "text-yellow-500 bg-yellow-50",audience: "vip",      title: "VIP Exclusive: Early Access",  message: "As a Turfin VIP, you get 24-hour early access to new premium field slots before they open to everyone else." },
  { name: "Weather Alert", icon: Cloud,                color: "text-cyan-500 bg-cyan-50",    audience: "all",      title: "Weather Advisory",             message: "Due to forecasted rain, some outdoor fields may be affected today. Check the app for real-time availability updates." },
];

export const statusCfg: Record<NotifStatus, { cls: string; label: string }> = {
  sent:      { cls: "bg-green-50 text-green-700", label: "Sent"      },
  scheduled: { cls: "bg-blue-50 text-blue-600",   label: "Scheduled" },
  failed:    { cls: "bg-red-50 text-red-600",     label: "Failed"    },
};

export const MOCK_INBOX_NOTIFICATIONS: InboxNotification[] = [
  {
    id: "1",
    title: "New Vendor Registration",
    message: "Arena Sports Hub just signed up and is pending KYC review.",
    time: "5m ago",
    read: false,
    type: "vendor",
  },
  {
    id: "2",
    title: "High Booking Volume",
    message: "12 bookings were made in the last hour across Mumbai turfs.",
    time: "1h ago",
    read: false,
    type: "booking",
  },
  {
    id: "3",
    title: "System Maintenance",
    message: "Scheduled maintenance will occur tonight at 2:00 AM IST.",
    time: "3h ago",
    read: false,
    type: "system",
  },
  {
    id: "4",
    title: "KYC Approved",
    message: "GreenZone FC's documents have been approved.",
    time: "1d ago",
    read: true,
    type: "vendor",
  },
];
