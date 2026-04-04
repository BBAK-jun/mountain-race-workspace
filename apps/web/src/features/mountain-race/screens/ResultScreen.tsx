import { Link } from "@tanstack/react-router";
import { resetRouteGuardSnapshot } from "@/features/mountain-race/app";

export function ResultScreen() {
  return (
    <main className="route-shell route-view">
      <h1>Result</h1>
      <p>Final board and replay actions will be shown here.</p>
      <p>
        Return to{" "}
        <Link
          to="/"
          onClick={() => {
            resetRouteGuardSnapshot();
          }}
        >
          landing
        </Link>
        .
      </p>
    </main>
  );
}
