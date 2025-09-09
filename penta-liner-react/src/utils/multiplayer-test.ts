// Simple test version of multiplayer to isolate issues

export interface SimpleRoomInfo {
  roomId: string;
  playerCount: number;
}

export class SimpleMultiplayerTest {
  private connected = false;

  async connect(): Promise<void> {
    console.log('SimpleMultiplayerTest: Connecting...');
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    console.log('SimpleMultiplayerTest: Connected!');
  }

  async createRoom(playerName: string): Promise<string> {
    console.log('SimpleMultiplayerTest: Creating room for', playerName);
    if (!this.connected) {
      throw new Error('Not connected');
    }
    const roomId = 'TEST' + Math.random().toString(36).substr(2, 4).toUpperCase();
    console.log('SimpleMultiplayerTest: Created room', roomId);
    return roomId;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const simpleMultiplayerTest = new SimpleMultiplayerTest();
