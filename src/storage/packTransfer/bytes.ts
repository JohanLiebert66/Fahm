export function transferBytes(value: Uint8Array, mime: string): Blob;
export function transferBytes(value: Blob): Promise<Uint8Array>;
export function transferBytes(value: Uint8Array | Blob, mime?: string): Blob | Promise<Uint8Array> {
  if (value instanceof Uint8Array) return new Blob([new Uint8Array(value)], { type: mime });
  if (typeof value.arrayBuffer === 'function') {
    return value.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error ?? new Error('packImport.error.read'));
    reader.onabort = () => reject(new Error('packImport.error.read'));
    reader.readAsArrayBuffer(value);
  });
}
