const columns = 16;
const rows = 12;
const mineCount = 30;
const buttonShadow = "10px 10px 10px rgba(0, 0, 0, 0.5)";
const clickedButtonShadow = "5px 5px 10px rgba(0, 0, 0, 0.8)";

let canvas;
let c;
let imgSize;
let images;
let actionButton;
let timeHolder;
let remainingMineCountHolder;

let isGameOver = false;
let isFirstClick = true;
let exploredFields = 0;
let flagCount = 0;
let timer;
let map;
let exploredMap;
let flaggedMap;
let explodedBomb;

window.onload = (event) => {
  init();
  startGame();
}

failChecker();

function failChecker() {
  setTimeout(() => {
    if (canvas.height === 0) {
      console.log("Failed to load canvas, retrying...");
      init();
      startGame();
    } else {
      console.log("Canvas loaded successfully.");
    }
  }, 2000);
}

function init() {
  canvas = document.querySelector('#minesweeperCanvas');
  c = canvas.getContext('2d');
  imgSize = canvas.clientWidth / columns;
  canvas.width = columns * imgSize;
  canvas.height = rows * imgSize;
  images = {
    hidden: document.getElementById('hidden'),
    flagged: document.getElementById('flagged'),
    flag: document.getElementById('flag'),
    flaggedWrong: document.getElementById('flagged-wrong'),
    explodedMine: document.getElementById('exploded-mine'),
    MINE: document.getElementById('mine'),
    0: document.getElementById('field-0'),
    1: document.getElementById('field-1'),
    2: document.getElementById('field-2'),
    3: document.getElementById('field-3'),
    4: document.getElementById('field-4'),
    5: document.getElementById('field-5'),
    6: document.getElementById('field-6'),
    7: document.getElementById('field-7'),
    8: document.getElementById('field-8'),
  };
  actionButton = document.querySelector('#action-button');
  timeHolder = document.querySelector('#time');
  remainingMineCountHolder = document.querySelector('#mine-count');
  canvas.addEventListener('click', canvasLeftClicked);
  canvas.addEventListener('contextmenu', canvasRightClicked);
  actionButton.addEventListener('click', actionButtonClicked);
}

function countFlaggedFields(fields) {
  let count = 0;
  for (let i = 0; i < fields.length; i++) {
    let field = fields[i];
    if (flaggedMap[field.y][field.x]) {
      count++;
    }
  }
  return count;
}

function startGame() {
  isGameOver = false;
  exploredFields = 0;
  flagCount = 0;
  isFirstClick = true;
  map = initializeMap(columns, rows);
  exploredMap = initializeExploredMap(columns, rows);
  flaggedMap = initializeExploredMap(columns, rows);
  drawMap();
  showRemainingMineCount(mineCount);
  resetTimer();
}

function restartGame() {
  actionButton.style.boxShadow = buttonShadow;
  actionButton.src = 'assets/button-start.png';
  startGame();
}

function startTimer() {
  let seconds = 0;
  resetTimer();
  timer = setInterval(() => {
    if (!isGameOver) {
      seconds = Math.min(seconds + 1, 999);
      showSecondsPassed(seconds);
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timer);
  showSecondsPassed(0);
}

function showRemainingMineCount(count) {
  remainingMineCountHolder.innerHTML = convertNumberToThreeDigitString(count);
}

function showSecondsPassed(seconds) {
  timeHolder.innerHTML = convertNumberToThreeDigitString(seconds);
}

function convertNumberToThreeDigitString(number) {
  if (number < 0) return "🤡";
  let numberString = number.toString();
  let digitCount = 3;
  if (numberString.length < digitCount) {
    let leadingZeros = digitCount - numberString.length;
    for (let i = 0; i < leadingZeros; i++) {
      numberString = '0' + numberString;
    }
  }
  return numberString;
}

function onLeftClick(x, y) {
  if (!isGameOver && !flaggedMap[y][x]) {
    exploreFields(x, y);
    drawMap();
    checkIfGameWon();
  }
  if (isGameOver && !isGameWon()) {
    endGame();
  }
}

function onRightClick(x, y) {
  if (isGameOver && !isGameWon()) return;
  if (!exploredMap[y][x]) {
    flaggedMap[y][x] = !flaggedMap[y][x];
    flagCount += flaggedMap[y][x] ? 1 : -1;
    showRemainingMineCount(mineCount - flagCount);
  } else if (!isGameOver) {
    let neighbours = getNeighbourIndices(x, y);
    let flaggedNeighbours = countFlaggedFields(neighbours);
    if (flaggedNeighbours !== map[y][x]) return;
    for (let i = 0; i < neighbours.length; i++) {
      let neighbour = neighbours[i];
      if (!exploredMap[neighbour.y][neighbour.x] && !flaggedMap[neighbour.y][neighbour.x]) {
        exploreFields(neighbour.x, neighbour.y);
      }
    }
  }
  drawMap();
  if (isGameOver && !isGameWon()) {
    endGame();
  }
  checkIfGameWon();
}

function checkIfGameWon() {
  if (isGameWon()) {
    isGameOver = true;
    actionButton.src = 'assets/button-won.png';
  }
}

function showWrongFlags() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      if (flaggedMap[y][x] && map[y][x] !== 'MINE') {
        drawImage(images.flaggedWrong, px(x), px(y));
      }
    }
  }
}

function exploreFields(x, y) {
  if (map[y][x] === 'MINE') {
    isGameOver = true;
    explodedBomb = {x: x, y: y};
  } else if (!exploredMap[y][x]) {
    exploredMap[y][x] = true;
    exploredFields++;
    if (map[y][x] === 0) {
      let neighbours = getNeighbourIndices(x, y);
      for (let neighbour of neighbours) {
        exploreFields(neighbour.x, neighbour.y);
      }
    }
  }
}

function endGame() {
  showWrongFlags();
  drawImage(images.explodedMine, px(explodedBomb.x), px(explodedBomb.y));
  actionButton.src = 'assets/button-lost.png';
}

function getNeighbourIndices(x, y) {
  let neighbours = [];
  for (let i = -1; i <= 1; i++) {
    if (map[y + i]) {
      for (let j = -1; j <= 1; j++) {
        if (map[y + i][x + j] !== undefined && !(i === 0 && j === 0)) {
          neighbours.push({x: x + j, y: y + i});
        }
      }
    }
  }
  return neighbours;
}

function isGameWon() {
  return exploredFields === (columns * rows) - mineCount;
}

function calculateFieldValues(map) {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      if (map[y][x] !== 'MINE') {
        map[y][x] = countNeighbourMines(getNeighbourValues(map, x, y));
      }
    }
  }
}

function countNeighbourMines(fields) {
  let count = 0;
  for (let field of fields) {
    if (field === 'MINE') {
      count++;
    }
  }
  return count;
}

function getNeighbourValues(map, x, y) {
  let neighbours = [];
  for (let i = -1; i <= 1; i++) {
    if (map[y + i]) {
      for (let j = -1; j <= 1; j++) {
        if (map[y + i][x + j] && !(i === 0 && j === 0)) {
          neighbours.push(map[y + i][x + j]);
        }
      }
    }
  }
  return neighbours;
}

function initializeMap(width, height) {
  let map = [];
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
        map[y][x] = 0;
    }
  }
  return map;
}

function initializeExploredMap(width, height) {
  let map = [];
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      map[y][x] = false;
    }
  }
  return map;
}

function px(index) {
  return index * imgSize;
}

function placeMines(map, count, startX, startY) {
  let placedMines = 0;
  while (placedMines < count) {
    let x = Math.floor(Math.random() * columns);
    let y = Math.floor(Math.random() * rows);
    if (x === startX && y === startY) {
      continue;
    }
    if (map[y][x] !== 'MINE') {
      map[y][x] = 'MINE';
      placedMines++;
    }
  }
}

function drawMap() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      if (exploredMap[y][x]) {
        let image = images[map[y][x]];
        drawImage(image, px(x), px(y));
      } else {
        drawImage(images.hidden, px(x), px(y));
        if (flaggedMap[y][x]) {
          drawImage(images.flag, px(x), px(y));
        }
      }
    }
  }
}

function drawImage(image, x, y) {
  c.drawImage(image, x, y, imgSize, imgSize);
}

function canvasLeftClicked(event) {
  let x = Math.floor(event.offsetX / imgSize);
  let y = Math.floor(event.offsetY / imgSize);
  if (isFirstClick) {
    isFirstClick = false;
    placeMines(map, mineCount, x, y);
    calculateFieldValues(map);
    startTimer();
  }
  onLeftClick(x, y);
}

function canvasRightClicked(event) {
  event.preventDefault();
  let x = Math.floor(event.offsetX / imgSize);
  let y = Math.floor(event.offsetY / imgSize);
  onRightClick(x, y);
}

function actionButtonClicked() {
  actionButton.style.boxShadow = clickedButtonShadow;
  setTimeout(restartGame, 100);
}