// Supabase-based real-time multiplayer client
// This provides true cross-device synchronization with automatic scaling

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://qtfuldmppecmvpglbxix.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZnVsZG1wcGVjbXZwZ2xieGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NzIxMzcsImV4cCI6MjA3MzA0ODEzN30.INH34TtLgfCVDJPArIWg1Kr4rdTYwgwWpnILjaayuew'; // Replace with your Supabase anon key

// Database types (internal)
interface SupabaseMove {
  id?: number;
  room_id: string;
  player_number: 1 | 2;
  row: number;
  col: number;
  player_name: string;
  created_at?: string;
}

interface SupabaseGameStateDB {
  id?: number;
  room_id: string;
  board: string; // JSON stringified board
  current_player: 1 | 2;
  winner: 0 | 1 | 2;
  game_active: boolean;
  player_names: string; // JSON stringified player names
  updated_at?: string;
}

interface SupabaseRoomDB {
  id?: number;
  room_id: string;
  host_name: string;
  guest_name?: string;
  is_game_started: boolean;
  created_at?: string;
  updated_at?: string;
}

// Game interfaces for the client (exported)
export interface SupabaseGameMove {
  roomId: string;
  playerNumber: 1 | 2;
  player: 1 | 2;
  row: number;
  col: number;
  playerName: string;
  timestamp: number;
}

export interface SupabaseGameState {
  roomId: string;
  board: (0 | 1 | 2)[][];
  currentPlayer: 1 | 2;
  winner: 0 | 1 | 2;
  gameActive: boolean;
  playerNames: {
    player1: string;
    player2: string;
  };
  timestamp: number;
}

export interface SupabaseRoom {
  roomId: string;
  hostName: string;
  guestName?: string;
  isGameStarted: boolean;
  timestamp: number;
}

class SupabaseMultiplayerClient {
  private supabase: SupabaseClient;
  private roomId: string = '';
  private playerNumber: 1 | 2 = 1;
  private playerName: string = '';
  private isHost: boolean = false;
  private moveCallback?: (move: SupabaseGameMove) => void;
  private gameStateCallback?: (gameState: SupabaseGameState) => void;
  private roomCallback?: (room: SupabaseRoom) => void;
  // Timestamps removed - using real-time subscriptions instead

  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('🔧 Supabase multiplayer client initialized');
  }

  // Set up the database tables (call this once to initialize)
  async setupDatabase(): Promise<void> {
    try {
      console.log('🔧 Setting up Supabase database tables...');
      
      // Note: In a real implementation, you would run these SQL commands in the Supabase dashboard
      // or use the Supabase CLI. For now, we'll assume the tables exist.
      
      console.log('✅ Database setup complete (tables should be created manually)');
    } catch (error) {
      console.error('❌ Database setup failed:', error);
      throw error;
    }
  }

  createRoom(playerName: string): string {
    this.playerName = playerName;
    this.isHost = true;
    this.playerNumber = 1;
    this.roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create room in Supabase
    this.createRoomInSupabase();
    
    // Set up real-time subscriptions
    this.setupRealtimeSubscriptions();
    
    return this.roomId;
  }

  private async createRoomInSupabase(): Promise<void> {
    try {
      const roomData: SupabaseRoomDB = {
        room_id: this.roomId,
        host_name: this.playerName,
        is_game_started: false
      };

      const { data, error } = await this.supabase
        .from('rooms')
        .insert([roomData])
        .select();

      if (error) {
        console.error('❌ Failed to create room:', error);
        throw error;
      }

      console.log('🏠 Room created in Supabase:', data);
    } catch (error) {
      console.error('❌ Error creating room:', error);
      throw error;
    }
  }

  async joinRoom(roomId: string, playerName: string): Promise<boolean> {
    this.playerName = playerName;
    this.isHost = false;
    this.playerNumber = 2;
    this.roomId = roomId;

    try {
      // Check if room exists and update it with guest info
      const { data: existingRoom, error: fetchError } = await this.supabase
        .from('rooms')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (fetchError || !existingRoom) {
        console.log('❌ Room not found:', roomId);
        return false;
      }

      // Update room with guest info
      const { error: updateError } = await this.supabase
        .from('rooms')
        .update({
          guest_name: playerName,
          is_game_started: true,
          updated_at: new Date().toISOString()
        })
        .eq('room_id', roomId);

      if (updateError) {
        console.error('❌ Failed to join room:', updateError);
        return false;
      }

      console.log('🚀 Successfully joined room:', roomId);
      
      // Set up real-time subscriptions
      this.setupRealtimeSubscriptions();
      
      return true;
    } catch (error) {
      console.error('❌ Error joining room:', error);
      return false;
    }
  }

  async sendMove(row: number, col: number): Promise<void> {
    try {
      const moveData: SupabaseMove = {
        room_id: this.roomId,
        player_number: this.playerNumber,
        row,
        col,
        player_name: this.playerName
      };

      const { error } = await this.supabase
        .from('moves')
        .insert([moveData]);

      if (error) {
        console.error('❌ Failed to send move:', error);
        throw error;
      }

      console.log('📤 Move sent to Supabase:', moveData);
    } catch (error) {
      console.error('❌ Error sending move:', error);
      throw error;
    }
  }

  async sendGameState(board: (0 | 1 | 2)[][], currentPlayer: 1 | 2, winner: 0 | 1 | 2, gameActive: boolean): Promise<void> {
    try {
      const gameStateData: SupabaseGameStateDB = {
        room_id: this.roomId,
        board: JSON.stringify(board),
        current_player: currentPlayer,
        winner,
        game_active: gameActive,
        player_names: JSON.stringify({
          player1: this.isHost ? this.playerName : 'Host',
          player2: this.isHost ? 'Guest' : this.playerName
        })
      };

      // Upsert (insert or update) game state
      const { error } = await this.supabase
        .from('game_states')
        .upsert([gameStateData], { 
          onConflict: 'room_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('❌ Failed to send game state:', error);
        throw error;
      }

      console.log('📤 Game state sent to Supabase:', gameStateData);
    } catch (error) {
      console.error('❌ Error sending game state:', error);
      throw error;
    }
  }

  private setupRealtimeSubscriptions(): void {
    // Subscribe to moves
    this.supabase
      .channel(`moves:${this.roomId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'moves',
          filter: `room_id=eq.${this.roomId}`
        }, 
        (payload) => {
          const move = payload.new as SupabaseMove;
          if (move.player_number !== this.playerNumber) {
            const gameMove: SupabaseGameMove = {
              roomId: move.room_id,
              playerNumber: move.player_number,
              player: move.player_number,
              row: move.row,
              col: move.col,
              playerName: move.player_name,
              timestamp: Date.now()
            };
            
            console.log('📥 Received move from Supabase:', gameMove);
            if (this.moveCallback) {
              this.moveCallback(gameMove);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to game state updates
    this.supabase
      .channel(`game_states:${this.roomId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'game_states',
          filter: `room_id=eq.${this.roomId}`
        }, 
        (payload) => {
          const gameState = payload.new as SupabaseGameStateDB;
          const parsedGameState: SupabaseGameState = {
            roomId: gameState.room_id,
            board: JSON.parse(gameState.board),
            currentPlayer: gameState.current_player,
            winner: gameState.winner,
            gameActive: gameState.game_active,
            playerNames: JSON.parse(gameState.player_names),
            timestamp: Date.now()
          };
          
          console.log('📥 Received game state from Supabase:', parsedGameState);
          if (this.gameStateCallback) {
            this.gameStateCallback(parsedGameState);
          }
        }
      )
      .subscribe();

    // Subscribe to room updates
    this.supabase
      .channel(`rooms:${this.roomId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'rooms',
          filter: `room_id=eq.${this.roomId}`
        }, 
        (payload) => {
          const room = payload.new as SupabaseRoomDB;
          const parsedRoom: SupabaseRoom = {
            roomId: room.room_id,
            hostName: room.host_name,
            guestName: room.guest_name,
            isGameStarted: room.is_game_started,
            timestamp: Date.now()
          };
          
          console.log('📥 Received room update from Supabase:', parsedRoom);
          if (this.roomCallback) {
            this.roomCallback(parsedRoom);
          }
        }
      )
      .subscribe();

    console.log('🔔 Real-time subscriptions set up for room:', this.roomId);
  }

  onMove(callback: (move: SupabaseGameMove) => void): void {
    this.moveCallback = callback;
  }

  onGameState(callback: (gameState: SupabaseGameState) => void): void {
    this.gameStateCallback = callback;
  }

  onRoomUpdate(callback: (room: SupabaseRoom) => void): void {
    this.roomCallback = callback;
  }

  async leaveRoom(): Promise<void> {
    try {
      // Unsubscribe from all channels
      await this.supabase.removeAllChannels();
      
      this.roomId = '';
      this.playerNumber = 1;
      this.playerName = '';
      this.isHost = false;
      
      console.log('🚪 Left Supabase room and cleaned up subscriptions');
    } catch (error) {
      console.error('❌ Error leaving room:', error);
    }
  }

  // Get the room URL for sharing
  getRoomUrl(): string {
    return `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
  }

  // Check if we're joining from a URL
  static getRoomFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('room');
  }
}

export const supabaseMultiplayerClient = new SupabaseMultiplayerClient();
export { SupabaseMultiplayerClient };
