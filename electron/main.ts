// main.ts
import { app, BrowserWindow, ipcMain, Menu, shell, Tray } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os';
import { promises as fsPromises } from 'node:fs';
// import worker
import { Worker } from 'worker_threads';


import { checkSync } from 'diskusage';
import axios from 'axios';

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))



// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let mainWindow: BrowserWindow | null

// Initialize the last known nonce value
let startTime = Date.now();
let lastKnownNonce = 0;
let lastKnownChallenge = "";


// Start the mining worker with an optional starting nonce
var miningWorker: Worker;
function startMiningWorker(startingNonce = 0, challenge: string = "") {
  // get nonce from server and reward rate
  miningWorker = new Worker('./miningWorker.js');

  miningWorker.postMessage({ command: 'start', nonce: startingNonce, challenge: challenge });

  miningWorker.on('message', (message) => {
    if (message.nonce !== undefined) {
      // Update the last known nonce value
      lastKnownNonce = message.nonce;
      lastKnownChallenge = message.challenge;
    } else {
      console.log('Message from worker:', message);
    }

    if (message.message && message.message.startsWith('Mining took')) {
      // Mining completed, terminate the worker
      lastKnownNonce = 0
      lastKnownChallenge = ""
      console.log(message)
      //check if an hour with ten minute margin has passed since start time, if so send message to frontend
      let currentTime = Date.now();
      //let timeMargin = 600000; //10 minutes
      //timeMargin of 5 seconds for testing
      let timeMargin = 5000; //5 seconds
      //mainWindow?.webContents.send('mining-complete', message);

      // 1h mining cycle
      //if (currentTime - startTime >= 3600000 - timeMargin) {
      // 5 seconds mining cycle
      if (currentTime - startTime >= 5000 - timeMargin) {
        mainWindow?.webContents.send('mining-complete', message);
        console.log("Mining cycle complete")
        miningWorker.terminate();
      } else {
        //if enough time has not passed, wait for the remaining time and then send message to frontend
        console.log("Waiting for remaining time to pass")
        setTimeout(() => {
          console.log("Mining cycle reached and complete")
          mainWindow?.webContents.send('mining-complete', message);
          miningWorker.terminate();
        }, 3600000 - (currentTime - startTime));
      }
      
    }
  });
  miningWorker.on('error', (err) => {
    console.error('Worker error:', err);
  });
  miningWorker.on('exit', (code) => {
    console.log('Worker exited with code:', code);
  });

}


let maxMem = 0

function logMemoryUsage() {

  const used = process.memoryUsage();
  const usedMem = used.rss
  const usedMemMB = usedMem / 1024 / 1024
  //const usedMemStr = usedMem.toFixed(2)

  if (usedMem > maxMem) {
    maxMem = usedMemMB
  }

  // Get available free memory
  const freeMem = os.freemem(); // In bytes

  const usedMemPercentage = (usedMem / freeMem) * 100;

  //console.log(`Memory Usage: RSS=${usedMemStr} MB (${usedMemPercentage.toFixed(2)}% of free memory)\nMaxMem: ${maxMem} MB`);

  if (usedMemPercentage >= 10) {
    console.log('Memory usage exceeds 10% of available free memory. Restarting worker.');
    if (miningWorker) {
      // Stop and terminate the current worker
      miningWorker.postMessage({ command: 'stop' });
      miningWorker.terminate();

      // Start a new worker with the last known nonce value
      startMiningWorker(lastKnownNonce, lastKnownChallenge);
    }
  }
}



setInterval(logMemoryUsage, 600); // Log every minute






// Function to get available storage
async function getAvailableStorage(): Promise<number> {
  const pathToCheck = app.getPath('home'); // Use home directory path
  try {
    // do something with crypto

    // create a random await to simulate a long running task

    const { free } = checkSync(pathToCheck);
    return free / (1024 ** 3); // Convert bytes to GB
  } catch (error) {
    console.error('Failed to get disk usage:', error);
    return 0; // Return 0 on error
  }
}

// Function to set offered storage with that creates a binary file with the size of the storage
async function setOfferedStorage(storage: number): Promise<boolean> {
  try {
    const homePath = app.getPath('home'); // Use home directory path
    const helloAppPath = path.join(homePath, 'hello-app');
    const filePath = path.join(helloAppPath, 'offered-storage.bin');

    // If the storage is 0, remove the allocated offered storage
    if (storage === 0) {
      try {
        await fsPromises.access(filePath);
        await fsPromises.unlink(filePath);
        console.log('Allocated storage removed sucessfully');
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
        console.log('No allocated storage to remove');
      }
      return true;
    }

    const size = storage * (1024 ** 3); // Convert GB to bytes
    console.log(`Allocating ${storage} GB of storage...`);

    await fsPromises.mkdir(helloAppPath, { recursive: true });

    const { free } = checkSync(homePath);
    if (free < size) {
      console.error('Not enough free space to allocate storage');
      return false;
    }

    // Determine optimal chunk size based on system memory
    const totalMemory = os.totalmem();
    const availableMemory = Math.max(os.freemem() - (0.2 * totalMemory), 0); // Reserve 20% of memory for system use

    let chunkSize = 256 * (1024 ** 2); // Default 256 MB chunk size
    if (availableMemory < chunkSize) {
      console.log('Not enough memory to allocate storage in chunks');
      chunkSize = Math.floor(availableMemory / 2); // Use half of available memory if less than default chunk size
    }

    console.log(`Using chunk size of ${chunkSize / (1024 ** 2)} MB`);


    // Check if the file exists and delete it if it does
    try {
      await fsPromises.access(filePath);
      await fsPromises.unlink(filePath);
    } catch (err: any) {
      // If the error is not "file not found", rethrow it
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    // Write the file in chunks to prevent memory overflow
    const buffer = Buffer.alloc(chunkSize);
    const writeStream = require('fs').createWriteStream(filePath, { flags: 'w' });
    for (let bytesWritten = 0; bytesWritten < size; bytesWritten += chunkSize) {
      const bytesToWrite = Math.min(chunkSize, size - bytesWritten);
      await new Promise((res, rej) => {
        writeStream.write(buffer.subarray(0, bytesToWrite), (err: any) => {
          if (err) rej(err);
          else res(true);
        })
      })
    }

    // Close the write stream
    await new Promise((res, rej) => {
      writeStream.end((err: any) => {
        if (err) rej(err);
        else res(true);
      });
    })



    console.log('Storage allocated successfully');
    return true;
  } catch (error) {
    console.error(`Failed to set offered storage ${storage}:`, error);
    return false;
  }
}


// Function to open the file explorer at the 'hello-app' directory
function openOfferedStorage() {
  const homePath = app.getPath('home');
  const helloAppPath = path.join(homePath, 'hello-app');
  shell.openPath(helloAppPath).then(res => {
    if (res) {
      console.error('Failed to open storage directory:', res);
    } else {
      console.log(`Storage directory at ${helloAppPath} opened successfully`);
    }
  })
}

// Function called open external to open a link in the default browser
ipcMain.handle('open-external', async (_, url: string) => {
  shell.openExternal(url);
});


ipcMain.handle('fetch-data', async () => {
  try {
    const response = await axios.get('https://google.com');
    return response.data;
  } catch (error) {
    throw error;
  }
})

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-logo.jpg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  })

  // Test active push message to Renderer-process.
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Listen for IPC event to get available storage
  ipcMain.handle('get-available-storage', async () => {
    return getAvailableStorage();
  });

  ipcMain.handle('set-offered-storage', async (_, storage: number) => {
    return setOfferedStorage(storage);
  });

  ipcMain.handle('open-offered-storage', async () => {
    openOfferedStorage();
  });

  ipcMain.handle('start-mining', async (_, challenge: string) => {
    console.log("starting mining")
    if (!miningWorker || miningWorker.threadId === null || miningWorker.threadId === -1) {
      console.log("starging worker function")
      startMiningWorker(undefined, challenge = challenge);
    } else {
      console.log("sending start message")
      miningWorker.postMessage({ command: 'start' });
    }
  }
  );

  ipcMain.handle('stop-mining', async () => {
    lastKnownNonce = 0;
    lastKnownChallenge = "";
    if (miningWorker) {
      miningWorker.postMessage({ command: 'stop' });
      miningWorker.terminate();
    }
  })


  // Emit the event with the string after 5 seconds (as an example)
  setTimeout(() => {
    mainWindow?.webContents.send('alert-title', 'Hello from Main Process!');
  }, 5000);

}


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', (event: Event) => {
  event.preventDefault(); // Prevents the app from quitting when all windows are closed

  /*
  if (process.platform !== 'darwin') {
    app.quit()
    mainWindow = null
  }
    */
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('before-quit', () => {
  miningWorker.postMessage('stop');
  miningWorker.terminate();
})

let tray: Tray | null = null;

app.whenReady().then(() => {
  createWindow()

  tray = new Tray(path.join(process.env.VITE_PUBLIC, 'electron-logo.jpg'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App', click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: 'Quit', click: () => {

        tray?.destroy();
        if (process.platform !== 'darwin') {
          app.quit()
          mainWindow = null
        }
      }
    },
  ]);
  tray.setContextMenu(contextMenu);

  mainWindow?.on('close', (event) => {
    event.preventDefault();
    mainWindow?.hide();
  })


  //createWindow()

})


setInterval(() => {
  // Collect data from the mining process
  // Send data to the server
  sendDataToServer();
}, 3600000); // 3600000 milliseconds = 1 hour

function sendDataToServer() {
  // Implement your data transmission logic here
  // Use HTTPS and proper error handling
  // Example:
  console.log('Sending data to server...');
}