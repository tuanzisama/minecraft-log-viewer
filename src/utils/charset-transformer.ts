interface CharsetTransformerParams {
  label: "UTF-8" | "WINDOWS-1252" | "GB18030" | string;
}

export class CharsetTransformer {
  private options: CharsetTransformerParams;

  constructor(options?: CharsetTransformerParams) {
    this.options = Object.assign({ label: "UTF-8" }, options);
  }

  private get decoder() {
    return new TextDecoder(this.options.label);
  }

  public decode(arrayBuffer: ArrayBuffer): string {
    return this.decoder.decode(arrayBuffer);
  }
}
