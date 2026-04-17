import { useState, useEffect } from "react";

export type PointsResetCycle = "monthly" | "3months" | "6months" | "12months";

export interface AppSettings {
  enableStreaks: boolean;
  pointsResetCycle: PointsResetCycle;
  notifyTaskComplete: boolean;
  notifyLeaderboard: boolean;
  notifyReminders: boolean;
  darkMode: boolean;
}

const DEFAULTS: AppSettings = {
  enableStreaks: true,
  pointsResetCycle: "monthly",
  notifyTaskComplete: true,
  notifyLeaderboard: false,
  notifyReminders: true,
  darkMode: false,
};

const STORAGE_KEY = "chorely-settings";

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function applyDarkMode(enabled: boolean) {
  if (enabled) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    applyDarkMode(settings.darkMode);
  }, []);

  function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    const next = { ...settings, [key]: value };
    setSettingsState(next);
    saveSettings(next);
    if (key === "darkMode") applyDarkMode(value as boolean);
  }

  function resetAllSettings() {
    localStorage.removeItem(STORAGE_KEY);
    setSettingsState(DEFAULTS);
    applyDarkMode(DEFAULTS.darkMode);
  }

  return { settings, updateSetting, resetAllSettings };
}
