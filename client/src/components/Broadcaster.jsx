import { useState, useEffect, useRef } from 'react';
import WebRTCService from '../services/webrtc';

function Broadcaster({ roomId, onLeave }) {
  const [isSharing, setIsSharing] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [error, setError] = useState(null);

  const webrtcRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const webrtc = new WebRTCService();
    webrtcRef.current = webrtc;

    // Set up callbacks
    webrtc.onViewerCountChange = (count) => {
      setViewerCount(count);
    };

    webrtc.onConnectionStateChange = (peerId, state) => {
      console.log(`Viewer ${peerId} state:`, state);
      if (state === 'connected') {
        setConnectionState('connected');
      }
    };

    // Connect to signaling server
    const serverUrl = `ws://${window.location.hostname}:3001`;
    webrtc.connect(serverUrl, roomId, 'broadcaster')
      .then(() => {
        console.log('Broadcaster connected to room:', roomId);
        setConnectionState('connected');
      })
      .catch((err) => {
        console.error('Failed to connect:', err);
        setError('Failed to connect to server');
      });

    return () => {
      webrtc.disconnect();
    };
  }, [roomId]);

  const startSharing = async () => {
    try {
      setError(null);
      const stream = await webrtcRef.current.startScreenShare();

      // Display local preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsSharing(true);
    } catch (err) {
      console.error('Error starting screen share:', err);
      setError('Failed to start screen sharing. Please ensure you granted permissions.');
    }
  };

  const stopSharing = () => {
    webrtcRef.current.stopScreenShare();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsSharing(false);
  };

  const handleLeave = () => {
    stopSharing();
    webrtcRef.current.disconnect();
    onLeave();
  };

  return (
    <div className="broadcaster">
      <div className="header">
        <h2>Broadcasting</h2>
        <div className="room-info">
          <span className="room-id">Room: {roomId}</span>
          <span className={`status ${connectionState}`}>
            {connectionState === 'connected' ? '● Connected' : '○ Connecting...'}
          </span>
        </div>
      </div>

      <div className="stats">
        <div className="stat-card">
          <span className="stat-value">{viewerCount}</span>
          <span className="stat-label">Viewers</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={isSharing ? 'active' : 'inactive'}
        />
        {!isSharing && (
          <div className="placeholder">
            <p>Click "Start Sharing" to begin broadcasting your screen</p>
          </div>
        )}
      </div>

      <div className="controls">
        {!isSharing ? (
          <button className="btn btn-primary" onClick={startSharing}>
            Start Sharing
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stopSharing}>
            Stop Sharing
          </button>
        )}
        <button className="btn btn-secondary" onClick={handleLeave}>
          Leave Room
        </button>
      </div>

      <div className="info-box">
        <h3>Instructions</h3>
        <ul>
          <li>Click "Start Sharing" and select the screen/window to share</li>
          <li>Share the room code "{roomId}" with viewers</li>
          <li>Viewers will see your screen in real-time</li>
          <li>Audio from your screen will be shared automatically</li>
        </ul>
      </div>
    </div>
  );
}

export default Broadcaster;
