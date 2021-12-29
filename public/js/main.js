const W = 17, H = 17, CELL_SIZE = 20, TEXT_FONT = '16px serif';
let HIDDEN_CANVAS = null;
let EVENT_COUNTER = 0;

async function fetch_display_status() {
    const resp = await fetch('/display-status');
    if (!resp.ok) {
        throw new Error(`failed to fetch. status: ${resp.status} ${resp.statusText}`);
    }
    return (await resp.json()).status;
}

function show_display_status(ctx, status) {
    rearrange(status);
    ctx.save();
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const idx = (y * W + x) * 3;
            ctx.fillStyle = `rgb(${status[idx + 0]},${status[idx + 1]},${status[idx + 2]})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    }
    ctx.restore();
}

async function set_color(r, g, b) {
    const status = (new Uint8Array(W * H * 3)).map((_, i) => {
        if (i % 3 === 0) return r;
        if (i % 3 === 1) return g;
        return b;
    });
    await fetch('/display-image', { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: status });
}

function rearrange(status) {
    for (let y = 0; y < H; y++) {
        if (y % 2 === 0) continue;
        let start = 0;
        let end = W - 1;
        while (start < end) {
            const i1 = (y * W + start) * 3;
            const i2 = (y * W + end) * 3;
            [status[i1 + 0], status[i2 + 0]] = [status[i2 + 0], status[i1 + 0]];
            [status[i1 + 1], status[i2 + 1]] = [status[i2 + 1], status[i1 + 1]];
            [status[i1 + 2], status[i2 + 2]] = [status[i2 + 2], status[i1 + 2]];
            start++;
            end--;
        }
    }
}

function get_text_length(text) {
    const c = HIDDEN_CANVAS;
    const x = c.getContext("2d");
    x.save();
    x.fillStyle = 'white';
    x.font = TEXT_FONT;
    const text_metrics = x.measureText(text);
    x.restore();
    return text_metrics.width;
}

function render_text(text, text_x, text_y, text_color = 'white') {
    const c = HIDDEN_CANVAS;
    const x = c.getContext("2d");
    x.fillStyle = "black";
    x.fillRect(0, 0, W, H);
    x.fillStyle = text_color;
    x.font = TEXT_FONT;
    x.fillText(text, text_x, text_y);
    const rgba = x.getImageData(0, 0, W, H).data;
    const rgb = new Uint8Array(W * H * 3);
    for (let i = 0, j = 0; j < W * H * 3; i += 4, j += 3) {
        rgb[j + 0] = rgba[i + 0];
        rgb[j + 1] = rgba[i + 1];
        rgb[j + 2] = rgba[i + 2];
    }
    rearrange(rgb);
    return rgb;
}

function render_scrolling_text(event_idx, text, text_color = 'white', t_speed = 100) {
    const min_text_x = -get_text_length(text), max_text_x = 10;
    let last_t = 0, text_x = max_text_x, text_step = -1;
    function draw(t) {
        if (EVENT_COUNTER !== event_idx) return;
        if (last_t === 0) last_t = t;
        if (t - last_t < t_speed) return requestAnimationFrame(draw);
        last_t = t;
        const new_status = render_text(text, text_x, H - 4, text_color);
        fetch('/display-image', { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: new_status }).catch(console.error);
        text_x += text_step;
        if (text_x <= min_text_x || text_x >= max_text_x) text_step *= -1;
        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
}

function get_rgb_from_canvas_ctx(x) {
    const rgba = x.getImageData(0, 0, W, H).data;
    const rgb = new Uint8Array(W * H * 3);
    for (let i = 0, j = 0; j < W * H * 3; i += 4, j += 3) {
        rgb[j + 0] = rgba[i + 0];
        rgb[j + 1] = rgba[i + 1];
        rgb[j + 2] = rgba[i + 2];
    }
    return rgb;
}

function send_image_to_display(rgb) {
    fetch('/display-image', { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: rgb }).catch(console.error);
}

function render_clock(rgb, cen_x, cen_y, radius) {
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const t1 = (x - cen_x) * (x - cen_x) + (y - cen_y) * (y - cen_y);
            if (Math.floor(.2 * (t1 - radius * radius)) === 0) {
                const idx = (y * W + x) * 3;
                rgb[idx + 0] = 0xff;
                rgb[idx + 1] = 0xff;
                rgb[idx + 2] = 0xff;
            }
        }
    }
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (y === cen_y && x >= cen_x && x <= cen_x + radius) {
                const idx = (y * W + x) * 3;
                rgb[idx + 0] = 0xff;
                rgb[idx + 1] = 0xff;
                rgb[idx + 2] = 0xff;
            }
            if (x === cen_x && y <= cen_y && y >= radius) {
                const idx = (y * W + x) * 3;
                rgb[idx + 0] = 0xff;
                rgb[idx + 1] = 0xff;
                rgb[idx + 2] = 0xff;
            }
        }
    }
}

function render_canvas_clock(event_idx) {
    const c = HIDDEN_CANVAS;
    const x = c.getContext("2d");

    let last_t = null;
    const t_speed = 100;

    function draw(t) {
        if (EVENT_COUNTER !== event_idx) return;
        if (last_t === null) last_t = t;
        if (t - last_t < t_speed) return requestAnimationFrame(draw);
        last_t = t;
        const minute_len = 5;
        const minute_angle = t / 200;
        const minute_x = minute_len * Math.cos(minute_angle);
        const minute_y = minute_len * Math.sin(minute_angle);
        const hour_len = 4;
        const hour_angle = t / 1000;
        const hour_x = hour_len * Math.cos(hour_angle);
        const hour_y = hour_len * Math.sin(hour_angle);
        x.save();
        x.fillStyle = "black";
        x.fillRect(0, 0, W, H);
        x.strokeStyle = "white";
        x.beginPath();
        x.arc(W / 2, H / 2, 8, 0, Math.PI * 2, true);
        x.moveTo(W / 2, H / 2);
        x.lineTo(W / 2 + minute_x, H / 2 + minute_y);
        x.moveTo(W / 2, H / 2);
        x.lineTo(W / 2 + hour_x, H / 2 + hour_y);
        x.stroke();
        x.restore();
        const rgb = get_rgb_from_canvas_ctx(x);
        rearrange(rgb);
        send_image_to_display(rgb);
        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
}

function show_ping_pong(event_idx) {
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
        if (EVENT_COUNTER !== event_idx) {
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

async function main() {
    console.log('main start');
    HIDDEN_CANVAS = document.createElement('canvas');
    HIDDEN_CANVAS.width = W;
    HIDDEN_CANVAS.height = H;

    const status_canvas = document.querySelector('#status-canvas');
    status_canvas.width = W * CELL_SIZE;
    status_canvas.height = H * CELL_SIZE;
    const controls_button_clear = document.querySelector('#controls-button-clear');
    controls_button_clear.addEventListener('click', () => {
        ++EVENT_COUNTER;
        console.log('clear the leds');
        set_color(0, 0, 0).catch(console.error);
    })
    const controls_input_color = document.querySelector('#controls-input-color');
    controls_input_color.addEventListener('change', () => {
        ++EVENT_COUNTER;
        const new_color = controls_input_color.value;
        const r = parseInt(new_color[1] + new_color[2], 16);
        const g = parseInt(new_color[3] + new_color[4], 16);
        const b = parseInt(new_color[5] + new_color[6], 16);
        console.log('selected color is red:', r, 'green:', g, 'blue:', b);
        set_color(r, g, b).catch(console.error);
    });
    const controls_button_send_files = document.querySelector('#controls-button-send-files');
    controls_button_send_files.addEventListener('click', () => {
        ++EVENT_COUNTER;
        fetch('/display-send-files', { method: 'PUT' }).catch(console.error);
    });
    const status_canvas_ctx = status_canvas.getContext('2d');
    const led_display_status = await fetch_display_status();
    show_display_status(status_canvas_ctx, led_display_status);
    const controls_button_refresh = document.querySelector('#controls-button-refresh');
    controls_button_refresh.addEventListener('click', async () => {
        // ++EVENT_COUNTER; // TODO: is this exception necessary?
        const led_display_status = await fetch_display_status();
        show_display_status(status_canvas_ctx, led_display_status);
    });
    const controls_input_text = document.querySelector('#controls-input-text');
    controls_input_text.addEventListener('keyup', e => {
        if (e.key !== 'Enter') return;
        ++EVENT_COUNTER;
        const text = controls_input_text.value.trim();
        if (text.length === 0) return;
        render_scrolling_text(EVENT_COUNTER, text);
    })
    const controls_button_display_text = document.querySelector('#controls-button-display-text');
    controls_button_display_text.addEventListener('click', () => {
        ++EVENT_COUNTER;
        const text = controls_input_text.value.trim();
        if (text.length === 0) return;
        render_scrolling_text(EVENT_COUNTER, text);
    });
    const controls_button_clock = document.querySelector('#controls-button-clock');
    controls_button_clock.addEventListener('click', () => {
        ++EVENT_COUNTER;
        render_canvas_clock(EVENT_COUNTER);
    });
    const controls_button_ping_pong = document.querySelector('#controls-button-ping-pong');
    controls_button_ping_pong.addEventListener('click', () => {
        ++EVENT_COUNTER;
        show_ping_pong(EVENT_COUNTER);
    });
    console.log('main end');
}

main().catch(console.error);
