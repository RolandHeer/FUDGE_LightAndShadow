namespace Fudge {
  import ƒ = FudgeCore;
  import ƒui = FudgeUserInterface;

  export interface ViewAnimationKey {
    key: ƒ.AnimationKey;
    path2D: Path2D;
    sequence: ViewAnimationSequence;
  }

  export interface ViewAnimationSequence {
    color: string;
    // element: HTMLElement;
    sequence: ƒ.AnimationSequence;
  }

  export interface ViewAnimationEvent {
    event: string;
    path2D: Path2D;
  }

  export interface ViewAnimationLabel {
    label: string;
    path2D: Path2D;
  }

  /**
   * TODO: add
   * @authors Lukas Scheuerle, HFU, 2019 | Jonas Plotzky, HFU, 2022
   */
  export class ViewAnimation extends View {
    public node: ƒ.Node;
    public animation: ƒ.Animation;
    public cmpAnimator: ƒ.ComponentAnimator;
    public playbackTime: number;
    public controller: ControllerAnimation;
    public crc2: CanvasRenderingContext2D;

    private graph: ƒ.Graph;
    private canvas: HTMLCanvasElement;
    private selectedKey: ViewAnimationKey;
    private selectedProperty: string;
    private attributeList: HTMLDivElement;
    private sheet: ViewAnimationSheet;
    private toolbar: HTMLDivElement;
    private hover: HTMLSpanElement;
    private time: ƒ.Time = new ƒ.Time();
    private idInterval: number;

    constructor(_container: ComponentContainer, _state: Object) {
      super(_container, _state);
      this.playbackTime = 500;
      this.setAnimation(null);
      this.createUserInterface();
      
      this.dom.addEventListener(EVENT_EDITOR.FOCUS, this.hndEvent);
      this.dom.addEventListener(ƒui.EVENT.SELECT, this.hndSelect);
      this.dom.addEventListener(ƒui.EVENT.CONTEXTMENU, this.openContextMenu);
      this.canvas.addEventListener("pointermove", this.hndPointerMove);
      this.canvas.addEventListener("pointerdown", this.hndPointerDown);
      this.toolbar.addEventListener("click", this.hndToolbarClick);
      this.toolbar.addEventListener("change", this.hndToolbarChange);

    }

    //#region  ContextMenu
    protected getContextMenu(_callback: ContextMenuCallback): Electron.Menu {
      const menu: Electron.Menu = new remote.Menu();
      let path: string[] = [];

      if (this.node != undefined) {
        let item: Electron.MenuItem;
        item = new remote.MenuItem({
          label: "Add Property",
          submenu: this.getNodeSubmenu(this.node, path, _callback)
        });
        menu.append(item);

        item = new remote.MenuItem({ label: "Delete Property", id: String(CONTEXTMENU.DELETE_PROPERTY), click: _callback, accelerator: "D" });
        menu.append(item);
      }
      

      return menu;
    }

    protected contextMenuCallback(_item: Electron.MenuItem, _window: Electron.BrowserWindow, _event: Electron.Event): void {
      let choice: CONTEXTMENU = Number(_item.id);
      ƒ.Debug.fudge(`MenuSelect | id: ${CONTEXTMENU[_item.id]} | event: ${_event}`);
      // if (!property && (choice == CONTEXTMENU.CREATE_MESH || choice == CONTEXTMENU.CREATE_MATERIAL)) {
        //   alert("Funky Electron-Error... please try again");
        //   return;
        // }
        
      let path: string[];
      switch (choice) {
        case CONTEXTMENU.ADD_PROPERTY:
          path = _item["path"];
          this.controller.addPathToAnimationStructure(path);

          this.dispatch(EVENT_EDITOR.MODIFY, { });
          this.setAnimation(this.animation); // TODO: use modify event for this
          break;
        case CONTEXTMENU.DELETE_PROPERTY:
          let element: Element = document.activeElement;
          if (element.tagName == "BODY")
            return;
          
          path = [];
          while (element !== this.attributeList) {
            if (element instanceof ƒui.Details) {
              let summaryElement: Element = element.getElementsByTagName("SUMMARY")[0];
              path.unshift(summaryElement.innerHTML);
            }

            if (element instanceof ƒui.CustomElement) {
              let labelElement: Element = element.getElementsByTagName("LABEL")[0];
              path.unshift(labelElement.innerHTML);
            }

            element = element.parentElement;
          }
          this.controller.deletePathFromAnimationStructure(path);
          this.setAnimation(this.animation); // TODO: use modify event for this
          return;
      }
    }


    private getNodeSubmenu(_node: ƒ.Node, _path: string[], _callback: ContextMenuCallback): Electron.Menu {
      const menu: Electron.Menu = new remote.Menu();
      for (const anyComponent of ƒ.Component.subclasses) {
        //@ts-ignore
        _node.getComponents(anyComponent).forEach((component, index) => { // we need to get the attached componnents as array so we can reconstuct their path
          let path: string[] = Object.assign([], _path);
          path.push("components");
          path.push(component.type);
          path.push(index.toString());
          let item: Electron.MenuItem;
          item = new remote.MenuItem(
            { label: component.type, submenu: this.getMutatorSubmenu(component.getMutatorForAnimation(), path, _callback)}
          );
          menu.append(item);  
        });
      }

      for (const child of _node.getChildren()) {
        let path: string[] = Object.assign([], _path);
        path.push("children");
        path.push(child.name);
        let item: Electron.MenuItem;
        item = new remote.MenuItem(
          { label: child.name, submenu: this.getNodeSubmenu(child, path, _callback)}
        );
        menu.append(item);
      }

      return menu;
    }

    private getMutatorSubmenu(_mutator: ƒ.Mutator, _path: string[], _callback: ContextMenuCallback): Electron.Menu {
      const menu: Electron.Menu = new remote.Menu();
      for (const property in _mutator) {
        let item: Electron.MenuItem;
        let path: string[] = Object.assign([], _path);
        path.push(property);
        if (typeof _mutator[property] === "object") {
          item = new remote.MenuItem(
            { label: property, submenu: this.getMutatorSubmenu(_mutator[property], path, _callback) }
          );
        } else {
          item = new remote.MenuItem(
            { label: property, id: String(CONTEXTMENU.ADD_PROPERTY), click: _callback }
          );
          //@ts-ignore
          item.overrideProperty("path", path);
          }
        menu.append(item);
        }

      
      return menu;
    }
    //#endregion

    private createUserInterface(): void {
      this.toolbar = document.createElement("div");
      this.toolbar.id = "toolbar";
      this.toolbar.style.width = "300px";
      this.toolbar.style.height = "80px";
      this.toolbar.style.borderBottom = "1px solid black";
      this.fillToolbar(this.toolbar);

      this.canvas = document.createElement("canvas");
      this.canvas.width = 1500;
      this.canvas.height = 500;
      this.canvas.style.position = "absolute";
      this.canvas.style.left = "300px";
      this.canvas.style.top = "0px";
      this.canvas.style.borderLeft = "1px solid black";
      this.crc2 = this.canvas.getContext("2d");

      this.hover = document.createElement("span");
      this.hover.style.background = "black";
      this.hover.style.color = "white";
      this.hover.style.position = "absolute";
      this.hover.style.display = "none";

      this.sheet = new ViewAnimationSheetCurve(this, this.crc2, new ƒ.Vector2(0.5, 2), new ƒ.Vector2(0, 200)); // TODO: stop using fixed values?
      this.sheet.redraw(this.playbackTime);
      document.addEventListener("DOMContentLoaded", () => this.updateUserInterface());
    }

    private hndPointerDown = (_event: PointerEvent): void => {
      //  TODO: rework events
      this.setTime(_event.offsetX / this.sheet.scale.x);

      let obj: ViewAnimationLabel | ViewAnimationKey | ViewAnimationEvent = this.sheet.getObjectAtPoint(_event.offsetX, _event.offsetY);
      if (!obj) return;

      if (obj["label"]) {
        console.log(obj["label"]);
        // TODO: replace with editor events. use dispatch event from view?
        this.dom.dispatchEvent(new CustomEvent(ƒui.EVENT.SELECT, { detail: { name: obj["label"], time: this.animation.labels[obj["label"]] } }));
      }
      else if (obj["event"]) {
        console.log(obj["event"]);
        this.dom.dispatchEvent(new CustomEvent(ƒui.EVENT.SELECT, { detail: { name: obj["event"], time: this.animation.events[obj["event"]] } }));
      }
      else if (obj["key"]) {
        console.log(obj["key"]);
        this.dom.dispatchEvent(new CustomEvent(ƒui.EVENT.SELECT, { detail: obj }));
      }
    }

    private hndPointerMove = (_event: PointerEvent): void => {
      _event.preventDefault();
      if (_event.buttons != 1) return;
      this.setTime(_event.offsetX / this.sheet.scale.x);
    }

    private hndEvent = (_event: FudgeEvent): void => {
      switch (_event.type) {
        case EVENT_EDITOR.FOCUS:
          this.graph = _event.detail.graph;
          this.focusNode(_event.detail.node);
          break;
      }
    }
    
    private focusNode(_node: ƒ.Node): void {
      this.node = _node;
      this.cmpAnimator = _node?.getComponent(ƒ.ComponentAnimator);
      this.contextMenu = this.getContextMenu(this.contextMenuCallback.bind(this));
      this.setAnimation(this.cmpAnimator?.animation);
    }

    private setAnimation(_animation: ƒ.Animation): void {
      if (!_animation) {
        this.animation = undefined;
        this.dom.innerHTML = "select node with an attached component animator";
        return;
      }
      this.dom.innerHTML = "";
      this.dom.appendChild(this.toolbar);
      this.dom.appendChild(this.canvas);
      this.dom.appendChild(this.hover);

      this.animation = _animation;
      let animationMutator: ƒ.Mutator = this.animation?.getMutated(this.playbackTime, 0, ƒ.ANIMATION_PLAYBACK.TIMEBASED_CONTINOUS);
      if (!animationMutator) animationMutator = {};
      this.attributeList = ƒui.Generator.createInterfaceFromMutator(animationMutator);
      this.controller = new ControllerAnimation(this.animation, this.attributeList, animationMutator);
      this.dom.appendChild(this.attributeList);

      this.sheet.redraw(this.playbackTime);
    }

    private hndSelect = (_event: CustomEvent): void => {
      if (typeof _event.detail == "string") {
        this.selectedProperty = _event.detail;
      }
      if ("key" in _event.detail) {
        this.selectedKey = _event.detail;
      }
    }

    private fillToolbar(_tb: HTMLElement): void { //TODO: rework this
      let playmode: HTMLSelectElement = document.createElement("select");
      playmode.id = "playmode";
      for (let m in ƒ.ANIMATION_PLAYMODE) {
        if (isNaN(+m)) {
          let op: HTMLOptionElement = document.createElement("option");
          op.value = m;
          op.innerText = m;
          playmode.appendChild(op);
        }
      }
      _tb.appendChild(playmode);
      _tb.appendChild(document.createElement("br"));

      let fpsL: HTMLLabelElement = document.createElement("label");
      fpsL.setAttribute("for", "fps");
      fpsL.innerText = "FPS";
      let fpsI: HTMLInputElement = document.createElement("input");
      fpsI.type = "number";
      fpsI.min = "0";
      fpsI.max = "999";
      fpsI.step = "1";
      fpsI.id = "fps";
      fpsI.value = this.animation?.fps.toString();
      fpsI.style.width = "40px";

      _tb.appendChild(fpsL);
      _tb.appendChild(fpsI);

      let spsL: HTMLLabelElement = document.createElement("label");
      spsL.setAttribute("for", "sps");
      spsL.innerText = "SPS";
      let spsI: HTMLInputElement = document.createElement("input");
      spsI.type = "number";
      spsI.min = "0";
      spsI.max = "999";
      spsI.step = "1";
      spsI.id = "sps";
      spsI.value = this.animation?.fps.toString(); // stepsPerSecond.toString();
      spsI.style.width = "40px";

      _tb.appendChild(spsL);
      _tb.appendChild(spsI);
      _tb.appendChild(document.createElement("br"));


      let buttons: HTMLButtonElement[] = [];
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons.push(document.createElement("button"));
      buttons[0].classList.add("fa", "fa-fast-backward", "start");
      buttons[1].classList.add("fa", "fa-backward", "back");
      buttons[2].classList.add("fa", "fa-play", "play");
      buttons[3].classList.add("fa", "fa-pause", "pause");
      buttons[4].classList.add("fa", "fa-forward", "forward");
      buttons[5].classList.add("fa", "fa-fast-forward", "end");
      buttons[6].classList.add("fa", "fa-file", "add-label");
      buttons[7].classList.add("fa", "fa-bookmark", "add-event");
      buttons[8].classList.add("fa", "fa-plus-square", "add-key");
      buttons[9].classList.add("fa", "fa-plus-square", "remove-key");
      buttons[0].id = "start";
      buttons[1].id = "back";
      buttons[2].id = "play";
      buttons[3].id = "pause";
      buttons[4].id = "forward";
      buttons[5].id = "end";
      buttons[6].id = "add-label";
      buttons[7].id = "add-event";
      buttons[8].id = "add-key";
      buttons[9].id = "remove-key";

      buttons[0].innerText = "start";
      buttons[1].innerText = "back";
      buttons[2].innerText = "play";
      buttons[3].innerText = "pause";
      buttons[4].innerText = "forward";
      buttons[5].innerText = "end";
      buttons[6].innerText = "add-label";
      buttons[7].innerText = "add-event";
      buttons[8].innerText = "add-key";
      buttons[9].innerText = "remove-key";

      for (let b of buttons) {
        _tb.appendChild(b);
      }

    }

    private hndToolbarClick = (_e: MouseEvent) => {
      // console.log("click", _e.target);
      let target: HTMLInputElement = <HTMLInputElement>_e.target;
      switch (target.id) {
        case "add-label":
          this.animation.labels[this.randomNameGenerator()] = this.playbackTime;
          this.sheet.redraw(this.playbackTime);
          break;
        case "add-event":
          this.animation.setEvent(this.randomNameGenerator(), this.playbackTime);
          this.sheet.redraw(this.playbackTime);
          break;
        case "add-key":
          this.controller.addKeyToAnimationStructure(this.playbackTime);          
          this.sheet.redraw(this.playbackTime);
          break;
        case "remove-key":
          this.controller.deleteKeyFromAnimationStructure(this.selectedKey);          
          this.sheet.redraw(this.playbackTime);
          break;
        case "start":
          this.playbackTime = 0;
          this.updateUserInterface();
          break;
        case "back":
          this.playbackTime = this.playbackTime -= 1000 / this.animation.fps; // stepsPerSecond;
          this.playbackTime = Math.max(this.playbackTime, 0);
          this.updateUserInterface();
          break;
        case "play":
          this.time.set(this.playbackTime);
          if (this.idInterval == undefined)
            this.idInterval = window.setInterval(this.playAnimation, 1000 / this.animation.fps);
          break;
        case "pause":
          // this.cmpAnimator.activate(false);
          window.clearInterval(this.idInterval);
          this.idInterval = undefined;
          break;
        case "forward":
          this.playbackTime = this.playbackTime += 1000 / this.animation.fps; // stepsPerSecond;
          this.playbackTime = Math.min(this.playbackTime, this.animation.totalTime);
          this.updateUserInterface();
          break;
        case "end":
          this.playbackTime = this.animation.totalTime;
          this.sheet.redraw(this.playbackTime);
          this.updateUserInterface();
          break;
        default:

          break;
      }
    }

    private hndToolbarChange = (_e: MouseEvent) => {
      let target: HTMLInputElement = <HTMLInputElement>_e.target;

      switch (target.id) {
        case "playmode":
          this.cmpAnimator.playmode = ƒ.ANIMATION_PLAYMODE[target.value];
          // console.log(ƒ.ANIMATION_PLAYMODE[target.value]);
          break;
        case "fps":
          // console.log("fps changed to", target.value);
          if (!isNaN(+target.value))
            this.animation.fps = +target.value;
          break;
        case "sps":
          // console.log("sps changed to", target.value);
          if (!isNaN(+target.value)) {
            this.animation.fps /* stepsPerSecond */ = +target.value;
            this.sheet.redraw(this.playbackTime);
          }
          break;
        default:
          console.log("no clue what you changed...");
          break;
      }
    }

    private updateUserInterface(_m: ƒ.Mutator = null): void {
      this.sheet.redraw(this.playbackTime);
      if (!_m)
        _m = this.animation.getMutated(this.playbackTime, 0, this.cmpAnimator.playback);

      this.controller.updateAnimationUserInterface(_m);
      this.dispatch(EVENT_EDITOR.ANIMATE, { bubbles: true, detail: { graph: this.graph} });
    }

    private setTime(_time: number, updateDisplay: boolean = true): void {
      if (!this.animation) return;
      // this.playbackTime = Math.min(this.animation.totalTime, Math.max(0, _time));
      this.playbackTime = Math.max(0, _time);
      this.playbackTime = Math.round(this.playbackTime / (1000 / this.animation.fps)) * (1000 / this.animation.fps);
      // console.log(this.playbackTime);
      if (updateDisplay) this.updateUserInterface(this.cmpAnimator.updateAnimation(this.playbackTime)[0]);
    }

    private playAnimation = () => {
      // requestAnimationFrame(this.playAnimation.bind(this));
      let t: number = this.time.get();
      let m: ƒ.Mutator = {};
      [m, t] = this.cmpAnimator.updateAnimation(t);
      this.playbackTime = t;
      this.updateUserInterface(m);
    }

    private randomNameGenerator(): string {
      let attr: string[] = ["red", "blue", "green", "pink", "yellow", "purple", "orange", "fast", "slow", "quick", "boring", "questionable", "king", "queen", "smart", "gold"];
      let anim: string[] = ["cow", "fish", "elephant", "cat", "dog", "bat", "chameleon", "caterpillar", "crocodile", "hamster", "horse", "panda", "giraffe", "lukas", "koala", "jellyfish", "lion", "lizard", "platypus", "scorpion", "penguin", "pterodactyl"];

      return attr[Math.floor(Math.random() * attr.length)] + "-" + anim[Math.floor(Math.random() * anim.length)];
    }
  }
}