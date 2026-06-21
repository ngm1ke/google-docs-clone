# Simple Google Docs Clone

Real-time collaborative text editor using Operational Transformation.

## Tech Stack

- **Frontend:** React
- **Backend:** NestJS
- **Protocol:** WebSocket


## How OT Works

### Flow (per keystroke)

1. **User types** → local operation generated (insert/delete)
2. **Debounce** → ops accumulated, sent as batch after 300ms idle
3. **Client sends** `operation` via WebSocket (version + operations + clientId)
4. **Server receives** → transforms incoming ops against concurrent history (clientId filter) → applies to document → increments revision → saves to history
5. **Server sends** `ack` back to sender, broadcasts `operation` to other clients
6. **Sender** receives `ack` → updates revision → sends buffered ops if any
7. **Other clients** receive broadcast → transform against local outstanding/buffer → apply to text → update cursor

### OT Layers (Client)

- **outstandingRef** — ops sent but not yet acked
- **bufferRef** — ops queued while waiting for ack
- **pendingOpsRef** — ops accumulated during debounce window
- **revisionRef** — current known server revision

## Current Features

- Real-time collaborative editing via WebSocket
- Operational Transformation for conflict resolution (both client and server)
- Active presence list

## Planned Features

- [ ] **Combine multiple letters into character** — group consecutive single-character inserts into one operation before sending to reduce operation count
- [ ] Undo/redo support
- [ ] Rich text formatting (bold, italic, headings)
- [ ] Document persistence (save/load)
