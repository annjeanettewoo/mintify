// src/hooks/useNotif.js
import { useEffect, useRef } from "react";
import keycloak from "../services/keycloak";

// Global scope to persist across React StrictMode remounts
let globalLastAlert = { text: "", time: 0 };

export default function useNotifications() {
  const wsRef = useRef(null); // Store the WebSocket instance
  const isConnected = useRef(false);
  const bufferRef = useRef([]); 
  const timeoutRef = useRef(null); 

  useEffect(() => {
    // 1. Safety Checks
    if (!keycloak.authenticated || !keycloak.tokenParsed) return;
    if (isConnected.current) return; // Prevent double-connect

    const userId = keycloak.tokenParsed.sub;
    const wsUrl = `${import.meta.env.VITE_NOTIF_WS_URL}?userId=${userId}`;

    console.log("[notif] Initializing connection to:", wsUrl);
    
    // 2. Open Connection
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws; // Track instance
    isConnected.current = true;

    // --- HELPER: Process Messages ---
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

      // Spam Filter: Ignore identical messages within 2 seconds
      const now = Date.now();
      if (alertText === globalLastAlert.text && (now - globalLastAlert.time < 2000)) {
        console.log("[notif] Duplicate suppressed:", alertText);
        return; 
      }
      globalLastAlert = { text: alertText, time: now };

      // Trigger UI updates
      setTimeout(() => {
         alert(alertText); // Show popup
         window.dispatchEvent(new Event("mintify:data-updated")); // Refresh data
      }, 50);
    };

    // --- LISTENERS ---
    ws.onopen = () => console.log("[notif] WS Connected");
    
    ws.onmessage = (event) => {
      console.log("[notif] Message received:", event.data);
      bufferRef.current.push(event.data);
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(flushBuffer, 300); 
    };

    ws.onerror = (err) => console.error("[notif] WebSocket error", err);
    
    ws.onclose = () => {
      console.log("[notif] WS Closed");
      isConnected.current = false;
    };

    // 3. Cleanup Function (Crucial for preventing duplicates)
    return () => {
      console.log("[notif] Cleaning up WebSocket...");
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      isConnected.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [keycloak.authenticated]);
}
