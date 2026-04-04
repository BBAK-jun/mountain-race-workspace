import { useEffect, useRef, useState } from "react";
import { InGameOverlaySlot, RaceSceneSlot } from "@/features/mountain-race/components";
import { COUNTDOWN_SECONDS } from "@/features/mountain-race/constants/balance";
import { useAudioStore, useGameStore } from "@/features/mountain-race/store";

// ── Web Audio beep (no external files needed) ──────────────────────────────

function playCountdownBeep(frequency: number, duration: number) {
  const { volume, isMuted } = useAudioStore.getState();
  if (isMuted || volume === 0) return;

  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = frequency;

    const level = volume * 0.3;
    gain.gain.setValueAtTime(level, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => ctx.close();
  } catch {
    /* silently ignore audio errors */
  }
}

// ── Countdown overlay ──────────────────────────────────────────────────────

const BEEP_FREQ_TICK = 440;
const BEEP_FREQ_GO = 880;
const BEEP_DUR_TICK = 0.15;
const BEEP_DUR_GO = 0.3;
const GO_DISPLAY_MS = 800;

function CountdownOverlay({ phase }: { phase: number }) {
  const display = phase > 0 ? String(phase) : "출발!";

  return (
    <>
      <style>{`
        @keyframes mr-countdown-pop {
          0%   { transform: scale(0.5); opacity: 0; }
          40%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .mr-countdown-pop {
          animation: mr-countdown-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
      <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
        <span
          key={phase}
          className="mr-countdown-pop text-8xl font-black text-white md:text-9xl"
          style={{
            textShadow: "0 0 40px rgba(255,255,255,0.3), 0 4px 24px rgba(0,0,0,0.6)",
          }}
        >
          {display}
        </span>
      </div>
    </>
  );
}

// ── Main composition ───────────────────────────────────────────────────────

export function RaceRouteComposition() {
  const startRace = useGameStore((s) => s.startRace);
  const tick = useGameStore((s) => s.tick);
  const isRacing = useGameStore((s) => s.isRacing);
  const [countdownPhase, setCountdownPhase] = useState(COUNTDOWN_SECONDS);
  const raceStarted = useRef(false);

  // Countdown sequence: 3 → 2 → 1 → 0 ("출발!")
  useEffect(() => {
    playCountdownBeep(BEEP_FREQ_TICK, BEEP_DUR_TICK);

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= COUNTDOWN_SECONDS; i++) {
      timers.push(
        setTimeout(() => {
          const next = COUNTDOWN_SECONDS - i;
          setCountdownPhase(next);
          playCountdownBeep(
            next > 0 ? BEEP_FREQ_TICK : BEEP_FREQ_GO,
            next > 0 ? BEEP_DUR_TICK : BEEP_DUR_GO,
          );
        }, i * 1000),
      );
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  // Trigger race start when countdown reaches 0
  useEffect(() => {
    if (countdownPhase > 0 || raceStarted.current) return;
    raceStarted.current = true;
    startRace();
  }, [countdownPhase, startRace]);

  // RAF game loop — independent of countdownPhase so the "출발!" hide doesn't kill it
  useEffect(() => {
    if (!isRacing) return;

    let rafId = 0;
    let prevTime = performance.now();

    const loop = (now: number) => {
      const deltaTime = Math.min((now - prevTime) / 1000, 0.1);
      prevTime = now;

      tick(deltaTime);

      if (!useGameStore.getState().hasResult) {
        rafId = window.requestAnimationFrame(loop);
      }
    };

    rafId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(rafId);
  }, [isRacing, tick]);

  // Auto-hide "출발!" after a short display
  useEffect(() => {
    if (countdownPhase !== 0) return;
    const timer = setTimeout(() => setCountdownPhase(-1), GO_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [countdownPhase]);

  return (
    <main className="relative h-dvh w-full overflow-hidden p-0">
      <RaceSceneSlot />
      <InGameOverlaySlot />
      {countdownPhase >= 0 && <CountdownOverlay phase={countdownPhase} />}
    </main>
  );
}
