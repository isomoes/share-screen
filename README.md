# Local Screen Share

A WebRTC-based screen sharing application designed for local network use. Share your screen with multiple viewers in real-time without any external dependencies.

## Features

- **Screen Sharing with Audio**: Share both your screen display and system audio
- **One-to-Many Broadcasting**: One broadcaster can stream to multiple viewers simultaneously
- **Local Network Focus**: Optimized for local network use, no TURN server required
- **Real-time Communication**: Low-latency streaming using WebRTC technology
- **Simple Room System**: Easy-to-use room codes for connecting broadcaster and viewers
- **Modern UI**: Clean, responsive interface built with React

## Tech Stack

- **Frontend**: React 19 + Vite
- **Backend**: Node.js + Express + WebSocket
- **Communication**: WebRTC for peer-to-peer connections
- **Signaling**: Custom WebSocket server

## Project Structure

```
share-screen/
├── server/               # Signaling server
│   ├── server.js        # WebSocket signaling implementation
│   └── package.json
├── client/              # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Broadcaster.jsx    # Broadcaster UI
│   │   │   ├── Viewer.jsx         # Viewer UI
│   │   │   └── RoomSelector.jsx   # Room selection
│   │   ├── services/
│   │   │   └── webrtc.js          # WebRTC service
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js 18+ and npm installed
- Modern web browser with WebRTC support (Chrome, Firefox, Edge, Safari)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd share-screen
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

## Running the Application

You need to run both the server and client:

### Terminal 1 - Start the Signaling Server

```bash
cd server
npm start
```

The server will start on port 3001.

### Terminal 2 - Start the Client

```bash
cd client
npm run dev
```

The client will start on port 5173 and will be accessible from other devices on your local network.

## Usage

### For the Broadcaster:

1. Open the application in your browser
2. Select "Broadcaster" role
3. Click "Generate" to create a room code (or enter a custom one)
4. Click "Join Room"
5. Click "Start Sharing" and select the screen/window to share
6. Share the room code with viewers

### For Viewers:

1. Open the application in your browser
2. Select "Viewer" role
3. Enter the room code provided by the broadcaster
4. Click "Join Room"
5. Wait for the broadcaster to start sharing
6. The screen will appear automatically when broadcasting begins
7. Click "Fullscreen" button or the fullscreen icon in the video to enter fullscreen mode
8. Press ESC or click "Exit Fullscreen" to exit fullscreen mode

## Network Configuration

### Accessing from Other Devices on Local Network

1. Find your computer's local IP address:
   - **Linux/Mac**: Run `ifconfig | grep inet` or `ip addr show`
   - **Windows**: Run `ipconfig` in Command Prompt

2. On other devices, access the application using:
   ```
   http://<your-ip-address>:5173
   ```

   For example: `http://192.168.1.100:5173`

### Firewall Configuration

Make sure the following ports are open:

- **3001**: WebSocket signaling server
- **5173**: Vite development server (client)

On Linux, you can open these ports with:
```bash
sudo ufw allow 3001
sudo ufw allow 5173
```

## How It Works

1. **Room Creation**: Broadcaster creates a room with a unique code
2. **Signaling**: WebSocket server coordinates connection setup between peers
3. **WebRTC Handshake**:
   - Broadcaster creates SDP offers for each viewer
   - Viewers respond with SDP answers
   - ICE candidates are exchanged for optimal connection paths
4. **Media Streaming**: Screen and audio tracks are transmitted via WebRTC data channels
5. **One-to-Many**: Broadcaster maintains separate peer connections with each viewer

## Troubleshooting

### "Failed to connect to server" error

This error appears when the viewer cannot connect to the WebSocket signaling server. To fix:

1. **Verify the signaling server is running**:
   ```bash
   cd server
   npm start
   ```
   You should see: "Signaling server running on port 3001"

2. **Check if connecting from another device**:
   - Make sure both devices are on the same network
   - The viewer must use the server's IP address, not `localhost`
   - Example: `http://192.168.1.100:5173` (not `http://localhost:5173`)

3. **Check firewall**:
   - Ensure port 3001 (signaling server) is open
   - Ensure port 5173 (client) is open

4. **Browser console**:
   - Open DevTools (F12) and check the Console tab for detailed error messages

### Screen sharing not working

- Ensure you're using HTTPS or localhost (required for `getDisplayMedia`)
- Check browser permissions for screen sharing
- Try a different browser (Chrome recommended)

### No connection between peers

- Verify both broadcaster and viewers are on the same network
- Check firewall settings
- Ensure signaling server is running
- Check browser console for WebRTC errors

### Audio not sharing

- When selecting screen, make sure to check "Share system audio" in the browser dialog
- Some browsers/systems may not support audio capture
- Try sharing a specific application tab instead of entire screen

### High latency

- Both devices should be on the same local network
- Check network bandwidth and congestion
- Reduce number of concurrent viewers
- Close unnecessary applications

## Development

### Building for Production

```bash
# Build client
cd client
npm run build

# The built files will be in client/dist/
# Serve them with any static file server
```

### Running Tests

Currently, no tests are implemented. To add tests:

```bash
cd client
npm install --save-dev vitest @testing-library/react
```

## Browser Support

- Chrome/Chromium 74+
- Firefox 66+
- Safari 12.1+
- Edge 79+

## Security Considerations

- This application is designed for **trusted local networks only**
- No authentication or encryption is implemented
- Do not expose the signaling server to the public internet
- For production use, implement:
  - HTTPS/WSS for all connections
  - User authentication
  - Room passwords
  - Connection encryption

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Future Enhancements

- [ ] Recording capability
- [ ] Screen annotation tools
- [ ] Chat functionality
- [ ] Password-protected rooms
- [ ] Quality/resolution settings
- [ ] Viewer grid view for broadcaster
- [ ] Mobile device support improvements
