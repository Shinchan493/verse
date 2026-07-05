// Some browser bundles (e.g. WebRTC libs) reference `global`.
(window as any).global = (window as any).global || window;

export {};
