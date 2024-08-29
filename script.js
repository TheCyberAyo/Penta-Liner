document.addEventListener('DOMContentLoaded', (event) => {
    const statusText = document.getElementById('statusText');
    const restartBtn = document.getElementById('restartBtn');
    const cellContainer = document.getElementById('cellContainer');
    const numberOfCells = 100; // Adjust this number as needed
    let playingColor = 'black';
    let isGameActive = true;

    // Create cells
    for (let i = 0; i < numberOfCells; i++) {
        const cell = document.createElement('div');
        cell.setAttribute('cellIndex', i);
        cell.className = 'cell';
        cellContainer.appendChild(cell);
    }

    // Re-select cells after they've been added to the DOM
    const cells = document.querySelectorAll('.cell');

    // Initialize game
    updateStatusText();

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            if (!isGameActive || cell.style.backgroundColor === 'black' || cell.style.backgroundColor === 'yellow') {
                return;
            }

            cell.style.backgroundColor = playingColor;
            if (checkWin(cell, playingColor)) {
                setTimeout(() => {
                    statusText.textContent = `${playingColor} wins!`;
                    isGameActive = false; // Disable further moves
                }, 100); // Delay to ensure the 5th block is visible
            } else {
                playingColor = (playingColor === 'black') ? 'yellow' : 'black';
                updateStatusText();
            }
        });
    });

    restartBtn.addEventListener('click', resetGame);

    function checkWin(cell, color) {
        const index = Array.from(cells).indexOf(cell);
        const row = Math.floor(index / 10);  // Assuming a 10x10 grid; adjust as needed
        const col = index % 10;

        return (
            checkDirection(row, col, 1, 0, color) || // Horizontal
            checkDirection(row, col, 0, 1, color) || // Vertical
            checkDirection(row, col, 1, 1, color) || // Diagonal /
            checkDirection(row, col, 1, -1, color)   // Diagonal \
        );
    }

    function checkDirection(row, col, rowIncrement, colIncrement, color) {
        let count = 1;

        // Check in positive direction
        for (let i = 1; i < 5; i++) {
            const newRow = row + i * rowIncrement;
            const newCol = col + i * colIncrement;
            if (isInBounds(newRow, newCol) && getCell(newRow, newCol).style.backgroundColor === color) {
                count++;
            } else {
                break;
            }
        }

        // Check in negative direction
        for (let i = 1; i < 5; i++) {
            const newRow = row - i * rowIncrement;
            const newCol = col - i * colIncrement;
            if (isInBounds(newRow, newCol) && getCell(newRow, newCol).style.backgroundColor === color) {
                count++;
            } else {
                break;
            }
        }

        return count >= 5;
    }

    function isInBounds(row, col) {
        return row >= 0 && row < 10 && col >= 0 && col < 10; // Adjust if your grid size is different
    }

    function getCell(row, col) {
        return cells[row * 10 + col]; // Adjust if your grid size is different
    }

    function resetGame() {
        cells.forEach(cell => {
            cell.style.backgroundColor = ''; // Clear the background color
        });
        playingColor = 'black'; // Reset the starting color
        isGameActive = true; // Enable the game
        updateStatusText(); // Update the status text to reflect the current player
    }

    function updateStatusText() {
        statusText.textContent = `${playingColor}, Play!`;
    }
});
