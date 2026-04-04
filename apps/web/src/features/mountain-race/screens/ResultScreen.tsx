import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { resetRouteGuardSnapshot } from "@/features/mountain-race/app";

export function ResultScreen() {
  const navigate = useNavigate();

  const handleGoSetup = () => {
    resetRouteGuardSnapshot();
    void navigate({ to: "/setup" });
  };

  const handleGoLobby = () => {
    resetRouteGuardSnapshot();
    void navigate({ to: "/" });
  };

  return (
    <main className="route-shell mx-auto w-full max-w-5xl py-6 md:py-10">
      <section className="rounded-3xl border border-white/50 bg-white/85 p-5 shadow-xl backdrop-blur md:p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-blue-600 uppercase">Result</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-900 md:text-4xl">
          레이스 결과
        </h1>

        <div className="mt-6 grid gap-4 md:grid-cols-[2fr_1fr]">
          <article className="rounded-2xl border border-zinc-200 bg-white/90 p-4">
            <h2 className="text-sm font-bold text-zinc-900">최종 순위</h2>
            <p className="mt-3 text-sm text-zinc-600">
              최종 순위 데이터는 gameplay/store 오너의 계약 반영 후 자동으로 연결됩니다.
            </p>
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white/90 p-4">
            <h2 className="text-sm font-bold text-zinc-900">MVP</h2>
            <p className="mt-3 text-sm text-zinc-600">
              MVP 집계 데이터도 store 계약 수신 이후 화면에서 읽기 전용으로 표시합니다.
            </p>
          </article>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleGoLobby}>
            로비로
          </Button>
          <Button type="button" onClick={handleGoSetup}>
            다시 하기
          </Button>
        </div>
      </section>
    </main>
  );
}
