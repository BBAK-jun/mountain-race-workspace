import { createFileRoute } from "@tanstack/react-router";
import { ResultScreen } from "@/features/mountain-race/screens";

export const Route = createFileRoute("/result")({
  component: ResultScreen,
});
