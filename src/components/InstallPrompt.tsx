"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed (standalone mode)
    const isInStandaloneMode = () => {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://")
      );
    };

    setIsStandalone(isInStandaloneMode());

    // Check if user has dismissed the prompt before
    const hasUserDismissed = localStorage.getItem("ml-allure-install-dismissed");
    const dismissedDate = hasUserDismissed
      ? new Date(hasUserDismissed)
      : null;

    // Show prompt again after 7 days
    const shouldShowPrompt =
      !dismissedDate ||
      Date.now() - dismissedDate.getTime() > 7 * 24 * 60 * 60 * 1000;

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Show install prompt after a delay (better UX)
      if (shouldShowPrompt && !isInStandaloneMode()) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000); // Show after 3 seconds
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Detect when app is installed
    window.addEventListener("appinstalled", () => {
      console.log("ML Allure PWA was installed");
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem("ml-allure-install-dismissed");
    });

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    // Remember user dismissed the prompt
    localStorage.setItem("ml-allure-install-dismissed", new Date().toISOString());
    setShowInstallPrompt(false);
  };

  // Don't show if app is already installed or no install prompt available
  if (isStandalone || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-slideInUp">
      <Card className="border-primary/20 bg-gradient-to-br from-white to-primary/5 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">ML Allure App</CardTitle>
                <CardDescription className="text-sm">
                  Installer l'application
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Installez ML Allure sur votre appareil pour une expérience rapide et
            un accès hors ligne.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Download className="h-4 w-4" />
              Installer l'application
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="border-primary/20"
            >
              Plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper keyframes for animation (add to globals.css if needed)
const styles = `
  @keyframes slideInUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-slideInUp {
    animation: slideInUp 0.4s ease-out;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
