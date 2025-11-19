// WebRTC service for managing peer connections and signaling

class WebRTCService {
  constructor() {
    this.ws = null;
    this.roomId = null;
    this.clientId = null;
    this.role = null; // 'broadcaster' or 'viewer'
    this.peerConnections = new Map();
    this.localStream = null;
    this.onRemoteStream = null;
    this.onConnectionStateChange = null;
    this.onViewerCountChange = null;

    // ICE configuration - using public STUN servers for local network
    this.iceConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
  }

  // Connect to signaling server
  connect(serverUrl, roomId, role) {
    return new Promise((resolve, reject) => {
      this.roomId = roomId;
      this.role = role;
      this.clientId = `${role}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      this.ws = new WebSocket(serverUrl);

      this.ws.onopen = () => {
        console.log('Connected to signaling server');

        // Join room
        this.send({
          type: 'join',
          roomId: this.roomId,
          clientId: this.clientId,
          role: this.role
        });

        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        this.handleSignalingMessage(JSON.parse(event.data));
      };

      this.ws.onclose = () => {
        console.log('Disconnected from signaling server');
        this.cleanup();
      };
    });
  }

  // Handle incoming signaling messages
  async handleSignalingMessage(message) {
    console.log('Received message:', message.type);

    switch (message.type) {
      case 'room-state':
        // Initial room state
        if (this.role === 'broadcaster' && message.clients.length > 0) {
          // Create connections to existing viewers
          for (const client of message.clients) {
            if (client.role === 'viewer') {
              await this.createOffer(client.id);
            }
          }
        }
        this.updateViewerCount(message.clients);
        break;

      case 'user-joined':
        console.log('User joined:', message.clientId, message.role);

        if (this.role === 'broadcaster' && message.role === 'viewer') {
          // Broadcaster creates offer for new viewer
          await this.createOffer(message.clientId);
        }

        this.updateViewerCount();
        break;

      case 'user-left':
        console.log('User left:', message.clientId);
        this.closePeerConnection(message.clientId);
        this.updateViewerCount();
        break;

      case 'offer':
        await this.handleOffer(message.offer, message.senderId);
        break;

      case 'answer':
        await this.handleAnswer(message.answer, message.senderId);
        break;

      case 'ice-candidate':
        await this.handleIceCandidate(message.candidate, message.senderId);
        break;
    }
  }

  // Create peer connection
  createPeerConnection(peerId) {
    const pc = new RTCPeerConnection(this.iceConfig);

    // Add local stream tracks if broadcaster
    if (this.localStream && this.role === 'broadcaster') {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: 'ice-candidate',
          candidate: event.candidate,
          roomId: this.roomId,
          senderId: this.clientId,
          targetId: peerId
        });
      }
    };

    // Handle remote stream (for viewers)
    pc.ontrack = (event) => {
      console.log('Received remote track');
      if (this.onRemoteStream) {
        this.onRemoteStream(event.streams[0]);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, pc.connectionState);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(peerId, pc.connectionState);
      }

      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        // Attempt to reconnect
        console.log('Connection failed, attempting to reconnect...');
      }
    };

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  // Create and send offer (broadcaster to viewer)
  async createOffer(viewerId) {
    const pc = this.createPeerConnection(viewerId);

    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      });

      await pc.setLocalDescription(offer);

      this.send({
        type: 'offer',
        offer: offer,
        roomId: this.roomId,
        senderId: this.clientId,
        targetId: viewerId
      });

      console.log('Sent offer to:', viewerId);
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  // Handle incoming offer (viewer receives from broadcaster)
  async handleOffer(offer, broadcasterId) {
    const pc = this.createPeerConnection(broadcasterId);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.send({
        type: 'answer',
        answer: answer,
        roomId: this.roomId,
        senderId: this.clientId,
        targetId: broadcasterId
      });

      console.log('Sent answer to:', broadcasterId);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  // Handle incoming answer (broadcaster receives from viewer)
  async handleAnswer(answer, viewerId) {
    const pc = this.peerConnections.get(viewerId);

    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Set remote description for:', viewerId);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(candidate, peerId) {
    const pc = this.peerConnections.get(peerId);

    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }

  // Start screen sharing (broadcaster only)
  async startScreenShare() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      this.localStream = stream;

      // Handle stream end (user stops sharing)
      stream.getVideoTracks()[0].onended = () => {
        console.log('Screen sharing stopped by user');
        this.stopScreenShare();
      };

      return stream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  // Stop screen sharing
  stopScreenShare() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((pc) => {
      pc.close();
    });
    this.peerConnections.clear();
  }

  // Close specific peer connection
  closePeerConnection(peerId) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
  }

  // Update viewer count
  updateViewerCount(clients = null) {
    if (this.onViewerCountChange) {
      const count = clients
        ? clients.filter(c => c.role === 'viewer').length
        : this.peerConnections.size;
      this.onViewerCountChange(count);
    }
  }

  // Send message to signaling server
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // Cleanup
  cleanup() {
    this.stopScreenShare();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
  }

  // Disconnect
  disconnect() {
    if (this.ws) {
      this.send({
        type: 'leave',
        roomId: this.roomId,
        clientId: this.clientId
      });
    }
    this.cleanup();
  }
}

export default WebRTCService;
