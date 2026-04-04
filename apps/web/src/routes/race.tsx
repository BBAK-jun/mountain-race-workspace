import { createFileRoute, redirect } from "@tanstack/react-router";
import { RaceRouteComposition, readRouteGuardSnapshot } from "@/features/mountain-race";

export const Route = createFileRoute("/race")({
  beforeLoad: () => {
    const { setupComplete } = readRouteGuardSnapshot();

    if (!setupComplete) {
      throw redirect({ to: "/setup" });
    }
  },
  component: RaceRouteComposition,
});
