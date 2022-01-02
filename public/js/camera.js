import { W, H, GLOBALS, HIDDEN_VIDEO_CAMERA, HIDDEN_CANVAS_FOR_VIDEO, HIDDEN_CANVAS_FOR_VIDEO_THRESHOLD } from './constants.js';
import { set_pixel_color, sleep, wait_for_cleanup } from './utils.js';

const led_to_camera_coords = {};

function manipulate(rgba) {
    let max = 0;
    for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 512; x++) {
            const idx = (y * 512 + x) * 4;
            const curr = rgba[idx + 0] + rgba[idx + 1] + rgba[idx + 2];
            max = Math.max(max, curr);
        }
    }
    // const leeway = 5;
    const leeway = 2;
    let max_x = 0, max_y = 0, counter = 0;
    for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 512; x++) {
            const idx = (y * 512 + x) * 4;
            const curr = rgba[idx + 0] + rgba[idx + 1] + rgba[idx + 2];
            if (curr < max - leeway) {
                rgba[idx + 0] = 0;
                rgba[idx + 1] = 0;
                rgba[idx + 2] = 0;
            } else {
                max_x += x;
                max_y += y;
                counter++;
            }
        }
    }
    max_x /= counter;
    max_y /= counter;
    return [max_x, max_y];
}

function manipulate_for_follow(rgba) {
    let max = 0;
    for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 512; x++) {
            const idx = (y * 512 + x) * 4;
            const curr = rgba[idx + 0] + rgba[idx + 1] + rgba[idx + 2];
            max = Math.max(max, curr);
        }
    }
    // const leeway = 5;
    const leeway = 2;
    let max_x = 0, max_y = 0, counter = 0;
    for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 512; x++) {
            const idx = (y * 512 + x) * 4;
            const curr = rgba[idx + 0] + rgba[idx + 1] + rgba[idx + 2];
            if (curr < max - leeway) {
                rgba[idx + 0] = 0;
                rgba[idx + 1] = 0;
                rgba[idx + 2] = 0;
            } else {
                max_x += x;
                max_y += y;
                counter++;
            }
        }
    }
    max_x /= counter;
    max_y /= counter;
    return [max_x, max_y];
}
// function manipulate_blue(rgba) {
//     let max = 0;
//     for (let y = 0; y < 512; y++) {
//         for (let x = 0; x < 512; x++) {
//             const idx = (y * 512 + x) * 4;
//             const curr = rgba[idx + 2];
//             max = Math.max(max, curr);
//         }
//     }
//     const leeway = 5;
//     let max_x = 0, max_y = 0, counter = 0;
//     for (let y = 0; y < 512; y++) {
//         for (let x = 0; x < 512; x++) {
//             const idx = (y * 512 + x) * 4;
//             rgba[idx + 0] = 0;
//             rgba[idx + 1] = 0;
//             const curr = rgba[idx + 2];
//             if (curr < max - leeway) {
//                 rgba[idx + 2] = 0;
//             } else {
//                 max_x += x;
//                 max_y += y;
//                 counter++;
//             }
//         }
//     }
//     max_x /= counter;
//     max_y /= counter;
//     return [max_x, max_y];
// }

function get_rgb_arrays(img) {
    const r_img = new ImageData(512, 512);
    const g_img = new ImageData(512, 512);
    const b_img = new ImageData(512, 512);
    for (let y = 0; y < 512; y++) {
        for (let x = 0; x < 512; x++) {
            const idx = (y * 512 + x) * 4;
            r_img.data[idx + 0] = img.data[idx + 0];
            g_img.data[idx + 1] = img.data[idx + 1];
            b_img.data[idx + 2] = img.data[idx + 2];
            r_img.data[idx + 3] = 255;
            g_img.data[idx + 3] = 255;
            b_img.data[idx + 3] = 255;
        }
    }
    return { r_img, g_img, b_img };
}

async function scan_to_get_led_positions(event_idx) {
    await wait_for_cleanup();
    GLOBALS.CLEANED = false;
    const constraints = { video: { width: 512, height: 512 } };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('got the media stream for the camera', stream);

    const video = HIDDEN_VIDEO_CAMERA;
    video.srcObject = stream;
    video.play();
    video.classList.remove('hidden');

    // const c = document.createElement('canvas');
    // c.width = 512;
    // c.height = 512;
    const c = HIDDEN_CANVAS_FOR_VIDEO;
    const x = c.getContext('2d');
    x.fillStyle = 'black';
    x.fillRect(0, 0, 512, 512);
    // document.body.appendChild(c);

    const c1 = HIDDEN_CANVAS_FOR_VIDEO_THRESHOLD;
    const x1 = c1.getContext('2d');
    c1.classList.remove('hidden');
    // const c1 = document.createElement('canvas');
    // c1.width = 512;
    // c1.height = 512;
    // const x1 = c1.getContext('2d');
    // x1.fillStyle = 'black';
    // x1.fillRect(0, 0, 512, 512);
    // document.body.appendChild(c1);

    // const c2 = document.createElement('canvas');
    // c2.width = 512;
    // c2.height = 512;
    // const x2 = c2.getContext('2d');
    // x2.fillStyle = 'black';
    // x2.fillRect(0, 0, 512, 512);
    // document.body.appendChild(c2);

    // const c3 = document.createElement('canvas');
    // c3.width = 512;
    // c3.height = 512;
    // const x3 = c3.getContext('2d');
    // x3.fillStyle = 'black';
    // x3.fillRect(0, 0, 512, 512);
    // document.body.appendChild(c3);

    async function scan() {
        if (GLOBALS.EVENT_COUNTER !== event_idx) {
            return;
        }
        for (let led_y = 0; led_y < H; led_y++) {
            for (let led_x = 0; led_x < W; led_x++) {
                set_pixel_color(led_x, led_y, 0, 0, 255);
                await sleep(100);
                if (GLOBALS.EVENT_COUNTER !== event_idx) {
                    return;
                }
                const img_data = x.getImageData(0, 0, 512, 512);
                const [max_x, max_y] = manipulate(img_data.data);
                // const [max_x, max_y] = manipulate_blue(img_data.data);
                // console.log('max_x', max_x, 'max_y', max_y);
                x1.putImageData(img_data, 0, 0);
                // draw a red circle at center of the biggest blob
                x1.beginPath();
                x1.fillStyle = 'red';
                x1.arc(max_x, max_y, 4, 0, 2 * Math.PI, true);
                x1.fill();
                // save the camera coordinates for the led
                led_to_camera_coords[led_y] = led_to_camera_coords[led_y] || {};
                led_to_camera_coords[led_y][led_x] = [max_x, max_y];
            }
        }
        console.log('led_to_camera_coords', led_to_camera_coords);
        setTimeout(scan, 1000);
    }
    function cleanup() {
        video.classList.add('hidden');
        c1.classList.add('hidden');
        GLOBALS.CLEANED = true;
    }
    function update() {
        if (GLOBALS.EVENT_COUNTER !== event_idx) {
            console.log('finished with camera');
            return cleanup();
        }
        x.drawImage(video, 0, 0);
        // const img_data = x.getImageData(0, 0, 512, 512);
        // const { r_img, g_img, b_img } = get_rgb_arrays(img_data);
        // x1.putImageData(r_img, 0, 0);
        // x2.putImageData(g_img, 0, 0);
        // x3.putImageData(b_img, 0, 0);
        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
    scan();
}

function vec_sq_distance(v1, v2) {
    const v3 = [v1[0] - v2[0], v1[1] - v2[1]];
    return v3[0] * v3[0] + v3[1] * v3[1];
}

async function follow_laser(event_idx) {
    if (Object.keys(led_to_camera_coords).length !== H) {
        return console.log('calculate led_to_camera_coords before trying to follow the laser');
    }
    await wait_for_cleanup();
    GLOBALS.CLEANED = false;
    const constraints = { video: { width: 512, height: 512 } };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('got the media stream for the camera', stream);

    const video = HIDDEN_VIDEO_CAMERA;
    video.srcObject = stream;
    video.play();
    video.classList.remove('hidden');

    const c = HIDDEN_CANVAS_FOR_VIDEO;
    const x = c.getContext('2d');
    x.fillStyle = 'black';
    x.fillRect(0, 0, 512, 512);

    const c1 = HIDDEN_CANVAS_FOR_VIDEO_THRESHOLD;
    const x1 = c1.getContext('2d');
    c1.classList.remove('hidden');

    async function follow() {
        if (GLOBALS.EVENT_COUNTER !== event_idx) {
            return;
        }
        const img_data = x.getImageData(0, 0, 512, 512);
        const [max_x, max_y] = manipulate_for_follow(img_data.data);
        // console.log('max_x', max_x, 'max_y', max_y);
        x1.putImageData(img_data, 0, 0);
        // draw a green circle at center of the biggest blob
        x1.beginPath();
        x1.fillStyle = 'green';
        x1.arc(max_x, max_y, 4, 0, 2 * Math.PI, true);
        x1.fill();
        // get the closest led using the camera coordinates of the biggest blob
        let closest_x = 0, closest_y = 0, min_d = 1000000;
        for (let led_y = 0; led_y < H; led_y++) {
            for (let led_x = 0; led_x < W; led_x++) {
                const led_cam_coords = led_to_camera_coords[led_y][led_x];
                const d = vec_sq_distance(led_cam_coords, [max_x, max_y]);
                if (d < min_d) {
                    min_d = d;
                    closest_x = led_x;
                    closest_y = led_y;
                }
            }
        }
        console.log('closest_x', closest_x, 'closest_y', closest_y);
        set_pixel_color(closest_x, closest_y, 0, 0, 255); // TODO: instead of this, draw a pattern of circles converging in on the point of the laser
        await sleep(1000);
        if (GLOBALS.EVENT_COUNTER !== event_idx) {
            return;
        }
        set_pixel_color(closest_x, closest_y, 0, 0, 0);
        setTimeout(follow, 1000);
    }
    function cleanup() {
        video.classList.add('hidden');
        c1.classList.add('hidden');
        GLOBALS.CLEANED = true;
    }
    function update() {
        if (GLOBALS.EVENT_COUNTER !== event_idx) {
            console.log('finished with camera');
            return cleanup();
        }
        x.drawImage(video, 0, 0);
        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
    follow();

}

export { scan_to_get_led_positions, follow_laser };
