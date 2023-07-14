import { defineConfig } from "vite";
import { fileURLToPath, URL } from "url";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { TDesignResolver } from "unplugin-vue-components/resolvers";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), AutoImport({ resolvers: [TDesignResolver({ library: "vue-next" })] }), Components({ resolvers: [TDesignResolver({ library: "vue-next" })] })],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import "@/styles/mixins.less";`,
      },
    },
  },
});
