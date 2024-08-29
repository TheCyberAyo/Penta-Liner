// const cells = document.querySelectorAll(".cell");
// const statusText = document.querySelector("#statusText");
// const restartBtn = document.querySelector("#restartBtn");

document.addEventListener('DOMContentLoaded', (event) => {
    const cells = document.querySelectorAll('.cell');
    let currentColor = 'green';

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            cell.style.backgroundColor = currentColor;
            
            currentColor = (currentColor === 'green') ? 'blue' : 'green';
        });
    });
});