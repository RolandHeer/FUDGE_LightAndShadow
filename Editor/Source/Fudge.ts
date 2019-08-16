///<reference types="../../node_modules/electron/Electron"/>
namespace FudgeEditor {
  const { app, BrowserWindow, Menu } = require("electron");
  var ipcMain: Electron.IpcMain = require("electron").ipcMain;
  
  let editorProject: Electron.BrowserWindow;
  let editors: Electron.BrowserWindow[] = [];
  let defaultWidth: number = 800;
  let defaultHeight: number = 600;
  
  ipcMain.addListener("openEditor", openEditor);

  app.addListener("ready", createEditorProject);
  app.addListener("window-all-closed", function (): void {
    if (process.platform !== "darwin") app.quit();
  });
  app.addListener("activate", function (): void {
    if (editorProject === null) createEditorProject();
  });

  function openEditor(_event: string, _args: Object): void {
    console.log("Opening window", _args);
    switch (_args) {
      case "EDITOR_NODE":
        addEditor("../Html/EditorNode.html");
        break;
      default:
        break;
    }
  }

  function createEditorProject(): void {
    editorProject = addEditor("../Html/EditorProject.html");
    const mainMenu: Electron.Menu = Menu.buildFromTemplate(getMainMenu());
    Menu.setApplicationMenu(mainMenu);
  }

  function removeEditor(_event: Electron.Event): void {
    //tslint:disable-next-line
    let index: number = editors.indexOf(<any>_event.target);
    editors.splice(index, 1);
    console.info("Editors", editors.length);
  }

  function addEditor(urlToHtmlFile: string, width: number = defaultWidth, height: number = defaultHeight): Electron.BrowserWindow {
    let window: Electron.BrowserWindow = new BrowserWindow({
      width: width,
      height: height,
      webPreferences: {
        // preload: path.join(__dirname, "preload.js"),
        nodeIntegration: true
      }
    });

    window.webContents.openDevTools();
    window.loadFile(urlToHtmlFile);
    window.addListener("closed", removeEditor);

    editors.push(window);
    console.info("Editors", editors.length);

    return window;
  }

  //TODO: this should go to EditorProject-Window
  function getMainMenu(): Electron.MenuItemConstructorOptions[] {
    //create menu template
    const mainMenuTemplate: Electron.MenuItemConstructorOptions[] = [
      {
        label: "File", submenu: [
          {
            label: "Save", click(): void { editorProject.webContents.send("save", null); }
          },
          {
            label: "Open", click(): void { editorProject.webContents.send("open", null); }
          },
          {
            label: "Quit", accelerator: process.platform == "darwin" ? "Command+Q" : "Ctrl+Q", click(): void { app.quit(); }
          }
        ]
      }
    ];
    return mainMenuTemplate;
  }
}