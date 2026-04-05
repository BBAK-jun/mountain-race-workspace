import { useNavigate } from "@tanstack/react-router";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { markSetupComplete } from "@/features/mountain-race/app";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/features/mountain-race/constants/balance";
import { useGameStore } from "@/features/mountain-race/store/useGameStore";
import { SetupScene } from "./SetupScene";

const MAX_UPLOAD_SIZE_MB = 5;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_NAME_LENGTH = 16;
const FACE_FALLBACK = ["🧗", "🥾", "🏔️", "🚩", "🌤️", "🎒", "🧢", "🌲"] as const;

function isDataImage(source: string | null) {
  return Boolean(source?.startsWith("data:image/"));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("이미지 파일을 읽지 못했습니다."));
    };

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";

      if (!result) {
        reject(new Error("이미지 데이터가 비어 있습니다."));
        return;
      }

      resolve(result);
    };

    reader.readAsDataURL(file);
  });
}

export function SetupScreen() {
  const navigate = useNavigate();
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const characters = useGameStore((s) => s.characters);
  const addCharacter = useGameStore((s) => s.addCharacter);
  const removeCharacter = useGameStore((s) => s.removeCharacter);
  const updateCharacter = useGameStore((s) => s.updateCharacter);
  const finalizeSetup = useGameStore((s) => s.finalizeSetup);

  const canAddCharacter = characters.length < MAX_PLAYERS;
  const canRemoveCharacter = characters.length > MIN_PLAYERS;
  const canStartRace = characters.length >= MIN_PLAYERS && characters.length <= MAX_PLAYERS;

  const handleStartRace = () => {
    if (!canStartRace) return;

    for (const [idx, c] of characters.entries()) {
      if (!c.name.trim()) {
        updateCharacter(c.id, { name: `산악인 ${idx + 1}` });
      }
    }

    finalizeSetup();
    markSetupComplete();
    void navigate({ to: "/race" });
  };

  const handleFaceUpload = async (characterId: string, file: File | null) => {
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setUploadErrors((prev) => ({
        ...prev,
        [characterId]: "PNG/JPEG/WEBP/GIF 이미지만 가능합니다.",
      }));
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      setUploadErrors((prev) => ({
        ...prev,
        [characterId]: `${MAX_UPLOAD_SIZE_MB}MB 이하만 허용됩니다.`,
      }));
      return;
    }

    try {
      const faceImage = await readFileAsDataUrl(file);
      updateCharacter(characterId, { faceImage });
      setUploadErrors((prev) => {
        const next = { ...prev };
        delete next[characterId];
        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "업로드 실패";
      setUploadErrors((prev) => ({ ...prev, [characterId]: message }));
    }
  };

  const handleFaceRemove = (characterId: string) => {
    updateCharacter(characterId, { faceImage: null });
    setUploadErrors((prev) => {
      const next = { ...prev };
      delete next[characterId];
      return next;
    });
  };

  const handleRemoveCharacter = (characterId: string) => {
    if (!canRemoveCharacter) return;
    removeCharacter(characterId);
    setUploadErrors((prev) => {
      const next = { ...prev };
      delete next[characterId];
      return next;
    });
  };

  const getFaceFallback = (index: number) => FACE_FALLBACK[index % FACE_FALLBACK.length] ?? "🙂";

  return (
    <main style={{ position: "relative", height: "100dvh", overflow: "hidden", padding: 0 }}>
      <Canvas
        camera={{ position: [0, 25, -5], fov: 60 }}
        dpr={[1, 1.5]}
        style={{ position: "absolute", inset: 0 }}
      >
        <SetupScene />
      </Canvas>

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

      <div className="absolute inset-0 z-10 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 pt-[12vh] pb-6 md:px-6 md:pt-[14vh] md:pb-10">
          <header className="mb-5 flex flex-col items-center text-center md:mb-6">
            <span
              className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[0.7rem] font-semibold tracking-[0.16em] text-white/90 uppercase backdrop-blur-md md:mb-4 md:text-xs"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
            >
              <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
              플레이어 설정
            </span>

            <h1
              className="text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)" }}
            >
              누가 뛸지 정해볼까?
            </h1>

            <p
              className="mt-1.5 text-sm text-white/70 md:text-base"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
            >
              {MIN_PLAYERS}~{MAX_PLAYERS}명 · 기본 산길
            </p>
          </header>

          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                {characters.length}명 참가
              </span>
              <span
                className="text-xs text-white/50"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
              >
                {canStartRace ? "출발 준비 완료 ✓" : `최소 ${MIN_PLAYERS}명`}
              </span>
            </div>
            <button
              type="button"
              onClick={addCharacter}
              disabled={!canAddCharacter}
              className="rounded-lg border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/20 active:scale-95 disabled:pointer-events-none disabled:opacity-30"
            >
              + 추가
            </button>
          </div>

          <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {characters.map((character, index) => {
              const uploadError = uploadErrors[character.id];
              const hasFace = isDataImage(character.faceImage);

              return (
                <li
                  key={character.id}
                  className="group overflow-hidden rounded-xl border border-white/15 bg-black/25 shadow-lg backdrop-blur-md transition hover:border-white/25 hover:bg-black/30"
                  style={{ borderLeftWidth: "3px", borderLeftColor: character.color.jacket }}
                >
                  <div className="flex items-center justify-between gap-1 px-3 pt-2.5">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[0.6rem] font-bold text-white"
                        style={{ backgroundColor: character.color.jacket }}
                      >
                        {index + 1}
                      </span>
                      <span className="truncate text-xs font-semibold text-white/90">
                        {character.name.trim() || `산악인 ${index + 1}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={!canRemoveCharacter}
                      onClick={() => handleRemoveCharacter(character.id)}
                      className="shrink-0 rounded p-1 text-[0.6rem] text-white/30 transition hover:bg-white/10 hover:text-red-400 disabled:pointer-events-none disabled:opacity-20"
                      aria-label={`${character.name.trim() || `산악인 ${index + 1}`} 삭제`}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-2 px-3">
                    <input
                      value={character.name}
                      maxLength={MAX_NAME_LENGTH}
                      onChange={(event) => {
                        updateCharacter(character.id, {
                          name: event.target.value.slice(0, MAX_NAME_LENGTH),
                        });
                      }}
                      className="w-full rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs text-white placeholder-white/30 outline-none transition focus:border-white/30 focus:bg-white/15 focus:ring-1 focus:ring-white/20"
                      placeholder={`닉네임 (등산객 ${index + 1})`}
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-2.5 px-3 pb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-lg">
                      {hasFace ? (
                        <img
                          src={character.faceImage ?? ""}
                          alt={`${character.name} 얼굴`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{getFaceFallback(index)}</span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <label className="cursor-pointer">
                        <span className="text-[0.65rem] font-medium text-white/70">
                          {hasFace ? "변경" : "얼굴 업로드"}
                        </span>
                        <input
                          type="file"
                          accept={ACCEPTED_IMAGE_TYPES.join(",")}
                          onChange={(event) => {
                            const file = event.currentTarget.files?.[0] ?? null;
                            void handleFaceUpload(character.id, file);
                            event.currentTarget.value = "";
                          }}
                          className="block w-full text-[0.65rem] text-white/50 file:mr-1.5 file:cursor-pointer file:rounded file:border-0 file:bg-white/15 file:px-2 file:py-0.5 file:text-[0.65rem] file:font-semibold file:text-white/80 hover:file:bg-white/25"
                        />
                      </label>
                      {hasFace ? (
                        <button
                          type="button"
                          onClick={() => handleFaceRemove(character.id)}
                          className="self-start rounded px-1 py-0.5 text-[0.6rem] text-red-400/70 transition hover:bg-red-500/10 hover:text-red-400"
                          aria-label={`${character.name.trim() || `산악인 ${index + 1}`} 얼굴 이미지 삭제`}
                        >
                          삭제
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {uploadError ? (
                    <p className="border-t border-red-400/20 bg-red-500/10 px-3 py-1.5 text-[0.65rem] text-red-300">
                      {uploadError}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                void navigate({ to: "/" });
              }}
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white/80 backdrop-blur-sm transition hover:bg-white/20 active:scale-[0.97]"
            >
              ← 로비로
            </button>
            <button
              type="button"
              onClick={handleStartRace}
              disabled={!canStartRace}
              className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-xl bg-white px-7 text-sm font-bold text-zinc-900 shadow-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <span className="relative z-10">🏃 등산 시작</span>
              <span className="absolute inset-0 -z-0 bg-gradient-to-r from-emerald-100 via-white to-sky-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
