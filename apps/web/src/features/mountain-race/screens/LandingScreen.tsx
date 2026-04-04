import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function LandingScreen() {
  return (
    <main className="route-shell flex min-h-screen items-center justify-center">
      <section className="w-full max-w-3xl rounded-3xl border border-white/50 bg-white/80 p-6 shadow-xl backdrop-blur md:p-10">
        <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-blue-600 uppercase">
          Mountain Race
        </p>
        <h1 className="text-3xl leading-tight font-black tracking-tight text-zinc-900 md:text-5xl">
          등산복 입고 뛰어
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-zinc-700 md:text-base">
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
    </main>
  );
}
