import { W, H, TEXT_FONT, HIDDEN_CANVAS, GLOBALS } from './constants.js';

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
        fetch('/display-image', { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: new_status }).catch(console.error);
        text_x += text_step/10;
        if (text_x <= min_text_x || text_x >= max_text_x) text_step *= -1;
        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
}

export { get_rgb_from_canvas_ctx, rearrange, send_image_to_display, get_text_length, render_text, render_scrolling_text };
