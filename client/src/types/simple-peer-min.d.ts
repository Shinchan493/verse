// The pre-bundled browser build of simple-peer is self-contained (it ships its
// own Buffer/process/stream shims), so it works under CRA 5 / webpack 5 without
// Node polyfills. Re-use the @types/simple-peer types for it.
declare module 'simple-peer/simplepeer.min.js' {
  import SimplePeer from 'simple-peer';
  export = SimplePeer;
}
