interface CharsetTransformerParams {
  label: "utf-8" | "windows-1252" | "gb18030" | string;
}

export class CharsetTransformer {
  private options: CharsetTransformerParams;

  constructor(options?: CharsetTransformerParams) {
    this.options = Object.assign({ label: "utf-8" }, options);
  }

  private get decoder() {
    return new TextDecoder(this.options.label);
  }

  public decode(arrayBuffer: ArrayBuffer): string {
    return this.decoder.decode(arrayBuffer);
  }
}
