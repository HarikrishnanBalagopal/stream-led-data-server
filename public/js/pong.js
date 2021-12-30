import { W, H, HIDDEN_CANVAS, GLOBALS } from './constants.js';
import { get_rgb_from_canvas_ctx, rearrange, send_image_to_display, render_scrolling_text } from './utils.js';

function show_pong(event_idx) {
    const c = HIDDEN_CANVAS;
    const x = c.getContext("2d");
    const PLAYER_LEN = 4;
    const STATE = {
        p1_y: 0,
        p2_y: H - PLAYER_LEN,
        ball_x: Math.floor(W / 2),
        ball_y: Math.floor(H / 2),
        ball_vx: 1,
        ball_vy: 1,
        p1_score: 4,
        p2_score: 4,
    };
    function handle_ping_pong(e) {
        if (e.key === "w") {
            STATE.p1_y -= 1;
            if (STATE.p1_y < 0) STATE.p1_y = 0;
        } else if (e.key === "s") {
            STATE.p1_y += 1;
            if (STATE.p1_y >= H - PLAYER_LEN) STATE.p1_y = H - PLAYER_LEN;
        } else if (e.key === "ArrowUp") {
            STATE.p2_y -= 1;
            if (STATE.p2_y < 0) STATE.p2_y = 0;
        } else if (e.key === "ArrowDown") {
            STATE.p2_y += 1;
            if (STATE.p2_y >= H - PLAYER_LEN) STATE.p2_y = H - PLAYER_LEN;
        }
    }
    document.body.addEventListener("keydown", handle_ping_pong);
    const t_speed = 100;
    let last_t = null;
    function draw(t) {
        if (GLOBALS.EVENT_COUNTER !== event_idx) {
            return document.body.removeEventListener("keydown", handle_ping_pong);
        }
        if (STATE.p1_score === 0 || STATE.p2_score === 0) {
            return render_scrolling_text(event_idx, STATE.p1_score === 0 ? 'blue wins!' : 'red wins!', STATE.p1_score === 0 ? 'blue' : 'red');
        }
        if (last_t === null) last_t = t;
        if (t - last_t < t_speed) return requestAnimationFrame(draw);
        last_t = t;
        x.save();
        x.fillStyle = "black";
        x.fillRect(0, 0, W, H);
        x.fillStyle = "red";
        x.fillRect(0, STATE.p1_y, 1, PLAYER_LEN);
        x.fillStyle = "blue";
        x.fillRect(W - 1, STATE.p2_y, 1, PLAYER_LEN);
        // net
        let i = 0;
        for (let r_lives = STATE.p1_score; r_lives > 0 && i < H; i += 2) {
            if (i === Math.floor(W / 2)) {
                x.fillStyle = 'white';
                x.fillRect(Math.floor(W / 2), i, 1, 1);
                continue;
            }
            x.fillStyle = 'red';
            x.fillRect(Math.floor(W / 2), i, 1, 1);
            r_lives--;
        }
        for (let b_lives = STATE.p2_score; b_lives > 0 && i < H; i += 2) {
            if (i === Math.floor(W / 2)) {
                x.fillStyle = 'white';
                x.fillRect(Math.floor(W / 2), i, 1, 1);
                continue;
            }
            x.fillStyle = 'blue';
            x.fillRect(Math.floor(W / 2), i, 1, 1);
            b_lives--;
        }
        // ball
        x.fillStyle = "white";
        x.fillRect(STATE.ball_x, STATE.ball_y, 1, 1);
        x.restore();
        // update state
        STATE.ball_x += STATE.ball_vx;
        STATE.ball_y += STATE.ball_vy;
        // collision
        if (
            STATE.ball_x === 1 &&
            STATE.ball_y >= STATE.p1_y &&
            STATE.ball_y < STATE.p1_y + PLAYER_LEN
        ) {
            STATE.ball_vx *= -1;
        } else if (
            STATE.ball_x === W - 2 &&
            STATE.ball_y >= STATE.p2_y &&
            STATE.ball_y < STATE.p2_y + PLAYER_LEN
        ) {
            STATE.ball_vx *= -1;
        } else if (
            STATE.ball_x === 1 &&
            STATE.ball_y + STATE.ball_vy >= STATE.p1_y &&
            STATE.ball_y + STATE.ball_vy < STATE.p1_y + PLAYER_LEN
        ) {
            STATE.ball_vx *= -1;
            STATE.ball_vy *= -1;
        } else if (
            STATE.ball_x === W - 2 &&
            STATE.ball_y + STATE.ball_vy >= STATE.p2_y &&
            STATE.ball_y + STATE.ball_vy < STATE.p2_y + PLAYER_LEN
        ) {
            STATE.ball_vx *= -1;
            STATE.ball_vy *= -1;
        }

        if (STATE.ball_y === 0 || STATE.ball_y === H - 1) {
            STATE.ball_vy *= -1;
        }
        // out of bounds
        if (
            STATE.ball_x < 0 ||
            STATE.ball_x >= W ||
            STATE.ball_y < 0 ||
            STATE.ball_y >= H
        ) {
            if (STATE.ball_x < 0) { STATE.p1_score--; STATE.p2_score++; }
            else if (STATE.ball_x >= W) { STATE.p1_score++; STATE.p2_score--; }
            STATE.ball_x = Math.floor(W / 2);
            STATE.ball_y = Math.floor(H / 2);
        }
        const rgb = get_rgb_from_canvas_ctx(x);
        rearrange(rgb);
        send_image_to_display(rgb);
        return requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
}

export { show_pong };
