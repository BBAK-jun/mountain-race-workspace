import { createFileRoute, redirect } from "@tanstack/react-router";
import { readRouteGuardSnapshot } from "@/features/mountain-race";
import { ResultScreen } from "@/features/mountain-race/screens";

export const Route = createFileRoute("/result")({
  beforeLoad: () => {
    const { setupComplete, hasResult } = readRouteGuardSnapshot();

    if (!setupComplete) {
      throw redirect({ to: "/setup" });
    }

    if (!hasResult) {
      throw redirect({ to: "/race" });
    }
  },
  component: ResultScreen,
});
