import { createFileRoute } from "@tanstack/react-router";
import { SetupScreen } from "@/features/mountain-race/screens";

export const Route = createFileRoute("/setup")({
  component: SetupScreen,
});
