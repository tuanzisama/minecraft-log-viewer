import { LogFile } from "../plugins/store/modules/file";
import { DecompressZip } from "../utils/decompress";
import { CharsetTransformer } from "../utils/charset-transformer";
import chardet from "chardet";

declare var self: DedicatedWorkerGlobalScope;
export {};

const resolvers = {
  resolve: async (logFile: LogFile) => {
    try {
      let buffer = null;
      if (logFile.fileInfo.isGzip) {
        console.time("TimeUsage---" + logFile.file.name);
        const decompress = new DecompressZip();
        buffer = await decompress.toArrayBuffer(logFile.file);
      } else {
        buffer = await logFile.file.arrayBuffer();
      }

      logFile.fileInfo.compressSize = buffer.byteLength;
      logFile.fileInfo.compressRatio = 1 - logFile.fileInfo.compressSize / logFile.fileInfo.originalSize;

      const analyseCharsetDetectResult = chardet.detect(new Uint8Array(buffer));
      const chatset = analyseCharsetDetectResult ?? "UTF-8";
      const charsetTrasnformer = new CharsetTransformer({ label: chatset });
      const response = charsetTrasnformer.decode(buffer);

      console.timeEnd("TimeUsage---" + logFile.file.name);
      logFile.decode = { charsetBy: chatset, content: response };
    } catch (error) {
      console.error(error);
    } finally {
      self.postMessage({ type: "resolve", data: { logFile } });
    }
  },
};

self.onmessage = (event: MessageEvent<MessageData>) => {
  if (event.data.type === "resolve") {
    resolvers.resolve(event.data.data.logFile);
  }
};
