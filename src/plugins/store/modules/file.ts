import { defineStore } from "pinia";
import { readonly } from "vue";

interface State {
  fileList: LogFile[];
  selectedFileList: LogFile[];
  currentRecord: LogFile | null;
  globalCharset: string;
}

export type LogFileDecodeResult = {
  /**
   * charset when decoding.
   */
  charsetBy: string;
  /**
   * decoded content.
   */
  content: string;
};

export interface LogFile {
  readonly file: File;
  readonly fileInfo: {
    /**
     * .gz file size
     */
    compressSize: number;
    /**
     * .gz file compress ratio
     */
    compressRatio: number;
    /**
     * .gz original size
     */
    originalSize: number;
    readonly prettySize: string;
    readonly prettyLastModified: string;
    readonly prettyCompressSize: string;
    readonly prettyOriginalSize: string;
    readonly isGzip: boolean;
    readonly md5: string;
    isLoaded: boolean;
  };
  /**
   * The decoding charset set by the file.
   */
  charset: string;
  decode: LogFileDecodeResult | null;
}

export const useFileStore = defineStore("file", {
  state: (): State => ({
    fileList: [],
    selectedFileList: [],
    currentRecord: null,
    globalCharset: "AUTO_DETECT",
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
      if (this.currentRecord && this.selectedFileList.includes(this.currentRecord)) {
        this.currentRecord = null;
      }
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
    replaceLogFile(logFile: LogFile) {
      const index = this.fileList.findIndex((f) => f.fileInfo.md5 === logFile.fileInfo.md5);
      if (index !== -1) {
        this.fileList[index] = logFile;
      }
    },
  },
  persist: {
    paths: ["globalCharset"],
  },
});
