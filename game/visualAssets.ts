export interface VisualFrame {
  x: number
  y: number
  width: number
  height: number
}

export type OnionVisualState = 'idle' | 'work' | 'cry' | 'sprout' | 'celebrate'
export type BuildingVisualState = 'bed' | 'curingShed' | 'cannery'

export const VISUAL_ASSETS = Object.freeze({
  mascots: '/assets/visual/onion-mascots.png',
  buildings: '/assets/visual/onion-buildings.png',
  field: '/assets/visual/onion-field.png',
})

export const ONION_FRAMES: Readonly<Record<OnionVisualState, VisualFrame>> = Object.freeze({
  idle: { x: 0, y: 0, width: 512, height: 512 },
  work: { x: 512, y: 0, width: 512, height: 512 },
  cry: { x: 1024, y: 0, width: 512, height: 512 },
  sprout: { x: 1536, y: 0, width: 512, height: 512 },
  celebrate: { x: 2048, y: 0, width: 512, height: 512 },
})

export const BUILDING_FRAMES: Readonly<Record<BuildingVisualState, VisualFrame>> = Object.freeze({
  bed: { x: 0, y: 0, width: 512, height: 512 },
  curingShed: { x: 512, y: 0, width: 512, height: 512 },
  cannery: { x: 1024, y: 0, width: 512, height: 512 },
})
