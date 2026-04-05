import { useGameStore } from "@/features/mountain-race/store/useGameStore";
import { Canvas } from "@react-three/fiber";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { LandingScene } from "./LandingScene";

export function LandingScreen() {
  const resetGame = useGameStore((s) => s.resetGame);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  return (
    <main
      style={{
        position: "relative",
        height: "100dvh",
        overflow: "hidden",
        padding: 0,
      }}
    >
      <Canvas
        camera={{ position: [0, 20, -5], fov: 60 }}
        dpr={[1, 1.5]}
        style={{ position: "absolute", inset: 0 }}
      >
        <LandingScene />
      </Canvas>

      {/* vignette + gradient overlay for text contrast */}
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background: [
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.2) 100%)",
            "linear-gradient(to top, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.08) 35%, transparent 60%)",
            "linear-gradient(to bottom, rgba(10,30,50,0.15) 0%, transparent 25%)",
          ].join(", "),
        }}
      />

      {/* hero content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-end px-6 pb-16 md:justify-center md:pb-0">
        {/* badge */}
        <span
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[0.7rem] font-semibold tracking-[0.16em] text-white/90 uppercase backdrop-blur-md md:mb-5 md:text-xs"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
        >
          <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
          Mountain Race
        </span>

        {/* title */}
        <h1
          className="text-center text-4xl leading-[1.1] font-black tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
          style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)" }}
        >
          등산복 입고 뛰어
        </h1>

        {/* description */}
        <p
          className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-white/80 md:mt-5 md:max-w-lg md:text-base"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
        >
          친구 얼굴과 닉네임을 넣고, 랜덤 이벤트가 만드는
          <br className="hidden sm:inline" /> 역전 드라마를 관전하는 파티 레이싱 룰렛
        </p>

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center gap-3 md:mt-10">
          <Link
            to="/setup"
            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-xl bg-white px-8 text-base font-bold text-zinc-900 shadow-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent md:h-14 md:px-10 md:text-lg"
          >
            <span className="relative z-10">게임 시작</span>
            <span className="absolute inset-0 -z-0 bg-gradient-to-r from-emerald-100 via-white to-sky-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </Link>
          <span
            className="text-xs tracking-wide text-white/70 md:text-sm"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
          >
            2~8명 · 약 60~90초
          </span>
        </div>
      </div>
    </main>
  );
}
