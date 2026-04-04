import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/useGameStore";
import {
  formatMessage,
  GLOBAL_EVENT_MESSAGES,
  ULTIMATE_ANNOUNCE_MESSAGE,
  ULTIMATE_MESSAGES,
} from "../data/eventMessages";
import type { GameEvent, GlobalEventType, UltimateType } from "../types";

const ALERT_DISPLAY_MS = 2000;

interface AlertInfo {
  text: string;
  eventId: string;
}

function buildAlertText(event: GameEvent, getName: (id: string) => string): string | null {
  if (event.category === "ultimate" && event.type in ULTIMATE_MESSAGES) {
    const casterName = event.casterId ? getName(event.casterId) : "???";
    const announce = formatMessage(ULTIMATE_ANNOUNCE_MESSAGE, casterName);
    const detail = ULTIMATE_MESSAGES[event.type as UltimateType];
    return `${announce}\n${formatMessage(detail, casterName)}`;
  }

  if (event.category === "global" && event.type in GLOBAL_EVENT_MESSAGES) {
    const messages = GLOBAL_EVENT_MESSAGES[event.type as GlobalEventType];
    if (messages[0]) {
      const targetName = event.targetIds[0] ? getName(event.targetIds[0]) : "";
      return formatMessage(messages[0], targetName);
    }
  }

  return null;
}

export function EventAlert() {
  const events = useGameStore((s) => s.events);
  const [alert, setAlert] = useState<AlertInfo | null>(null);
  const prevCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (events.length <= prevCountRef.current) {
      prevCountRef.current = events.length;
      return;
    }

    const newEvents = events.slice(prevCountRef.current);
    prevCountRef.current = events.length;

    const alertEvent = newEvents.find((e) => e.category === "ultimate" || e.category === "global");
    if (!alertEvent) return;

    const { characters } = useGameStore.getState();
    const getName = (id: string): string => characters.find((c) => c.id === id)?.name ?? "???";

    const text = buildAlertText(alertEvent, getName);
    if (!text) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setAlert({ text, eventId: alertEvent.id });
    timerRef.current = setTimeout(() => setAlert(null), ALERT_DISPLAY_MS);
  }, [events]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!alert) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        key={alert.eventId}
        className="animate-in fade-in-0 zoom-in-75 rounded-2xl bg-black/60 px-8 py-5 text-center backdrop-blur-md duration-300"
      >
        {alert.text.split("\n").map((line, i) => (
          <p
            key={`${alert.eventId}-${String(i)}`}
            className={
              i === 0
                ? "text-2xl font-bold text-white md:text-3xl"
                : "mt-2 text-lg font-bold text-white/90 md:text-xl"
            }
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
