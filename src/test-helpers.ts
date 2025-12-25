// Shared test helpers for the test suite

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

export function normalizeUrlSafeBase64ToBuffer(urlSafe: string) {
  let std = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (std.length % 4)) % 4;
  std += '='.repeat(pad);
  return Buffer.from(std, 'base64');
}

