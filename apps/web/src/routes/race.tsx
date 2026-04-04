import { createFileRoute, redirect } from "@tanstack/react-router";
import { RaceRouteComposition } from "@/features/mountain-race";
import { useGameStore } from "@/features/mountain-race/store";

export const Route = createFileRoute("/race")({
  beforeLoad: () => {
    const { setupComplete, hasResult } = useGameStore.getState();

    if (!setupComplete) {
      throw redirect({ to: "/setup" });
    }

    if (hasResult) {
      throw redirect({ to: "/result" });
    }
  },
  component: RaceRouteComposition,
});
