export function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
}

export function getUIScale(base = 800) {
  const w = window.innerWidth;
  // escala suave ~0.8..1.2 (ajusta tamanhos de botões/tipos)
  return Math.max(0.8, Math.min(1.2, w / base));
}

/** “Safe area” aproximado para notches (iOS/Android). */
export function getSafeInsets() {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const top = isIOS ? 22 : 8;
  const bottom = isIOS ? 12 : 8;
  const left = 8, right = 8;
  return { top, bottom, left, right };
}

/** Heurística simples para “modo leve” (menos draw calls/FX). */
export function lowGfxMode() {
  const cores = (navigator as any).hardwareConcurrency || 2;
  const mem = (navigator as any).deviceMemory || 2;
  return cores <= 4 || mem <= 2 || getUIScale() <= 0.85;
}
