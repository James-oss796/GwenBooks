"use client";

import ColorThief from "colorthief";

export async function getDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image(); // ✅ use global browser Image
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const BrowserColorThief = ColorThief as unknown as new () => {
          getColor: (image: HTMLImageElement) => [number, number, number] | null;
        };
        const colorThief = new BrowserColorThief();
        const color = colorThief.getColor(img); // [r, g, b]
        resolve(color ? `rgb(${color[0]}, ${color[1]}, ${color[2]})` : "#444");
      } catch {
        resolve("#444"); // fallback color
      }
    };

    img.onerror = () => resolve("#444");
  });
}
