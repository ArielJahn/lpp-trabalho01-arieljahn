import { Server } from 'socket.io'
import { createGameInstance } from '../arionion/game-instance'
import { attachGameSocket, emitRuntime } from '../arionion/socket-gateway'

export default defineNitroPlugin((nitroApp) => {
  const port = Number(process.env.ARIONION_SOCKET_PORT ?? 3001)
  const io = new Server(port, {
    cors: { origin: true, credentials: true },
  })
  const game = createGameInstance(emissions => emitRuntime(io, emissions))
  attachGameSocket(io, game.runtime)
  game.scheduler.start()

  nitroApp.hooks.hook('close', async () => {
    game.scheduler.stop()
    await new Promise<void>(resolve => io.close(() => resolve()))
  })
})
