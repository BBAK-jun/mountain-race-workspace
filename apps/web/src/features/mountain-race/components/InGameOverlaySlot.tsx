import { Link } from "@tanstack/react-router";
import { markResultReady } from "@/features/mountain-race/app";

export function InGameOverlaySlot() {
  return (
    <aside className="route-view" aria-label="In-game overlay slot">
      <h2>In-Game Overlay</h2>
      <p>HUD, event alert, and race log UI from gameplay owner will be mounted here.</p>
      <p>
        When race finishes, move to{" "}
        <Link
          to="/result"
          onClick={() => {
            markResultReady();
          }}
        >
          /result
        </Link>
        .
      </p>
    </aside>
  );
}
