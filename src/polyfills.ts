// (window as any).global = window;
// (window as any).process = {
//     env: {DEBUG: undefined},
// };
(window as any).process = { env: { DEBUG: undefined }, };
(window as any).global = window;


import { Buffer } from 'buffer';

// @ts-ignore
window.Buffer = Buffer;
