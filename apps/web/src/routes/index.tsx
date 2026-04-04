import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { resetRouteGuardSnapshot } from "@/features/mountain-race";
import { LandingScreen } from "@/features/mountain-race/screens";

export const Route = createFileRoute("/")({
  component: IndexRoute,
});

function IndexRoute() {
  useEffect(() => {
    // Entering landing resets the flow so the next setup/race cycle starts clean.
    resetRouteGuardSnapshot();
  }, []);

  return <LandingScreen />;
}
