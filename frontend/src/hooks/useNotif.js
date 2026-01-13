// src/hooks/useNotif.js

import { useEffect, useRef } from "react";
import keycloak from "../services/keycloak";

// Global scope to persist across React StrictMode remounts
let globalLastAlert = { text: "", time: 0 };

export default function useNotifications() {
  const isConnected = useRef(false);
  const bufferRef = useRef([]); 
  const timeoutRef = useRef(null); 

  useEffect(() => {
    if (!keycloak.authenticated || !keycloak.tokenParsed || isConnected.current) return;

    const userId = keycloak.tokenParsed.sub;
    const wsUrl = `${import.meta.env.VITE_NOTIF_WS_URL}?userId=${userId}`;

    console.log("[notif] Connecting WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);
    isConnected.current = true;

    // --- PROCESS BATCHED MESSAGES ---
    const flushBuffer = () => {
      const messages = bufferRef.current;
      if (messages.length === 0) return;

      const uniqueMessages = [...new Set(messages.map(msg => {
        try {
          return JSON.parse(msg).data?.message || "Update received";
        } catch {
          return "Update received";
        }
      }))];

      const alertText = uniqueMessages.length === 1 
        ? `🔔 Notification: ${uniqueMessages[0]}`
        : `🔔 Updates: ${uniqueMessages.join(", ")}`;

      bufferRef.current = [];

      // Filter identical messages arriving rapidly
      const now = Date.now();
      if (alertText === globalLastAlert.text && (now - globalLastAlert.time < 2000)) {
        return; 
      }
      globalLastAlert = { text: alertText, time: now };

      setTimeout(() => {
         // Suppress popups for actions that already show a UI banner
         const lower = alertText.toLowerCase();
         if (!lower.includes("edited") && !lower.includes("deleted")) {
            alert(alertText);
         }
         
         window.dispatchEvent(new Event("mintify:data-updated"));
      }, 50);
    };

    // --- LISTENER ---
    ws.onmessage = (event) => {
      bufferRef.current.push(event.data);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(flushBuffer, 300); 
    };

    ws.onerror = (err) => console.error("[notif] WebSocket error", err);

    return () => {
      console.log("[notif] WebSocket closing");
      ws.close();
      isConnected.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [keycloak.authenticated]);
}