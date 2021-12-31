import { render_scrolling_text, show_display_status } from './utils.js';
import { GLOBALS } from './constants.js';

// https://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
function base64ToUint8Array(base64) {
    return Uint8Array.from(window.atob(base64), c => c.charCodeAt(0));
}

function subscribe_to_messages(sse_url) {
    const t1 = new EventSource(sse_url);
    t1.addEventListener('open', console.log);
    t1.addEventListener('ping', console.log);
    t1.addEventListener('display_status', e => {
        const status = base64ToUint8Array(e.data);
        show_display_status(status);
    });
    t1.addEventListener('message', e => {
        ++GLOBALS.EVENT_COUNTER;
        console.log(e);
        render_scrolling_text(GLOBALS.EVENT_COUNTER, e.data);
    });
    t1.addEventListener('error', console.error);
    return t1;
}

export { subscribe_to_messages };
