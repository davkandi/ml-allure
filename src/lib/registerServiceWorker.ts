/**
 * Service Worker Registration
 * Registers the PWA service worker for offline functionality
 */

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.log("Service Worker not supported");
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("Service Worker registered successfully:", registration.scope);

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

      // Handle updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("New service worker available");
              // Optionally show update notification to user
              if (
                confirm(
                  "Une nouvelle version de ML Allure est disponible. Actualiser maintenant?"
                )
              ) {
                window.location.reload();
              }
            }
          });
        }
      });
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  });

  // Handle service worker messages
  navigator.serviceWorker.addEventListener("message", (event) => {
    console.log("Message from service worker:", event.data);
  });

  // Handle controller change (new service worker activated)
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    console.log("Service worker controller changed");
  });
}
