// miningWorker.js
const { parentPort } = require('worker_threads');
const crypto = require('node:crypto');

let isMining = false;

function mine() {
    // Mining logic
    let nonce = 0;
    const startTime = new Date();

    console.log("mining")
    while (isMining) {
        const hash = crypto.createHash('sha256').update(String(nonce)).digest('hex');
        // log each 10000th hash
        if (nonce % 10000 === 0) {
            console.log(`Hash: ${hash}`);
        }
        if (hash.endsWith('00000000')) { // Example condition for proof of work
            const endTime = new Date();
            const duration = (endTime.getTime() - startTime.getTime()) / 60000; // Convert milliseconds to minutes
            const message = `Mining took ${duration.toFixed(2)} minutes`;
            parentPort.postMessage({ nonce, hash, message });
            break;
        }
        nonce++;
    }
}

parentPort.on('message', (message) => {
    if (message === 'start') {
        isMining = true;
        mine();
    } else if (message === 'stop') {
        // Stop mining
        isMining = false;
    } else {
        console.log('Unknown message:', message);
    }
});