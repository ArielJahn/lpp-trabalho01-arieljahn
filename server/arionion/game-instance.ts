import { createGameRuntime, type RuntimeEmission } from './runtime'
import { createScheduler } from './scheduler'

export function createGameInstance(publish: (emissions: RuntimeEmission[]) => void) {
  let runtime: ReturnType<typeof createGameRuntime>
  const scheduler = createScheduler(effect => publish(runtime.processEffect(effect)))
  runtime = createGameRuntime({ scheduler })
  return { runtime, scheduler }
}
