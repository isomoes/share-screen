import { useState } from 'react';
import RoomSelector from './components/RoomSelector';
import Broadcaster from './components/Broadcaster';
import Viewer from './components/Viewer';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('selector');
  const [roomId, setRoomId] = useState('');
  const [role, setRole] = useState('');

  const handleJoinRoom = (roomCode, userRole) => {
    setRoomId(roomCode);
    setRole(userRole);
    setCurrentView('room');
  };

  const handleLeaveRoom = () => {
    setCurrentView('selector');
    setRoomId('');
    setRole('');
  };

  return (
    <div className="app">
      {currentView === 'selector' && (
        <RoomSelector onJoin={handleJoinRoom} />
      )}

      {currentView === 'room' && role === 'broadcaster' && (
        <Broadcaster roomId={roomId} onLeave={handleLeaveRoom} />
      )}

      {currentView === 'room' && role === 'viewer' && (
        <Viewer roomId={roomId} onLeave={handleLeaveRoom} />
      )}
    </div>
  );
}

export default App;
