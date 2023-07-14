import { defineStore } from "pinia";

interface State {
  fileList: LogFile[];
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
    currentRecord: null,
  }),
  actions: {},
  persist: false,
});
