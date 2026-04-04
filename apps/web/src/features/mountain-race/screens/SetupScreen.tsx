import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { markSetupComplete } from "@/features/mountain-race/app";

const MAX_UPLOAD_SIZE_MB = 5;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const MAX_NAME_LENGTH = 16;
const DEFAULT_PLAYERS = 4;

type SetupCharacter = {
  id: string;
  name: string;
  faceImage: string | null;
  color: string;
};

const COLOR_PRESETS = [
  "#ff66b2",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#f97316",
  "#ef4444",
  "#eab308",
  "#06b6d4",
] as const;
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

function createCharacter(index: number): SetupCharacter {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${index}`,
    name: `등산객 ${index + 1}`,
    faceImage: FACE_FALLBACK[index % FACE_FALLBACK.length] ?? "🙂",
    color: COLOR_PRESETS[index % COLOR_PRESETS.length] ?? "#64748b",
  };
}

export function SetupScreen() {
  const navigate = useNavigate();
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [characters, setCharacters] = useState<SetupCharacter[]>(() =>
    Array.from({ length: DEFAULT_PLAYERS }, (_, index) => createCharacter(index)),
  );

  const canAddCharacter = characters.length < MAX_PLAYERS;
  const canRemoveCharacter = characters.length > MIN_PLAYERS;
  const canStartRace = characters.length >= MIN_PLAYERS && characters.length <= MAX_PLAYERS;

  const handleStartRace = () => {
    if (!canStartRace) {
      return;
    }

    markSetupComplete();
    void navigate({ to: "/race" });
  };

  const addCharacter = () => {
    if (!canAddCharacter) {
      return;
    }

    setCharacters((prev) => [...prev, createCharacter(prev.length)]);
  };

  const removeCharacter = (characterId: string) => {
    if (!canRemoveCharacter) {
      return;
    }

    setCharacters((prev) => prev.filter((character) => character.id !== characterId));
    setUploadErrors((prev) => {
      const next = { ...prev };
      delete next[characterId];
      return next;
    });
  };

  const updateCharacter = (characterId: string, partial: Partial<SetupCharacter>) => {
    setCharacters((prev) =>
      prev.map((character) =>
        character.id === characterId ? { ...character, ...partial, id: character.id } : character,
      ),
    );
  };

  const handleFaceUpload = async (characterId: string, file: File | null) => {
    if (!file) {
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setUploadErrors((prev) => ({
        ...prev,
        [characterId]: "PNG/JPEG/WEBP/GIF 이미지 파일만 업로드할 수 있습니다.",
      }));
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      setUploadErrors((prev) => ({
        ...prev,
        [characterId]: `이미지 크기는 ${MAX_UPLOAD_SIZE_MB}MB 이하만 허용됩니다.`,
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
      const message = error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.";
      setUploadErrors((prev) => ({
        ...prev,
        [characterId]: message,
      }));
    }
  };

  return (
    <main className="route-shell mx-auto w-full max-w-6xl py-6 md:py-10">
      <section className="rounded-3xl border border-white/50 bg-white/80 p-5 shadow-xl backdrop-blur md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-blue-600 uppercase">Setup</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-900 md:text-4xl">
              플레이어 설정
            </h1>
            <p className="mt-2 text-sm text-zinc-600 md:text-base">
              인원은 {MIN_PLAYERS}~{MAX_PLAYERS}명까지 설정할 수 있습니다.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 text-sm text-zinc-600 md:min-w-64">
            <p className="font-semibold text-zinc-900">맵 선택 (MVP)</p>
            <select
              value="basic-mountain"
              disabled
              aria-label="맵 선택"
              className="mt-2 w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-600"
            >
              <option value="basic-mountain">기본 산길 (단일 맵)</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-600">
            현재 인원 <strong className="text-zinc-900">{characters.length}명</strong>
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={addCharacter}
            disabled={!canAddCharacter}
          >
            캐릭터 추가
          </Button>
        </div>

        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {characters.map((character, index) => {
            const uploadError = uploadErrors[character.id];

            return (
              <li
                key={character.id}
                className="rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-zinc-900 px-2 text-xs font-bold text-white">
                      #{index + 1}
                    </span>
                    <span
                      aria-hidden
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: character.color }}
                    />
                    <span className="text-sm font-semibold text-zinc-700">플레이어</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={!canRemoveCharacter}
                    onClick={() => {
                      removeCharacter(character.id);
                    }}
                  >
                    삭제
                  </Button>
                </div>

                <label className="mt-3 block text-sm font-medium text-zinc-700">
                  닉네임
                  <input
                    value={character.name}
                    maxLength={MAX_NAME_LENGTH}
                    onChange={(event) => {
                      updateCharacter(character.id, {
                        name: event.target.value.slice(0, MAX_NAME_LENGTH),
                      });
                    }}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-500 transition focus:ring-2"
                    placeholder={`등산객 ${index + 1}`}
                  />
                </label>

                <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
                  <p className="text-xs font-semibold text-zinc-600 uppercase">얼굴 미리보기</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white text-2xl">
                      {isDataImage(character.faceImage) ? (
                        <img
                          src={character.faceImage ?? ""}
                          alt={`${character.name} 얼굴`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{character.faceImage ?? "🙂"}</span>
                      )}
                    </div>
                    <label className="text-sm text-zinc-600">
                      <span className="mb-1 block font-medium text-zinc-800">
                        얼굴 이미지 업로드
                      </span>
                      <input
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES.join(",")}
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0] ?? null;
                          void handleFaceUpload(character.id, file);
                          event.currentTarget.value = "";
                        }}
                        className="block text-xs text-zinc-600 file:mr-2 file:rounded-md file:border-0 file:bg-zinc-900 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-zinc-700"
                      />
                    </label>
                  </div>
                  {uploadError ? <p className="mt-2 text-xs text-red-600">{uploadError}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void navigate({ to: "/" });
            }}
          >
            로비로
          </Button>
          <Button type="button" onClick={handleStartRace} disabled={!canStartRace}>
            등산 시작
          </Button>
        </div>
      </section>
    </main>
  );
}
