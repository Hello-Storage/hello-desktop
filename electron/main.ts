import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os';
import { promises as fsPromises } from 'node:fs';


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

let win: BrowserWindow | null

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
    const writeStream = require('fs').createWriteStream(filePath, { flags: 'w' });
    let bytesWritten = 0;

    while (bytesWritten < size) {
      // Determine the size of the next chunk to write
      const remainingBytes = size - bytesWritten;
      const currentChunkSize = Math.min(chunkSize, remainingBytes);

      // Create a buffer of the current chunk size
      const buffer = Buffer.alloc(currentChunkSize);

      // Write the buffer to the file
      await new Promise((res, rej) => {
        writeStream.write(buffer, (err: any) => {
          if (err) rej(err);
          else res(true);
        })
      });

      // Increment the total bytes written
      bytesWritten += currentChunkSize;
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

ipcMain.handle('fetch-data', async () => {
  try {
    const response = await axios.get('https://google.com');
    return response.data;
  } catch (error) {
    throw error;
  }
})

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Listen for IPC event to get available storage
  ipcMain.handle('get-available-storage', async () => {
    return getAvailableStorage();
  });

  ipcMain.handle('set-offered-storage', async (_, storage: number) => {
    return setOfferedStorage(storage);
  });


  // Emit the event with the string after 5 seconds (as an example)
  setTimeout(() => {
    win?.webContents.send('alert-title', 'Hello from Main Process!');
  }, 5000);

}


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
