import { createFileRoute, redirect } from "@tanstack/react-router";
import { useGameStore } from "@/features/mountain-race/store";
import { ResultScreen } from "@/features/mountain-race/screens";

export const Route = createFileRoute("/result")({
  beforeLoad: () => {
    const { setupComplete, hasResult } = useGameStore.getState();

    if (!setupComplete) {
      throw redirect({ to: "/setup" });
    }

    if (!hasResult) {
      throw redirect({ to: "/race" });
    }
  },
  component: ResultScreen,
});
