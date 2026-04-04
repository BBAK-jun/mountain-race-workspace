import { useMemo } from "react";
import { useGameStore } from "@/features/mountain-race/store";

const MAX_VISIBLE_LOGS = 6;

export function EventLog() {
  const logs = useGameStore((state) => state.eventLogs);

  const visibleLogs = useMemo(
    () => logs.slice(Math.max(logs.length - MAX_VISIBLE_LOGS, 0)),
    [logs],
  );

  return (
    <section className="rounded-2xl border border-white/60 bg-white/85 p-3 shadow-md backdrop-blur">
      <h2 className="text-xs font-semibold tracking-widest text-zinc-700 uppercase">Event Log</h2>
      {visibleLogs.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">아직 기록된 이벤트가 없습니다.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm text-zinc-700">
          {visibleLogs.map((log) => (
            <li key={log.id} className="rounded-lg border border-zinc-200/80 bg-white/90 px-2 py-1">
              {log.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
