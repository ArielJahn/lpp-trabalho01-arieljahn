export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  nitro: {
    preset: 'node-server',
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
})
