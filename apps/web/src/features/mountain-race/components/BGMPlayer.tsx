import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { Volume2, VolumeX } from "lucide-react";
import { useAudioStore } from "../store/useAudioStore";

const BGM_LOBBY = "/audio/bgm/The_Clumsy_Hero_s_Waltz.mp3";
const BGM_RACE = "/audio/bgm/Tripping_Over_Tiles.mp3";

const FADE_MS = 600;

function resolveBgmSrc(pathname: string): string {
  if (pathname.startsWith("/race")) return BGM_RACE;
  return BGM_LOBBY;
}

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsTouch(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isTouch;
}

export function BGMPlayer() {
  const { pathname } = useLocation();
  const volume = useAudioStore((s) => s.volume);
  const isMuted = useAudioStore((s) => s.isMuted);
  const setVolume = useAudioStore((s) => s.setVolume);
  const toggleMute = useAudioStore((s) => s.toggleMute);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const isTouch = useIsTouchDevice();

  const targetSrc = resolveBgmSrc(pathname);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const el = new Audio();
      el.loop = true;
      el.preload = "auto";
      audioRef.current = el;
    }
    return audioRef.current;
  }, []);

  // Start muted autoplay immediately, unmute on first user gesture
  useEffect(() => {
    if (unlocked) return;

    const audio = getAudio();
    audio.src = targetSrc;
    audio.volume = 0;
    audio.muted = true;
    audio.play().catch(() => {});

    const unlock = () => {
      setUnlocked(true);
      const a = audioRef.current;
      if (a) {
        a.muted = false;
        a.volume = useAudioStore.getState().isMuted ? 0 : useAudioStore.getState().volume;
        if (a.paused) a.play().catch(() => {});
      }
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
    window.addEventListener("click", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock);
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, [unlocked, getAudio, targetSrc]);

  // Close slider when tapping outside on touch devices
  useEffect(() => {
    if (!isTouch || !showSlider) return;
    const handleOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSlider(false);
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [isTouch, showSlider]);

  // Crossfade when the target BGM changes (only after unlock)
  useEffect(() => {
    if (!unlocked) return;
    const audio = getAudio();

    if (fadeTimerRef.current != null) {
      cancelAnimationFrame(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }

    const needsSwitch = audio.src !== new URL(targetSrc, window.location.origin).href;

    if (!needsSwitch) {
      if (audio.paused) audio.play().catch(() => {});
      return;
    }

    const baseVolume = isMuted ? 0 : volume;

    const fadeOut = (now: number, start: number) => {
      const t = Math.min((now - start) / FADE_MS, 1);
      audio.volume = baseVolume * (1 - t);

      if (t < 1) {
        fadeTimerRef.current = requestAnimationFrame((n) => fadeOut(n, start));
        return;
      }

      audio.pause();
      audio.src = targetSrc;
      audio.load();
      audio.volume = 0;
      audio.play().catch(() => {});

      const fadeInStart = performance.now();
      const fadeIn = (now2: number) => {
        const t2 = Math.min((now2 - fadeInStart) / FADE_MS, 1);
        audio.volume = baseVolume * t2;

        if (t2 < 1) {
          fadeTimerRef.current = requestAnimationFrame(fadeIn);
        } else {
          fadeTimerRef.current = null;
        }
      };
      fadeTimerRef.current = requestAnimationFrame(fadeIn);
    };

    if (audio.paused || audio.readyState === 0) {
      audio.src = targetSrc;
      audio.load();
      audio.volume = baseVolume;
      audio.play().catch(() => {});
    } else {
      const start = performance.now();
      fadeTimerRef.current = requestAnimationFrame((n) => fadeOut(n, start));
    }
  }, [targetSrc, unlocked, getAudio, volume, isMuted]);

  // Sync volume / mute without re-triggering fade
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !unlocked || fadeTimerRef.current != null) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted, unlocked]);

  const handleButtonClick = () => {
    if (isTouch) {
      setShowSlider((prev) => !prev);
    } else {
      toggleMute();
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-3 left-3 z-50 flex items-center gap-2"
      onMouseEnter={() => !isTouch && setShowSlider(true)}
      onMouseLeave={() => !isTouch && setShowSlider(false)}
    >
      <button
        type="button"
        onClick={handleButtonClick}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
        aria-label={isMuted ? "음소거 해제" : "음소거"}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${showSlider ? "w-28 opacity-100" : "w-0 opacity-0"}`}
      >
        <div className="flex items-center gap-1.5">
          {isTouch && (
            <button
              type="button"
              onClick={toggleMute}
              className="shrink-0 text-white/70 active:text-white"
              aria-label={isMuted ? "음소거 해제" : "음소거"}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          )}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              if (v > 0 && isMuted) toggleMute();
            }}
            className="h-1 w-full cursor-pointer accent-white"
          />
        </div>
      </div>
    </div>
  );
}
