import { useState, useEffect, useRef } from 'react';
import WebRTCService from '../services/webrtc';

function Viewer({ roomId, onLeave }) {
  const [connectionState, setConnectionState] = useState('connecting');
  const [hasStream, setHasStream] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const webrtcRef = useRef(null);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const webrtc = new WebRTCService();
    webrtcRef.current = webrtc;

    // Set up callbacks
    webrtc.onRemoteStream = (stream) => {
      console.log('Received remote stream');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasStream(true);
        setConnectionState('connected');
      }
    };

    webrtc.onConnectionStateChange = (peerId, state) => {
      console.log('Connection state:', state);
      setConnectionState(state);

      if (state === 'failed' || state === 'disconnected') {
        setHasStream(false);
        setError('Connection lost. The broadcaster may have stopped sharing.');
      }
    };

    // Connect to signaling server
    const serverUrl = `ws://${window.location.hostname}:3001`;
    webrtc.connect(serverUrl, roomId, 'viewer')
      .then(() => {
        console.log('Viewer connected to room:', roomId);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to connect:', err);
        setError(`Failed to connect to server at ${window.location.hostname}:3001. Make sure the server is running.`);
        setConnectionState('failed');
      });

    return () => {
      webrtc.disconnect();
    };
  }, [roomId]);

  const handleLeave = () => {
    if (isFullscreen) {
      exitFullscreen();
    }
    webrtcRef.current.disconnect();
    onLeave();
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (containerRef.current.webkitRequestFullscreen) {
          await containerRef.current.webkitRequestFullscreen();
        } else if (containerRef.current.mozRequestFullScreen) {
          await containerRef.current.mozRequestFullScreen();
        } else if (containerRef.current.msRequestFullscreen) {
          await containerRef.current.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    setIsFullscreen(false);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const getStatusMessage = () => {
    switch (connectionState) {
      case 'connecting':
        return 'Connecting to room...';
      case 'connected':
        return hasStream ? 'Connected - Receiving stream' : 'Connected - Waiting for broadcast';
      case 'disconnected':
        return 'Disconnected';
      case 'failed':
        return 'Connection failed';
      default:
        return connectionState;
    }
  };

  return (
    <div className="viewer">
      <div className="header">
        <h2>Viewing</h2>
        <div className="room-info">
          <span className="room-id">Room: {roomId}</span>
          <span className={`status ${connectionState}`}>
            {connectionState === 'connected' ? '● Connected' : '○ ' + getStatusMessage()}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="video-container" ref={containerRef}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={hasStream ? 'active' : 'inactive'}
        />
        {!hasStream && (
          <div className="placeholder">
            <div className="loader"></div>
            <p>{getStatusMessage()}</p>
            <p className="hint">Waiting for the broadcaster to start sharing...</p>
          </div>
        )}
        {hasStream && (
          <button
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '⊗' : '⛶'}
          </button>
        )}
      </div>

      <div className="controls">
        {hasStream && (
          <button className="btn btn-primary" onClick={toggleFullscreen}>
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        )}
        <button className="btn btn-secondary" onClick={handleLeave}>
          Leave Room
        </button>
      </div>

      <div className="info-box">
        <h3>Viewer Mode</h3>
        <ul>
          <li>You are connected to room "{roomId}"</li>
          <li>Waiting for broadcaster to share their screen</li>
          <li>Stream will appear automatically when broadcasting starts</li>
          <li>Audio will play automatically (unmute if needed)</li>
        </ul>
      </div>
    </div>
  );
}

export default Viewer;
