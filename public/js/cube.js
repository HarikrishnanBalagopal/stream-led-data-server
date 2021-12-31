import { W, H, HIDDEN_CANVAS, GLOBALS } from './constants.js';
import { get_rgb_from_canvas_ctx, rearrange, send_image_to_display, wait_for_cleanup } from './utils.js';

function sub(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
}

function normalize(p) {
    const l = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
    return [p[0] / l, p[1] / l, p[2] / l];
}

function mul_3x3(mat, p) {
    // 3x1 = 3x3 3x1
    const q = [0, 0, 0];
    q[0] = mat[0][0] * p[0] + mat[0][1] * p[1] + mat[0][2] * p[2];
    q[1] = mat[1][0] * p[0] + mat[1][1] * p[1] + mat[1][2] * p[2];
    q[2] = mat[2][0] * p[0] + mat[2][1] * p[1] + mat[2][2] * p[2];
    return q;
}

function mul_mat_3x3(m1, m2) {
    // 3x3 = 3x3 3x3
    const m3 = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ];
    m3[0][0] = m1[0][0] * m2[0][0] + m1[0][1] * m2[1][0] + m1[0][2] * m2[2][0];
    m3[0][1] = m1[0][0] * m2[0][1] + m1[0][1] * m2[1][1] + m1[0][2] * m2[2][1];
    m3[0][2] = m1[0][0] * m2[0][2] + m1[0][1] * m2[1][2] + m1[0][2] * m2[2][2];

    m3[1][0] = m1[1][0] * m2[0][0] + m1[1][1] * m2[1][0] + m1[1][2] * m2[2][0];
    m3[1][1] = m1[1][0] * m2[0][1] + m1[1][1] * m2[1][1] + m1[1][2] * m2[2][1];
    m3[1][2] = m1[1][0] * m2[0][2] + m1[1][1] * m2[1][2] + m1[1][2] * m2[2][2];

    m3[2][0] = m1[2][0] * m2[0][0] + m1[2][1] * m2[1][0] + m1[2][2] * m2[2][0];
    m3[2][1] = m1[2][0] * m2[0][1] + m1[2][1] * m2[1][1] + m1[2][2] * m2[2][1];
    m3[2][2] = m1[2][0] * m2[0][2] + m1[2][1] * m2[1][2] + m1[2][2] * m2[2][2];
    return m3;
}

function get_rotation_matrix(axis, theta) {
    return [
        [
            Math.cos(theta) + axis[0] * axis[0] * (1 - Math.cos(theta)),
            axis[0] * axis[1] * (1 - Math.cos(theta)) - axis[2] * Math.sin(theta),
            axis[0] * axis[2] * (1 - Math.cos(theta)) + axis[1] * Math.sin(theta)
        ],
        [
            axis[1] * axis[0] * (1 - Math.cos(theta)) + axis[2] * Math.sin(theta),
            Math.cos(theta) + axis[1] * axis[1] * (1 - Math.cos(theta)),
            axis[1] * axis[2] * (1 - Math.cos(theta)) - axis[0] * Math.sin(theta)
        ],
        [
            axis[2] * axis[0] * (1 - Math.cos(theta)) - axis[1] * Math.sin(theta),
            axis[2] * axis[1] * (1 - Math.cos(theta)) + axis[0] * Math.sin(theta),
            Math.cos(theta) + axis[2] * axis[2] * (1 - Math.cos(theta))
        ]
    ];
}

function get_projection_matrix(screen) {
    return [
        [1, 0, screen[0] / screen[2]],
        [0, 1, screen[1] / screen[2]],
        [0, 0, 1 / screen[2]]
    ];
}

function project(cam, screen, p) {
    const p1 = sub(p, cam);
    const mat = get_projection_matrix(screen);
    const q = mul_3x3(mat, p1);
    return [q[0] / q[2], q[1] / q[2], q[2]];
}

function distance(v1, v2) {
    const v3 = sub(v1, v2);
    return Math.sqrt(v3[0]*v3[0]+v3[1]*v3[1]+v3[2]*v3[2]);
}

async function show_cube(event_idx) {
    await wait_for_cleanup();
    GLOBALS.CLEANED = false;
    const c = HIDDEN_CANVAS;
    const x = c.getContext("2d");
    const cube = [
        [-1, -1, -1],
        [-1, -1, +1],
        [-1, +1, +1],
        [-1, +1, -1],
        [+1, +1, -1],
        [+1, +1, +1],
        [+1, -1, +1],
        [+1, -1, -1]
    ];
    const vertex_colors = [
        "red",
        "orange",
        "yellow",
        "green",
        "blue",
        "indigo",
        "violet",
        "white"
    ];
    const edges = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4],
        [3, 4],
        [2, 5],
        [1, 6],
        [0, 7]
    ];
    x.translate(W / 2, H / 2);
    const t_speed = 10;
    const rot_speed = 0.001;
    let last_t = null;
    const cam = [0, 0, 4];
    const screen = [0, 0, -2];
    const axis_rots = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
        normalize([0, 1, 1]),
        normalize([1, 1, 0]),
        normalize([1, 1, 1])
    ];
    let curr_rot_mat = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ];
    let curr_idx = 0;
    let curr_rot_t = 0;
    let curr_rot_axis = axis_rots[0];
    function draw(t) {
        if (GLOBALS.EVENT_COUNTER !== event_idx) {
            x.translate(-W / 2, -H / 2);
            GLOBALS.CLEANED = true;
            return;
        }
        if (last_t === null) last_t = t;
        if (t - last_t < t_speed) return requestAnimationFrame(draw);
        last_t = t;
        x.fillStyle = "black";
        x.fillRect(-W / 2, -H / 2, W, H);
        const rot_mat = mul_mat_3x3(
            curr_rot_mat,
            get_rotation_matrix(curr_rot_axis, (t - curr_rot_t) * rot_speed)
        );
        // update
        const new_idx = Math.floor(t / 1000) % axis_rots.length;
        if (new_idx !== curr_idx) {
            curr_rot_mat = rot_mat;
            curr_idx = new_idx;
            curr_rot_t = t;
            curr_rot_axis =
                axis_rots[Math.floor(Math.random() * 100) % axis_rots.length];
        }
        const rotated_vertices = cube.map((p) => mul_3x3(rot_mat, p));
        const proj_vertices = rotated_vertices.map((p1) => {
            const q1 = project(cam, screen, p1);
            return [q1[0] * (W / 2), q1[1] * (H / 2), q1[2]];
        });
        const idxs = proj_vertices.map((_, i) => i);
        idxs.sort((i1, i2) =>
            proj_vertices[i1][2] > proj_vertices[i2][2] ? -1 : 1
        );
        x.strokeStyle = "white";
        x.beginPath();
        // edges.forEach((e) => {
        //   const v1 = proj_vertices[e[0]];
        //   const v2 = proj_vertices[e[1]];
        //   x.moveTo(v1[0], v1[1]);
        //   x.lineTo(v2[0], v2[1]);
        // });
        x.stroke();
        idxs.forEach((i) => {
            x.beginPath();
            x.fillStyle = vertex_colors[i];
            x.arc(proj_vertices[i][0], proj_vertices[i][1], 8/(1+distance(rotated_vertices[i],cam)), 0, 2 * Math.PI, true);
            x.fill();
        });
        const rgb = get_rgb_from_canvas_ctx(x);
        rearrange(rgb);
        send_image_to_display(rgb);
        requestAnimationFrame(draw);
    }

    draw(0);
}

export { show_cube };
