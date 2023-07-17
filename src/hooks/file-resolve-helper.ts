import FileResolverWorker from "../dedicated-workers/file-resolver?worker";
import { LogFile, LogFileDecodeResult } from "../plugins/store/modules/file";
import EventEmitter from "eventemitter3";

interface FileResolveHelperEvents {
  onResolved: (logFile: LogFile) => void;
}

class FileResolveHelper extends EventEmitter<FileResolveHelperEvents> {
  #resolveWorker: Worker;

  constructor() {
    super();
    this.#resolveWorker = new FileResolverWorker();

    this.#resolveWorker.onmessage = (event: MessageEvent<MessageData>) => {
      console.info("#resolveWorker.onmessage", event.data.type);

      if (event.data.type === "resolve") {
        const data = event.data as MessageData<{ logFile: LogFile; result: LogFileDecodeResult }>;
        this.emit("onResolved", data.data.logFile);
      }
    };
  }

  resolve(logFile: LogFile): void {
    this.#resolveWorker.postMessage({ type: "resolve", data: { logFile } });
  }
}

export const useFileResolveHelper = () => {
  return new FileResolveHelper();
};
