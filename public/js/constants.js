const W = 17, H = 17, CELL_SIZE = 20, TEXT_FONT = '16px serif';
const STATUS_CANVAS = document.querySelector('#status-canvas');
const HIDDEN_CANVAS = document.createElement('canvas');
const HIDDEN_VIDEO_CAMERA = document.querySelector('#controls-video-camera');
const HIDDEN_CANVAS_FOR_VIDEO = document.createElement('canvas');
const HIDDEN_CANVAS_FOR_VIDEO_THRESHOLD = document.querySelector('#controls-canvas-threshold');

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

function initialize() {
    HIDDEN_CANVAS.width = W;
    HIDDEN_CANVAS.height = H;
    STATUS_CANVAS.width = W;
    STATUS_CANVAS.height = H;
    HIDDEN_CANVAS_FOR_VIDEO.width = 512;
    HIDDEN_CANVAS_FOR_VIDEO.height = 512;
}

export {
    initialize,
    W, H, CELL_SIZE, TEXT_FONT, HIDDEN_CANVAS, GLOBALS, STATUS_CANVAS, HIDDEN_VIDEO_CAMERA, HIDDEN_CANVAS_FOR_VIDEO, HIDDEN_CANVAS_FOR_VIDEO_THRESHOLD,
    GAME_PAD, GAME_PAD_UP, GAME_PAD_DOWN, GAME_PAD_LEFT, GAME_PAD_RIGHT,
    GAME_PAD_FOR_PONG, GAME_PAD_FOR_PONG_P1_LEFT, GAME_PAD_FOR_PONG_P1_RIGHT, GAME_PAD_FOR_PONG_P2_LEFT, GAME_PAD_FOR_PONG_P2_RIGHT,
};
