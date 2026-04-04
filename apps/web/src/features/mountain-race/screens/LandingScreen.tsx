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

      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <section className="w-full max-w-lg rounded-3xl border border-white/40 bg-white/70 p-6 shadow-2xl backdrop-blur-xl md:max-w-2xl md:p-10">
          <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-blue-600 uppercase">
            Mountain Race
          </p>
          <h1 className="text-4xl leading-tight font-black tracking-tight text-zinc-900 md:text-6xl">
            등산복 입고 뛰어
          </h1>
          <p className="mt-4 max-w-xl text-sm text-zinc-700 md:text-base">
            친구 얼굴과 닉네임을 넣고, 랜덤 이벤트가 만드는 역전 드라마를 관전하는 파티 레이싱
            게임입니다.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link to="/setup">게임 시작</Link>
            </Button>
            <p className="text-sm text-zinc-500">플레이어 2~8명, 한 판 약 60~90초</p>
          </div>
        </section>
      </div>
    </main>
  );
}
