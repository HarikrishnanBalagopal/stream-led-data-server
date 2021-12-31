const W = 17, H = 17, CELL_SIZE = 20, TEXT_FONT = '16px serif';
const STATUS_CANVAS = document.querySelector('#status-canvas');
const HIDDEN_CANVAS = document.createElement('canvas');

const GAME_PAD = document.querySelector('#game-pad');
const GAME_PAD_UP = document.querySelector('#controls-game-pad-button-up');
const GAME_PAD_DOWN = document.querySelector('#controls-game-pad-button-down');
const GAME_PAD_LEFT = document.querySelector('#controls-game-pad-button-left');
const GAME_PAD_RIGHT = document.querySelector('#controls-game-pad-button-right');

const GAME_PAD_FOR_PONG = document.querySelector('#game-pad-for-pong');
const GAME_PAD_FOR_PONG_P1_LEFT = document.querySelector("#controls-game-pad-for-pong-p1-button-left");
const GAME_PAD_FOR_PONG_P1_RIGHT = document.querySelector("#controls-game-pad-for-pong-p1-button-right");
const GAME_PAD_FOR_PONG_P2_LEFT = document.querySelector("#controls-game-pad-for-pong-p2-button-left");
const GAME_PAD_FOR_PONG_P2_RIGHT = document.querySelector("#controls-game-pad-for-pong-p2-button-right");

const GLOBALS = {
    EVENT_COUNTER: 0,
    CLEANED: true,
};

export {
    W, H, CELL_SIZE, TEXT_FONT, HIDDEN_CANVAS, GLOBALS, STATUS_CANVAS,
    GAME_PAD, GAME_PAD_UP, GAME_PAD_DOWN, GAME_PAD_LEFT, GAME_PAD_RIGHT,
    GAME_PAD_FOR_PONG, GAME_PAD_FOR_PONG_P1_LEFT, GAME_PAD_FOR_PONG_P1_RIGHT, GAME_PAD_FOR_PONG_P2_LEFT, GAME_PAD_FOR_PONG_P2_RIGHT,
};
