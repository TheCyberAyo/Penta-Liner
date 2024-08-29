// const cells = document.querySelectorAll(".cell");
// const statusText = document.querySelector("#statusText");
// const restartBtn = document.querySelector("#restartBtn");

document.addEventListener('DOMContentLoaded', (event) => {
    const cells = document.querySelectorAll('.cell');
    let currentColor = 'red'; // Initial color

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            cell.style.backgroundColor = currentColor;
            
            // Toggle the color for the next click
            currentColor = (currentColor === 'red') ? 'blue' : 'red';
        });
    });
});