// Add event listener when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});

function initializeGame() {
    const statusText = document.getElementById('statusText');
    const restartBtn = document.getElementById('restartBtn');
    const cellContainer = document.getElementById('cellContainer');
    const numberOfCells = 100;
    let playingColor = 'black';
    let isGameActive = true;
    let turnTimer;

    createCells(cellContainer, numberOfCells);

    const cells = document.querySelectorAll('.cell');

    updateStatusText(statusText, playingColor);

    setupCellClickEvent(cells, statusText, playingColor, isGameActive, turnTimer);
    restartBtn.addEventListener('click', () => resetGame(cells, statusText, playingColor, isGameActive, turnTimer));

    startTurnTimer(playingColor, statusText, turnTimer, isGameActive);
}

function createCells(container, numberOfCells) {
    for (let i = 0; i < numberOfCells; i++) {
        const cell = document.createElement('div');
        cell.setAttribute('cellIndex', i);
        cell.className = 'cell';
        container.appendChild(cell);
    }
}

function setupCellClickEvent(cells, statusText, playingColor, isGameActive, turnTimer) {
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            if (!isGameActive || cell.style.backgroundColor === 'black' || cell.style.backgroundColor === 'yellow') {
                return;
            }

            cell.style.backgroundColor = playingColor;
            clearTimeout(turnTimer); // Clear the timer for the current turn

            if (checkWin(cell, playingColor, cells)) {
                setTimeout(() => {
                    statusText.textContent = `${playingColor} wins!`;
                    isGameActive = false; // Disable further moves
                }, 100); // Delay to ensure the 5th block is visible
            } else {
                playingColor = (playingColor === 'black') ? 'yellow' : 'black';
                updateStatusText(statusText, playingColor);
                startTurnTimer(playingColor, statusText, turnTimer, isGameActive);
            }
        });
    });
}

function startTurnTimer(playingColor, statusText, turnTimer, isGameActive) {
    turnTimer = setTimeout(() => {
        if (isGameActive) {
            statusText.textContent = `${playingColor} failed to play. Opponent wins!`;
            isGameActive = false;
        }
    }, 15000); // 15 seconds
}

function checkWin(cell, color, cells) {
    const index = Array.from(cells).indexOf(cell);
    const row = Math.floor(index / 10);  // Assuming a 10x10 grid; adjust as needed
    const col = index % 10;

    return (
        checkDirection(row, col, 1, 0, color, cells) || // Horizontal
        checkDirection(row, col, 0, 1, color, cells) || // Vertical
        checkDirection(row, col, 1, 1, color, cells) || // Diagonal /
        checkDirection(row, col, 1, -1, color, cells)   // Diagonal \
    );
}

function checkDirection(row, col, rowIncrement, colIncrement, color, cells) {
    let count = 1;

    // Check in positive direction
    for (let i = 1; i < 5; i++) {
        const newRow = row + i * rowIncrement;
        const newCol = col + i * colIncrement;
        if (isInBounds(newRow, newCol) && getCell(newRow, newCol, cells).style.backgroundColor === color) {
            count++;
        } else {
            break;
        }
    }

    // Check in negative direction
    for (let i = 1; i < 5; i++) {
        const newRow = row - i * rowIncrement;
        const newCol = col - i * colIncrement;
        if (isInBounds(newRow, newCol) && getCell(newRow, newCol, cells).style.backgroundColor === color) {
            count++;
        } else {
            break;
        }
    }

    return count >= 5;
}

function isInBounds(row, col) {
    return row >= 0 && row < 10 && col >= 0 && col < 10;
}

function getCell(row, col, cells) {
    return cells[row * 10 + col];
}

function resetGame(cells, statusText, playingColor, isGameActive, turnTimer) {
    clearTimeout(turnTimer); // Clear any existing timer

    cells.forEach(cell => {
        cell.style.backgroundColor = 'skyblue'; // Clear the background color
    });
    playingColor = 'black'; // Reset the starting color
    isGameActive = true; // Enable the game
    updateStatusText(statusText, playingColor); // Update the status text to reflect the current player

    startTurnTimer(playingColor, statusText, turnTimer, isGameActive); // Restart the timer for the new game
}

function updateStatusText(statusText, playingColor) {
    statusText.textContent = `${playingColor}, Play!`;
}

