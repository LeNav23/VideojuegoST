import { GAME_CONFIG, PLAYER_NAMES } from "./config.js";

function createMatrix(defaultValue = null) {
  return Array.from({ length: GAME_CONFIG.BOARD_SIZE }, () =>
    Array.from({ length: GAME_CONFIG.BOARD_SIZE }, () => defaultValue)
  );
}

export function createPlayerState(name) {
  return {
    name,
    board: createMatrix(null),
    ships: GAME_CONFIG.SHIPS.map((ship) => ({
      ...ship,
      positions: [],
      placed: false,
    })),
    attacks: createMatrix(null),
    shotsReceived: createMatrix(null),
    confirmed: false,
  };
}

export function createInitialState() {
  return {
    phase: "setup",
    currentSetupPlayerIndex: 0,
    currentTurnPlayerIndex: 0,
    orientation: "horizontal",
    winnerIndex: null,
    players: PLAYER_NAMES.map(createPlayerState),
  };
}

export function resetSetupPlayer(player) {
  player.board = createMatrix(null);
  player.ships = GAME_CONFIG.SHIPS.map((ship) => ({
    ...ship,
    positions: [],
    placed: false,
  }));
}
