export function generateNumberArray(start: number, end: number): number[] {
  if (start < end) return Array.from(new Array(end + 1).keys()).slice(start);
  else return Array.from(new Array(start + 1).keys()).slice(end);
}

export function downloadFile(blob: Blob, fileName: string): void {
  const blobUrl = window.URL.createObjectURL(blob);
  const aEl = document.createElement("a");
  aEl.setAttribute("href", blobUrl);
  aEl.setAttribute("download", fileName);
  aEl.click();
  window.URL.revokeObjectURL(blobUrl);
}
