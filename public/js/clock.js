import { W, H, HIDDEN_CANVAS, GLOBALS } from './constants.js';
import { get_rgb_from_canvas_ctx, rearrange, send_image_to_display } from './utils.js';

function show_clock(event_idx) {
    const c = HIDDEN_CANVAS;
    const x = c.getContext("2d");
    let last_t = null;
    const t_speed = 100;
    function draw(t) {
        if (GLOBALS.EVENT_COUNTER !== event_idx) return;
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

export { show_clock };
