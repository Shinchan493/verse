enum SocketEvent {
  SEND_CHANGES = 'send-changes',
  RECEIVE_CHANGES = 'receive-changes',
  CURRENT_USERS_UPDATE = 'current-users-update',
  // Yjs (CRDT) collaboration
  YJS_SYNC = 'yjs:sync',
  YJS_UPDATE = 'yjs:update',
  YJS_AWARENESS = 'yjs:awareness',
}

export default SocketEvent;
