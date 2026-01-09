# Training Meeting Whiteboard Demo

A **frontend-only** demo application for online training sessions with video (LiveKit) and collaborative whiteboard.

## Features

- **Two Roles**: Trainer (host/draw) and Trainee (view-only)
- **LiveKit Video**: Real-time video conferencing
- **Multi-page Whiteboard**: Canvas-based drawing with pen, eraser, text tools
- **Real-time Sync**: Cross-tab sync via BroadcastChannel
- **PDF Export**: Export whiteboard to PDF after class ends
- **No Backend**: Everything runs in browser (except LiveKit cloud)

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure LiveKit** (optional):
   - Copy `.env.example` to `.env`
   - Add your LiveKit URL (or use UI input at runtime)

3. **Generate LiveKit Tokens**:
   - Go to your LiveKit Cloud dashboard or use CLI
   - Generate tokens for each role with room permissions
   - Example using CLI:
     ```bash
     livekit-cli token create \
       --api-key <your-api-key> \
       --api-secret <your-api-secret> \
       --join --room my-room --identity trainer1
     ```

4. **Run the app**:
   ```bash
   npm run dev
   ```

5. **Open in browser**: `http://localhost:3000`

## How to Use

### As Trainer:
1. Open the app
2. Select "Trainer" role
3. Enter Room ID (e.g., "room-123")
4. Paste your LiveKit token (generated with trainer identity)
5. Click "Join Room"
6. Click "Start Class" to begin
7. Use drawing tools on the whiteboard
8. Trainees will see your video and whiteboard in real-time
9. Click "End Class" when done
10. Click "Export PDF" to download whiteboard

### As Trainee:
1. Open the app (can be same browser, different tab)
2. Select "Trainee" role
3. Enter the SAME Room ID
4. Paste your LiveKit token (generated with trainee identity)
5. Click "Join Room"
6. View trainer's video and whiteboard (read-only)

## Cross-Tab Real-time Sync

Open multiple tabs/windows:
- One as Trainer
- Others as Trainees
- Whiteboard updates sync instantly via BroadcastChannel

## Tech Stack

- React 18 + TypeScript
- Vite
- LiveKit (video)
- HTML Canvas (whiteboard)
- jsPDF (export)
- react-router-dom (routing)

## Notes

- This is a DEMO with no backend
- LiveKit tokens must be generated externally
- Whiteboard state persists in localStorage per room
- Cross-tab sync works only on same origin (localhost)

## Troubleshooting

**LiveKit connection fails?**
- Verify your token is valid and not expired
- Check token has correct room name and permissions
- Ensure VITE_LIVEKIT_URL is correct

**Whiteboard not syncing across tabs?**
- Ensure tabs are on same origin (http://localhost:3000)
- Check browser console for BroadcastChannel support
- Falls back to localStorage events automatically

**Export PDF fails?**
- Ensure you clicked "End Class" first
- Check browser console for errors
- Try on a modern browser (Chrome/Firefox/Edge)
