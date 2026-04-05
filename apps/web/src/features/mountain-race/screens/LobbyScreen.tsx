import { useConnectionStore } from "@/features/mountain-race/store/useConnectionStore";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      type="button"
      onClick={copy}
      className="ml-3 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:bg-white/20 active:scale-95"
    >
      {copied ? "복사됨!" : "복사"}
    </button>
  );
}

function PlayerRow({
  name,
  jacketColor,
  ready,
  isMe,
  isHost,
  onNameChange,
}: {
  name: string;
  jacketColor: string;
  ready: boolean;
  isMe: boolean;
  isHost: boolean;
  onNameChange?: ((v: string) => void) | undefined;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 backdrop-blur-sm">
      <span
        className="size-4 shrink-0 rounded-full ring-2 ring-white/20"
        style={{ backgroundColor: jacketColor }}
      />

      {isMe ? (
        <input
          ref={inputRef}
          type="text"
          value={name}
          maxLength={12}
          onChange={(e) => onNameChange?.(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm font-medium text-white outline-none transition focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
        />
      ) : (
        <span className="flex-1 truncate text-sm font-medium text-white/90">{name}</span>
      )}

      <div className="flex items-center gap-2">
        {isHost && (
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-amber-300 uppercase">
            호스트
          </span>
        )}
        <span
          className={`size-2.5 rounded-full transition ${ready ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" : "bg-white/20"}`}
        />
      </div>
    </div>
  );
}

export function LobbyScreen() {
  const { roomCode, players, playerId, isHost, status, send, disconnect } = useConnectionStore();
  const navigate = useNavigate();

  const me = players.find((p) => p.id === playerId);
  const allReady = players.length >= 2 && players.filter((p) => !p.isHost).every((p) => p.ready);

  const handleNameChange = useCallback(
    (name: string) => {
      send({
        type: "setCharacter",
        name,
        faceImage: null,
        color: me?.color ?? {
          jacket: "#3b82f6",
          inner: "#fff",
          pants: "#1e293b",
          buff: "#f97316",
          hat: "#22c55e",
        },
      });
    },
    [send, me?.color],
  );

  const toggleReady = useCallback(() => {
    send({ type: "setReady", ready: !me?.ready });
  }, [send, me?.ready]);

  const startRace = useCallback(() => {
    send({ type: "startRace" });
  }, [send]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.05)_0%,transparent_70%)]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        {/* room code */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-semibold tracking-[0.2em] text-white/50 uppercase">
            방 코드
          </span>
          <div className="flex items-center">
            <span className="font-mono text-4xl font-black tracking-[0.25em] text-white md:text-5xl">
              {roomCode ?? "----"}
            </span>
            {roomCode && <CopyButton text={roomCode} />}
          </div>
        </div>

        {/* status */}
        {status === "connecting" && <p className="animate-pulse text-sm text-white/60">연결 중…</p>}
        {status === "error" && (
          <p className="text-sm text-red-400">연결 오류. 다시 시도해 주세요.</p>
        )}

        {/* player list */}
        <div className="w-full space-y-2">
          <h2 className="mb-3 text-center text-sm font-semibold tracking-wide text-white/60 uppercase">
            플레이어 ({players.length})
          </h2>
          {players.map((p) => (
            <PlayerRow
              key={p.id}
              name={p.name}
              jacketColor={p.color.jacket}
              ready={p.ready}
              isMe={p.id === playerId}
              isHost={p.isHost}
              onNameChange={p.id === playerId ? handleNameChange : undefined}
            />
          ))}
        </div>

        {/* actions */}
        <div className="flex w-full flex-col gap-3">
          {isHost ? (
            <button
              type="button"
              onClick={startRace}
              disabled={!allReady}
              className="h-12 w-full rounded-xl bg-emerald-500 text-base font-bold text-white shadow-lg transition hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 md:h-14 md:text-lg"
            >
              레이스 시작
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleReady}
              className={`h-12 w-full rounded-xl text-base font-bold shadow-lg transition active:scale-[0.98] md:h-14 md:text-lg ${
                me?.ready
                  ? "bg-white/10 text-white/80 hover:bg-white/20"
                  : "bg-emerald-500 text-white hover:bg-emerald-400"
              }`}
            >
              {me?.ready ? "준비 취소" : "준비 완료"}
            </button>
          )}

          {!allReady && isHost && (
            <p className="text-center text-xs text-white/40">
              모든 플레이어가 준비해야 시작할 수 있습니다 (최소 2명)
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              disconnect();
              void navigate({ to: "/" });
            }}
            className="h-10 w-full rounded-xl border border-white/10 text-sm font-medium text-white/50 transition hover:border-white/20 hover:text-white/70"
          >
            나가기
          </button>
        </div>
      </div>
    </main>
  );
}
