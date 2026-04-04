import { useGameStore } from "@/features/mountain-race/store";

export function EventAlert() {
  const activeGlobalEvent = useGameStore((state) => state.activeGlobalEvent);
  const activeBubble = useGameStore((state) => state.activeBubble);

  if (!activeGlobalEvent && !activeBubble) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-900 shadow-md">
      {activeGlobalEvent ? (
        <p>
          전역 이벤트: <strong>{activeGlobalEvent}</strong>
        </p>
      ) : null}
      {activeBubble ? (
        <p className={activeGlobalEvent ? "mt-1" : ""}>
          반응 대사: <strong>{activeBubble.text}</strong>
        </p>
      ) : null}
    </section>
  );
}
