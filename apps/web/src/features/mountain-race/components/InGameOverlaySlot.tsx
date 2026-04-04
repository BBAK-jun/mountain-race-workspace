import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { markResultReady } from "@/features/mountain-race/app";
import { useGameStore } from "@/features/mountain-race/store";
import { CameraControls } from "./CameraControls";
import { HUD } from "./HUD";
import { EventAlert } from "./EventAlert";
import { EventLog } from "./EventLog";

export function InGameOverlaySlot() {
  const hasResult = useGameStore((s) => s.hasResult);
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasResult) return;
    markResultReady();
    void navigate({ to: "/result" });
  }, [hasResult, navigate]);

  return (
    <aside className="pointer-events-none fixed inset-0 z-10" aria-label="In-game overlay">
      <HUD />
      <EventAlert />
      <EventLog />
      <CameraControls />
    </aside>
  );
}
