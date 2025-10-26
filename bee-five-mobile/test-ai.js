// Test script for AI Logic
// Run this to verify AI strategies are working correctly

import { getAIMove, AI_DIFFICULTIES } from './src/utils/aiLogic';

// Test board with some pieces already placed
const testBoard: (0 | 1 | 2 | 3)[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 0, 0, 0, 0], // Human has 4 in a row - AI should block
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

console.log('Testing AI Logic...');
console.log('Test board:');
testBoard.forEach((row, i) => {
  console.log(`Row ${i}:`, row.map(cell => cell === 0 ? '.' : cell === 1 ? 'H' : cell === 2 ? 'A' : 'B').join(' '));
});

// Test each difficulty
['easy', 'medium', 'hard'].forEach(difficulty => {
  console.log(`\n--- Testing ${difficulty.toUpperCase()} AI ---`);
  try {
    const move = getAIMove(testBoard, difficulty);
    console.log(`AI Move: (${move.row}, ${move.col})`);
    console.log(`Reason: ${move.reason}`);
    console.log(`Score: ${move.score}`);
  } catch (error) {
    console.error(`Error testing ${difficulty} AI:`, error);
  }
});

console.log('\nAI Difficulty Configurations:');
Object.entries(AI_DIFFICULTIES).forEach(([key, config]) => {
  console.log(`${key.toUpperCase()}: ${config.name} - ${config.description}`);
});
