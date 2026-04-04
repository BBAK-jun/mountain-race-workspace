import { createFileRoute } from "@tanstack/react-router";
import { RaceScreen } from "@/features/mountain-race/screens";

export const Route = createFileRoute("/race")({
  component: RaceScreen,
});
