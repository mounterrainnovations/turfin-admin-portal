"use client";

import {
  DeviceMobile, CloudArrowUp, Rocket, GitBranch,
  ToggleLeft, ToggleRight, ArrowCircleUp, BellRinging,
  CheckCircle, ClockCountdown, PaperPlaneTilt,
  AndroidLogo, AppleLogo, Lightning, Users, Info,
  FloppyDisk, ArrowCounterClockwise, X,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useAuditLog } from "../audit-log-context";

// ── Types ─────────────────────────────────────────────────────────────────────
type AppTarget = "client" | "vendor";
type OtaChannel = "production" | "staging" | "preview";
type HistoryType = "ota" | "force-update" | "notification";
type HistoryStatus = "success" | "failed" | "pending";

interface AppConfig {
  id: AppTarget;
  name: string;
  color: string;
  liveVersion: string;
  latestBuild: string;
  minRequired: string;
  forceUpdate: boolean;
  iosCompliance: number;
  androidCompliance: number;
}

interface HistoryEntry {
  id: string;
  type: HistoryType;
  target: string;
  version: string;
  action: string;
  date: string;
  status: HistoryStatus;
}

// ── Seed Data ─────────────────────────────────────────────────────────────────
const INIT_APPS: AppConfig[] = [
  {
    id: "client",
    name: "TurfIn Client",
    color: "#8a9e60",
    liveVersion: "2.3.0",
    latestBuild: "2.3.1",
    minRequired: "2.1.0",
    forceUpdate: true,
    iosCompliance: 78,
    androidCompliance: 85,
  },
  {
    id: "vendor",
    name: "TurfIn Vendor",
    color: "#6e8245",
    liveVersion: "1.9.0",
    latestBuild: "1.9.2",
    minRequired: "1.7.0",
    forceUpdate: false,
    iosCompliance: 91,
    androidCompliance: 88,
  },
];

const INIT_HISTORY: HistoryEntry[] = [
  { id: "H-001", type: "ota",           target: "Client",        version: "2.3.1", action: "OTA pushed to production",      date: "Mar 24, 2026", status: "success" },
  { id: "H-002", type: "notification",  target: "Both",          version: "—",     action: "Update alert broadcast",        date: "Mar 23, 2026", status: "success" },
  { id: "H-003", type: "force-update",  target: "Client",        version: "2.1.0", action: "Min version set to 2.1.0",      date: "Mar 20, 2026", status: "success" },
  { id: "H-004", type: "ota",           target: "Vendor",        version: "1.9.2", action: "OTA pushed to staging",         date: "Mar 18, 2026", status: "success" },
  { id: "H-005", type: "notification",  target: "Vendor Owners", version: "—",     action: "Vendor app update alert",       date: "Mar 15, 2026", status: "success" },
  { id: "H-006", type: "ota",           target: "Client",        version: "2.3.0", action: "OTA pushed to production",      date: "Mar 10, 2026", status: "success" },
  { id: "H-007", type: "force-update",  target: "Vendor",        version: "1.7.0", action: "Min version set to 1.7.0",      date: "Mar 05, 2026", status: "success" },
];

// ── Style Maps ─────────────────────────────────────────────────────────────────
const historyTypeStyle: Record<HistoryType, { cls: string; label: string }> = {
  "ota":          { cls: "bg-blue-50 text-blue-600",     label: "OTA"          },
  "force-update": { cls: "bg-amber-50 text-amber-600",   label: "Force Update" },
  "notification": { cls: "bg-purple-50 text-purple-600", label: "Notification" },
};

const historyStatusStyle: Record<HistoryStatus, string> = {
  success: "bg-green-50 text-green-700",
  failed:  "bg-red-50 text-red-600",
  pending: "bg-gray-100 text-gray-500",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function AppManagementPage() {
  const { log } = useAuditLog();
  const [apps, setApps] = useState<AppConfig[]>(INIT_APPS);
  const [history, setHistory] = useState<HistoryEntry[]>(INIT_HISTORY);

  // OTA form
  const [otaTarget, setOtaTarget] = useState<"client" | "vendor" | "both">("client");
  const [otaChannel, setOtaChannel] = useState<OtaChannel>("production");
  const [otaVersion, setOtaVersion] = useState("");
  const [otaNotes, setOtaNotes] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [deployDone, setDeployDone] = useState(false);

  // Notification form
  const [notifTitle, setNotifTitle] = useState("App Update Available");
  const [notifMessage, setNotifMessage] = useState(
    "A new version of TurfIn is available. Update now for the latest features and improvements.",
  );
  const [notifTarget, setNotifTarget] = useState<"client" | "vendor" | "both">("both");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Min-version edit state per app
  const [editMin, setEditMin] = useState<Record<AppTarget, string>>({
    client: INIT_APPS[0].minRequired,
    vendor: INIT_APPS[1].minRequired,
  });
  const [savedMin, setSavedMin] = useState<Record<AppTarget, boolean>>({ client: false, vendor: false });

  function toggleForceUpdate(id: AppTarget) {
    const app = apps.find(a => a.id === id)!;
    const next = !app.forceUpdate;
    setApps(prev => prev.map(a => a.id === id ? { ...a, forceUpdate: next } : a));
    log({
      category: "app",
      action: `Force Update ${next ? "Enabled" : "Disabled"}`,
      description: `Force update ${next ? "enabled" : "disabled"} for ${app.name}. Users ${next ? "below min version will be blocked" : "will no longer be blocked on launch"}.`,
      resource: { type: "App", id, label: app.name },
      severity: next ? "warning" : "info",
      status: "success",
      changes: [{ field: "forceUpdate", before: String(!next), after: String(next) }],
    });
  }

  function saveMinVersion(id: AppTarget) {
    const app = apps.find(a => a.id === id)!;
    const prev_version = app.minRequired;
    const next_version = editMin[id];
    setApps(prev => prev.map(a => a.id === id ? { ...a, minRequired: next_version } : a));
    setSavedMin(prev => ({ ...prev, [id]: true }));
    const entry: HistoryEntry = {
      id: `H-${Date.now()}`, type: "force-update",
      target: id === "client" ? "Client" : "Vendor",
      version: next_version,
      action: `Min version set to ${next_version}`,
      date: "Just now", status: "success",
    };
    setHistory(prev => [entry, ...prev]);
    log({
      category: "app",
      action: "Min Version Updated",
      description: `Minimum required version updated for ${app.name} from v${prev_version} to v${next_version}.`,
      resource: { type: "App", id, label: app.name },
      severity: "info",
      status: "success",
      changes: [{ field: "minVersion", before: prev_version, after: next_version }],
    });
    setTimeout(() => setSavedMin(prev => ({ ...prev, [id]: false })), 2000);
  }

  function handleOtaDeploy() {
    if (!otaVersion) return;
    setDeploying(true);
    setTimeout(() => {
      setDeploying(false);
      setDeployDone(true);
      const target = otaTarget === "both" ? "Client + Vendor" : otaTarget === "client" ? "Client" : "Vendor";
      const entry: HistoryEntry = {
        id: `H-${Date.now()}`, type: "ota",
        target, version: otaVersion,
        action: `OTA pushed to ${otaChannel}`,
        date: "Just now", status: "success",
      };
      setHistory(prev => [entry, ...prev]);
      setOtaVersion("");
      setOtaNotes("");
      log({
        category: "app",
        action: "OTA Update Deployed",
        description: `OTA bundle v${otaVersion} pushed to ${otaChannel} channel for ${target}.`,
        resource: { type: "App", id: otaTarget, label: target },
        severity: "info",
        status: "success",
        meta: { channel: otaChannel, version: otaVersion, ...(otaNotes ? { notes: otaNotes } : {}) },
      });
      setTimeout(() => setDeployDone(false), 3000);
    }, 2000);
  }

  function handleBroadcast() {
    if (!notifTitle) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      const target = notifTarget === "both" ? "Both" : notifTarget === "client" ? "Client" : "Vendor Owners";
      const entry: HistoryEntry = {
        id: `H-${Date.now()}`, type: "notification",
        target, version: "—",
        action: `"${notifTitle}" broadcast`,
        date: "Just now", status: "success",
      };
      setHistory(prev => [entry, ...prev]);
      log({
        category: "notification",
        action: "Update Notification Broadcast",
        description: `Push notification "${notifTitle}" broadcast to ${target}.`,
        resource: { type: "Notification", id: `PN-${Date.now()}`, label: notifTitle },
        severity: "info",
        status: "success",
        meta: { target, message: notifMessage.slice(0, 80) },
      });
      setTimeout(() => setSent(false), 3000);
    }, 1500);
  }

  const totalCompliance = Math.round(
    apps.reduce((s, a) => s + (a.iosCompliance + a.androidCompliance) / 2, 0) / apps.length,
  );

  return (
    <div className="px-6 py-5 space-y-5">

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-4 gap-4">

        {apps.map(app => (
          <div key={app.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{app.name}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: app.color + "20" }}>
                <DeviceMobile size={14} weight="fill" style={{ color: app.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">v{app.liveVersion}</p>
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <AppleLogo size={11} /> iOS
              </span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <AndroidLogo size={11} /> Android
              </span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${app.forceUpdate ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"}`}>
              {app.forceUpdate ? "Force Update ON" : "Force Update OFF"}
            </span>
          </div>
        ))}

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Update Compliance</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#8a9e6020" }}>
              <Users size={14} weight="fill" style={{ color: "#8a9e60" }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-1">{totalCompliance}%</p>
          <p className="text-[10px] text-gray-400 mb-2">on latest or min-required version</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${totalCompliance}%`, backgroundColor: "#8a9e60" }} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Force Updates Active</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#c4953a20" }}>
              <Lightning size={14} weight="fill" style={{ color: "#c4953a" }} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-1">
            {apps.filter(a => a.forceUpdate).length}
            <span className="text-sm font-normal text-gray-400"> / {apps.length}</span>
          </p>
          <p className="text-[10px] text-gray-400">apps have forced update enabled</p>
        </div>
      </div>

      {/* ── Middle Row: Version Control + OTA ── */}
      <div className="grid grid-cols-3 gap-4">

        {apps.map(app => (
          <div key={app.id} className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <DeviceMobile size={16} weight="fill" style={{ color: app.color }} />
                <h2 className="font-semibold text-gray-800 text-sm">{app.name}</h2>
              </div>
              <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Live</span>
            </div>

            <div className="p-4 space-y-4 flex-1">

              {/* Version grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Live Version</p>
                  <div className="flex items-center gap-1.5">
                    <GitBranch size={13} style={{ color: app.color }} />
                    <span className="text-sm font-bold text-gray-800">v{app.liveVersion}</span>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">Published on stores</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Latest Build</p>
                  <div className="flex items-center gap-1.5">
                    <ArrowCircleUp size={13} style={{ color: "#c4953a" }} />
                    <span className="text-sm font-bold text-gray-800">v{app.latestBuild}</span>
                  </div>
                  <p className="text-[9px] text-amber-500 mt-0.5">Pending store review</p>
                </div>
              </div>

              {/* Platform compliance bars */}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Platform Compliance</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <AppleLogo size={12} className="text-gray-500 shrink-0" />
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${app.iosCompliance}%`, backgroundColor: app.color }} />
                    </div>
                    <span className="text-[10px] text-gray-500 w-7 text-right">{app.iosCompliance}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AndroidLogo size={12} className="text-gray-500 shrink-0" />
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${app.androidCompliance}%`, backgroundColor: app.color }} />
                    </div>
                    <span className="text-[10px] text-gray-500 w-7 text-right">{app.androidCompliance}%</span>
                  </div>
                </div>
              </div>

              {/* Min required version */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Min Required Version</p>
                  <div className="group relative">
                    <Info size={11} className="text-gray-400 cursor-help" />
                    <div className="absolute left-4 -top-1 z-10 hidden group-hover:block w-56 bg-gray-800 text-white text-[10px] rounded-lg p-2.5 leading-relaxed shadow-xl">
                      Users below this version are blocked from using the app until they update. Your mobile app must check this value on launch — see the integration guide in docs/.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={editMin[app.id]}
                    onChange={e => setEditMin(prev => ({ ...prev, [app.id]: e.target.value }))}
                    className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#8a9e60] font-mono"
                    placeholder="e.g. 2.0.0"
                  />
                  <button
                    onClick={() => saveMinVersion(app.id)}
                    className="flex items-center gap-1.5 text-[10px] font-semibold text-white px-3 py-2 rounded-lg shrink-0 transition-colors"
                    style={{ backgroundColor: savedMin[app.id] ? "#8a9e60" : app.color }}
                  >
                    {savedMin[app.id] ? <CheckCircle size={12} weight="fill" /> : <FloppyDisk size={12} />}
                    {savedMin[app.id] ? "Saved" : "Save"}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Current enforced: v{app.minRequired}</p>
              </div>

              {/* Force Update toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div>
                  <p className="text-xs font-semibold text-gray-700">Force Update</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Block app below min version</p>
                </div>
                <button onClick={() => toggleForceUpdate(app.id)} className="shrink-0">
                  {app.forceUpdate
                    ? <ToggleRight size={30} weight="fill" style={{ color: app.color }} />
                    : <ToggleLeft size={30} className="text-gray-300" />
                  }
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* OTA Deploy Panel */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <CloudArrowUp size={16} weight="fill" style={{ color: "#8a9e60" }} />
              <h2 className="font-semibold text-gray-800 text-sm">OTA Update Deploy</h2>
            </div>
            <div className="group relative">
              <Info size={13} className="text-gray-400 cursor-help" />
              <div className="absolute right-0 top-5 z-10 hidden group-hover:block w-64 bg-gray-800 text-white text-[10px] rounded-lg p-3 leading-relaxed shadow-xl">
                <strong className="block mb-1">What is OTA?</strong>
                Over-The-Air updates push new JavaScript bundle changes to users instantly — no App Store or Play Store approval needed. Use this for bug fixes and UI changes. Requires Expo EAS Update or Microsoft CodePush to be integrated in your mobile app.
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4 flex-1 flex flex-col">

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-[10px] text-blue-600 leading-relaxed">
              OTA only updates JS/TS code. Native changes (new permissions, native modules) require a full store release.
            </div>

            {/* Target */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Target App</label>
              <div className="flex gap-2">
                {(["client", "vendor", "both"] as const).map(t => (
                  <button key={t} onClick={() => setOtaTarget(t)}
                    className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg border capitalize transition-colors ${otaTarget === t ? "text-white border-transparent" : "text-gray-500 border-gray-200 hover:border-gray-300"}`}
                    style={otaTarget === t ? { backgroundColor: "#8a9e60" } : {}}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Channel */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Release Channel</label>
              <div className="flex gap-2">
                {(["production", "staging", "preview"] as const).map(ch => (
                  <button key={ch} onClick={() => setOtaChannel(ch)}
                    className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg border capitalize transition-colors ${otaChannel === ch ? "border-[#8a9e60] text-[#8a9e60] bg-[#8a9e60]/5" : "text-gray-500 border-gray-200 hover:border-gray-300"}`}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Version label */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Version / Label</label>
              <input
                value={otaVersion}
                onChange={e => setOtaVersion(e.target.value)}
                placeholder="e.g. 2.3.1-hotfix"
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#8a9e60] font-mono"
              />
            </div>

            {/* Release notes */}
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Release Notes</label>
              <textarea
                value={otaNotes}
                onChange={e => setOtaNotes(e.target.value)}
                rows={3}
                placeholder="Describe what changed in this release…"
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#8a9e60] resize-none"
              />
            </div>

            {/* Deploy button */}
            <button
              onClick={handleOtaDeploy}
              disabled={!otaVersion || deploying}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: deployDone ? "#8a9e60" : "#6e8245" }}
            >
              {deployDone
                ? <><CheckCircle size={14} weight="fill" /> Deployed!</>
                : deploying
                  ? <><ArrowCounterClockwise size={14} className="animate-spin" /> Deploying…</>
                  : <><Rocket size={14} weight="fill" /> Push OTA Update</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Broadcast + History ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Broadcast Notification */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
            <BellRinging size={16} weight="fill" style={{ color: "#8a9e60" }} />
            <h2 className="font-semibold text-gray-800 text-sm">Broadcast Update Notification</h2>
          </div>

          <div className="p-4 grid grid-cols-2 gap-5">

            {/* Compose */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Notification Title</label>
                <input
                  value={notifTitle}
                  onChange={e => setNotifTitle(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#8a9e60]"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Message Body</label>
                <textarea
                  value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  rows={4}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#8a9e60] resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Send To</label>
                <div className="flex gap-2">
                  {([
                    { val: "client" as const, label: "Client Users"   },
                    { val: "vendor" as const, label: "Vendor Owners"  },
                    { val: "both"   as const, label: "Both"           },
                  ]).map(({ val, label }) => (
                    <button key={val} onClick={() => setNotifTarget(val)}
                      className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg border transition-colors ${notifTarget === val ? "text-white border-transparent" : "text-gray-500 border-gray-200 hover:border-gray-300"}`}
                      style={notifTarget === val ? { backgroundColor: "#8a9e60" } : {}}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleBroadcast}
                disabled={sending || !notifTitle}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: sent ? "#8a9e60" : "#6e8245" }}
              >
                {sent
                  ? <><CheckCircle size={14} weight="fill" /> Sent!</>
                  : sending
                    ? <><ArrowCounterClockwise size={14} className="animate-spin" /> Sending…</>
                    : <><PaperPlaneTilt size={14} weight="fill" /> Broadcast Now</>
                }
              </button>
            </div>

            {/* Phone preview + note */}
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Notification Preview</p>

              {/* Mock phone notification */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#8a9e6020" }}>
                      <DeviceMobile size={16} weight="fill" style={{ color: "#8a9e60" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-semibold text-gray-700">TurfIn</span>
                        <span className="text-[9px] text-gray-400">now</span>
                      </div>
                      <p className="text-[11px] font-semibold text-gray-800 leading-snug truncate">
                        {notifTitle || "Notification Title"}
                      </p>
                      <p className="text-[10px] text-gray-500 leading-snug mt-0.5 line-clamp-2">
                        {notifMessage || "Your message will appear here."}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-gray-400 text-center mt-2.5">
                  Sent to:{" "}
                  <span className="font-medium text-gray-600">
                    {notifTarget === "both" ? "All users + vendor owners" : notifTarget === "client" ? "Client app users" : "Vendor owners"}
                  </span>
                </p>
              </div>

              <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-3 text-[10px] text-amber-700 leading-relaxed">
                <strong>Integration needed:</strong> This triggers a Firebase Cloud Messaging (FCM) broadcast. Your mobile apps must register FCM device tokens and the admin portal backend needs a valid FCM Service Account key. See <code className="font-mono bg-amber-100 px-1 rounded">docs/APP_MANAGEMENT.md</code> for setup instructions.
              </div>
            </div>
          </div>
        </div>

        {/* Update History */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col" style={{ maxHeight: 480 }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <ClockCountdown size={16} weight="fill" style={{ color: "#8a9e60" }} />
              <h2 className="font-semibold text-gray-800 text-sm">Update History</h2>
            </div>
            <span className="text-[10px] font-medium text-gray-400">{history.length} entries</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {history.map(h => (
              <div key={h.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${historyTypeStyle[h.type].cls}`}>
                    {historyTypeStyle[h.type].label}
                  </span>
                  <span className="text-[9px] text-gray-400 shrink-0">{h.date}</span>
                </div>
                <p className="text-[10px] font-semibold text-gray-700">{h.action}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] text-gray-400">
                    {h.target}{h.version !== "—" ? ` · v${h.version}` : ""}
                  </span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${historyStatusStyle[h.status]}`}>
                    {h.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
