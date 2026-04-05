import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LobbyScreen } from "@/features/mountain-race/screens";
import { useConnectionStore } from "@/features/mountain-race/store/useConnectionStore";
import { markSetupComplete } from "@/features/mountain-race";
import { useEffect } from "react";

export const Route = createFileRoute("/lobby")({
  component: LobbyRoute,
});

function LobbyRoute() {
  const phase = useConnectionStore((s) => s.phase);
  const navigate = useNavigate();

  useEffect(() => {
    if (phase === "countdown" || phase === "racing") {
      markSetupComplete();
      void navigate({ to: "/race" });
    }
  }, [phase, navigate]);

  return <LobbyScreen />;
}
