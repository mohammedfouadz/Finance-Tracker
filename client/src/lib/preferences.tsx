import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface Preferences {
  accentColor: string;
  density: "compact" | "comfortable" | "spacious";
  reduceMotion: boolean;
  highContrast: boolean;
  landingPage: string;
  dateFormat: string;
  numberFormat: string;
  chartType: string;
  autoCategory: boolean;
  confirmDelete: boolean;
  shortcuts: boolean;
  tooltips: boolean;
}

export const DEFAULT_PREFS: Preferences = {
  accentColor: "#1B4FE4",
  density: "comfortable",
  reduceMotion: false,
  highContrast: false,
  landingPage: "dashboard",
  dateFormat: "MM/DD/YYYY",
  numberFormat: "en",
  chartType: "bar",
  autoCategory: true,
  confirmDelete: true,
  shortcuts: true,
  tooltips: true,
};

const STORAGE_KEY = "wealthly-prefs";

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyAccentColor(hex: string) {
  const hsl = hexToHsl(hex);
  const root = document.documentElement;
  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--ring", hsl);
  root.style.setProperty("--sidebar-primary", hsl);
  root.style.setProperty("--sidebar-ring", hsl);
}

function applyDensity(density: string) {
  document.documentElement.classList.remove("density-compact", "density-comfortable", "density-spacious");
  if (density !== "comfortable") {
    document.documentElement.classList.add(`density-${density}`);
  }
}

function applyReduceMotion(on: boolean) {
  if (on) document.documentElement.classList.add("reduce-motion");
  else document.documentElement.classList.remove("reduce-motion");
}

function applyHighContrast(on: boolean) {
  if (on) document.documentElement.classList.add("high-contrast");
  else document.documentElement.classList.remove("high-contrast");
}

function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_PREFS };
}

function savePrefs(prefs: Preferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

interface PreferencesContextType {
  prefs: Preferences;
  setPrefs: (patch: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextType>({
  prefs: DEFAULT_PREFS,
  setPrefs: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Preferences>(loadPrefs);

  useEffect(() => {
    applyAccentColor(prefs.accentColor);
    applyDensity(prefs.density);
    applyReduceMotion(prefs.reduceMotion);
    applyHighContrast(prefs.highContrast);
  }, []);

  const setPrefs = (patch: Partial<Preferences>) => {
    setPrefsState(prev => {
      const next = { ...prev, ...patch };
      savePrefs(next);
      if (patch.accentColor !== undefined) applyAccentColor(next.accentColor);
      if (patch.density !== undefined) applyDensity(next.density);
      if (patch.reduceMotion !== undefined) applyReduceMotion(next.reduceMotion);
      if (patch.highContrast !== undefined) applyHighContrast(next.highContrast);
      return next;
    });
  };

  return (
    <PreferencesContext.Provider value={{ prefs, setPrefs }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}

export function formatDate(date: Date | string, format: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  if (format === "DD/MM/YYYY") return `${dd}/${mm}/${yyyy}`;
  if (format === "YYYY-MM-DD") return `${yyyy}-${mm}-${dd}`;
  return `${mm}/${dd}/${yyyy}`;
}

export function formatNumber(value: number, format: string): string {
  if (format === "eu") return value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (format === "fr") return value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
