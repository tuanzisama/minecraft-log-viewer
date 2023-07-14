import { defineStore } from "pinia";

interface State {
  fileList: LogFile[];
  selectedFileIndex: number[];
  currentRecord: LogFile | null;
}

export interface LogFile {
  file: File;
  fileSize: string;
  fileLastModified: string;
  isTarGZ: boolean;
  content: string | null;
}

export const useFileStore = defineStore("file", {
  state: (): State => ({
    fileList: [],
    selectedFileIndex: [],
    currentRecord: null,
  }),
  getters: {
    sortSelectedFileIndex: (state) => {
      return state.selectedFileIndex.sort();
    },
  },
  actions: {},
  persist: false,
});
