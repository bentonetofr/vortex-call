"use client";

import { useState } from "react";
import type { ScreenShareOptions } from "@/lib/useVoiceCall";

interface ScreenShareSettingsModalProps {
  onCancel: () => void;
  onConfirm: (options: ScreenShareOptions) => void;
}

const RESOLUTIONS: { label: string; width: number | null; height: number | null }[] = [
  { label: "720p", width: 1280, height: 720 },
  { label: "1080p", width: 1920, height: 1080 },
  { label: "Fonte", width: null, height: null },
];

const FRAME_RATES = [15, 30, 60];

export function ScreenShareSettingsModal({ onCancel, onConfirm }: ScreenShareSettingsModalProps) {
  const [resolutionIndex, setResolutionIndex] = useState(1);
  const [frameRate, setFrameRate] = useState(30);
  const [withAudio, setWithAudio] = useState(true);

  function handleConfirm() {
    const res = RESOLUTIONS[resolutionIndex];
    onConfirm({ width: res.width, height: res.height, frameRate, withAudio });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-xl bg-vc-sidebar p-5">
        <h2 className="text-base font-medium text-vc-text">Compartilhar tela</h2>

        <p className="mt-4 mb-1.5 text-xs text-vc-text-muted">Resolução</p>
        <div className="flex gap-1.5">
          {RESOLUTIONS.map((res, i) => (
            <button
              key={res.label}
              onClick={() => setResolutionIndex(i)}
              className={`flex-1 rounded-md py-1.5 text-xs ${
                resolutionIndex === i ? "bg-vc-accent-soft text-vc-accent" : "bg-vc-input text-vc-text-muted"
              }`}
            >
              {res.label}
            </button>
          ))}
        </div>

        <p className="mt-4 mb-1.5 text-xs text-vc-text-muted">Taxa de quadros</p>
        <div className="flex gap-1.5">
          {FRAME_RATES.map((fps) => (
            <button
              key={fps}
              onClick={() => setFrameRate(fps)}
              className={`flex-1 rounded-md py-1.5 text-xs ${
                frameRate === fps ? "bg-vc-accent-soft text-vc-accent" : "bg-vc-input text-vc-text-muted"
              }`}
            >
              {fps} fps
            </button>
          ))}
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-vc-text">
          <input
            type="checkbox"
            checked={withAudio}
            onChange={(e) => setWithAudio(e.target.checked)}
            className="h-4 w-4 accent-vc-accent"
          />
          Compartilhar áudio
        </label>

        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-md bg-vc-input py-2 text-sm text-vc-text">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-md bg-vc-accent py-2 text-sm font-medium text-vc-sidebar"
          >
            Compartilhar
          </button>
        </div>
      </div>
    </div>
  );
}
