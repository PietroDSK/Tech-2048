import { defineConfig } from 'vite'
import path from 'path'

const isCap = process.env.CAPACITOR === '1'

export default defineConfig({
  base: isCap ? './' : '/Tech-2048/',
  build: { outDir: 'dist' },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } }
})
