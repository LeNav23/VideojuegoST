// Config general del juego (se puede cambiar facil aqui).
export const GAME_CONFIG = {
  BOARD_SIZE: 10,
  SHIPS: [
    { id: "carrier", label: "Carrier", size: 5 },
    { id: "battleship", label: "Battleship", size: 4 },
    { id: "cruiser", label: "Cruiser", size: 3 },
    { id: "submarine", label: "Submarine", size: 3 },
    { id: "destroyer", label: "Destroyer", size: 2 },
  ],
};

export const PLAYER_NAMES = ["Jugador 1", "Jugador 2"];
