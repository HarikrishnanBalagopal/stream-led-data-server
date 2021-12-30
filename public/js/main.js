import { W, H, HIDDEN_CANVAS, GLOBALS } from './constants.js';
import { show_snake } from './snake.js';
import { show_clock } from './clock.js';
import { show_pong } from './pong.js';
import { rearrange, render_scrolling_text, send_image_to_display } from './utils.js';

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
            ctx.fillRect(x, y, 1, 1);
        }
    }
    ctx.restore();
}

function set_color(r, g, b) {
    const status = (new Uint8Array(W * H * 3)).map((_, i) => {
        if (i % 3 === 0) return r;
        if (i % 3 === 1) return g;
        return b;
    });
    send_image_to_display(status);
}

async function main() {
    console.log('main start');
    HIDDEN_CANVAS.width = W;
    HIDDEN_CANVAS.height = H;

    const status_canvas = document.querySelector('#status-canvas');
    status_canvas.width = W;
    status_canvas.height = H;
    const controls_button_clear = document.querySelector('#controls-button-clear');
    controls_button_clear.addEventListener('click', () => {
        ++GLOBALS.EVENT_COUNTER;
        console.log('clear the leds');
        set_color(0, 0, 0);
    })
    const controls_input_color = document.querySelector('#controls-input-color');
    controls_input_color.addEventListener('change', () => {
        ++GLOBALS.EVENT_COUNTER;
        const new_color = controls_input_color.value;
        const r = parseInt(new_color[1] + new_color[2], 16);
        const g = parseInt(new_color[3] + new_color[4], 16);
        const b = parseInt(new_color[5] + new_color[6], 16);
        console.log('selected color is red:', r, 'green:', g, 'blue:', b);
        set_color(r, g, b);
    });
    const controls_button_send_files = document.querySelector('#controls-button-send-files');
    controls_button_send_files.addEventListener('click', () => {
        ++GLOBALS.EVENT_COUNTER;
        fetch('/display-send-files', { method: 'PUT' }).catch(console.error);
    });
    const status_canvas_ctx = status_canvas.getContext('2d');
    const led_display_status = await fetch_display_status();
    show_display_status(status_canvas_ctx, led_display_status);
    const controls_button_refresh = document.querySelector('#controls-button-refresh');
    controls_button_refresh.addEventListener('click', async () => {
        // ++GLOBALS.EVENT_COUNTER; // TODO: is this exception necessary?
        const led_display_status = await fetch_display_status();
        show_display_status(status_canvas_ctx, led_display_status);
    });
    const controls_input_text = document.querySelector('#controls-input-text');
    controls_input_text.addEventListener('keyup', e => {
        if (e.key !== 'Enter') return;
        ++GLOBALS.EVENT_COUNTER;
        const text = controls_input_text.value.trim();
        if (text.length === 0) return;
        render_scrolling_text(GLOBALS.EVENT_COUNTER, text);
    })
    const controls_button_display_text = document.querySelector('#controls-button-display-text');
    controls_button_display_text.addEventListener('click', () => {
        ++GLOBALS.EVENT_COUNTER;
        const text = controls_input_text.value.trim();
        if (text.length === 0) return;
        render_scrolling_text(GLOBALS.EVENT_COUNTER, text);
    });
    const controls_button_clock = document.querySelector('#controls-button-clock');
    controls_button_clock.addEventListener('click', () => {
        ++GLOBALS.EVENT_COUNTER;
        show_clock(GLOBALS.EVENT_COUNTER);
    });
    const controls_button_ping_pong = document.querySelector('#controls-button-ping-pong');
    controls_button_ping_pong.addEventListener('click', () => {
        ++GLOBALS.EVENT_COUNTER;
        show_pong(GLOBALS.EVENT_COUNTER);
    });
    const controls_button_snake = document.querySelector('#controls-button-snake');
    controls_button_snake.addEventListener('click', () => {
        ++GLOBALS.EVENT_COUNTER;
        show_snake(GLOBALS.EVENT_COUNTER);
    });
    console.log('main end');
}

main().catch(console.error);
