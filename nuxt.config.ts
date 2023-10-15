// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "@vueuse/nuxt"],
  ssr: false,
  app: {
    baseURL: "/pourover-guide/",
    buildAssetsDir: "assets",
  },
});
