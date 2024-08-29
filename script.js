// const cells = document.querySelectorAll(".cell");
// const statusText = document.querySelector("#statusText");
// const restartBtn = document.querySelector("#restartBtn");

document.addEventListener('DOMContentLoaded', (event) => {
    const cells = document.querySelectorAll('.cell');

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            cell.style.backgroundColor = 'red';
        });
    });
});