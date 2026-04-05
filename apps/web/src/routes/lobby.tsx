import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LobbyScreen } from "@/features/mountain-race/screens";
import { useConnectionStore } from "@/features/mountain-race/store/useConnectionStore";
import { markSetupComplete } from "@/features/mountain-race";
import { useEffect } from "react";

interface LobbySearch {
  code?: string | undefined;
}

export const Route = createFileRoute("/lobby")({
  validateSearch: (search: Record<string, unknown>): LobbySearch => ({
    code: typeof search.code === "string" ? search.code.toUpperCase() : undefined,
  }),
  component: LobbyRoute,
});

function LobbyRoute() {
  const { code } = Route.useSearch();
  const phase = useConnectionStore((s) => s.phase);
  const status = useConnectionStore((s) => s.status);
  const roomCode = useConnectionStore((s) => s.roomCode);
  const joinRoom = useConnectionStore((s) => s.joinRoom);
  const navigate = useNavigate();

  useEffect(() => {
    if (code && status === "disconnected" && !roomCode) {
      joinRoom(code);
    }
  }, [code, status, roomCode, joinRoom]);

  useEffect(() => {
    if (phase === "countdown" || phase === "racing") {
      markSetupComplete();
      void navigate({ to: "/race" });
    }
  }, [phase, navigate]);

  return <LobbyScreen />;
}
