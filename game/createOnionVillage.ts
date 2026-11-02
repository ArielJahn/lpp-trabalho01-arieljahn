import { EVENTS, type PublicGameState } from '~/shared/arionion/contracts'
import { VISUAL_ASSETS } from './visualAssets'
import { createReactionQueue, reactionForEvent, type VisualReaction } from './villageReactions'

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

export async function createOnionVillage(container: HTMLElement, options: { reducedMotion?: boolean } = {}): Promise<VillageDriver> {
  const Phaser = (await import('phaser')).default
  const reducedMotion = options.reducedMotion ?? false
  const reactions = createReactionQueue(6)
  let scene: any
  let game: any
  let observer: ResizeObserver | null = null
  let destroyed = false

  class OnionScene extends Phaser.Scene {
    background: any
    structures: any[] = []
    workers: any[] = []
    transients: any[] = []
    banner: any
    overlay: any
    playingReaction = false
    currentState?: PublicGameState

    constructor() { super('arionion') }
    preload() {
      this.load.image('onion-field', VISUAL_ASSETS.field)
      this.load.spritesheet('onion-mascots', VISUAL_ASSETS.mascots, { frameWidth: 512, frameHeight: 512 })
      this.load.spritesheet('onion-buildings', VISUAL_ASSETS.buildings, { frameWidth: 512, frameHeight: 512 })
    }
    create() {
      this.background = this.add.image(0, 0, 'onion-field').setOrigin(0).setDepth(0)
      this.banner = this.add.text(0, 0, 'Aguardando o Mestre', {
        fontFamily: 'Georgia, serif', fontSize: '17px', fontStyle: 'bold', color: '#443117',
        backgroundColor: '#fff8dfee', padding: { x: 14, y: 8 }, stroke: '#ffffff', strokeThickness: 1,
      }).setOrigin(.5, 0).setDepth(30)
      this.scale.on('resize', (size: any) => this.layout(size.width, size.height))
      this.layout(this.scale.width, this.scale.height)
      scene = this
    }
    layout(width: number, height: number) {
      if (!this.background) return
      this.background.setDisplaySize(width, height)
      this.banner.setPosition(width / 2, 14)
      if (this.currentState) this.syncState(this.currentState)
    }
    clearCollection(collection: any[]) {
      for (const item of collection) {
        this.tweens.killTweensOf(item)
        item.destroy()
      }
      collection.length = 0
    }
    addBuilding(frame: number, x: number, y: number, scale: number, pending = false) {
      const sprite = this.add.sprite(x, y, 'onion-buildings', frame).setOrigin(.5, 1).setScale(scale).setDepth(8 + y / 1000)
      if (pending) {
        sprite.setAlpha(.55)
        if (!reducedMotion) this.tweens.add({ targets: sprite, alpha: { from: .4, to: .8 }, duration: 650, yoyo: true, repeat: -1 })
      }
      this.structures.push(sprite)
    }
    addWorker(index: number, busy: boolean) {
      const width = this.scale.width
      const height = this.scale.height
      const x = width * .38 + index * Math.min(150, width * .13)
      const sprite = this.add.sprite(x, height * .88, 'onion-mascots', busy ? 1 : 0).setOrigin(.5, 1).setScale(Math.max(.22, Math.min(.36, width / 3000))).setDepth(20 + index)
      if (!busy) sprite.setAlpha(.92)
      if (!reducedMotion) this.tweens.add({ targets: sprite, y: sprite.y - 7, duration: 950 + index * 140, ease: 'Sine.inOut', yoyo: true, repeat: -1 })
      this.workers.push(sprite)
    }
    syncState(state?: PublicGameState) {
      if (!state || !this.background) return
      this.currentState = state
      this.clearCollection(this.structures)
      this.clearCollection(this.workers)
      const width = this.scale.width
      const height = this.scale.height
      const buildingScale = Math.max(.24, Math.min(.42, width / 2500))
      for (let index = 0; index < state.buildings.beds; index++) this.addBuilding(0, width * (.18 + index * .18), height * .91, buildingScale * .78)
      if (state.buildings.curingSheds) this.addBuilding(1, width * .7, height * .76, buildingScale)
      if (state.buildings.canneries) this.addBuilding(2, width * .86, height * .79, buildingScale)
      for (const construction of state.constructions) {
        const frame = construction.kind === 'bed' ? 0 : construction.kind === 'curing-shed' ? 1 : 2
        this.addBuilding(frame, width * .58, height * .8, buildingScale * .9, true)
      }
      for (let index = 0; index < state.workers.limit; index++) this.addWorker(index, index < state.workers.busy)
      this.banner.setText(state.phase === 'open' ? `Cebolal aberto · nível ${state.upgradeLevel}` : state.phase === 'closed' ? 'Temporada encerrada' : 'Aguardando o Mestre')
    }
    enqueue(reaction: VisualReaction) {
      reactions.enqueue(reaction)
      this.playNextReaction()
    }
    playNextReaction() {
      if (this.playingReaction) return
      const reaction = reactions.dequeue()
      if (!reaction) return
      this.playingReaction = true
      const frame = reaction.type === 'sprout' ? 3 : reaction.type === 'reject' ? 2 : reaction.type === 'produce' || reaction.type === 'build' ? 1 : 4
      const message = reaction.type === 'celebrate' ? reaction.message
        : reaction.type === 'build' ? (reaction.phase === 'started' ? 'Nova obra iniciada!' : 'Construção concluída!')
          : reaction.type === 'produce' ? `+${reaction.quantity} ${reaction.resource === 'preserve' ? 'conservas' : reaction.resource === 'cured-onion' ? 'cebolas curadas' : 'cebolas'}`
            : reaction.type === 'sprout' ? `${reaction.quantity} cebolas brotaram!`
              : reaction.type === 'upgrade' ? 'Cebolal melhorado!'
                : reaction.type === 'reject' ? reaction.reason : 'Hora de descansar'
      const actor = this.add.sprite(this.scale.width / 2, this.scale.height * .8, 'onion-mascots', frame).setOrigin(.5, 1).setScale(Math.max(.3, Math.min(.44, this.scale.width / 2400))).setDepth(35)
      const label = this.add.text(this.scale.width / 2, this.scale.height * .25, message, {
        fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'bold', color: reaction.type === 'reject' || reaction.type === 'sprout' ? '#8c352b' : '#3e571f',
        backgroundColor: '#fffdf2f2', padding: { x: 14, y: 9 }, stroke: '#ffffff', strokeThickness: 2,
      }).setOrigin(.5).setDepth(36)
      this.transients.push(actor, label)
      if (reaction.type === 'reject' && !reducedMotion) this.cameras.main.shake(150, .004)
      const finish = () => {
        actor.destroy(); label.destroy()
        this.transients = this.transients.filter(item => item !== actor && item !== label)
        this.playingReaction = false
        this.playNextReaction()
      }
      if (reducedMotion) this.time.delayedCall(240, finish)
      else this.tweens.add({ targets: [actor, label], y: '-=22', alpha: { from: 1, to: 0 }, duration: 1250, hold: 400, ease: 'Sine.out', onComplete: finish })
    }
    closeOverlay() {
      this.overlay?.destroy()
      this.overlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x26351d, .4).setDepth(25)
      this.banner.setDepth(30)
    }
    dispose() {
      reactions.clear()
      this.clearCollection(this.structures)
      this.clearCollection(this.workers)
      this.clearCollection(this.transients)
      this.scale.off('resize')
    }
  }

  await new Promise<void>((resolve) => {
    game = new Phaser.Game({
      type: Phaser.AUTO, parent: container, width: Math.max(320, container.clientWidth), height: Math.max(320, container.clientHeight),
      transparent: true, scene: OnionScene, audio: { noAudio: true },
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      callbacks: { postBoot: () => resolve() },
    })
  })
  while (!scene) await new Promise(resolve => setTimeout(resolve, 0))

  observer = new ResizeObserver(([entry]) => {
    if (!entry || destroyed) return
    const width = Math.max(320, Math.round(entry.contentRect.width))
    const height = Math.max(320, Math.round(entry.contentRect.height))
    game?.scale.resize(width, height)
  })
  observer.observe(container)

  const react = (event: string, payload: VillagePayload) => {
    scene.syncState(payload.state)
    scene.enqueue(reactionForEvent(event, payload))
  }
  return {
    sync(payload) { scene.syncState(payload.state) },
    seasonStarted(payload) { react(EVENTS.seasonStarted, payload) },
    constructionStarted(payload) { react(EVENTS.constructionStarted, payload) },
    constructionCompleted(payload) { react(EVENTS.constructionCompleted, payload) },
    resourceProduced(payload) { react(EVENTS.resourceProduced, payload) },
    onionSprouted(payload) { react(EVENTS.onionSprouted, payload) },
    upgradeCompleted(payload) { react(EVENTS.upgradeCompleted, payload) },
    rejected(payload) { react(EVENTS.operationRejected, payload) },
    seasonClosed(payload) { react(EVENTS.seasonClosed, payload); scene.closeOverlay() },
    destroy() {
      if (destroyed) return
      destroyed = true
      observer?.disconnect()
      observer = null
      scene?.dispose()
      game?.destroy(true)
      scene = null
      game = null
    },
  }
}
