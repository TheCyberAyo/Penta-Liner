document.addEventListener('DOMContentLoaded', (event) => {
    const cells = document.querySelectorAll('.cell');
    const statusText = document.getElementById('statusText');
    const restartBtn = document.getElementById('restartBtn');
    let currentColor = 'black';
    let isGameActive = true;

    // Initialize game
    updateStatusText();

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            if (!isGameActive || cell.style.backgroundColor === 'black' || cell.style.backgroundColor === 'yellow') {
                return;
            }

            cell.style.backgroundColor = currentColor;
            if (checkWin(cell, currentColor)) {
                setTimeout(() => {
                    statusText.textContent = `${currentColor} wins!`;
                    isGameActive = false; // Disable further moves
                }, 100); // Delay to ensure the 5th block is visible
            } else {
                currentColor = (currentColor === 'black') ? 'yellow' : 'black';
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
        currentColor = 'black'; // Reset the starting color
        isGameActive = true; // Enable the game
        updateStatusText(); // Update the status text to reflect the current player
    }

    function updateStatusText() {
        statusText.textContent = `${currentColor}, Play!`;
    }
});
