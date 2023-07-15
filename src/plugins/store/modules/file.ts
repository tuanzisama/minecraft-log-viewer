import { pullAllBy } from "lodash";
import { defineStore } from "pinia";

interface State {
  fileList: LogFile[];
  selectedFileList: LogFile[];
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
    selectedFileList: [],
    currentRecord: null,
  }),
  getters: {
    sortSelectedFileIndex: (state) => {
      return state.fileList.reduce((pre, acc, index) => {
        if (state.selectedFileList.includes(acc)) {
          return pre.concat(index);
        } else {
          return pre;
        }
      }, [] as number[]);
    },
  },
  actions: {
    removeFileListFromSelected() {
      this.fileList = this.fileList.filter((f) => !this.selectedFileList.includes(f));
      //   pullAllBy(this.fileList, this.selectedFileList);
    },
  },
  persist: false,
});
