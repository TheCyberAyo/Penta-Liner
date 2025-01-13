// Add event listener when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});

let countdownInterval; // Variable to store the timer interval
let currentPlayer = 'black'; // Tracks the current player
let isGameActive = true; // Global variable to track game state

function initializeGame() {
    const statusText = document.getElementById('statusText');
    const countdownText = document.getElementById('countDown');
    const restartBtn = document.getElementById('restartBtn');
    const cellContainer = document.getElementById('cellContainer');
    const numberOfCells = 100;

    createCells(cellContainer, numberOfCells);

    const cells = document.querySelectorAll('.cell');

    updateStatusText(statusText, currentPlayer);

    setupCellClickEvent(cells, statusText, countdownText);
    restartBtn.addEventListener('click', () => resetGame(cells, statusText, countdownText));
    startTimer(countdownText);
}

function createCells(container, numberOfCells) {
    for (let i = 0; i < numberOfCells; i++) {
        const cell = document.createElement('div');
        cell.setAttribute('cellIndex', i);
        cell.className = 'cell';
        container.appendChild(cell);
    }
}

function setupCellClickEvent(cells, statusText, countdownText) {
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            if (!isGameActive || cell.style.backgroundColor === 'black' || cell.style.backgroundColor === 'yellow') {
                return; // Do nothing if the game is inactive or the cell is already filled
            }

            cell.style.backgroundColor = currentPlayer;

            if (checkWin(cell, currentPlayer, cells)) {
                setTimeout(() => {
                    statusText.textContent = `${currentPlayer} wins!`;
                    clearInterval(countdownInterval); // Stop the timer
                    isGameActive = false; // Disable further moves
                }, 100); // Delay to ensure the 5th block is visible
            } else {
                currentPlayer = (currentPlayer === 'black') ? 'yellow' : 'black';
                updateStatusText(statusText, currentPlayer);
                restartTimer(countdownText); // Restart the timer for the next player
            }
        });
    });
}

function startTimer(countdownText) {
    let timeLeft = 15;

    countdownInterval = setInterval(() => {
        if (!isGameActive) {
            clearInterval(countdownInterval);
            return;
        }

        countdownText.textContent = `Time Left: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            const winner = currentPlayer === 'black' ? 'yellow' : 'black';
            document.getElementById('statusText').textContent = `${winner} wins due to time limit!`;
            isGameActive = false; // End the game
        }

        timeLeft--;
    }, 1000);
}

function restartTimer(countdownText) {
    clearInterval(countdownInterval);
    if (isGameActive) {
        startTimer(countdownText);
    }
}

function checkWin(cell, color, cells) {
    const index = Array.from(cells).indexOf(cell);
    const row = Math.floor(index / 10); // A 10x10 grid
    const col = index % 10;

    return (
        checkDirection(row, col, 1, 0, color, cells) || // Horizontal
        checkDirection(row, col, 0, 1, color, cells) || // Vertical
        checkDirection(row, col, 1, 1, color, cells) || // Diagonal /
        checkDirection(row, col, 1, -1, color, cells) // Diagonal \
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

function resetGame(cells, statusText, countdownText) {
    clearInterval(countdownInterval); // Stop any existing timer
    cells.forEach(cell => {
        cell.style.backgroundColor = 'skyblue'; // Clear the background color
    });
    currentPlayer = 'black'; // Reset the starting color
    isGameActive = true; // Enable the game
    updateStatusText(statusText, currentPlayer); // Update the status text to reflect the current player
    startTimer(countdownText); // Start a new timer
}

function updateStatusText(statusText, playingColor) {
    statusText.textContent = `${playingColor}, Play!`;
}
