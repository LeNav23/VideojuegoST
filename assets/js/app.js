// Archivo: app.js | Este es el punto de entrada: conecta la logica con la UI y eventos de botones/clicks.
import { createInitialState, resetSetupPlayer } from "./state.js";
import {
  getNextShipToPlace,
  getPlacementCells,
  isPlacementValid,
  placeShip,
  isPlayerDefeated,
} from "./logic.js";
import {
  getElements,
  buildBoards,
  showTurnScreen,
  hideTurnScreen,
  updateStatus,
  render,
} from "./ui.js";

const elements = getElements();
let state = createInitialState();
const backgroundMusic = new Audio("assets/sounds/BackgroundMusic.mp3");
const clickSfx = new Audio("assets/sounds/ClickSE.mp3");
const bombSfx = new Audio("assets/sounds/BombSE.mp3");
const lostShipSfx = new Audio("assets/sounds/LostShipSE.mp3");
const victorySfx = new Audio("assets/sounds/VictorySE.mp3");

// Musica de fondo para la partida.
backgroundMusic.loop = true;
backgroundMusic.volume = 0.45;
clickSfx.volume = 0.5;
bombSfx.volume = 0.65;
lostShipSfx.volume = 0.7;
victorySfx.volume = 0.9;

init();

function init() {
  // Armamos tableros una sola vez y conectamos botones.
  buildBoards(elements);
  bindEvents();
  renderUI();
}

function bindEvents() {
  document.addEventListener("click", onAnyButtonClick);
  elements.board.addEventListener("click", onBoardClick);
  elements.rotateButton.addEventListener("click", onRotate);
  elements.resetBoardButton.addEventListener("click", onResetBoard);
  elements.confirmPlayerButton.addEventListener("click", onConfirmPlayer);
  elements.restartGameButton.addEventListener("click", onRestartGame);
  elements.continueButton.addEventListener("click", onContinueAfterTurnScreen);
}

function onAnyButtonClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest("button");
  if (!button || button.classList.contains("cell")) {
    return;
  }

  playSfx(clickSfx);
}

function onBoardClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.classList.contains("cell")) {
    return;
  }

  if (elements.turnScreen.classList.contains("hidden") === false) {
    return;
  }

  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);

  if (state.phase === "setup") {
    handleSetupPlacement(row, col);
    return;
  }

  handleAttack(row, col);
}

function handleSetupPlacement(row, col) {
  const player = getSetupPlayer();
  const nextShip = getNextShipToPlace(player);

  if (!nextShip) {
    updateStatus(elements, "Todos los barcos ya fueron colocados. Confirma jugador.");
    return;
  }

  const placement = getPlacementCells(row, col, nextShip.size, state.orientation);
  if (!isPlacementValid(player, placement)) {
    updateStatus(elements, "No se puede colocar ahi: fuera del tablero o se enciman barcos.");
    return;
  }

  placeShip(player, nextShip, placement);
  updateStatus(elements, `${nextShip.label} colocado correctamente.`);
  renderUI();
}

function handleAttack(row, col) {
  if (state.phase !== "battle") {
    return;
  }

  const attacker = getTurnPlayer();
  const defender = getOpponentPlayer();

  if (attacker.attacks[row][col] !== null) {
    updateStatus(elements, "Ya atacaste esa casilla. Elige otra.");
    return;
  }

  const hitShipId = defender.board[row][col];
  const result = hitShipId !== null ? "hit" : "miss";
  attacker.attacks[row][col] = result;
  defender.shotsReceived[row][col] = result;

  if (result === "hit") {
    if (isShipSunk(defender, hitShipId)) {
      playSfx(lostShipSfx);
    } else {
      playSfx(bombSfx);
    }
  }

  if (isPlayerDefeated(defender)) {
    state.winnerIndex = state.currentTurnPlayerIndex;
    state.phase = "gameover";
    stopBackgroundMusic();
    playSfx(victorySfx);
    showTurnScreen(elements, `Victoria de ${attacker.name}`, {
      variant: "victory",
      message: "",
      buttonLabel: "Jugar otra vez",
    });
    updateStatus(elements, `${attacker.name} destruyo toda la flota enemiga.`);
    renderUI();
    return;
  }

  if (result === "hit") {
    updateStatus(elements, `${attacker.name} acerto un disparo. Sigue tu turno.`);
    renderUI();
    return;
  }

  updateStatus(elements, `${attacker.name} fallo el disparo.`);
  state.currentTurnPlayerIndex = getNextPlayerIndex();

  showTurnScreen(elements, `Turno de ataque: ${getTurnPlayer().name}`, {
    message: "Pasa la computadora al siguiente jugador y presiona continuar.",
    buttonLabel: "Continuar",
  });
  renderUI();
}

function onRotate() {
  state.orientation = state.orientation === "horizontal" ? "vertical" : "horizontal";
  renderUI();
}

function onResetBoard() {
  if (state.phase !== "setup") {
    return;
  }

  resetSetupPlayer(getSetupPlayer());
  updateStatus(elements, "Tablero limpio. Vuelve a colocar tus barcos.");
  renderUI();
}

function onConfirmPlayer() {
  if (state.phase !== "setup") {
    return;
  }

  const player = getSetupPlayer();
  const allPlaced = player.ships.every((ship) => ship.placed);

  if (!allPlaced) {
    updateStatus(elements, "Aun faltan barcos por colocar.");
    return;
  }

  player.confirmed = true;

  if (state.currentSetupPlayerIndex === 0) {
    showTurnScreen(elements, "Turno de Jugador 2", {
      message: "Pasa la computadora al siguiente jugador y presiona continuar.",
      buttonLabel: "Continuar",
    });
    updateStatus(elements, "Jugador 1 listo. Esperando cambio de jugador.");
    return;
  }

  startBattlePhase();
}

function onContinueAfterTurnScreen() {
  if (state.phase === "gameover") {
    onRestartGame();
    return;
  }

  hideTurnScreen(elements);

  if (state.phase === "setup") {
    if (state.currentSetupPlayerIndex === 0 && state.players[1].confirmed === false) {
      state.currentSetupPlayerIndex = 1;
      state.orientation = "horizontal";
      renderUI();
      updateStatus(elements, "Jugador 2: coloca tus barcos.");
    }
    return;
  }

  renderUI();
  updateStatus(elements, `Turno activo: ${getTurnPlayer().name}. Haz tu disparo.`);
}

function onRestartGame() {
  state = createInitialState();
  stopBackgroundMusic();
  hideTurnScreen(elements);
  updateStatus(elements, "Juego reiniciado. Jugador 1 coloca sus barcos.");
  renderUI();
}

function startBattlePhase() {
  state.phase = "battle";
  state.currentTurnPlayerIndex = 0;
  playBackgroundMusic();
  showTurnScreen(elements, "Empieza la batalla: Jugador 1", {
    message: "Jugador 1 prepara tu estrategia y presiona comenzar.",
    buttonLabel: "Comenzar",
  });
  renderUI();
}

function playBackgroundMusic() {
  backgroundMusic.currentTime = 0;
  const playPromise = backgroundMusic.play();

  if (playPromise) {
    playPromise.catch(() => {
      updateStatus(elements, "No se pudo reproducir la musica automaticamente.");
    });
  }
}

function stopBackgroundMusic() {
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
}

function playSfx(audio) {
  audio.currentTime = 0;
  const playPromise = audio.play();

  if (playPromise) {
    playPromise.catch(() => {
      // Si el navegador bloquea audio automatico, no tronamos el juego.
    });
  }
}

function isShipSunk(player, shipId) {
  if (!shipId) {
    return false;
  }

  const ship = player.ships.find((item) => item.id === shipId);
  if (!ship) {
    return false;
  }

  return ship.positions.every(
    ({ row, col }) => player.shotsReceived[row][col] === "hit"
  );
}

function renderUI() {
  // Agregar clase del jugador actual al contenedor
  const container = document.querySelector('.container');
  if (container) {
    container.classList.remove('player-1', 'player-2');
    const currentPlayer = state.phase === 'setup' ? state.currentSetupPlayerIndex : state.currentTurnPlayerIndex;
    container.classList.add(`player-${currentPlayer + 1}`);
  }
  
  render(elements, state, {
    getSetupPlayer,
    getTurnPlayer,
    getOpponentPlayer,
  });
}

function getSetupPlayer() {
  return state.players[state.currentSetupPlayerIndex];
}

function getTurnPlayer() {
  return state.players[state.currentTurnPlayerIndex];
}

function getOpponentPlayer() {
  const opponentIndex = state.currentTurnPlayerIndex === 0 ? 1 : 0;
  return state.players[opponentIndex];
}

function getNextPlayerIndex() {
  return state.currentTurnPlayerIndex === 0 ? 1 : 0;
}

