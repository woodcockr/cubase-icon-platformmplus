import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/icon_platformmplus.ts"],
    outDir: "dist/icon/platformmplus",
    clean: true,
    external: ["midiremote_api_v1"],
    noExternal: ["abbreviate", "core-js", "color-diff"],
    target: "es5",
  }
);
