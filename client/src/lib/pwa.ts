/**
 * Registers the service worker so the app can be installed on phones and
 * desktops ("Add to Home Screen" / "Install app"). Skipped in development so
 * Vite's hot reload is never served stale files.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service worker registration failed", err);
    });
  });
}
