import { Link } from "@tanstack/react-router";
import { useGameStore } from "@/features/mountain-race/store";

export function SetupScreen() {
  const finalizeSetup = useGameStore((state) => state.finalizeSetup);

  return (
    <main className="route-shell route-view">
      <h1>Setup</h1>
      <p>Configure player info and race params.</p>
      <p>
        Proceed to{" "}
        <Link
          to="/race"
          onClick={() => {
            finalizeSetup();
          }}
        >
          /race
        </Link>{" "}
        when setup is ready.
      </p>
    </main>
  );
}
