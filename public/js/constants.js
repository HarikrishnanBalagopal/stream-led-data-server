const W = 17, H = 17, CELL_SIZE = 20, TEXT_FONT = '16px serif';
const HIDDEN_CANVAS = document.createElement('canvas');;
const GAME_PAD_UP = document.querySelector('#controls-game-pad-button-up');
const GAME_PAD_DOWN = document.querySelector('#controls-game-pad-button-down');
const GAME_PAD_LEFT = document.querySelector('#controls-game-pad-button-left');
const GAME_PAD_RIGHT = document.querySelector('#controls-game-pad-button-right');

const GLOBALS = {
    EVENT_COUNTER: 0,
};

export { W, H, CELL_SIZE, TEXT_FONT, HIDDEN_CANVAS, GLOBALS, GAME_PAD_UP, GAME_PAD_DOWN, GAME_PAD_LEFT, GAME_PAD_RIGHT };
