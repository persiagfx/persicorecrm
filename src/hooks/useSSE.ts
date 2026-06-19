"use client";

import { useEffect, useRef, useCallback } from "react";

type SSEEvent = { type: string; data: unknown };
type SSEHandler = (event: SSEEvent) => void;

/**
 * هوک برای اتصال به Server-Sent Events
 * استفاده: const { connected } = useSSE((e) => { if (e.type === "notification") ... })
 */
export function useSSE(onEvent: SSEHandler, enabled = true) {
  const esRef = useRef<EventSource | null>(null);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    const token = localStorage.getItem("crm-token");
    if (!token) return;

    const url = `/api/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const parsed: SSEEvent = JSON.parse(e.data);
        handlerRef.current(parsed);
      } catch { /* JSON parse fail — ignore */ }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // retry after 5s
      setTimeout(connect, 5000);
    };
  }, [enabled]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);

  return { connected: esRef.current?.readyState === EventSource.OPEN };
}
