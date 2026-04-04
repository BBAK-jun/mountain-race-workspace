import { Link } from "@tanstack/react-router";
import { markSetupComplete } from "@/features/mountain-race/app";

export function SetupScreen() {
  return (
    <main className="route-shell route-view">
      <h1>Setup</h1>
      <p>Configure player info and race params.</p>
      <p>
        Proceed to{" "}
        <Link
          to="/race"
          onClick={() => {
            markSetupComplete();
          }}
        >
          /race
        </Link>{" "}
        when setup is ready.
      </p>
    </main>
  );
}
