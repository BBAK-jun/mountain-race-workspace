import { useEffect } from "react";
import { markResultReady } from "@/features/mountain-race/app";
import { useGameStore } from "../store/useGameStore";
import { HUD } from "./HUD";
import { EventAlert } from "./EventAlert";
import { EventLog } from "./EventLog";

export function InGameOverlaySlot() {
  const hasResult = useGameStore((s) => s.hasResult);

  useEffect(() => {
    if (hasResult) {
      markResultReady();
    }
  }, [hasResult]);

  return (
    <aside className="pointer-events-none fixed inset-0 z-10" aria-label="In-game overlay">
      <HUD />
      <EventAlert />
      <EventLog />
    </aside>
  );
}
