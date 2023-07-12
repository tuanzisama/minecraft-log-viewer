interface DecompressZipParams {
  format: "gzip" | "deflate" | "deflate-raw";
}

export class DecompressZip {
  private options: DecompressZipParams;
  private ds: DecompressionStream;

  constructor(options?: DecompressZipParams) {
    this.options = Object.assign({ format: "gzip" }, options);
    this.ds = new DecompressionStream(this.options.format);
  }

  public execute(blob: Blob): Response {
    const stream = blob.stream().pipeThrough(this.ds);
    return new Response(stream);
  }

  public toBlob(blob: Blob): Promise<Blob> {
    return this.execute(blob).blob();
  }

  public toArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return this.execute(blob).arrayBuffer();
  }

  public async toText(blob: Blob): Promise<string> {
    const response = await this.execute(blob);
    return response.text();
  }
}
