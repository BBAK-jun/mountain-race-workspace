import { Link } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/features/mountain-race/store/useGameStore";
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

      {/* bottom gradient for depth */}
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 40%), linear-gradient(to bottom, rgba(135,180,220,0.2) 0%, transparent 30%)",
        }}
      />

      <div className="absolute inset-0 z-10 flex items-end justify-center p-4 pb-12 md:items-center md:pb-4">
        <section className="w-full max-w-md rounded-3xl border border-white/30 bg-white/65 p-6 shadow-2xl backdrop-blur-xl md:max-w-2xl md:p-10">
          <p className="mb-1 text-[0.7rem] font-bold tracking-[0.18em] text-emerald-700 uppercase md:mb-2 md:text-xs">
            Mountain Race
          </p>
          <h1 className="text-3xl leading-tight font-black tracking-tight text-zinc-900 md:text-5xl lg:text-6xl">
            등산복 입고 뛰어
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 md:mt-4 md:text-base">
            친구 얼굴과 닉네임을 넣고, 랜덤 이벤트가 만드는 역전 드라마를 관전하는 파티 레이싱
            게임입니다.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 md:mt-8">
            <Button asChild size="lg" className="px-6 text-base font-bold">
              <Link to="/setup">게임 시작</Link>
            </Button>
            <p className="text-xs text-zinc-500 md:text-sm">2~8명 · 약 60~90초</p>
          </div>
        </section>
      </div>
    </main>
  );
}
