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
      
      // Store room info in sessionStorage for other players to find
      const roomData = {
        roomId,
        hostId: this.localPlayerId,
        timestamp: Date.now()
      };
      sessionStorage.setItem(`p2p_room_${roomId}`, JSON.stringify(roomData));

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
      const roomData = sessionStorage.getItem(`p2p_room_${roomCode}`);
      if (!roomData) {
        throw new Error('Room not found');
      }

      const parsedRoomData = JSON.parse(roomData);
      
      // Check if room is still active (within 1 hour)
      if (Date.now() - parsedRoomData.timestamp > 3600000) {
        sessionStorage.removeItem(`p2p_room_${roomCode}`);
        throw new Error('Room expired');
      }

      await this.setupPeerConnection();
      
      // Create room info
      this.currentRoom = {
        roomId: roomCode,
        players: [
          {
            id: parsedRoomData.hostId,
            name: 'Host', // We'll get the real name via WebRTC
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
        timestamp: Date.now()
      };
      sessionStorage.setItem(`p2p_connection_${roomCode}`, JSON.stringify(connectionData));

      // Poll for answer from host
      this.pollForAnswer(roomCode);

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
        // Store ICE candidate for the other peer
        this.storeIceCandidate(event.candidate);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('Connection state:', state);
      
      if (state === 'connected') {
        if (this.onConnected) {
          this.onConnected();
        }
      } else if (state === 'disconnected' || state === 'failed') {
        if (this.onDisconnected) {
          this.onDisconnected();
        }
      }
    };

    if (this.isHost) {
      // Host creates data channel
      this.dataChannel = this.peerConnection.createDataChannel('gameData');
      this.setupDataChannel();
      
      // Poll for incoming connection offers
      this.pollForOffers();
    } else {
      // Guest waits for data channel from host
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel();
      };
    }
  }

  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      if (this.onConnected) {
        this.onConnected();
      }
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const message: P2PMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
      if (this.onDisconnected) {
        this.onDisconnected();
      }
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

    const checkForOffers = () => {
      const connectionData = sessionStorage.getItem(`p2p_connection_${this.currentRoom!.roomId}`);
      if (connectionData) {
        const parsedData = JSON.parse(connectionData);
        if (parsedData.type === 'offer') {
          this.handleIncomingOffer(parsedData);
          sessionStorage.removeItem(`p2p_connection_${this.currentRoom!.roomId}`);
        }
      } else {
        // Continue polling
        setTimeout(checkForOffers, 1000);
      }
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
        timestamp: Date.now()
      };
      sessionStorage.setItem(`p2p_answer_${this.currentRoom!.roomId}`, JSON.stringify(answerData));

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
    const checkForAnswer = () => {
      const answerData = sessionStorage.getItem(`p2p_answer_${roomCode}`);
      if (answerData) {
        const parsedData = JSON.parse(answerData);
        if (parsedData.type === 'answer') {
          this.handleIncomingAnswer(parsedData);
          sessionStorage.removeItem(`p2p_answer_${roomCode}`);
        }
      } else {
        // Continue polling
        setTimeout(checkForAnswer, 1000);
      }
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
      sessionStorage.removeItem(`p2p_room_${this.currentRoom.roomId}`);
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
