// Archivo: logic.js | Aqui esta la logica principal del juego (reglas, validaciones y acciones de batalla).
import { GAME_CONFIG } from "./config.js";

// Devuelve el barco que sigue para colocar en setup.
export function getNextShipToPlace(player) {
  return player.ships.find((ship) => ship.placed === false) || null;
}

export function getPlacementCells(startRow, startCol, shipSize, orientation) {
  const cells = [];

  for (let i = 0; i < shipSize; i += 1) {
    const row = orientation === "horizontal" ? startRow : startRow + i;
    const col = orientation === "horizontal" ? startCol + i : startCol;
    cells.push({ row, col });
  }

  return cells;
}

export function isPlacementValid(player, placement) {
  return placement.every(({ row, col }) => {
    const insideBoard =
      row >= 0 && row < GAME_CONFIG.BOARD_SIZE && col >= 0 && col < GAME_CONFIG.BOARD_SIZE;

    if (!insideBoard) {
      return false;
    }

    return player.board[row][col] === null;
  });
}

export function placeShip(player, ship, placement) {
  placement.forEach(({ row, col }) => {
    player.board[row][col] = ship.id;
  });

  ship.positions = placement;
  ship.placed = true;
}

export function isPlayerDefeated(player) {
  return player.ships.every((ship) =>
    ship.positions.every(({ row, col }) => player.shotsReceived[row][col] === "hit")
  );
}

