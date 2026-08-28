"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, Promise<string | null>>();

async function computeDominantColor(imageUrl: string): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image failed to load"));
      img.src = imageUrl;
    });

    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);

    const { data } = ctx.getImageData(0, 0, size, size);

    // Bucket pixels into a coarse palette and count frequency, so
    // "dominant" means "most common color region" rather than a flat
    // average (which tends toward muddy gray on varied photos).
    const BUCKET = 24;
    const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue; // skip mostly-transparent pixels
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const key = `${(r / BUCKET) | 0}-${(g / BUCKET) | 0}-${(b / BUCKET) | 0}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.count++;
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
      } else {
        buckets.set(key, { count: 1, r, g, b });
      }
    }

    let best: { count: number; r: number; g: number; b: number } | null = null;
    for (const bucket of buckets.values()) {
      if (!best || bucket.count > best.count) best = bucket;
    }
    if (!best) return null;

    const r = Math.round(best.r / best.count);
    const g = Math.round(best.g / best.count);
    const b = Math.round(best.b / best.count);
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    // Cross-origin image/canvas read can fail (CORS) — callers just fall
    // back to their default look instead of crashing.
    return null;
  }
}

// Extracts the most common color region from an image (e.g. a profile
// picture), for tinting UI around it. Results are cached per URL for the
// life of the tab, since this is a real (if small) image decode + pixel
// scan and the same avatar shows up in a lot of places.
export function useDominantColor(imageUrl: string | null): string | null {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    let cancelled = false;
    let promise = cache.get(imageUrl);
    if (!promise) {
      promise = computeDominantColor(imageUrl);
      cache.set(imageUrl, promise);
    }
    promise.then((result) => {
      if (!cancelled) setColor(result);
    });

    return () => {
      cancelled = true;
      setColor(null);
    };
  }, [imageUrl]);

  return color;
}
