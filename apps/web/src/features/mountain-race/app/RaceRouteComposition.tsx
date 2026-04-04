import { InGameOverlaySlot, RaceSceneSlot } from "@/features/mountain-race/components";

export function RaceRouteComposition() {
  return (
    <main className="route-shell">
      <RaceSceneSlot />
      <InGameOverlaySlot />
    </main>
  );
}
