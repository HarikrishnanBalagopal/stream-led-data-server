import { W, H, HIDDEN_CANVAS, GLOBALS, GAME_PAD_UP, GAME_PAD_DOWN, GAME_PAD_LEFT, GAME_PAD_RIGHT } from './constants.js';
import { get_rgb_from_canvas_ctx, rearrange, send_image_to_display, render_scrolling_text } from './utils.js';

// snake game

function mod(n, m) {
    return ((n % m) + m) % m;
}

function get_random_int(max) {
    return Math.floor(Math.random() * max);
}

function show_snake(event_idx) {
    const STATE = {
        snake_dir: 'R',
        apple: [3, 4],
        snake: [],
    };
    function reset() {
        STATE.snake = [
            [0, 0],
            [0, 1],
            [0, 2],
            [0, 3]
        ];
        STATE.apple = new_apple_pos();
    }
    function new_apple_pos() {
        let x = 0,
            y = 0;
        let intersect = false;
        do {
            x = get_random_int(W);
            y = get_random_int(H);
            intersect = false;
            for (const s of STATE.snake) {
                if (s[0] === x && s[1] === y) {
                    intersect = true;
                    break;
                }
            }
        } while (intersect);
        return [x, y];
    }
    function handle_change_snake_dir_helper(key) {
        switch (key) {
            case "ArrowUp":
                STATE.snake_dir = "U";
                break;
            case "ArrowDown":
                STATE.snake_dir = "D";
                break;
            case "ArrowLeft":
                STATE.snake_dir = "L";
                break;
            case "ArrowRight":
                STATE.snake_dir = "R";
                break;
            case "r":
                reset();
                break;
        }
    }
    function handle_change_snake_dir(e) {
        handle_change_snake_dir_helper(e.key);
    }
    function handle_change_snake_dir_up() {
        handle_change_snake_dir_helper('ArrowUp');
    }
    function handle_change_snake_dir_down() {
        handle_change_snake_dir_helper('ArrowDown');
    }
    function handle_change_snake_dir_left() {
        handle_change_snake_dir_helper('ArrowLeft');
    }
    function handle_change_snake_dir_right() {
        handle_change_snake_dir_helper('ArrowRight');
    }

    reset();
    // event listeners
    document.body.addEventListener("keyup", handle_change_snake_dir);
    GAME_PAD_UP.addEventListener('click', handle_change_snake_dir_up);
    GAME_PAD_DOWN.addEventListener('click', handle_change_snake_dir_down);
    GAME_PAD_LEFT.addEventListener('click', handle_change_snake_dir_left);
    GAME_PAD_RIGHT.addEventListener('click', handle_change_snake_dir_right);
    // event listeners
    const c = HIDDEN_CANVAS;
    c.width = W;
    c.height = H;
    const x = c.getContext("2d");
    const t_speed = 20;
    let last_t = null;
    function eat_apple() {
        if (STATE.snake[0][0] === STATE.apple[0] && STATE.snake[0][1] === STATE.apple[1]) {
            STATE.snake.unshift([...STATE.apple]);
            STATE.apple = new_apple_pos();
        }
    }
    function move_snake() {
        let off_x = 0,
            off_y = 0;
        switch (STATE.snake_dir) {
            case "L":
                off_x = -1;
                break;
            case "R":
                off_x = 1;
                break;
            case "U":
                off_y = -1;
                break;
            case "D":
                off_y = 1;
                break;
        }
        const new_head = [
            mod(STATE.snake[0][0] + off_x, W),
            mod(STATE.snake[0][1] + off_y, H)
        ];
        for (const x of STATE.snake) {
            if (new_head[0] === x[0] && new_head[1] === x[1]) return true;
        }
        STATE.snake.pop();
        STATE.snake.unshift(new_head);
    }
    function step(t) {
        if (GLOBALS.EVENT_COUNTER !== event_idx) {
            document.body.removeEventListener("keyup", handle_change_snake_dir);
            GAME_PAD_UP.removeEventListener('click', handle_change_snake_dir_up);
            GAME_PAD_DOWN.removeEventListener('click', handle_change_snake_dir_down);
            GAME_PAD_LEFT.removeEventListener('click', handle_change_snake_dir_left);
            GAME_PAD_RIGHT.removeEventListener('click', handle_change_snake_dir_right);
            return;
        }
        t /= 4;
        if (last_t === null) last_t = t;
        if (t - last_t < t_speed) return requestAnimationFrame(step);
        last_t = t;
        if (move_snake()) {
            return render_scrolling_text(event_idx, 'Game Over', 'green');
        }
        eat_apple();
        x.save();
        x.fillStyle = "black";
        x.fillRect(0, 0, W, H);
        x.fillStyle = "lime";
        STATE.snake.forEach((s) => x.fillRect(s[0], s[1], 1, 1));
        x.fillStyle = "red";
        x.fillRect(STATE.apple[0], STATE.apple[1], 1, 1);
        x.restore();
        const rgb = get_rgb_from_canvas_ctx(x);
        rearrange(rgb);
        send_image_to_display(rgb);
        requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

export { show_snake };
