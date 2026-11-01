import { computed, ref, type Ref } from 'vue'
import { io } from 'socket.io-client'
import {
  EVENTS,
  createInitialState,
  type PlayerRole,
  type PublicGameState,
} from '../shared/arionion/contracts'

export type ClientEventKind = 'request' | 'fact' | 'rejection'
export interface ClientEventRecord {
  id: number
  direction: 'emit' | 'on'
  name: string
  time: string
  cause?: string
  data?: string
  reaction?: string
  kind: ClientEventKind
}
export interface ClientNotice { text: string; type: 'info' | 'success' | 'error' }

interface ClientSocket {
  on(event: string, handler: (payload?: any) => void): ClientSocket
  emit(event: string, payload?: unknown): ClientSocket
  disconnect(): void
}
type SocketFactory = (options: { auth: { nome: string; papel: string } }) => ClientSocket

const reactions: Record<string, string> = {
  [EVENTS.stateSynchronized]: 'sincroniza o estado atual do Cebolal',
  [EVENTS.seasonStarted]: 'abre a temporada para todos',
  [EVENTS.constructionStarted]: 'mostra a nova obra e ocupa um colhedor',
  [EVENTS.constructionCompleted]: 'ativa a construção e libera o colhedor',
  [EVENTS.resourceProduced]: 'atualiza os estoques da cadeia produtiva',
  [EVENTS.onionSprouted]: 'remove as cebolas que brotaram',
  [EVENTS.stageUnlocked]: 'revela a próxima etapa da cadeia',
  [EVENTS.upgradeCompleted]: 'aumenta o rendimento do Cebolal',
  [EVENTS.seasonClosed]: 'encerra a temporada e bloqueia novas ações',
}

function initialPublicState(): PublicGameState {
  return { ...createInitialState(), nextBuilding: 'bed', upgradeCost: 20 }
}

function summarize(payload: Record<string, unknown>): string {
  return Object.entries(payload)
    .filter(([key]) => key !== 'state' && key !== 'cause')
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
    .join(' · ')
}

export function createAriOnionClient(factory?: SocketFactory) {
  const state = ref<PublicGameState>(initialPublicState())
  const connected = ref(false)
  const events = ref<ClientEventRecord[]>([])
  const notices = ref<ClientNotice[]>([])
  const hideProduction = ref(false)
  let socket: ClientSocket | null = null
  let eventId = 0

  const register = (record: Omit<ClientEventRecord, 'id' | 'time'>) => {
    events.value.push({ ...record, id: ++eventId, time: new Date().toLocaleTimeString('pt-BR') })
    if (events.value.length > 100) events.value.splice(0, events.value.length - 100)
  }
  const notice = (text: string, type: ClientNotice['type']) => {
    notices.value.push({ text, type })
    if (notices.value.length > 6) notices.value.shift()
  }
  const project = (name: string, payload?: Record<string, unknown>) => {
    const safe = payload ?? {}
    if (safe.state && typeof safe.state === 'object') state.value = structuredClone(safe.state as PublicGameState)
    register({ direction: 'on', name, cause: typeof safe.cause === 'string' ? safe.cause : undefined,
      data: summarize(safe), reaction: reactions[name] ?? 'atualiza a interface', kind: 'fact' })
  }
  const request = (name: string) => {
    register({ direction: 'emit', name, kind: 'request' })
    socket?.emit(name)
  }

  return {
    state, connected, events, notices, hideProduction,
    visibleEvents: computed(() => events.value.filter(event => !(hideProduction.value && event.name === EVENTS.resourceProduced))),
    connect(name: string, role: PlayerRole) {
      socket?.disconnect()
      const createSocket = factory ?? ((options: { auth: { nome: string; papel: string } }) => {
        const host = globalThis.location?.hostname || 'localhost'
        return io(`http://${host}:3001`, options)
      })
      socket = createSocket({ auth: { nome: name.trim() || 'Anônimo', papel: role === 'master' ? 'mestre' : 'jogador' } })
      socket.on('connect', () => { connected.value = true })
      socket.on('disconnect', () => { connected.value = false })
      for (const name of [EVENTS.stateSynchronized, EVENTS.seasonStarted, EVENTS.constructionStarted,
        EVENTS.constructionCompleted, EVENTS.resourceProduced, EVENTS.onionSprouted, EVENTS.stageUnlocked,
        EVENTS.upgradeCompleted, EVENTS.seasonClosed]) {
        socket.on(name, payload => project(name, payload as Record<string, unknown> | undefined))
      }
      socket.on(EVENTS.operationRejected, payload => {
        const safe = (payload ?? {}) as Record<string, unknown>
        const reason = typeof safe.reason === 'string' ? safe.reason : 'Operação recusada'
        register({ direction: 'on', name: EVENTS.operationRejected,
          cause: typeof safe.cause === 'string' ? safe.cause : undefined, data: reason,
          reaction: 'mostra o motivo somente para quem pediu', kind: 'rejection' })
        notice(reason, 'error')
      })
    },
    disconnect() { socket?.disconnect(); socket = null; connected.value = false },
    requestOpen: () => request(EVENTS.openingRequested),
    requestConstruction: () => request(EVENTS.constructionRequested),
    requestUpgrade: () => request(EVENTS.upgradeRequested),
    requestClose: () => request(EVENTS.closingRequested),
  }
}

let singleton: ReturnType<typeof createAriOnionClient> | undefined
export function useAriOnionSocket() {
  return singleton ??= createAriOnionClient()
}
