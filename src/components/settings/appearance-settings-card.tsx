"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sunset, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

type Theme = "light" | "dark" | "night";
const THEME_KEY = "year-mission-theme";
const THEME_EVENT = "year-mission-theme-change";

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "night" ? theme : "dark";
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(THEME_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function applyTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
  const themeColor = theme === "light" ? "#fafafa" : theme === "night" ? "#120f0d" : "#09090b";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function AppearanceSettingsCard() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark" as Theme);

  return (
    <div className="px-4 pb-4">
      <Card>
        <CardHeader title="Appearance" subtitle="Night Shift uses a warmer, lower-glare palette for evening use. Your choice stays on this device." />
        <div className="grid grid-cols-3 gap-2">
          <Button type="button" variant={theme === "light" ? "secondary" : "ghost"} onClick={() => applyTheme("light")} aria-pressed={theme === "light"}>
            <Sun className="h-4 w-4" />
            Light
          </Button>
          <Button type="button" variant={theme === "dark" ? "secondary" : "ghost"} onClick={() => applyTheme("dark")} aria-pressed={theme === "dark"}>
            <Moon className="h-4 w-4" />
            Dark
          </Button>
          <Button type="button" variant={theme === "night" ? "secondary" : "ghost"} onClick={() => applyTheme("night")} aria-pressed={theme === "night"}>
            <Sunset className="h-4 w-4" />
            Night
          </Button>
        </div>
      </Card>
    </div>
  );
}
