import { W, H, TEXT_FONT, HIDDEN_CANVAS, GLOBALS, STATUS_CANVAS } from './constants.js';

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

function send_image_to_display(rgb) {
    fetch('/display-image', { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: rgb }).catch(console.error);
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


function render_scrolling_text(event_idx, text, text_color = 'white', t_speed = 10) {
    const min_text_x = -get_text_length(text), max_text_x = 10;
    let last_t = 0, text_x = max_text_x, text_step = -1;
    function draw(t) {
        if (GLOBALS.EVENT_COUNTER !== event_idx) return;
        if (last_t === 0) last_t = t;
        if (t - last_t < t_speed) return requestAnimationFrame(draw);
        last_t = t;
        const new_status = render_text(text, text_x, H - 4, text_color);
        send_image_to_display(new_status);
        text_x += text_step / 10;
        if (text_x <= min_text_x || text_x >= max_text_x) text_step *= -1;
        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
}

function show_display_status(status) {
    const ctx = STATUS_CANVAS.getContext('2d');
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

function wait_for_cleanup() {
    return new Promise(resolve=>{
        const helper = () => {
            if(GLOBALS.CLEANED)return resolve();
            requestAnimationFrame(helper);
        };
        helper();
    });
}

export { get_rgb_from_canvas_ctx, rearrange, send_image_to_display, get_text_length, render_text, render_scrolling_text, show_display_status, wait_for_cleanup };
