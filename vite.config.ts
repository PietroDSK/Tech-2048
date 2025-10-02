import { defineConfig } from "vite";
import path from "path";

const isCap = process.env.CAPACITOR === "1";

export default defineConfig({
  optimizeDeps: {
    exclude: ["@capacitor/core", "@capacitor-community/admob"],
  },
  base: "",
  build: { outDir: "dist" },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
