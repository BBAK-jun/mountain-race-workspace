import type { ClientMessage, Player, ServerMessage } from "@mountain-race/types";
import type { PlayerRegistry } from "../shared/playerRegistry";
import type { Broadcaster } from "../ports";

export interface RoomUseCaseDeps {
  registry: PlayerRegistry;
  broadcaster: Broadcaster;
}

export function handleSetCharacter(
  deps: RoomUseCaseDeps,
  player: Player,
  msg: Extract<ClientMessage, { type: "setCharacter" }>,
): void {
  player.name = msg.name;
  player.faceImage = msg.faceImage;
  player.color = msg.color;
  deps.broadcaster.broadcast({
    type: "playerUpdated",
    playerId: player.id,
    changes: { name: player.name, faceImage: player.faceImage, color: player.color },
  });
}

export function handleSetReady(
  deps: RoomUseCaseDeps,
  player: Player,
  msg: Extract<ClientMessage, { type: "setReady" }>,
): void {
  player.ready = msg.ready;
  deps.broadcaster.broadcast({
    type: "playerUpdated",
    playerId: player.id,
    changes: { ready: player.ready },
  });
}

export function handlePlayerDisconnect(deps: RoomUseCaseDeps, playerId: string): void {
  const player = deps.registry.get(playerId);
  if (!player) return;

  deps.registry.disconnect(playerId);
  deps.broadcaster.broadcast({ type: "playerLeft", playerId });

  if (player.isHost) {
    const newHost = deps.registry.transferHost();
    if (newHost) {
      deps.broadcaster.broadcast({
        type: "playerUpdated",
        playerId: newHost.id,
        changes: { isHost: true },
      });
    }
  }

  if (deps.registry.phase === "waiting") deps.registry.clearIfEmpty();
}
