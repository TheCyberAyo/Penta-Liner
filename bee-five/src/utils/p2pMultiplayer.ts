// Peer-to-Peer Multiplayer using WebRTC
// This works without any server - perfect for deployed static sites!

export interface GameMove {
  row: number;
  col: number;
  player: 1 | 2;
  timestamp: number;
}

export interface P2PMessage {
  type: 'game-move' | 'game-reset' | 'player-info' | 'room-joined' | 'game-start';
  data: any;
}

export interface RoomInfo {
  roomId: string;
  players: PlayerInfo[];
  isGameStarted: boolean;
  hostId: string;
}

export interface PlayerInfo {
  id: string;
  name: string;
  playerNumber: 1 | 2;
  isHost: boolean;
}

class P2PMultiplayerClient {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localPlayerId: string = '';
  private currentRoom: RoomInfo | null = null;
  private isHost: boolean = false;
  private playerName: string = '';

  // Event handlers (to be set by components)
  public onConnected: (() => void) | null = null;
  public onDisconnected: (() => void) | null = null;
  public onGameMove: ((move: GameMove) => void) | null = null;
  public onGameReset: (() => void) | null = null;
  public onRoomJoined: ((roomInfo: RoomInfo) => void) | null = null;
  public onRoomUpdate: ((roomInfo: RoomInfo) => void) | null = null;
  public onError: ((error: string) => void) | null = null;

  constructor() {
    this.localPlayerId = this.generatePlayerId();
  }

  private generatePlayerId(): string {
    return 'player_' + Math.random().toString(36).substr(2, 9);
  }

  private generateRoomCode(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  // Create a new room (host)
  async createRoom(playerName: string): Promise<string> {
    try {
      this.playerName = playerName;
      this.isHost = true;
      
      const roomId = this.generateRoomCode();
      
      this.currentRoom = {
        roomId,
        players: [{
          id: this.localPlayerId,
          name: playerName,
          playerNumber: 1,
          isHost: true
        }],
        isGameStarted: false,
        hostId: this.localPlayerId
      };

      // Set up peer connection for incoming connections
      await this.setupPeerConnection();
      
      // Store room info in localStorage for other players to find (with expiration)
      const roomData = {
        roomId,
        hostId: this.localPlayerId,
        hostName: playerName,
        timestamp: Date.now(),
        expires: Date.now() + (30 * 60 * 1000) // 30 minutes
      };
      localStorage.setItem(`bee5_room_${roomId}`, JSON.stringify(roomData));

      if (this.onRoomJoined) {
        this.onRoomJoined(this.currentRoom);
      }

      return roomId;
    } catch (error) {
      console.error('Failed to create room:', error);
      if (this.onError) {
        this.onError('Failed to create room');
      }
      throw error;
    }
  }

  // Join an existing room
  async joinRoom(roomCode: string, playerName: string): Promise<void> {
    try {
      this.playerName = playerName;
      this.isHost = false;

      // Check if room exists
      const roomData = localStorage.getItem(`bee5_room_${roomCode}`);
      if (!roomData) {
        throw new Error('Room not found. Make sure the room code is correct.');
      }

      const parsedRoomData = JSON.parse(roomData);
      
      // Check if room is still active
      if (Date.now() > parsedRoomData.expires) {
        localStorage.removeItem(`bee5_room_${roomCode}`);
        throw new Error('Room has expired. Please ask the host to create a new room.');
      }

      await this.setupPeerConnection();
      
      // Create room info
      this.currentRoom = {
        roomId: roomCode,
        players: [
          {
            id: parsedRoomData.hostId,
            name: parsedRoomData.hostName || 'Host',
            playerNumber: 1,
            isHost: true
          },
          {
            id: this.localPlayerId,
            name: playerName,
            playerNumber: 2,
            isHost: false
          }
        ],
        isGameStarted: true, // Start game immediately when 2 players
        hostId: parsedRoomData.hostId
      };

      // Create offer to connect to host
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // Store offer for host to find
      const connectionData = {
        type: 'offer',
        offer: offer,
        playerId: this.localPlayerId,
        playerName: playerName,
        timestamp: Date.now(),
        expires: Date.now() + (5 * 60 * 1000) // 5 minutes for connection
      };
      localStorage.setItem(`bee5_connection_${roomCode}`, JSON.stringify(connectionData));

      // Poll for answer from host
      this.pollForAnswer(roomCode);

      // For now, call onRoomJoined immediately to proceed to the game
      // The WebRTC connection will be established in the background
      console.log('🚀 Proceeding to game - WebRTC connection will establish in background');
      if (this.onRoomJoined) {
        this.onRoomJoined(this.currentRoom);
      }

    } catch (error) {
      console.error('Failed to join room:', error);
      if (this.onError) {
        this.onError('Failed to join room: ' + (error instanceof Error ? error.message : String(error)));
      }
      throw error;
    }
  }

  private async setupPeerConnection(): Promise<void> {
    // Use free STUN servers for NAT traversal
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // Set up event handlers
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 ICE candidate generated');
        // Store ICE candidate for the other peer
        this.storeIceCandidate(event.candidate);
      } else {
        console.log('🧊 ICE gathering complete');
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('🔗 Connection state changed:', state);
      
      if (state === 'connected') {
        console.log('✅ WebRTC connection established!');
        if (this.onConnected) {
          this.onConnected();
        }
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        console.log('❌ WebRTC connection failed:', state);
        if (this.onDisconnected) {
          this.onDisconnected();
        }
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const iceState = this.peerConnection?.iceConnectionState;
      console.log('🧊 ICE connection state:', iceState);
    };

    if (this.isHost) {
      // Host creates data channel
      this.dataChannel = this.peerConnection.createDataChannel('gameData');
      this.setupDataChannel(this.dataChannel);
      
      // Poll for incoming connection offers
      this.pollForOffers();
    } else {
      // Guest waits for data channel from host
      this.peerConnection.ondatachannel = (event) => {
        console.log('📡 Data channel received from host');
        this.dataChannel = event.channel;
        this.setupDataChannel(this.dataChannel);
      };
    }
  }

  private setupDataChannel(dataChannel?: RTCDataChannel): void {
    if (dataChannel) {
      this.dataChannel = dataChannel;
    }
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('📡 Data channel opened - connection established!');
      if (this.onConnected) {
        this.onConnected();
      }
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const message: P2PMessage = JSON.parse(event.data);
        console.log('📨 Received message:', message.type);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    this.dataChannel.onclose = () => {
      console.log('📡 Data channel closed');
      if (this.onDisconnected) {
        this.onDisconnected();
      }
    };

    this.dataChannel.onerror = (error) => {
      console.error('📡 Data channel error:', error);
    };
  }

  private handleMessage(message: P2PMessage): void {
    switch (message.type) {
      case 'game-move':
        if (this.onGameMove) {
          this.onGameMove(message.data);
        }
        break;
      case 'game-reset':
        if (this.onGameReset) {
          this.onGameReset();
        }
        break;
      case 'player-info':
        // Update room info with real player names
        if (this.currentRoom) {
          const playerIndex = this.currentRoom.players.findIndex(p => p.id === message.data.playerId);
          if (playerIndex !== -1) {
            this.currentRoom.players[playerIndex].name = message.data.playerName;
            if (this.onRoomUpdate) {
              this.onRoomUpdate(this.currentRoom);
            }
          }
        }
        break;
      case 'game-start':
        if (this.currentRoom) {
          this.currentRoom.isGameStarted = true;
          if (this.onRoomUpdate) {
            this.onRoomUpdate(this.currentRoom);
          }
        }
        break;
    }
  }

  private pollForOffers(): void {
    if (!this.currentRoom) return;

    let pollCount = 0;
    const maxPolls = 300; // 5 minutes of polling

    const checkForOffers = () => {
      pollCount++;
      
      if (pollCount > maxPolls) {
        console.log('Stopped polling for offers after 5 minutes');
        return;
      }

      const connectionData = localStorage.getItem(`bee5_connection_${this.currentRoom!.roomId}`);
      if (connectionData) {
        try {
          const parsedData = JSON.parse(connectionData);
          
          // Check if connection data has expired
          if (Date.now() > parsedData.expires) {
            localStorage.removeItem(`bee5_connection_${this.currentRoom!.roomId}`);
            setTimeout(checkForOffers, 1000);
            return;
          }
          
          if (parsedData.type === 'offer') {
            this.handleIncomingOffer(parsedData);
            localStorage.removeItem(`bee5_connection_${this.currentRoom!.roomId}`);
            return;
          }
        } catch (error) {
          console.error('Error parsing connection data:', error);
          localStorage.removeItem(`bee5_connection_${this.currentRoom!.roomId}`);
        }
      }
      
      // Continue polling
      setTimeout(checkForOffers, 1000);
    };

    checkForOffers();
  }

  private async handleIncomingOffer(data: any): Promise<void> {
    try {
      await this.peerConnection!.setRemoteDescription(data.offer);
      
      // Update room with guest player info
      if (this.currentRoom) {
        this.currentRoom.players[1].name = data.playerName;
        this.currentRoom.players[1].id = data.playerId;
        this.currentRoom.isGameStarted = true;
      }

      // Create answer
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      // Store answer for guest to find
      const answerData = {
        type: 'answer',
        answer: answer,
        timestamp: Date.now(),
        expires: Date.now() + (5 * 60 * 1000) // 5 minutes for connection
      };
      localStorage.setItem(`bee5_answer_${this.currentRoom!.roomId}`, JSON.stringify(answerData));

      // Send player info to guest
      setTimeout(() => {
        this.sendMessage({
          type: 'player-info',
          data: {
            playerId: this.localPlayerId,
            playerName: this.playerName
          }
        });

        this.sendMessage({
          type: 'game-start',
          data: {}
        });
      }, 1000);

    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  private pollForAnswer(roomCode: string): void {
    let pollCount = 0;
    const maxPolls = 60; // 1 minute of polling (reduced from 5 minutes)
    let connectionEstablished = false;

    // Set a timeout to force connection completion
    const connectionTimeout = setTimeout(() => {
      if (!connectionEstablished) {
        console.log('⏰ Connection timeout - forcing connection completion');
        if (this.onRoomJoined && this.currentRoom) {
          this.onRoomJoined(this.currentRoom);
        }
      }
    }, 10000); // 10 seconds timeout

    const checkForAnswer = () => {
      pollCount++;
      
      if (pollCount > maxPolls) {
        console.log('Stopped polling for answer after 1 minute');
        clearTimeout(connectionTimeout);
        if (this.onError) {
          this.onError('Connection timeout. Host may not be available.');
        }
        return;
      }

      const answerData = localStorage.getItem(`bee5_answer_${roomCode}`);
      if (answerData) {
        try {
          const parsedData = JSON.parse(answerData);
          
          // Check if answer data has expired
          if (Date.now() > parsedData.expires) {
            localStorage.removeItem(`bee5_answer_${roomCode}`);
            setTimeout(checkForAnswer, 1000);
            return;
          }
          
          if (parsedData.type === 'answer') {
            connectionEstablished = true;
            clearTimeout(connectionTimeout);
            this.handleIncomingAnswer(parsedData);
            localStorage.removeItem(`bee5_answer_${roomCode}`);
            return;
          }
        } catch (error) {
          console.error('Error parsing answer data:', error);
          localStorage.removeItem(`bee5_answer_${roomCode}`);
        }
      }
      
      // Continue polling
      setTimeout(checkForAnswer, 1000);
    };

    checkForAnswer();
  }

  private async handleIncomingAnswer(data: any): Promise<void> {
    try {
      await this.peerConnection!.setRemoteDescription(data.answer);
      
      if (this.onRoomJoined && this.currentRoom) {
        this.onRoomJoined(this.currentRoom);
      }

      // Send our player info to host
      setTimeout(() => {
        this.sendMessage({
          type: 'player-info',
          data: {
            playerId: this.localPlayerId,
            playerName: this.playerName
          }
        });
      }, 1000);

    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  private storeIceCandidate(candidate: RTCIceCandidate): void {
    if (!this.currentRoom) return;
    
    const candidateData = {
      candidate: candidate,
      timestamp: Date.now(),
      playerId: this.localPlayerId
    };
    
    const key = `p2p_ice_${this.currentRoom.roomId}_${this.localPlayerId}`;
    sessionStorage.setItem(key, JSON.stringify(candidateData));
  }

  // Send a game move to the other player
  sendGameMove(move: GameMove): void {
    this.sendMessage({
      type: 'game-move',
      data: move
    });
  }

  // Send game reset to the other player
  sendGameReset(): void {
    this.sendMessage({
      type: 'game-reset',
      data: {}
    });
  }

  private sendMessage(message: P2PMessage): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
    }
  }

  // Leave the current room
  leaveRoom(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.currentRoom && this.isHost) {
      localStorage.removeItem(`bee5_room_${this.currentRoom.roomId}`);
      localStorage.removeItem(`bee5_connection_${this.currentRoom.roomId}`);
      localStorage.removeItem(`bee5_answer_${this.currentRoom.roomId}`);
    }

    this.currentRoom = null;
    this.isHost = false;
  }

  // Get current player ID
  getCurrentPlayerId(): string {
    return this.localPlayerId;
  }

  // Get current room info
  getCurrentRoom(): RoomInfo | null {
    return this.currentRoom;
  }

  // Check if connected
  isConnected(): boolean {
    return this.dataChannel?.readyState === 'open';
  }
}

// Export singleton instance
export const p2pClient = new P2PMultiplayerClient();
