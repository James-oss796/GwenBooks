"use client";

import ColorThief from "colorthief";

export async function getDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image(); // ✅ use global browser Image
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const color = colorThief.getColor(img); // [r, g, b]
        resolve(`rgb(${color[0]}, ${color[1]}, ${color[2]})`);
      } catch {
        resolve("#444"); // fallback color
      }
    };

    img.onerror = () => resolve("#444");
  });
}
