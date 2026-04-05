import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { markResultReady } from "@/features/mountain-race/app";
import { useConnectionStore, useGameStore } from "@/features/mountain-race/store";
import { CameraControls } from "./CameraControls";
import { EffectRevealOverlay } from "./EffectRevealOverlay";
import { HUD } from "./HUD";
import { EventAlert } from "./EventAlert";
import { EventLog } from "./EventLog";
import { HiddenEffectButton } from "./HiddenEffectButton";

export function InGameOverlaySlot() {
  const localHasResult = useGameStore((s) => s.hasResult);
  const isMultiplayer = useConnectionStore((s) => s.status === "connected");
  const mpPhase = useConnectionStore((s) => s.phase);
  const hasResult = isMultiplayer ? mpPhase === "result" || localHasResult : localHasResult;
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
      {isMultiplayer && <HiddenEffectButton />}
      {isMultiplayer && <EffectRevealOverlay />}
    </aside>
  );
}
