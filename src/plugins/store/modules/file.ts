import { defineStore } from "pinia";

interface State {
  fileList: LogFile[];
  selectedFileList: LogFile[];
  currentRecord: LogFile | null;
  globalCharset: string;
}

export interface LogFile {
  readonly file: File;
  readonly fileSize: string;
  readonly fileLastModified: string;
  /**
   * The decoding charset set by the file.
   */
  charset: string;
  isTarGZ: boolean;
  decode: {
    /**
     * charset when decoding.
     */
    charsetBy: string;
    /**
     * decoded content.
     */
    content: () => string;
  } | null;
}

export const useFileStore = defineStore("file", {
  state: (): State => ({
    fileList: [],
    selectedFileList: [],
    currentRecord: null,
    globalCharset: "utf-8",
  }),
  getters: {
    fileListSize: (state) => {
      return state.fileList.length;
    },
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
    },
    setCurrentRecordCharsetLabel(charsetLabel: string) {
      if (this.currentRecord) {
        this.currentRecord.charset = charsetLabel;
      }
    },
    applyAllFileCharset(charsetLabel: string) {
      this.globalCharset = charsetLabel;
      this.fileList.map((file) => {
        file.charset = charsetLabel;
        return file;
      });
    },
  },
  persist: {
    paths: ["globalCharset"],
  },
});
