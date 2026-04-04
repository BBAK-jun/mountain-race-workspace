import { useEffect, useRef } from "react";
import { useGameStore } from "../store/useGameStore";

const MAX_VISIBLE_LOGS = 8;

export function EventLog() {
  const eventLogs = useGameStore((s) => s.eventLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleLogs = eventLogs.slice(-MAX_VISIBLE_LOGS);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && eventLogs.length > 0) {
      el.scrollTop = el.scrollHeight;
    }
  }, [eventLogs]);

  if (visibleLogs.length === 0) return null;

  return (
    <div className="absolute bottom-16 left-3 z-30 w-72 max-w-[45vw] md:bottom-14">
      <div
        ref={scrollRef}
        className="flex max-h-[35vh] flex-col gap-1 overflow-y-auto rounded-lg bg-black/40 p-2 backdrop-blur-sm"
      >
        {visibleLogs.map((log) => (
          <p key={log.id} className="text-xs leading-relaxed text-white/90">
            {log.text}
          </p>
        ))}
      </div>
    </div>
  );
}
