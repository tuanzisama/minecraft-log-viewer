export function generateNumberArray(start: number, end: number): number[] {
  if (start < end) return Array.from(new Array(end + 1).keys()).slice(start);
  else return Array.from(new Array(start + 1).keys()).slice(end);
}
