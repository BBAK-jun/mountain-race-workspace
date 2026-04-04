import { createFileRoute } from "@tanstack/react-router";
import { LandingScreen } from "@/features/mountain-race/screens";

export const Route = createFileRoute("/")({
  component: LandingScreen,
});
