import { defineStore } from "pinia";

interface State {
  theme: "light" | "dark";
}

export const useAppStore = defineStore("app", {
  state: (): State => ({
    theme: "light",
  }),
  actions: {},
  persist: true,
});
