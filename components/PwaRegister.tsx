"use client";

import { useEffect } from "react";

/** Registers the service worker (public/sw.js) once the page is interactive. Renders nothing. */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is a progressive enhancement — failing silently
        // (e.g. unsupported browser, blocked by a privacy setting) is fine.
      });
    }
  }, []);

  return null;
}
