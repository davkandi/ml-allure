"use client";

import { useEffect } from "react";
import { InstallPrompt } from "./InstallPrompt";
import { registerServiceWorker } from "@/lib/registerServiceWorker";

/**
 * PWA Handler Component
 * Handles service worker registration and install prompts
 */
export const PWAHandler = () => {
  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker();

    // Log PWA status
    const isPWA = window.matchMedia("(display-mode: standalone)").matches;
    console.log("Running as PWA:", isPWA);
  }, []);

  return <InstallPrompt />;
};
