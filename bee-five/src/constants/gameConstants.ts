// Shared game constants to avoid duplication across components

export const GRID_SIZE = 10;
export const CELL_SIZE = 50;
export const BORDER_WIDTH = 2;
export const CANVAS_SIZE = GRID_SIZE * CELL_SIZE + (GRID_SIZE + 1) * BORDER_WIDTH;

// Mobile canvas uses larger cells for better touch precision
export const MULTIPLAYER_CELL_SIZE = 60; // Increased from 40px to 60px for better touch targets
export const MULTIPLAYER_CANVAS_SIZE = GRID_SIZE * MULTIPLAYER_CELL_SIZE + (GRID_SIZE + 1) * BORDER_WIDTH;


