// Shared test helpers for the test suite
import * as pako from 'pako';

export function makeRoute(params: any) {
  return { queryParams: { subscribe: (fn: any) => fn(params) } } as any;
}

export function mockAtobWithGzipHeader() {
  const orig = (global as any).atob;
  (global as any).atob = jest.fn().mockReturnValue(String.fromCharCode(0x1f, 0x8b, 0x08, 0x00));
  return orig;
}

export function restoreAtob(orig: any) {
  (global as any).atob = orig;
}

export function encodeAbiToUrlSafe(abi: any) {
  const s = typeof abi === 'string' ? abi : JSON.stringify(abi);
  const compressed = (pako as any).deflate(s); // deflate tends to produce eJ... prefix
  const b = Buffer.from(compressed);
  const base64 = b.toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function gzipEncodeAbiBase64(abi: any) {
  const s = typeof abi === 'string' ? abi : JSON.stringify(abi);
  const compressed = (pako as any).gzip(s);
  return Buffer.from(compressed).toString('base64');
}

export function toUrlSafeFromBase64(b64: string) {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function normalizeUrlSafeBase64ToBuffer(urlSafe: string) {
  let std = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (std.length % 4)) % 4;
  std += '='.repeat(pad);
  return Buffer.from(std, 'base64');
}

