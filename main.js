const net = require('net');
const fs = require('fs');
const path = require('path');
const express = require('express');
const EventSource = require('eventsource');

const PORT = 8080;
const W = 17, H = 17, CELL_SIZE = 20;
const LED_DISPLAY_IP = '192.168.0.19';
const LED_DISPLAY_PORT = 80;
const MAGIC_STRING = (new TextEncoder().encode('my_leds\n'));

let STATE = {
    is_cycling_through_images: false,
    display_status: new Uint8Array(W * H * 3),
    subs: [],
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function make_status_valid_led_data(status) {
    const led_data = new Uint8Array(MAGIC_STRING.length + status.length);
    led_data.set(MAGIC_STRING);
    led_data.set(status, MAGIC_STRING.length);
    return led_data;
}

function read_files_to_send() {
    const led_data_dir = 'output';
    const filenames = fs.readdirSync(led_data_dir);
    const led_datas = filenames.map(filename => fs.readFileSync(path.join(led_data_dir, filename))).map(x =>  new Uint8Array(Uint8Array.from(x).buffer, MAGIC_STRING.length, W*H*3));
    return { filenames, led_datas };
}

async function send_files_to_display(client, filenames, led_datas) {
    let sleep_ms = 1000;
    let i = 0;
    while (STATE.is_cycling_through_images) {
        console.log(`sending filenames[${i}]: ${filenames[i]} to the display`);
        const status = led_datas[i];
        const led_data = make_status_valid_led_data(status);
        client.write(led_data);
        STATE.display_status = status;
        STATE.subs.forEach(sub => sub.write('event:display_status\ndata:' + Uint8ArrayToBase64(status) + '\n\n'));
        i = (i + 1) % led_datas.length;
        await sleep(sleep_ms);
    }
}

async function connect_to_led_display(display_ip, display_port) {
    const client = await new Promise(resolve => {
        const client = net.connect(display_port, display_ip, () => resolve(client));
    });
    console.log('connected to server');
    return client;
}

function subscribe_to_messages(sse_url) {
    const t1 = new EventSource(sse_url);
    t1.addEventListener('open', console.log);
    t1.addEventListener('ping', console.log);
    t1.addEventListener('message', e => {
        console.log(e);
        STATE.subs.forEach(sub => sub.write(`data:${e.data}\n\n`));
    });
    t1.addEventListener('error', console.error);
    return t1;
}

function read_config(config_path = './server-config.json') {
    return JSON.parse(fs.readFileSync(config_path));
}

function Uint8ArrayToBase64(status) {
    return Buffer.from(status).toString('base64');
}

// handlers

function handle_new_sub(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.write('event:ping\ndata:you have subscribed\n\n');
    STATE.subs.push(res);
}

function handle_get_display_status(_, res) {
    console.log('got a request for display status');
    res.status(200).json({ status: STATE.display_status });
}

function handle_put_display_image(client, req, res) {
    console.log('got a request to change display status to', req.body);
    const status = new Uint8Array(req.body);
    STATE.is_cycling_through_images = false;
    STATE.display_status = status;
    STATE.subs.forEach(sub => sub.write('event:display_status\ndata:' + Uint8ArrayToBase64(status) + '\n\n'));
    client.write(make_status_valid_led_data(status));
    res.status(200).end();
}

function handle_put_display_send_files(client, _, res) {
    console.log('got a request to send files to the display');
    res.status(200).end();
    if (STATE.is_cycling_through_images) return;
    STATE.is_cycling_through_images = true;
    const { filenames, led_datas } = read_files_to_send();
    send_files_to_display(client, filenames, led_datas);
}

// server

function http_server(client) {
    const app = express();
    app.use(express.static('public'));
    app.use(express.json());
    app.use(express.raw());
    app.use((req, res, next) => {
        console.log(`${new Date()} ${req.method} ${req.url} ${req.socket.remoteAddress}`);
        next();
    });
    app.get('/sse', handle_new_sub);
    app.get('/display-status', handle_get_display_status);
    app.put('/display-image', (req, res) => handle_put_display_image(client, req, res));
    app.put('/display-send-files', (req, res) => handle_put_display_send_files(client, req, res));
    app.listen(PORT, () => console.log(`listening on http://localhost:${PORT}`));
}

// main

async function main() {
    console.log('main start');
    const config = read_config();
    console.log('running with config:', config);
    subscribe_to_messages(config.sse_url);
    const client = await connect_to_led_display(LED_DISPLAY_IP, LED_DISPLAY_PORT);
    http_server(client);
    console.log('main end');
}

main().catch(console.error);
