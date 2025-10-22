// Placeholder for P2P multiplayer functionality
export interface RoomInfo {
  id: string;
  name: string;
  host: string;
  players: string[];
  maxPlayers: number;
}

// Placeholder implementation - will be implemented later
export const createRoom = (): RoomInfo => {
  return {
    id: 'placeholder',
    name: 'Test Room',
    host: 'player1',
    players: ['player1'],
    maxPlayers: 2,
  };
};

export const joinRoom = (roomId: string): RoomInfo => {
  return {
    id: roomId,
    name: 'Test Room',
    host: 'player1',
    players: ['player1', 'player2'],
    maxPlayers: 2,
  };
};
