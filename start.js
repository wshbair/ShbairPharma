require("@electron/remote/main").initialize();
const ElectronStore = require("electron-store");
ElectronStore.initRenderer();
const setupEvents = require("./installers/setupEvents");
if (setupEvents.handleSquirrelEvent()) {
    //@ts-expect-error
    return;
}

// Apply per-mode network settings before the API server boots.
try {
    const settingsStore = new ElectronStore();
    const stored = /** @type {any} */ (settingsStore.get("settings")) || {};
    if (stored.app === "Network Point of Sale Server") {
        if (stored.port) process.env.PORT = String(stored.port);
        process.env.BIND_HOST = String(stored.bind || "0.0.0.0");
        if (stored.license) process.env.LICENSE_KEY = String(stored.license);
    } else {
        // Standalone or Terminal: keep the embedded API local-only.
        process.env.BIND_HOST = "127.0.0.1";
    }
} catch (e) {
    console.warn("Could not pre-load settings for server config:", e && e.message);
}

const server = require('./server');
const { app, BrowserWindow, ipcMain, screen} = require("electron");
const path = require("path");
const contextMenu = require("electron-context-menu");
let { Menu, template } = require("./assets/js/native_menu/menu");
const menuController = require('./assets/js/native_menu/menuController.js');
const isPackaged = app.isPackaged;
//@ts-expect-error
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
let mainWindow;

//stop app from launching multiple times during these squirrel spawning events
if (require('electron-squirrel-startup')) app.quit();

function createWindow() {

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        frame: true,
        webPreferences: {
            nodeIntegration: true,
            //@ts-expect-error
            enableRemoteModule: false,
            contextIsolation: false,
        },
    });
    menuController.initializeMainWindow(mainWindow); 
    require("@electron/remote/main").enable(mainWindow.webContents);
    if (typeof mainWindow.webContents.setMaxListeners === "function") {
        mainWindow.webContents.setMaxListeners(20);
    }
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.loadURL(`file://${path.join(__dirname, "index.html")}`);
    mainWindow.webContents.openDevTools();
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    
}


app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication');
app.whenReady().then(() => {
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

ipcMain.on("app-quit", (evt, arg) => {
    app.quit();
});

ipcMain.on("app-reload", (event, arg) => {
    mainWindow.reload();
});

ipcMain.on("restart-app", () => {
    //autoUpdater.quitAndInstall();
    app.quit()
    
});

ipcMain.on("open-csv-review", () => {
    let csvReviewWindow = new BrowserWindow({
        width: 1100,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            //@ts-expect-error
            enableRemoteModule: false,
        },
        title: 'CSV Product Review & Upload',
        parent: mainWindow,
        modal: false
    });
    
    require("@electron/remote/main").enable(csvReviewWindow.webContents);
    csvReviewWindow.loadURL(`file://${path.join(__dirname, "csv-review.html")}`);
    //csvReviewWindow.webContents.openDevTools();
    
    csvReviewWindow.on("closed", () => {
        csvReviewWindow = null;
    });
});

 
//Context menu
contextMenu({
    prepend: (params, browserWindow) => [
        {
            label: "Refresh",
            click() {
                mainWindow.reload();
            },
        },
    ],
});

//Live reload during development
// if (!isPackaged) {
//     try {
//         require("electron-reloader")(module);
//     } catch (_) {}
// }


