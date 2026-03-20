import { GAME_CONFIG } from "./config.js";

export function getElements() {
  return {
    board: document.getElementById("placement-board"),
    ownBoard: document.getElementById("own-board"),
    ownBoardWrap: document.getElementById("own-board-wrap"),
    shipList: document.getElementById("ship-list"),
    shipListTitle: document.getElementById("ship-list-title"),
    status: document.getElementById("status"),
    playerTitle: document.getElementById("player-title"),
    actionBoardTitle: document.getElementById("action-board-title"),
    orientationLabel: document.getElementById("orientation-label"),
    rotateButton: document.getElementById("btn-rotate"),
    resetBoardButton: document.getElementById("btn-reset-board"),
    confirmPlayerButton: document.getElementById("btn-confirm-player"),
    restartGameButton: document.getElementById("btn-restart-game"),
    turnScreen: document.getElementById("turn-screen"),
    turnScreenBadge: document.getElementById("turn-screen-badge"),
    turnScreenTitle: document.getElementById("turn-screen-title"),
    turnScreenMessage: document.getElementById("turn-screen-message"),
    continueButton: document.getElementById("btn-continue"),
  };
}

export function buildBoards(elements) {
  buildSingleGrid(elements.board, "attack");
  buildSingleGrid(elements.ownBoard, "own");
}

function buildSingleGrid(element, gridType) {
  const totalCells = GAME_CONFIG.BOARD_SIZE * GAME_CONFIG.BOARD_SIZE;
  element.innerHTML = "";
  element.style.setProperty("--board-size", String(GAME_CONFIG.BOARD_SIZE));

  for (let i = 0; i < totalCells; i += 1) {
    const row = Math.floor(i / GAME_CONFIG.BOARD_SIZE);
    const col = i % GAME_CONFIG.BOARD_SIZE;
    const cellButton = document.createElement("button");
    cellButton.type = "button";
    cellButton.className = "cell";
    cellButton.dataset.row = String(row);
    cellButton.dataset.col = String(col);
    cellButton.dataset.gridType = gridType;
    cellButton.setAttribute("aria-label", `Fila ${row + 1}, Columna ${col + 1}`);

    if (gridType === "own") {
      cellButton.disabled = true;
    }

    element.appendChild(cellButton);
  }
}

export function showTurnScreen(elements, title, options = {}) {
  const { variant = "normal", message, buttonLabel } = options;

  elements.turnScreenTitle.textContent = title;
  if (message) {
    elements.turnScreenMessage.textContent = message;
  }

  elements.continueButton.textContent = buttonLabel || "Continuar";
  elements.turnScreen.classList.toggle("turn-screen--victory", variant === "victory");
  elements.turnScreenBadge.classList.toggle("hidden", variant !== "victory");
  elements.turnScreen.classList.remove("hidden");
}

export function hideTurnScreen(elements) {
  elements.turnScreen.classList.add("hidden");
}

export function updateStatus(elements, message) {
  elements.status.textContent = message;
}

// Render principal: decide que pintar segun la fase del juego.
export function render(elements, state, selectors) {
  if (state.phase === "setup") {
    renderSetupPhase(elements, state, selectors);
    return;
  }

  renderBattlePhase(elements, state, selectors);
}

function renderSetupPhase(elements, state, selectors) {
  const player = selectors.getSetupPlayer();

  elements.ownBoardWrap.classList.add("hidden");
  elements.rotateButton.disabled = false;
  elements.resetBoardButton.disabled = false;
  elements.rotateButton.classList.remove("hidden");
  elements.resetBoardButton.classList.remove("hidden");
  elements.confirmPlayerButton.classList.remove("hidden");
  elements.actionBoardTitle.textContent = "Tablero de colocacion";
  elements.shipListTitle.textContent = "Barcos por colocar";
  elements.playerTitle.textContent = `Turno de colocacion: ${player.name}`;

  const orientationText =
    state.orientation === "horizontal" ? "Horizontal" : "Vertical";
  elements.orientationLabel.textContent = `Orientacion: ${orientationText}`;
  elements.rotateButton.textContent = `Rotar (${orientationText})`;

  renderSetupShipList(elements, player);
  renderSetupBoard(elements, player);

  const allPlaced = player.ships.every((ship) => ship.placed);
  elements.confirmPlayerButton.disabled = !allPlaced || player.confirmed;
}

function renderBattlePhase(elements, state, selectors) {
  const attacker = selectors.getTurnPlayer();
  const defender = selectors.getOpponentPlayer();

  elements.ownBoardWrap.classList.remove("hidden");
  elements.rotateButton.disabled = true;
  elements.resetBoardButton.disabled = true;
  elements.confirmPlayerButton.disabled = true;
  elements.rotateButton.classList.add("hidden");
  elements.resetBoardButton.classList.add("hidden");
  elements.confirmPlayerButton.classList.add("hidden");
  elements.actionBoardTitle.textContent = "Tablero enemigo (disparos)";
  elements.shipListTitle.textContent = "Resumen del turno";

  if (state.phase === "gameover") {
    const winnerName = state.players[state.winnerIndex].name;
    elements.playerTitle.textContent = `Ganador: ${winnerName}`;
    elements.orientationLabel.textContent = "Modo: Fin de partida";
  } else {
    elements.playerTitle.textContent = `Turno de ataque: ${attacker.name}`;
    elements.orientationLabel.textContent = "Modo: Ataque";
  }

  renderBattleInfo(elements, state, attacker, defender);
  renderAttackBoard(elements, state, attacker);
  renderOwnBoard(elements, attacker);
}

function renderSetupShipList(elements, player) {
  elements.shipList.innerHTML = "";

  player.ships.forEach((ship) => {
    const item = document.createElement("li");
    item.className = "ship-list__item";

    const shipInfo = document.createElement("span");
    shipInfo.textContent = `${ship.label} (${ship.size})`;

    const shipState = document.createElement("strong");
    shipState.textContent = ship.placed ? "OK" : "Pendiente";
    shipState.className = ship.placed ? "tag tag--ok" : "tag tag--pending";

    item.appendChild(shipInfo);
    item.appendChild(shipState);
    elements.shipList.appendChild(item);
  });
}

function renderBattleInfo(elements, state, attacker, defender) {
  const hits = attacker.attacks.flat().filter((value) => value === "hit").length;
  const misses = attacker.attacks.flat().filter((value) => value === "miss").length;

  elements.shipList.innerHTML = "";

  const items = state.phase === "gameover"
    ? [
        `Ganador: ${state.players[state.winnerIndex].name}`,
        `Flota derrotada: ${defender.name}`,
        "Presiona Reiniciar juego para otra partida",
      ]
    : [
        `Atacando a: ${defender.name}`,
        `Hits acumulados: ${hits}`,
        `Misses acumulados: ${misses}`,
      ];

  items.forEach((text) => {
    const item = document.createElement("li");
    item.className = "ship-list__item";
    item.textContent = text;
    elements.shipList.appendChild(item);
  });
}

function renderSetupBoard(elements, player) {
  const cells = elements.board.querySelectorAll(".cell");

  cells.forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const value = player.board[row][col];

    cell.classList.toggle("cell--ship", value !== null);
    cell.classList.remove("cell--hit", "cell--miss");
    cell.textContent = value !== null ? "S" : "";
    cell.disabled = false;
  });
}

function renderAttackBoard(elements, state, attacker) {
  const cells = elements.board.querySelectorAll(".cell");

  cells.forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const value = attacker.attacks[row][col];

    cell.classList.remove("cell--ship");
    cell.classList.toggle("cell--hit", value === "hit");
    cell.classList.toggle("cell--miss", value === "miss");

    if (value === "hit") {
      cell.textContent = "X";
    } else if (value === "miss") {
      cell.textContent = "o";
    } else {
      cell.textContent = "";
    }

    cell.disabled =
      state.phase === "gameover" ||
      value !== null ||
      elements.turnScreen.classList.contains("hidden") === false;
  });
}

function renderOwnBoard(elements, currentPlayer) {
  const cells = elements.ownBoard.querySelectorAll(".cell");

  cells.forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const ship = currentPlayer.board[row][col];
    const shot = currentPlayer.shotsReceived[row][col];

    cell.classList.toggle("cell--ship", ship !== null);
    cell.classList.toggle("cell--hit", shot === "hit");
    cell.classList.toggle("cell--miss", shot === "miss" && ship === null);

    if (shot === "hit") {
      cell.textContent = "X";
    } else if (shot === "miss") {
      cell.textContent = ship === null ? "o" : "S";
    } else {
      cell.textContent = ship !== null ? "S" : "";
    }

    cell.disabled = true;
  });
}
