import { useState } from 'react';

function RoomSelector({ onJoin }) {
  const [roomId, setRoomId] = useState('');
  const [role, setRole] = useState('viewer');

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoin(roomId.trim().toUpperCase(), role);
    }
  };

  return (
    <div className="room-selector">
      <div className="welcome-card">
        <h1>Local Screen Share</h1>
        <p className="subtitle">Share your screen over local network using WebRTC</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Role</label>
            <div className="role-buttons">
              <button
                type="button"
                className={`role-btn ${role === 'broadcaster' ? 'active' : ''}`}
                onClick={() => setRole('broadcaster')}
              >
                <div className="role-icon">📺</div>
                <div className="role-title">Broadcaster</div>
                <div className="role-desc">Share your screen</div>
              </button>
              <button
                type="button"
                className={`role-btn ${role === 'viewer' ? 'active' : ''}`}
                onClick={() => setRole('viewer')}
              >
                <div className="role-icon">👁️</div>
                <div className="role-title">Viewer</div>
                <div className="role-desc">Watch a shared screen</div>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="roomId">Room Code</label>
            <div className="input-group">
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                maxLength="6"
                required
              />
              {role === 'broadcaster' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={generateRoomId}
                >
                  Generate
                </button>
              )}
            </div>
            {role === 'broadcaster' && (
              <p className="help-text">
                Generate a code and share it with viewers
              </p>
            )}
            {role === 'viewer' && (
              <p className="help-text">
                Enter the code provided by the broadcaster
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-large">
            Join Room
          </button>
        </form>

        <div className="features">
          <h3>Features</h3>
          <ul>
            <li>✓ Screen sharing with audio</li>
            <li>✓ Works on local network</li>
            <li>✓ One-to-many broadcasting</li>
            <li>✓ No external dependencies</li>
          </ul>
        </div>

        <div className="info-box">
          <h4>How it works</h4>
          <ol>
            <li>Broadcaster creates a room and gets a code</li>
            <li>Viewers join using the room code</li>
            <li>Broadcaster shares their screen</li>
            <li>All viewers see the screen in real-time</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default RoomSelector;
