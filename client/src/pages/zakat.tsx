import { Layout } from "@/components/layout-sidebar";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBankAccounts, useInvestments, useDebts, useAssets } from "@/hooks/use-finance";
import { toUsd } from "@/lib/currency";
import { calculateZakat, type ZakatAssets, type ZakatCalculatorSettings, type ZakatPrices } from "@shared/zakatCalculator";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  CheckCircle2, XCircle, RefreshCw, Save, Trash2, ChevronDown, ChevronUp, Info,
  Calendar, Bell, Moon, Star, Clock, Download, ExternalLink, ArrowRight,
  TrendingUp, CheckCheck, AlertTriangle, Sparkles, Target,
} from "lucide-react";
import { format, differenceInDays, addDays, isToday, isBefore } from "date-fns";

/* ── palette ── */
const BRAND  = "#1B4FE4";
const MINT   = "#00C896";
const AMBER  = "#F59E0B";
const DANGER = "#EF4444";
const PURPLE = "#8B5CF6";
const GOLD   = "#D97706";

/* ── Hijri month names ── */
const HIJRI_MONTHS = [
  "Muharram","Safar","Rabi' al-Awwal","Rabi' al-Thani",
  "Jumada al-Awwal","Jumada al-Thani","Rajab","Sha'ban",
  "Ramadan","Shawwal","Dhu al-Qa'dah","Dhu al-Hijjah",
];

/* ── Gregorian → Hijri conversion (Kuwaiti algorithm) ── */
function toHijri(date: Date): { year: number; month: number; day: number; monthName: string } {
  const d = date.getDate(), m = date.getMonth() + 1, y = date.getFullYear();
  const jd =
    Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
    Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
    d - 32075;
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const hm = Math.floor((24 * l) / 709);
  const hd = l - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;
  return { year: hy, month: hm, day: hd, monthName: HIJRI_MONTHS[hm - 1] ?? "" };
}

/* ── Next Hawl date computation ── */
function getNextHawlDate(hawlDate: string, hawlDateType: string, hawlStartDate?: string): Date | null {
  if (!hawlDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (hawlDateType === "tracking" && hawlStartDate) {
    // Hawl completes 354 days after start, then repeats every 354 days
    const start = new Date(hawlStartDate);
    let next = addDays(start, 354);
    while (isBefore(next, today)) next = addDays(next, 354);
    return next;
  }
  // Fixed annual: same month/day every year
  const base = new Date(hawlDate);
  let next = new Date(today.getFullYear(), base.getMonth(), base.getDate());
  if (isBefore(next, today) && !isToday(next)) {
    next = new Date(today.getFullYear() + 1, base.getMonth(), base.getDate());
  }
  return next;
}

function getLastHawlDate(hawlDate: string, hawlDateType: string, hawlStartDate?: string): Date | null {
  const next = getNextHawlDate(hawlDate, hawlDateType, hawlStartDate);
  if (!next) return null;
  if (hawlDateType === "tracking") return addDays(next, -354);
  return new Date(next.getFullYear() - 1, next.getMonth(), next.getDate());
}

/* ── Countdown color state ── */
function countdownState(days: number): { color: string; bg: string; label: string; urgent: boolean } {
  if (days < 0)  return { color: "#DC2626", bg: "#FEF2F2", label: `${Math.abs(days)} days overdue`, urgent: true };
  if (days === 0) return { color: "#059669", bg: "#ECFDF5", label: "Today is your Zakat day! 🎉", urgent: true };
  if (days <= 7)  return { color: "#DC2626", bg: "#FEF2F2", label: "Zakat due very soon",  urgent: true  };
  if (days <= 14) return { color: "#EA580C", bg: "#FFF7ED", label: "Final preparations",    urgent: true  };
  if (days <= 30) return { color: AMBER,    bg: "#FFFBEB", label: "Start preparing",        urgent: false };
  if (days <= 60) return { color: AMBER,    bg: "#FFFBEB", label: "Prepare soon",           urgent: false };
  return            { color: MINT,    bg: "#ECFDF5", label: "Plenty of time",          urgent: false };
}

/* ── ICS calendar export ── */
function exportToICS(nextDate: Date, zakatAmount: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = nextDate.getFullYear(), m = nextDate.getMonth() + 1, d = nextDate.getDate();
  const dt = `${y}${pad(m)}${pad(d)}`;
  const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Wealthly//ZakatReminder//EN\r\nCALSCALE:GREGORIAN\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:${dt}\r\nSUMMARY:Zakat Due — $${zakatAmount.toFixed(2)}\r\nDESCRIPTION:Your annual Zakat is due today.\\nEstimated amount: $${zakatAmount.toFixed(2)}\\nMay Allah accept your Zakat.\r\nRRULE:FREQ=YEARLY\r\nBEGIN:VALARM\r\nTRIGGER:-P30D\r\nACTION:DISPLAY\r\nDESCRIPTION:Zakat due in 30 days\r\nEND:VALARM\r\nBEGIN:VALARM\r\nTRIGGER:-P7D\r\nACTION:DISPLAY\r\nDESCRIPTION:Zakat due in 7 days\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "zakat-reminder.ics"; a.click();
  URL.revokeObjectURL(url);
}

/* ── Circular SVG Progress Ring ── */
function ProgressRing({ percent, size = 96, stroke = 7, color = MINT }: { percent: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(Math.max(percent, 0), 100) / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.5s ease" }} />
    </svg>
  );
}

/* ── Small helpers ── */
const fmt = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function InfoRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b last:border-0 dark:border-gray-800">
      <span className={`text-sm ${strong ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm font-mono ${strong ? "font-bold text-foreground" : ""}`} dir="ltr">{value}</span>
    </div>
  );
}

/* ── Hooks ── */
function useZakatSettings() {
  return useQuery({
    queryKey: ["/api/zakat/settings"],
    queryFn: async () => {
      const r = await fetch("/api/zakat/settings", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to fetch zakat settings");
      return r.json();
    },
  });
}

function useSaveZakatSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const r = await fetch("/api/zakat/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to save settings");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/zakat/settings"] }),
  });
}

function useZakatSnapshots() {
  return useQuery({
    queryKey: ["/api/zakat/snapshots"],
    queryFn: async () => {
      const r = await fetch("/api/zakat/snapshots", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to fetch snapshots");
      return r.json();
    },
  });
}

function useSaveSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const r = await fetch("/api/zakat/snapshots", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to save snapshot");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/zakat/snapshots"] }),
  });
}

function useDeleteSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/zakat/snapshots/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/zakat/snapshots"] }),
  });
}

/* ══════════════════════════════════════════════════════════
   HAWL SETUP CARD — replaces the simple toggle
══════════════════════════════════════════════════════════ */
function HawlSetupCard({
  hawlDate, hawlDateType, hawlStartDate,
  onChange, onSave, saving,
}: {
  hawlDate: string; hawlDateType: string; hawlStartDate: string;
  onChange: (key: string, val: string) => void;
  onSave: () => void; saving: boolean;
}) {
  const { t } = useI18n();
  const PRESET_DATES: { label: string; month: number; day: number }[] = [
    { label: "1 Ramadan", month: 3, day: 2 },    // approximate Gregorian
    { label: "1 Muharram", month: 7, day: 6 },
    { label: "15 Sha'ban", month: 2, day: 14 },
    { label: "Day of Arafah", month: 6, day: 5 },
    { label: "1 Dhul Hijjah", month: 5, day: 28 },
  ];

  const nextDate = hawlDate ? getNextHawlDate(hawlDate, hawlDateType, hawlStartDate) : null;
  const hijriNext = nextDate ? toHijri(nextDate) : null;

  return (
    <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${MINT}33, ${GOLD}22)` }}>
            <Moon className="w-4 h-4" style={{ color: GOLD }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">Set Your Zakat Anniversary Date</h3>
            <p className="text-xs text-gray-400">Choose when to calculate and pay your Zakat each year</p>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {/* Option A: Fixed Annual Date */}
        <div
          onClick={() => onChange("hawlDateType", "fixed")}
          className="w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer"
          style={hawlDateType === "fixed"
            ? { borderColor: MINT, backgroundColor: "#ECFDF5" }
            : { borderColor: "#E2E8F0", backgroundColor: "transparent" }}>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0"
              style={{ borderColor: hawlDateType === "fixed" ? MINT : "#CBD5E1" }}>
              {hawlDateType === "fixed" && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MINT }} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Fixed Annual Date</p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: MINT }}>Recommended</span>
              </div>
              <p className="text-xs text-gray-500">Choose a memorable Islamic date to calculate Zakat every year. Most practical for regular Muslims.</p>
              {hawlDateType === "fixed" && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Quick select Islamic date</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {PRESET_DATES.map(p => {
                        const yearDate = `${new Date().getFullYear()}-${String(p.month).padStart(2,"0")}-${String(p.day).padStart(2,"0")}`;
                        return (
                          <button key={p.label} onClick={e => { e.stopPropagation(); onChange("hawlDate", yearDate); }}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all"
                            style={hawlDate === yearDate
                              ? { backgroundColor: MINT, color: "#fff", borderColor: MINT }
                              : { backgroundColor: "#F8FAFC", color: "#64748B", borderColor: "#E2E8F0" }}>
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="date" value={hawlDate} onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); onChange("hawlDate", e.target.value); }}
                        className="h-8 text-xs max-w-[180px]" />
                      <span className="text-xs text-gray-400">Custom date</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Option B: Track Nisab Date */}
        <div
          onClick={() => onChange("hawlDateType", "tracking")}
          className="w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer"
          style={hawlDateType === "tracking"
            ? { borderColor: BRAND, backgroundColor: "#EEF4FF" }
            : { borderColor: "#E2E8F0", backgroundColor: "transparent" }}>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0"
              style={{ borderColor: hawlDateType === "tracking" ? BRAND : "#CBD5E1" }}>
              {hawlDateType === "tracking" && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND }} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Track My Nisab Date Precisely</p>
              <p className="text-xs text-gray-500">I know the exact date my wealth first exceeded Nisab. Calculate based on the 354-day lunar cycle.</p>
              {hawlDateType === "tracking" && (
                <div className="mt-3">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">When did your wealth first exceed Nisab?</label>
                  <Input type="date" value={hawlStartDate} onClick={e => e.stopPropagation()}
                    onChange={e => { e.stopPropagation(); onChange("hawlStartDate", e.target.value); }}
                    className="h-8 text-xs max-w-[200px]" />
                  <p className="text-xs text-gray-400 mt-1">Hawl completes 354 days after this date and repeats annually.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        {nextDate && (
          <div className="p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30" style={{ backgroundColor: "#F0FDF4" }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-800">
                  Your next Zakat date: {format(nextDate, "MMMM d, yyyy")}
                  {" "}({format(nextDate, "EEEE")})
                </p>
                {hijriNext && (
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    ≈ {hijriNext.day} {hijriNext.monthName} {hijriNext.year} AH
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <Button onClick={onSave} disabled={saving || (!hawlDate && !hawlStartDate)}
          className="gap-2 rounded-xl text-white" style={{ backgroundColor: MINT }}>
          {saving ? <><RefreshCw className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Hawl Date</>}
        </Button>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════
   HAWL COUNTDOWN CARD
══════════════════════════════════════════════════════════ */
function HawlCountdownCard({
  hawlDate, hawlDateType, hawlStartDate, zakatDue,
}: {
  hawlDate: string; hawlDateType: string; hawlStartDate: string; zakatDue: number;
}) {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const nextDate = getNextHawlDate(hawlDate, hawlDateType, hawlStartDate);
  const lastDate = getLastHawlDate(hawlDate, hawlDateType, hawlStartDate);

  if (!nextDate) {
    return (
      <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
        <CardContent className="p-5 text-center">
          <Moon className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Hawl date not set</p>
          <p className="text-xs text-gray-400 mt-1">Set your Zakat anniversary date in Settings above to see your countdown</p>
        </CardContent>
      </Card>
    );
  }

  const daysLeft = differenceInDays(nextDate, today);
  const daysElapsed = lastDate ? differenceInDays(today, lastDate) : 0;
  const totalDays = hawlDateType === "tracking" ? 354 : 365;
  const progress = Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100);
  const state = countdownState(daysLeft);
  const hijriNext = toHijri(nextDate);

  // Month/day label
  const months = Math.floor(Math.abs(daysLeft) / 30);
  const days  = Math.abs(daysLeft) % 30;

  return (
    <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="p-1" style={{ background: `linear-gradient(135deg, ${MINT}18, ${GOLD}12)` }}>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Moon className="w-4 h-4" style={{ color: GOLD }} />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Next Zakat Date</span>
            {daysLeft <= 14 && daysLeft >= 0 && (
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
                style={{ backgroundColor: state.bg, color: state.color }}>
                {state.label}
              </span>
            )}
          </div>

          {/* Main countdown + ring */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative shrink-0">
              <ProgressRing percent={progress} size={88} stroke={6} color={state.color} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold leading-none" style={{ color: state.color }}>
                  {daysLeft === 0 ? "🎉" : Math.abs(daysLeft)}
                </span>
                {daysLeft !== 0 && <span className="text-[9px] text-gray-400 font-medium mt-0.5">days</span>}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {format(nextDate, "MMMM d, yyyy")}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{format(nextDate, "EEEE")}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: GOLD }}>
                {hijriNext.day} {hijriNext.monthName} {hijriNext.year} AH
              </p>
              {daysLeft > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {months > 0 ? `${months}mo ` : ""}{days > 0 ? `${days}d` : ""} remaining
                </p>
              )}
              {daysLeft < 0 && (
                <p className="text-xs font-semibold mt-1" style={{ color: DANGER }}>
                  Overdue by {Math.abs(daysLeft)} days
                </p>
              )}
            </div>
          </div>

          {/* Progress bar label */}
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>Hawl progress</span>
              <span>{progress.toFixed(0)}% · {daysElapsed} / {totalDays} days</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#E2E8F0" }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${progress}%`, backgroundColor: state.color }} />
            </div>
          </div>

          {/* Zakat amount */}
          {zakatDue > 0 && (
            <div className="p-2.5 rounded-xl mb-3" style={{ backgroundColor: state.bg }}>
              <p className="text-[10px] text-gray-500 mb-0.5">Estimated Zakat due</p>
              <p className="text-lg font-bold" style={{ color: state.color }}>{fmt(zakatDue)}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs flex-1"
              onClick={() => exportToICS(nextDate, zakatDue)}>
              <Calendar className="w-3.5 h-3.5" /> Add to Calendar
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs flex-1"
              onClick={() => navigate("/settings#notifications")}>
              <Bell className="w-3.5 h-3.5" /> Reminders
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════
   ZAKAT JOURNEY (multi-year history)
══════════════════════════════════════════════════════════ */
function ZakatJourney({ snapshots }: { snapshots: any[] }) {
  const { t } = useI18n();
  if (!snapshots || snapshots.length === 0) return null;

  const total = snapshots.reduce((s, snap) => s + Number(snap.zakatDue || 0), 0);
  const sorted = [...snapshots].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl mt-6">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Your Zakat Journey
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Year-over-year record</p>
          </div>
          {total > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-gray-400 mb-0.5">Lifetime total</p>
              <p className="text-base font-bold" style={{ color: MINT }}>{fmt(total)}</p>
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="p-3 rounded-xl mb-4" style={{ background: `linear-gradient(135deg, ${MINT}18, ${GOLD}12)` }}>
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                You've paid {fmt(total)} in Zakat across {snapshots.length} record{snapshots.length > 1 ? "s" : ""}. May Allah accept it. 🤲
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {sorted.map((s: any, i) => {
            const hijri = toHijri(new Date(s.createdAt));
            const due = Number(s.zakatDue || 0);
            const paid = s.hawlMet && s.nisabMet;
            return (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 group" data-testid={`snapshot-row-${s.id}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${paid ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-slate-100 dark:bg-slate-700"}`}>
                  {paid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {format(new Date(s.createdAt), "dd MMM yyyy")}
                    </p>
                    <Badge variant="outline" className="text-[9px] h-4">{s.nisabStandard}</Badge>
                    {i === 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: BRAND + "22", color: BRAND }}>Latest</span>}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {hijri.day} {hijri.monthName} {hijri.year} AH · Net: {fmt(Number(s.netZakatable))}
                  </p>
                  {s.notes && <p className="text-[10px] text-gray-500 mt-0.5 truncate">"{s.notes}"</p>}
                </div>
                <div className="text-right shrink-0">
                  {due > 0 ? (
                    <p className="text-sm font-bold" style={{ color: MINT }}>{fmt(due)}</p>
                  ) : (
                    <p className="text-xs text-gray-400">Not due</p>
                  )}
                </div>
                <DeleteSnapshotBtn id={s.id} />
              </div>
            );
          })}
        </div>

        {snapshots.length >= 2 && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Consider setting aside {fmt(sorted[0] ? Number(sorted[0].zakatDue || 0) / 12 : 0)}/month
                to have next year's Zakat ready well in advance.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeleteSnapshotBtn({ id }: { id: number }) {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/zakat/snapshots/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/zakat/snapshots"] }),
  });
  return (
    <button onClick={() => del.mutate(id)}
      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all ml-1"
      data-testid={`button-delete-snapshot-${id}`}>
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function ZakatPage() {
  const { t, lang, isRtl } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: savedSettings } = useZakatSettings();
  const { data: snapshots } = useZakatSnapshots();
  const { data: bankAccounts = [] } = useBankAccounts();
  const { data: investments = [] } = useInvestments();
  const { data: debts = [] } = useDebts();
  const { data: assets = [] } = useAssets();

  const saveSettings = useSaveZakatSettings();
  const saveSnapshot = useSaveSnapshot();

  const [settingsOpen, setSettingsOpen] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(false);

  // Calculator state
  const [settings, setSettings] = useState<ZakatCalculatorSettings>({
    nisabStandard: "gold", includeDebts: true, hawlMet: false, realEstateMode: "exempt",
  });
  const [prices, setPrices] = useState<ZakatPrices>({ goldPricePerGram: 60, silverPricePerGram: 0.75 });
  const [cashOnHand, setCashOnHand]         = useState("0");
  const [goldGrams, setGoldGrams]           = useState("0");
  const [goldKarat, setGoldKarat]           = useState("24");
  const [silverGrams, setSilverGrams]       = useState("0");
  const [receivables, setReceivables]       = useState("0");
  const [rentalIncomeCash, setRentalIncomeCash] = useState("0");
  const [notes, setNotes]                   = useState("");

  // Hawl tracking state
  const [hawlDate, setHawlDate]           = useState("");
  const [hawlDateType, setHawlDateType]   = useState("fixed");
  const [hawlStartDate, setHawlStartDate] = useState("");

  // Per-account / per-investment overrides
  const [accountZakatable, setAccountZakatable]         = useState<Record<number, boolean>>({});
  const [investmentZakatMethod, setInvestmentZakatMethod] = useState<Record<number, string>>({});

  // Populate from saved settings
  useEffect(() => {
    if (!savedSettings) return;
    setSettings({
      nisabStandard: savedSettings.nisabStandard || "gold",
      includeDebts:  savedSettings.includeDebts ?? true,
      hawlMet:       savedSettings.hawlMet ?? false,
      realEstateMode: savedSettings.realEstateMode || "exempt",
    });
    setPrices({
      goldPricePerGram:   Number(savedSettings.goldPricePerGram) || 60,
      silverPricePerGram: Number(savedSettings.silverPricePerGram) || 0.75,
    });
    setCashOnHand(String(savedSettings.cashOnHand || "0"));
    setGoldGrams(String(savedSettings.goldGrams || "0"));
    setGoldKarat(String(savedSettings.goldKarat || "24"));
    setSilverGrams(String(savedSettings.silverGrams || "0"));
    setReceivables(String(savedSettings.receivables || "0"));
    setRentalIncomeCash(String(savedSettings.rentalIncomeCash || "0"));
    setHawlDate(savedSettings.hawlDate || "");
    setHawlDateType(savedSettings.hawlDateType || "fixed");
    setHawlStartDate(savedSettings.hawlStartDate || "");
  }, [savedSettings]);

  useEffect(() => {
    const map: Record<number, boolean> = {};
    (bankAccounts as any[]).forEach((a: any) => { map[a.id] = a.isZakatable !== false; });
    setAccountZakatable(map);
  }, [bankAccounts]);

  useEffect(() => {
    const map: Record<number, string> = {};
    (investments as any[]).filter((i: any) => i.status === "active").forEach((i: any) => {
      map[i.id] = i.zakatMethod || "market_value";
    });
    setInvestmentZakatMethod(map);
  }, [investments]);

  // Derived hawlMet from dates
  const derivedHawlMet = useMemo(() => {
    if (settings.hawlMet) return true; // manual override
    if (!hawlDate && !hawlStartDate) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (hawlDateType === "tracking" && hawlStartDate) {
      const start = new Date(hawlStartDate);
      const hawlComplete = addDays(start, 354);
      return !isBefore(today, hawlComplete) || isToday(hawlComplete);
    }
    return !!hawlDate; // fixed date: assume hawl is met once date is set
  }, [hawlDate, hawlDateType, hawlStartDate, settings.hawlMet]);

  // Derived values
  const cashFromBankAccounts = useMemo(() =>
    (bankAccounts as any[]).reduce((s, a) => accountZakatable[a.id] === false ? s : s + toUsd(a.balance, a.exchangeRateToUsd), 0),
    [bankAccounts, accountZakatable]);

  const investmentsValue = useMemo(() =>
    (investments as any[]).filter((i: any) => i.status === "active" && investmentZakatMethod[i.id] !== "exempt")
      .reduce((s, i) => s + toUsd(i.currentValue, i.exchangeRateToUsd), 0),
    [investments, investmentZakatMethod]);

  const realEstateAssets = useMemo(() => (assets as any[]).filter((a: any) => a.type === "Real Estate"), [assets]);
  const realEstateValue  = useMemo(() => realEstateAssets.reduce((s: number, a: any) => s + toUsd(a.currentValue, a.exchangeRateToUsd), 0), [realEstateAssets]);
  const deductibleDebts  = useMemo(() =>
    (debts as any[]).filter((d: any) => d.status === "active").reduce((s, d) => s + toUsd(d.remainingAmount, d.exchangeRateToUsd), 0),
    [debts]);

  const zakatAssets: ZakatAssets = {
    cashFromBankAccounts, cashOnHand: Number(cashOnHand) || 0,
    goldGrams: Number(goldGrams) || 0, goldKarat: Number(goldKarat) || 24,
    silverGrams: Number(silverGrams) || 0, investmentsValue,
    receivables: Number(receivables) || 0, realEstateValue,
    rentalIncomeCash: Number(rentalIncomeCash) || 0,
  };
  const zakatLiabilities = { deductibleDebts: settings.includeDebts ? deductibleDebts : 0 };

  const result = useMemo(
    () => calculateZakat(zakatAssets, zakatLiabilities, { ...settings, hawlMet: derivedHawlMet }, prices),
    [zakatAssets, zakatLiabilities, settings, derivedHawlMet, prices]
  );

  // Actions
  const fetchLivePrices = async () => {
    setPricesLoading(true);
    try {
      const r = await fetch("/api/zakat/prices", { credentials: "include" });
      const data = await r.json();
      if (data.goldPricePerGram) setPrices(p => ({ ...p, goldPricePerGram: data.goldPricePerGram }));
      if (data.silverPricePerGram) setPrices(p => ({ ...p, silverPricePerGram: data.silverPricePerGram }));
      toast({ title: data.goldPricePerGram ? `Live prices loaded (${data.source})` : "Live prices unavailable — enter manually" });
    } catch { toast({ title: "Failed to fetch prices", variant: "destructive" }); }
    finally { setPricesLoading(false); }
  };

  const handleSaveSettings = async () => {
    try {
      await saveSettings.mutateAsync({
        ...settings,
        goldPricePerGram: String(prices.goldPricePerGram),
        silverPricePerGram: String(prices.silverPricePerGram),
        cashOnHand, goldGrams, goldKarat: parseInt(goldKarat),
        silverGrams, receivables, rentalIncomeCash,
        hawlDate, hawlDateType, hawlStartDate,
      });
      toast({ title: "Settings saved" });
    } catch { toast({ title: "Failed to save settings", variant: "destructive" }); }
  };

  const handleSaveHawl = async () => {
    await handleSaveSettings();
    toast({ title: "Hawl date saved ✓" });
  };

  const handleHawlChange = (key: string, val: string) => {
    if (key === "hawlDate")      setHawlDate(val);
    if (key === "hawlDateType")  setHawlDateType(val);
    if (key === "hawlStartDate") setHawlStartDate(val);
  };

  const handleToggleAccount = async (accountId: number, val: boolean) => {
    setAccountZakatable(prev => ({ ...prev, [accountId]: val }));
    await fetch(`/api/bank-accounts/${accountId}/zakat`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isZakatable: val }), credentials: "include",
    });
    qc.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
  };

  const handleInvestmentMethod = async (invId: number, method: string) => {
    setInvestmentZakatMethod(prev => ({ ...prev, [invId]: method }));
    await fetch(`/api/investments/${invId}/zakat`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zakatMethod: method }), credentials: "include",
    });
    qc.invalidateQueries({ queryKey: ["/api/investments"] });
  };

  const handleSaveSnapshot = async () => {
    try {
      await saveSnapshot.mutateAsync({
        nisabStandard: settings.nisabStandard,
        goldPricePerGram: String(prices.goldPricePerGram),
        silverPricePerGram: String(prices.silverPricePerGram),
        nisabValueUsd: String(result.nisabValueUsd),
        cashTotal: String(result.breakdown.cashTotal),
        goldValue: String(result.breakdown.goldValue),
        silverValue: String(result.breakdown.silverValue),
        investmentsTotal: String(result.breakdown.investmentsTotal),
        receivablesTotal: String(result.breakdown.receivablesTotal),
        realEstateValue: String(result.breakdown.realEstateValue),
        totalZakatableAssets: String(result.breakdown.totalZakatableAssets),
        deductibleDebts: String(result.breakdown.deductibleDebts),
        netZakatable: String(result.breakdown.netZakatable),
        nisabMet: result.nisabMet, hawlMet: derivedHawlMet,
        zakatDue: String(result.zakatDue),
        notes, snapshotDate: new Date().toISOString(),
      });
      toast({ title: "Snapshot saved ✓" });
    } catch { toast({ title: "Failed to save snapshot", variant: "destructive" }); }
  };

  // Hawl countdown days for badge tint
  const nextHawlDate = hawlDate || hawlStartDate ? getNextHawlDate(hawlDate, hawlDateType, hawlStartDate) : null;
  const hawlDaysLeft = nextHawlDate ? differenceInDays(nextHawlDate, new Date()) : null;

  return (
    <Layout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white" data-testid="text-page-title">
            {t("zakat.title")} <span className="text-gray-400 text-lg font-normal">حاسبة الزكاة</span>
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{t("zakat.subtitle")}</p>
        </div>
        <Button onClick={handleSaveSnapshot} disabled={saveSnapshot.isPending}
          className="gap-2 text-white" style={{ backgroundColor: MINT }} data-testid="button-save-snapshot">
          <Save className="w-4 h-4" /> {t("zakat.saveSnapshot")}
        </Button>
      </div>

      {/* Urgency banner */}
      {hawlDaysLeft !== null && hawlDaysLeft <= 30 && (
        <div className="mb-5 p-3.5 rounded-2xl border flex items-center gap-3"
          style={{
            borderColor: hawlDaysLeft <= 7 ? "#FCA5A5" : hawlDaysLeft <= 14 ? "#FED7AA" : "#FDE68A",
            backgroundColor: hawlDaysLeft <= 7 ? "#FEF2F2" : hawlDaysLeft <= 14 ? "#FFF7ED" : "#FFFBEB",
          }}>
          <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: hawlDaysLeft <= 7 ? DANGER : AMBER }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: hawlDaysLeft <= 7 ? DANGER : "#92400E" }}>
              {hawlDaysLeft === 0 ? t("zakat.dueToday") : t("zakat.dueInDays", { days: hawlDaysLeft })}
            </p>
            <p className="text-xs" style={{ color: hawlDaysLeft <= 7 ? "#DC2626" : "#B45309" }}>
              {hawlDaysLeft <= 7 ? t("zakat.distributionAdvice") : t("zakat.reviewAdvice")}
              {result.zakatDue > 0 && ` ${t("zakat.estimated")}: ${fmt(result.zakatDue)}`}
            </p>
          </div>
          <Button size="sm" className="ms-auto gap-1.5 rounded-xl text-xs shrink-0" onClick={handleSaveSnapshot}
            style={{ backgroundColor: hawlDaysLeft <= 7 ? DANGER : AMBER, color: "#fff" }}>
            <Target className="w-3.5 h-3.5" /> {t("zakat.finalize")} →
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="xl:col-span-2 space-y-6">

          {/* Settings & Prices */}
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardHeader className="cursor-pointer" onClick={() => setSettingsOpen(o => !o)}>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">{t("zakat.settingsPrices")}</CardTitle>
                {settingsOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </CardHeader>
            {settingsOpen && (
              <CardContent className="space-y-5 pt-0">
                {/* Nisab */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">{t("zakat.nisabStandard")}</label>
                  <div className="flex gap-2">
                    {(["gold", "silver"] as const).map(s => (
                      <Button key={s} variant={settings.nisabStandard === s ? "default" : "outline"} className="capitalize rounded-xl"
                        onClick={() => setSettings(p => ({ ...p, nisabStandard: s }))} data-testid={`button-nisab-${s}`}>
                        {s === "gold" ? `🥇 ${t("zakat.goldStandard")}` : `🥈 ${t("zakat.silverStandard")}`}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{t("zakat.nisabHelp")}</p>
                </div>

                {/* Real estate */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">{t("zakat.realEstateTreatment")}</label>
                  <Select value={settings.realEstateMode} onValueChange={v => setSettings(p => ({ ...p, realEstateMode: v as any }))}>
                    <SelectTrigger className="rounded-xl" data-testid="select-real-estate-mode"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exempt">{t("zakat.reExempt")}</SelectItem>
                      <SelectItem value="rental_income">{t("zakat.reRental")}</SelectItem>
                      <SelectItem value="trading">{t("zakat.reTrading")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium">{t("zakat.deductDebts")}</p>
                      <p className="text-xs text-gray-400">{t("zakat.shortTermDebts")}</p>
                    </div>
                    <Switch checked={settings.includeDebts}
                      onCheckedChange={v => setSettings(p => ({ ...p, includeDebts: v }))} data-testid="switch-include-debts" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800"
                    style={{ backgroundColor: derivedHawlMet ? "#F0FDF4" : "transparent", borderColor: derivedHawlMet ? "#BBF7D0" : undefined }}>
                    <div>
                      <p className="text-sm font-medium">{t("zakat.hawlStatus")}</p>
                      <p className="text-xs" style={{ color: derivedHawlMet ? "#059669" : "#94A3B8" }}>
                        {derivedHawlMet ? `✓ ${t("zakat.hawlConfirmed")}` : t("zakat.hawlPending")}
                      </p>
                    </div>
                    <Switch checked={settings.hawlMet}
                      onCheckedChange={v => setSettings(p => ({ ...p, hawlMet: v }))} data-testid="switch-hawl-met" />
                  </div>
                </div>

                {/* Metal prices */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("zakat.metalPrices")}</label>
                    <Button variant="outline" size="sm" onClick={fetchLivePrices} disabled={pricesLoading}
                      className="rounded-xl gap-1.5 text-xs h-7" data-testid="button-fetch-prices">
                      <RefreshCw className={`w-3 h-3 ${pricesLoading ? "animate-spin" : ""}`} /> {t("common.fetchLive")}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">{t("zakat.goldPrice")}</label>
                      <Input type="number" min="0" step="0.01" value={prices.goldPricePerGram}
                        onChange={e => setPrices(p => ({ ...p, goldPricePerGram: Number(e.target.value) }))} data-testid="input-gold-price" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">{t("zakat.silverPrice")}</label>
                      <Input type="number" min="0" step="0.001" value={prices.silverPricePerGram}
                        onChange={e => setPrices(p => ({ ...p, silverPricePerGram: Number(e.target.value) }))} data-testid="input-silver-price" />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveSettings} disabled={saveSettings.isPending} variant="outline" className="w-full rounded-xl" data-testid="button-save-settings">
                  <Save className="w-4 h-4 me-2" /> {t("common.saveSettings")}
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Hawl Setup Card */}
          <HawlSetupCard
            hawlDate={hawlDate} hawlDateType={hawlDateType} hawlStartDate={hawlStartDate}
            onChange={handleHawlChange} onSave={handleSaveHawl} saving={saveSettings.isPending}
          />

          {/* Cash & Bank Accounts */}
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardHeader><CardTitle>💵 {t("zakat.cashBankAccounts")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(bankAccounts as any[]).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="font-medium text-sm">{a.bankName} — {a.accountType}</p>
                    <p className="text-xs text-gray-400">{t("common.balance")}: {fmt(toUsd(a.balance, a.exchangeRateToUsd))}</p>
                  </div>
                  <Switch checked={accountZakatable[a.id] !== false}
                    onCheckedChange={v => handleToggleAccount(a.id, v)} data-testid={`switch-account-${a.id}`} />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium mb-1 block">{t("zakat.cashOnHand")}</label>
                <Input type="number" min="0" step="1" value={cashOnHand}
                  onChange={e => setCashOnHand(e.target.value)} data-testid="input-cash-on-hand" placeholder="0" />
              </div>
            </CardContent>
          </Card>

          {/* Gold & Silver */}
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardHeader><CardTitle>🥇 {t("zakat.goldSilver")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("zakat.goldGrams")}</label>
                  <Input type="number" min="0" step="0.1" value={goldGrams} onChange={e => setGoldGrams(e.target.value)} data-testid="input-gold-grams" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t("zakat.goldKarat")}</label>
                  <Select value={goldKarat} onValueChange={setGoldKarat}>
                    <SelectTrigger data-testid="select-gold-karat"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[24, 22, 21, 18, 14, 10, 9].map(k => (
                        <SelectItem key={k} value={String(k)}>{k}k ({((k / 24) * 100).toFixed(1)}%)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {Number(goldGrams) > 0 && (
                <p className="text-xs text-gray-400">
                  {t("zakat.pureGold")}: {(Number(goldGrams) * (Number(goldKarat) / 24)).toFixed(3)}g → {fmt(Number(goldGrams) * (Number(goldKarat) / 24) * prices.goldPricePerGram)}
                </p>
              )}
              <div>
                <label className="text-sm font-medium mb-1 block">{t("zakat.silverGrams")}</label>
                <Input type="number" min="0" step="0.1" value={silverGrams} onChange={e => setSilverGrams(e.target.value)} data-testid="input-silver-grams" placeholder="0" />
              </div>
            </CardContent>
          </Card>

          {/* Investments */}
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardHeader><CardTitle>📈 {t("nav.investments")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-xs text-blue-700 dark:text-blue-300">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{t("zakat.investmentAdvice")}</span>
              </div>
              {(investments as any[]).filter((i: any) => i.status === "active").map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{inv.name}</p>
                    <p className="text-xs text-gray-400">{inv.type} — {fmt(toUsd(inv.currentValue, inv.exchangeRateToUsd))}</p>
                  </div>
                  <Select value={investmentZakatMethod[inv.id] || "market_value"} onValueChange={v => handleInvestmentMethod(inv.id, v)}>
                    <SelectTrigger className="w-40 text-xs" data-testid={`select-inv-method-${inv.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market_value">{t("zakat.marketValue")}</SelectItem>
                      <SelectItem value="exempt">{t("zakat.reExempt")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {(investments as any[]).filter((i: any) => i.status === "active").length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">{t("zakat.noActiveInvestments")}</p>
              )}
            </CardContent>
          </Card>

          {/* Business Receivables */}
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardHeader><CardTitle>📋 {t("zakat.businessReceivables")}</CardTitle></CardHeader>
            <CardContent>
              <label className="text-sm font-medium mb-1 block">{t("zakat.receivablesHelp")}</label>
              <Input type="number" min="0" step="1" value={receivables} onChange={e => setReceivables(e.target.value)} data-testid="input-receivables" placeholder="0" />
              <p className="text-xs text-gray-400 mt-1">{t("zakat.receivablesAdvice")}</p>
            </CardContent>
          </Card>

          {/* Real Estate (conditional) */}
          {settings.realEstateMode !== "exempt" && (
            <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
              <CardHeader><CardTitle>🏠 {t("zakat.realEstate")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {settings.realEstateMode === "rental_income" && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t("zakat.rentalIncomeCash")}</label>
                    <Input type="number" min="0" step="1" value={rentalIncomeCash} onChange={e => setRentalIncomeCash(e.target.value)} data-testid="input-rental-income" placeholder="0" />
                    <p className="text-xs text-gray-400 mt-1">{t("zakat.rentalAdvice")}</p>
                  </div>
                )}
                {settings.realEstateMode === "trading" && (
                  <div>
                    <p className="text-sm text-gray-400 mb-3">{t("zakat.resaleProperties")}:</p>
                    {realEstateAssets.map((a: any) => (
                      <div key={a.id} className="flex justify-between items-center p-2 rounded-lg border border-gray-100 dark:border-gray-800 mb-2">
                        <span className="text-sm font-medium">{a.name}</span>
                        <span className="text-sm">{fmt(toUsd(a.currentValue, a.exchangeRateToUsd))}</span>
                      </div>
                    ))}
                    {realEstateAssets.length === 0 && <p className="text-sm text-gray-400">{t("zakat.noRealEstate")}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Deductible Debts */}
          {settings.includeDebts && (
            <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
              <CardHeader><CardTitle>💳 {t("zakat.deductibleLiabilities")}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400 mb-3">{t("zakat.shortTermDebtsHelp")}</p>
                {(debts as any[]).filter((d: any) => d.status === "active").map((d: any) => (
                  <div key={d.id} className="flex justify-between items-center py-2 border-b last:border-0 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium">{d.creditorName}</p>
                      <p className="text-xs text-gray-400">{d.reason}</p>
                    </div>
                    <span className="text-sm font-mono text-red-500">−{fmt(toUsd(d.remainingAmount, d.exchangeRateToUsd))}</span>
                  </div>
                ))}
                {(debts as any[]).filter((d: any) => d.status === "active").length === 0 && (
                  <p className="text-sm text-gray-400">{t("zakat.noActiveDebts")}</p>
                )}
                <div className="flex justify-between items-center pt-2 font-semibold">
                  <span className="text-sm">{t("zakat.totalDeductible")}</span>
                  <span className="text-sm font-mono text-red-500">−{fmt(deductibleDebts)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">

          {/* Hawl Countdown */}
          <HawlCountdownCard
            hawlDate={hawlDate} hawlDateType={hawlDateType}
            hawlStartDate={hawlStartDate} zakatDue={result.zakatDue}
          />

          {/* Results Card */}
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">{t("zakat.results")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {result.nisabMet ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                  <span className="text-sm font-medium">{t("zakat.nisabStatus")} {result.nisabMet ? `${t("common.met")} ✓` : t("common.notMet")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {derivedHawlMet ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                  <span className="text-sm font-medium">{t("zakat.hawlStatus")} {derivedHawlMet ? `${t("common.met")} ✓` : t("common.notMet")}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-400">{t("zakat.nisabThreshold")} ({settings.nisabStandard})</p>
                <p className="text-lg font-bold">{fmt(result.nisabValueUsd)}</p>
              </div>

              <Separator />

              <div className="space-y-0.5">
                <InfoRow label={t("zakat.cashTotal")} value={fmt(result.breakdown.cashTotal)} />
                {result.breakdown.goldValue > 0 && <InfoRow label={t("zakat.goldValue")} value={fmt(result.breakdown.goldValue)} />}
                {result.breakdown.silverValue > 0 && <InfoRow label={t("zakat.silverValue")} value={fmt(result.breakdown.silverValue)} />}
                {result.breakdown.investmentsTotal > 0 && <InfoRow label={t("nav.investments")} value={fmt(result.breakdown.investmentsTotal)} />}
                {result.breakdown.receivablesTotal > 0 && <InfoRow label={t("zakat.receivables")} value={fmt(result.breakdown.receivablesTotal)} />}
                {result.breakdown.realEstateValue > 0 && <InfoRow label={t("zakat.realEstate")} value={fmt(result.breakdown.realEstateValue)} />}
                <InfoRow label={t("zakat.totalAssets")} value={fmt(result.breakdown.totalZakatableAssets)} strong />
                {result.breakdown.deductibleDebts > 0 && <InfoRow label={t("zakat.deductibleLiabilities")} value={`−${fmt(result.breakdown.deductibleDebts)}`} />}
                <InfoRow label={t("zakat.netZakatable")} value={fmt(result.breakdown.netZakatable)} strong />
              </div>

              <Separator />

              <div className={`p-4 rounded-xl text-center ${result.zakatDue > 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-gray-50 dark:bg-gray-800"}`}>
                <p className="text-xs text-gray-400 mb-1">{t("zakat.dueAmount")} (2.5%)</p>
                <p className={`text-3xl font-bold ${result.zakatDue > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-gray-400"}`} data-testid="text-zakat-due">
                  {result.zakatDue > 0 ? fmt(result.zakatDue) : t("zakat.notDue")}
                </p>
                {result.zakatDue > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    ≈ {fmt(result.zakatDue / 12)}/{t("common.month")} {t("zakat.ifSavedMonthly")}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t("zakat.notesPlaceholder")} ({t("common.optional")})</label>
                <Input placeholder={t("zakat.notesPlaceholder")} value={notes} onChange={e => setNotes(e.target.value)} data-testid="input-notes" />
              </div>

              <Button onClick={handleSaveSnapshot} className="w-full rounded-xl gap-2 text-white"
                style={{ backgroundColor: MINT }} disabled={saveSnapshot.isPending} data-testid="button-save-snapshot-result">
                <Save className="w-4 h-4" /> {t("zakat.saveSnapshot")}
              </Button>

              <details className="text-xs">
                <summary className="cursor-pointer text-gray-400 hover:text-gray-600">{t("zakat.showDetails")}</summary>
                <div className="mt-2 space-y-1 text-gray-400">
                  {result.explanations.map((e, i) => <p key={i}>• {e}</p>)}
                </div>
              </details>
            </CardContent>
          </Card>

          {/* Assumptions */}
          <Card className="border border-gray-100 dark:border-gray-800 rounded-2xl">
            <CardHeader><CardTitle className="text-sm">{t("zakat.disclaimerTitle")}</CardTitle></CardHeader>
            <CardContent className="text-xs text-gray-400 space-y-1">
              <p>• <strong className="text-gray-600 dark:text-gray-300">{t("zakat.nisabStatus")}:</strong> {settings.nisabStandard === "gold" ? "85g gold (AAOIFI contemporary)" : "595g silver (classical)"}</p>
              <p>• <strong className="text-gray-600 dark:text-gray-300">{t("zakat.deductDebts")}:</strong> {settings.includeDebts ? "Short-term debts deducted" : "Debts not deducted"}</p>
              <p>• <strong className="text-gray-600 dark:text-gray-300">{t("zakat.realEstate")}:</strong> {settings.realEstateMode === "exempt" ? "Exempt" : settings.realEstateMode === "rental_income" ? "Rental income only" : "Trading inventory (full market value)"}</p>
              <p>• <strong className="text-gray-600 dark:text-gray-300">{t("zakat.goldStandard")}:</strong> ${prices.goldPricePerGram}/g · <strong className="text-gray-600 dark:text-gray-300">{t("zakat.silverStandard")}:</strong> ${prices.silverPricePerGram}/g</p>
              <p className="pt-1 italic">{t("zakat.disclaimerAdvice")}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Zakat Journey (multi-year history) */}
      <ZakatJourney snapshots={snapshots as any[] || []} />
    </Layout>
  );
}
