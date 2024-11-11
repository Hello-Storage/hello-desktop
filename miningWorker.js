// miningWorker.js
import { parentPort } from 'worker_threads';
const {
    createHash,
} = await import('node:crypto');

let isMining = false;
let nonce = 0;
let challenge = '';
let solutionFound = false;

function mine() {

    // Mining logic
    const startTime = new Date();
    function doMining() {
        if (!isMining || solutionFound) {
            console.log("Mining stopped");
            return;
        }


        for (let i = 0; i < 1000; i++) {

            const hash = createHash('sha256').update(challenge + String(nonce)).digest('hex');
            // log each 1000001th hash
            if (nonce % 1000001 === 0) {
                console.log(`Hash: ${hash}, nonce ${nonce}, i: ${i}`);
            }
            if (hash.endsWith('00000')) { // Example condition for proof of work
                const endTime = new Date();
                const duration = (endTime.getTime() - startTime.getTime()) / 60000; // Convert milliseconds to minutes
                const message = `Mining took ${duration.toFixed(2)} minutes`;
                console.log("Solution found", message)
                parentPort.postMessage({ nonce, hash, message });
                solutionFound = true
                isMining = false
                break;
            }
            nonce++;

            // Periodically send nonce progress back to main thread
            if (nonce % 100000 === 0) {
                parentPort.postMessage({ nonce })
            }
        }

        if (!solutionFound) {
            setImmediate(doMining);
        }
    }

    doMining()
}

parentPort.on('message', (message) => {
    if (message.command === 'start') {
        isMining = true;
        if (typeof message.challenge === 'string') {
            challenge = message.challenge;
        }
        if (typeof message.nonce === 'number') {
            nonce = message.nonce;
        } else {
            nonce = 0;
        }
        console.log("challenge at starting worker", challenge)
        mine();
    } else if (message.command === 'stop') {
        // Stop mining
        isMining = false;
    } else {
        console.log('Unknown message:', message);
    }
});