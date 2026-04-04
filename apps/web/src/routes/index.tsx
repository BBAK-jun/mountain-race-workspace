import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useGameStore } from "@/features/mountain-race/store";
import { LandingScreen } from "@/features/mountain-race/screens";

export const Route = createFileRoute("/")({
  component: IndexRoute,
});

function IndexRoute() {
  useEffect(() => {
    // Entering landing resets the flow so the next setup/race cycle starts clean.
    useGameStore.getState().resetGame();
  }, []);

  return <LandingScreen />;
}
