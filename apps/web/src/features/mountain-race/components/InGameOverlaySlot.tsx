import { HUD } from "./HUD";
import { EventAlert } from "./EventAlert";
import { EventLog } from "./EventLog";

export function InGameOverlaySlot() {
  return (
    <aside className="pointer-events-none fixed inset-0 z-10" aria-label="In-game overlay">
      <HUD />
      <EventAlert />
      <EventLog />
    </aside>
  );
}
