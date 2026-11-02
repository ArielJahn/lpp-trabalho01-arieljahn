import { EVENTS, type PublicGameState } from '~/shared/arionion/contracts'

export interface VillagePayload {
  state?: PublicGameState
  reason?: string
  resource?: string
  quantity?: number
  kind?: string
}

export interface VillageDriver {
  sync(payload: VillagePayload): void
  seasonStarted(payload: VillagePayload): void
  constructionStarted(payload: VillagePayload): void
  constructionCompleted(payload: VillagePayload): void
  resourceProduced(payload: VillagePayload): void
  onionSprouted(payload: VillagePayload): void
  upgradeCompleted(payload: VillagePayload): void
  rejected(payload: VillagePayload): void
  seasonClosed(payload: VillagePayload): void
  destroy(): void
}

export interface OnionVillageAdapter {
  ready(driver: VillageDriver): void
  handle(event: string, payload: VillagePayload): void
  destroy(): void
}

export function createOnionVillageAdapter(): OnionVillageAdapter {
  let driver: VillageDriver | null = null
  let destroyed = false
  const queue: Array<[string, VillagePayload]> = []
  const dispatch = (event: string, payload: VillagePayload) => {
    if (!driver || destroyed) return
    const method = ({
      [EVENTS.stateSynchronized]: 'sync',
      [EVENTS.seasonStarted]: 'seasonStarted',
      [EVENTS.constructionStarted]: 'constructionStarted',
      [EVENTS.constructionCompleted]: 'constructionCompleted',
      [EVENTS.resourceProduced]: 'resourceProduced',
      [EVENTS.onionSprouted]: 'onionSprouted',
      [EVENTS.upgradeCompleted]: 'upgradeCompleted',
      [EVENTS.operationRejected]: 'rejected',
      [EVENTS.seasonClosed]: 'seasonClosed',
    } as const)[event]
    if (method) driver[method](payload)
  }
  return {
    ready(nextDriver) {
      if (destroyed || driver) return
      driver = nextDriver
      for (const [event, payload] of queue.splice(0)) dispatch(event, payload)
    },
    handle(event, payload) {
      if (destroyed) return
      if (!driver) queue.push([event, payload]); else dispatch(event, payload)
    },
    destroy() {
      if (destroyed) return
      destroyed = true
      queue.length = 0
      driver?.destroy()
      driver = null
    },
  }
}

export async function createOnionVillage(container: HTMLElement): Promise<VillageDriver> {
  const Phaser = (await import('phaser')).default
  let scene: any
  let game: any

  class OnionScene extends Phaser.Scene {
    structures: any[] = []
    overlay: any
    banner: any
    points: Array<{ x: number; y: number }> = []

    constructor() { super('arionion') }
    preload() {
      this.load.image('tiles', '/assets/arionion-tiles.png')
      this.load.tilemapTiledJSON('map', '/assets/arionion-map.json')
    }
    create() {
      const map = this.make.tilemap({ key: 'map' })
      const tiles = map.addTilesetImage('tileset-vila', 'tiles')
      if (!tiles) throw new Error('Tileset do Cebolal não foi carregado')
      map.createLayer('chao', tiles)
      map.createLayer('decoracao', tiles)
      const objects = map.getObjectLayer('pontos')?.objects ?? []
      this.points = objects.filter((point: any) => String(point.name).startsWith('lote'))
        .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name), 'pt', { numeric: true }))
        .map((point: any) => ({ x: Number(point.x ?? 0), y: Number(point.y ?? 0) }))
      this.banner = this.add.text(144, 8, '⏳ Aguardando o Mestre', {
        fontFamily: 'system-ui', fontSize: '8px', color: '#ffffff', backgroundColor: '#26351dcc', padding: { x: 5, y: 3 },
      }).setOrigin(.5, 0).setDepth(20)
      this.cameras.main.setZoom(2).centerOn(144, 72)
      scene = this
    }
    clearStructures() { for (const item of this.structures) item.destroy(); this.structures = [] }
    point(index: number) { return this.points[index % Math.max(1, this.points.length)] ?? { x: 70 + index * 35, y: 65 } }
    addStructure(index: number, emoji: string, label: string, active = true) {
      const point = this.point(index)
      const shadow = this.add.ellipse(point.x, point.y + 10, 27, 8, 0x31451f, .25)
      const icon = this.add.text(point.x, point.y, emoji, { fontSize: '19px', resolution: 2 }).setOrigin(.5, .65)
      const text = this.add.text(point.x, point.y + 13, label, { fontFamily: 'system-ui', fontSize: '5px', color: '#24321a', backgroundColor: '#fffde0cc', padding: { x: 2, y: 1 }, resolution: 2 }).setOrigin(.5)
      if (!active) this.tweens.add({ targets: icon, alpha: { from: .45, to: 1 }, scale: { from: .8, to: 1 }, duration: 900, yoyo: true, repeat: -1 })
      this.structures.push(shadow, icon, text)
    }
    syncState(state?: PublicGameState) {
      if (!state) return
      this.clearStructures()
      let index = 0
      for (let n = 0; n < state.buildings.beds; n++) this.addStructure(index++, '🧅', `Canteiro ${n + 1}`)
      if (state.buildings.curingSheds) this.addStructure(index++, '🏚️', 'Cura')
      if (state.buildings.canneries) this.addStructure(index++, '🏭', 'Conserveira')
      for (const construction of state.constructions) {
        const label = construction.kind === 'bed' ? 'Canteiro' : construction.kind === 'curing-shed' ? 'Galpão' : 'Conserveira'
        this.addStructure(index++, '🚧', label, false)
      }
      this.banner.setText(state.phase === 'open' ? `☀️ Cebolal aberto · nível ${state.upgradeLevel}` : state.phase === 'closed' ? '🌙 Temporada encerrada' : '⏳ Aguardando o Mestre')
    }
    float(text: string, color = '#23451c') {
      const label = this.add.text(144, 105, text, { fontFamily: 'system-ui', fontSize: '9px', fontStyle: 'bold', color, stroke: '#ffffff', strokeThickness: 3, resolution: 2 }).setOrigin(.5).setDepth(30)
      this.tweens.add({ targets: label, y: 82, alpha: 0, duration: 1500, onComplete: () => label.destroy() })
    }
    closeOverlay() {
      this.overlay?.destroy()
      this.overlay = this.add.rectangle(144, 72, 288, 144, 0x17213a, .42).setDepth(15)
      this.banner.setDepth(20)
    }
  }

  await new Promise<void>((resolve) => {
    game = new Phaser.Game({ type: Phaser.AUTO, parent: container, width: 576, height: 288, pixelArt: true,
      backgroundColor: '#99bd68', scene: OnionScene, audio: { noAudio: true }, callbacks: { postBoot: () => resolve() } })
  })
  while (!scene) await new Promise(resolve => setTimeout(resolve, 0))

  const sync = (payload: VillagePayload) => scene.syncState(payload.state)
  return {
    sync,
    seasonStarted(payload) { sync(payload); scene.float('☀️ Temporada aberta!') },
    constructionStarted(payload) { sync(payload); scene.float('🚧 Nova obra iniciada') },
    constructionCompleted(payload) { sync(payload); scene.float('✅ Construção concluída') },
    resourceProduced(payload) { sync(payload); scene.float(`+${payload.quantity ?? ''} ${payload.resource === 'preserve' ? '🫙' : '🧅'}`) },
    onionSprouted(payload) { sync(payload); scene.float(`🌱 ${payload.quantity ?? ''} cebolas brotaram`, '#8a3f31') },
    upgradeCompleted(payload) { sync(payload); scene.float('⚙️ Cebolal melhorado!') },
    rejected(payload) { scene.cameras.main.shake(180, .006); scene.float(`✋ ${payload.reason ?? 'Operação recusada'}`, '#9a3028') },
    seasonClosed(payload) { sync(payload); scene.closeOverlay() },
    destroy() { game?.destroy(true); scene = null; game = null },
  }
}
