export interface VillageViewport {
  width: number
  height: number
}

export const VILLAGE_FRAME_STYLE = {
  aspectRatio: '16 / 9',
  boxSizing: 'border-box',
  minHeight: '0',
} as const

export function calculateVillageViewport(width: number, height: number): VillageViewport {
  const safeWidth = Math.max(320, Number.isFinite(width) ? Math.round(width) : 320)
  const requestedHeight = Math.max(180, Number.isFinite(height) ? Math.round(height) : 180)
  const aspectHeight = Math.round(safeWidth * 9 / 16)
  return { width: safeWidth, height: Math.max(180, Math.min(requestedHeight, aspectHeight)) }
}
