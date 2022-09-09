/// <reference types="../../../node_modules/electron/electron" />
/// <reference types="../../core/build/fudgecore" />
/// <reference types="../../../aid/build/fudgeaid" />
/// <reference types="../../../userinterface/build/fudgeuserinterface" />
/// <reference types="../../GoldenLayout/golden-layout" />
declare namespace Fudge {
    export type ContextMenuCallback = (menuItem: Electron.MenuItem, browserWindow: Electron.BrowserWindow, event: Electron.KeyboardEvent) => void;
    type Subclass<T> = {
        subclasses: T[];
        name: string;
    };
    export class ContextMenu {
        static appendCopyPaste(_menu: Electron.Menu): void;
        static getSubclassMenu<T extends Subclass<T>>(_id: CONTEXTMENU, _class: T, _callback: ContextMenuCallback): Electron.Menu;
    }
    export {};
}
declare namespace Fudge {
    enum CONTEXTMENU {
        ADD_NODE = 0,
        ACTIVATE_NODE = 1,
        DELETE_NODE = 2,
        ADD_COMPONENT = 3,
        DELETE_COMPONENT = 4,
        ADD_COMPONENT_SCRIPT = 5,
        EDIT = 6,
        CREATE_MESH = 7,
        CREATE_MATERIAL = 8,
        CREATE_GRAPH = 9,
        CREATE_ANIMATION = 10,
        CREATE_PARTICLE_EFFECT = 11,
        SYNC_INSTANCES = 12,
        REMOVE_COMPONENT = 13,
        ADD_JOINT = 14,
        DELETE_RESOURCE = 15,
        ILLUMINATE = 16,
        ADD_PROPERTY = 17,
        DELETE_PROPERTY = 18,
        ADD_PARTICLE_FUNCTION = 19,
        ADD_PARTICLE_FUNCTION_NAMED = 20,
        ADD_PARTICLE_CONSTANT = 21,
        ADD_PARTICLE_CONSTANT_NAMED = 22,
        ADD_PARTICLE_TRANSFORMATION = 23,
        DELETE_PARTICLE_DATA = 24
    }
    enum MENU {
        QUIT = "quit",
        PROJECT_NEW = "projectNew",
        PROJECT_SAVE = "projectSave",
        PROJECT_LOAD = "projectLoad",
        DEVTOOLS_OPEN = "devtoolsOpen",
        PANEL_GRAPH_OPEN = "panelGraphOpen",
        PANEL_ANIMATION_OPEN = "panelAnimationOpen",
        PANEL_PROJECT_OPEN = "panelProjectOpen",
        PANEL_HELP_OPEN = "panelHelpOpen",
        PANEL_PARTICLE_SYSTEM_OPEN = "panelParticleSystemOpen",
        FULLSCREEN = "fullscreen"
    }
    enum PANEL {
        GRAPH = "PanelGraph",
        PROJECT = "PanelProject",
        HELP = "PanelHelp",
        ANIMATION = "PanelAnimation",
        PARTICLE_SYSTEM = "PanelParticleSystem"
    }
    enum VIEW {
        HIERARCHY = "ViewHierarchy",
        ANIMATION = "ViewAnimation",
        ANIMATION_SHEET = "ViewAnimationSheet",
        RENDER = "ViewRender",
        COMPONENTS = "ViewComponents",
        CAMERA = "ViewCamera",
        INTERNAL = "ViewInternal",
        EXTERNAL = "ViewExternal",
        PROPERTIES = "ViewProperties",
        PREVIEW = "ViewPreview",
        SCRIPT = "ViewScript",
        PARTICLE_SYSTEM = "ViewParticleSystem"
    }
    enum TRANSFORM {
        TRANSLATE = "translate",
        ROTATE = "rotate",
        SCALE = "scale"
    }
}
declare namespace Fudge {
    export enum MIME {
        TEXT = "text",
        AUDIO = "audio",
        IMAGE = "image",
        MESH = "mesh",
        UNKNOWN = "unknown"
    }
    const fs: ƒ.General;
    export class DirectoryEntry {
        path: typeof fs.PathLike;
        pathRelative: typeof fs.PathLike;
        dirent: typeof fs.Dirent;
        stats: Object;
        constructor(_path: typeof fs.PathLike, _pathRelative: typeof fs.PathLike, _dirent: typeof fs.Dirent, _stats: Object);
        static createRoot(_path: typeof fs.PathLike): DirectoryEntry;
        get name(): string;
        set name(_name: string);
        get isDirectory(): boolean;
        get type(): string;
        delete(): void;
        getDirectoryContent(): DirectoryEntry[];
        getFileContent(): string;
        addEntry(_entry: DirectoryEntry): void;
        getMimeType(): MIME;
    }
    export {};
}
declare namespace Fudge {
    enum EVENT_EDITOR {
        CREATE = "EDITOR_CREATE",
        SELECT = "EDITOR_SELECT",
        MODIFY = "EDITOR_MODIFY",
        DELETE = "EDITOR_DELETE",
        CLOSE = "EDITOR_CLOSE",
        TRANSFORM = "EDITOR_TRANSFORM",
        FOCUS = "EDITOR_FOCUS",
        ANIMATE = "EDITOR_ANIMATE"
    }
    interface EventDetail {
        node?: ƒ.Node;
        graph?: ƒ.Graph;
        resource?: ƒ.SerializableResource;
        transform?: Object;
        view?: View;
        data?: ƒ.General;
    }
    /**
     * Extension of CustomEvent that supports a detail field with the type EventDetail
     */
    class FudgeEvent extends CustomEvent<EventDetail> {
    }
}
declare namespace Fudge {
    let watcher: ƒ.General;
    function newProject(): Promise<void>;
    function saveProject(_new?: boolean): Promise<boolean>;
    function promptLoadProject(): Promise<URL>;
    function loadProject(_url: URL): Promise<void>;
}
declare namespace Fudge {
    import ƒ = FudgeCore;
    class Project extends ƒ.Mutable {
        #private;
        base: URL;
        name: string;
        fileIndex: string;
        fileInternal: string;
        fileScript: string;
        fileStyles: string;
        private includeAutoViewScript;
        private graphAutoView;
        constructor(_base: URL);
        openDialog(): Promise<boolean>;
        hndChange: (_event: Event) => void;
        load(htmlContent: string): Promise<void>;
        getProjectJSON(): string;
        getProjectCSS(): string;
        getProjectHTML(_title: string): string;
        getMutatorAttributeTypes(_mutator: ƒ.Mutator): ƒ.MutatorAttributeTypes;
        protected reduceMutator(_mutator: ƒ.Mutator): void;
        private getGraphs;
        private createProjectHTML;
        private getAutoViewScript;
        private settingsStringify;
        private panelsStringify;
        private stringifyHTML;
    }
}
declare namespace Fudge {
    import ƒ = FudgeCore;
    const ipcRenderer: Electron.IpcRenderer;
    const remote: Electron.Remote;
    let project: Project;
    interface PanelInfo {
        type: string;
        state: PanelState;
    }
    /**
     * The uppermost container for all panels controlling data flow between.
     * @authors Monika Galkewitsch, HFU, 2019 | Lukas Scheuerle, HFU, 2019 | Jirka Dell'Oro-Friedl, HFU, 2020
     */
    class Page {
        static goldenLayoutModule: ƒ.General;
        static modeTransform: TRANSFORM;
        private static idCounter;
        private static goldenLayout;
        private static panels;
        private static physics;
        static setDefaultProject(): void;
        static getPanelInfo(): string;
        static setPanelInfo(_panelInfos: string): void;
        static setTransform(_mode: TRANSFORM): void;
        static getPhysics(_graph: ƒ.Graph): ƒ.Physics;
        private static start;
        private static setupGoldenLayout;
        private static add;
        private static find;
        private static generateID;
        private static loadLayout;
        private static setupPageListeners;
        /** Send custom copies of the given event to the views */
        private static broadcastEvent;
        private static hndKey;
        private static hndEvent;
        private static hndPanelCreated;
        private static loadProject;
        private static setupMainListeners;
    }
}
declare namespace Fudge {
    class AnimationList {
        listRoot: HTMLElement;
        private mutator;
        private index;
        constructor(_mutator: ƒ.Mutator, _listContainer: HTMLElement);
        getMutator(): ƒ.Mutator;
        setMutator(_mutator: ƒ.Mutator): void;
        collectMutator: () => ƒ.Mutator;
        getElementIndex(): ƒ.Mutator;
        updateMutator(_update: ƒ.Mutator): void;
        private updateEntry;
        private updateMutatorEntry;
        private buildFromMutator;
        private toggleCollapse;
    }
}
declare namespace Fudge {
    import ƒ = FudgeCore;
    import ƒui = FudgeUserInterface;
    class ControllerAnimation {
        private static readonly PROPERTY_COLORS;
        private animation;
        private propertyList;
        private view;
        private sequences;
        constructor(_animation: ƒ.Animation, _propertyList: HTMLElement, _view: ViewAnimation);
        updatePropertyList(_mutator: ƒ.Mutator): void;
        updateSequence(_time: number, _element: ƒui.CustomElement): void;
        nextKey(_time: number, _direction: "forward" | "backward"): number;
        addProperty(_path: string[]): void;
        deleteProperty(_element: HTMLElement): void;
        private getSelectedSequences;
        private deletePath;
        private hndEvent;
        private hndKey;
    }
}
declare namespace Fudge {
    /**
     * Base class for all [[View]]s to support generic functionality
     * @authors Monika Galkewitsch, HFU, 2019 | Lukas Scheuerle, HFU, 2019 | Jirka Dell'Oro-Friedl, HFU, 2020
     */
    abstract class View {
        private static views;
        private static idCount;
        dom: HTMLElement;
        protected contextMenu: Electron.Menu;
        private container;
        private id;
        constructor(_container: ComponentContainer, _state: JsonValue);
        static getViewSource(_event: DragEvent): View;
        private static registerViewForDragDrop;
        setTitle(_title: string): void;
        getDragDropSources(): Object[];
        dispatch(_type: EVENT_EDITOR, _init: CustomEventInit<EventDetail>): void;
        protected openContextMenu: (_event: Event) => void;
        protected getContextMenu(_callback: ContextMenuCallback): Electron.Menu;
        protected contextMenuCallback(_item: Electron.MenuItem, _window: Electron.BrowserWindow, _event: Electron.Event): void;
        protected hndDrop(_event: DragEvent, _source: View): void;
        protected hndDragOver(_event: DragEvent, _source: View): void;
        private hndEventCommon;
    }
}
declare namespace Fudge {
    /**
     * List the external resources
     * @author Jirka Dell'Oro-Friedl, HFU, 2020
     */
    class ViewExternal extends View {
        private tree;
        constructor(_container: ComponentContainer, _state: JsonValue | undefined);
        setProject(): void;
        getSelection(): DirectoryEntry[];
        getDragDropSources(): DirectoryEntry[];
        private hndEvent;
    }
}
declare namespace Fudge {
    import ƒ = FudgeCore;
    let typesOfResources: ƒ.General[];
    /**
     * List the internal resources
     * @author Jirka Dell'Oro-Friedl, HFU, 2020
     */
    class ViewInternal extends View {
        private table;
        constructor(_container: ComponentContainer, _state: JsonValue | undefined);
        listResources(): void;
        getSelection(): ƒ.SerializableResource[];
        getDragDropSources(): ƒ.SerializableResource[];
        protected getContextMenu(_callback: ContextMenuCallback): Electron.Menu;
        protected contextMenuCallback(_item: Electron.MenuItem, _window: Electron.BrowserWindow, _event: Electron.Event): Promise<void>;
        protected hndDragOver(_event: DragEvent, _viewSource: View): void;
        protected hndDrop(_event: DragEvent, _viewSource: View): Promise<void>;
        private hndEvent;
    }
}
declare namespace Fudge {
    import ƒ = FudgeCore;
    import ƒUi = FudgeUserInterface;
    class ControllerComponent extends ƒUi.Controller {
        constructor(_mutable: ƒ.Mutable, _domElement: HTMLElement);
        protected mutateOnInput: (_event: Event) => Promise<void>;
        private hndKey;
        private hndDragOver;
        private hndDrop;
        private filterDragDrop;
        private getAncestorWithType;
    }
}
declare namespace Fudge {
    import ƒui = FudgeUserInterface;
    class ControllerTableResource extends ƒui.TableController<ƒ.SerializableResource> {
        private static head;
        private static getHead;
        getHead(): ƒui.TABLE[];
        getLabel(_object: ƒ.SerializableResource): string;
        rename(_object: ƒ.SerializableResource, _new: string): boolean;
        copy(_originals: ƒ.SerializableResource[]): Promise<ƒ.SerializableResource[]>;
        delete(_focussed: ƒ.SerializableResource[]): Promise<ƒ.SerializableResource[]>;
        sort(_data: ƒ.SerializableResource[], _key: string, _direction: number): void;
    }
}
declare namespace Fudge {
    import ƒui = FudgeUserInterface;
    class ScriptInfo {
        name: string;
        namespace: string;
        superClass: string;
        script: Function;
        isComponent: boolean;
        isComponentScript: boolean;
        constructor(_script: Function, _namespace: string);
    }
    class ControllerTableScript extends ƒui.TableController<ScriptInfo> {
        private static head;
        private static getHead;
        getHead(): ƒui.TABLE[];
        getLabel(_object: ScriptInfo): string;
        rename(_object: ScriptInfo, _new: string): boolean;
        delete(_focussed: ScriptInfo[]): Promise<ScriptInfo[]>;
        copy(_originals: ScriptInfo[]): Promise<ScriptInfo[]>;
        sort(_data: ScriptInfo[], _key: string, _direction: number): void;
    }
}
declare namespace Fudge {
    import ƒUi = FudgeUserInterface;
    class ControllerTreeDirectory extends ƒUi.TreeController<DirectoryEntry> {
        getLabel(_entry: DirectoryEntry): string;
        getAttributes(_object: DirectoryEntry): string;
        rename(_entry: DirectoryEntry, _new: string): boolean;
        hasChildren(_entry: DirectoryEntry): boolean;
        getChildren(_entry: DirectoryEntry): DirectoryEntry[];
        delete(_focussed: DirectoryEntry[]): DirectoryEntry[];
        addChildren(_entries: DirectoryEntry[], _target: DirectoryEntry): DirectoryEntry[];
        copy(_originals: DirectoryEntry[]): Promise<DirectoryEntry[]>;
    }
}
declare namespace Fudge {
    import ƒ = FudgeCore;
    import ƒUi = FudgeUserInterface;
    class ControllerTreeHierarchy extends ƒUi.TreeController<ƒ.Node> {
        getLabel(_node: ƒ.Node): string;
        getAttributes(_node: ƒ.Node): string;
        rename(_node: ƒ.Node, _new: string): boolean;
        hasChildren(_node: ƒ.Node): boolean;
        getChildren(_node: ƒ.Node): ƒ.Node[];
        delete(_focussed: ƒ.Node[]): ƒ.Node[];
        addChildren(_children: ƒ.Node[], _target: ƒ.Node): ƒ.Node[];
        copy(_originals: ƒ.Node[]): Promise<ƒ.Node[]>;
    }
}
declare namespace Fudge {
    import ƒ = FudgeCore;
    import ƒui = FudgeUserInterface;
    class ControllerTreeParticleSystem extends ƒui.CustomTreeController<ƒ.ParticleData.EffectRecursive> {
        childToParent: Map<Object, Object>;
        createContent(_data: ƒ.ParticleData.EffectRecursive): HTMLFormElement;
        getAttributes(_data: ƒ.ParticleData.EffectRecursive): string;
        rename(_data: ƒ.ParticleData.EffectRecursive, _id: string, _new: string): void;
        hasChildren(_data: ƒ.ParticleData.EffectRecursive): boolean;
        getChildren(_data: ƒ.ParticleData.EffectRecursive): (ƒ.ParticleData.EffectRecursive)[];
        delete(_focused: (ƒ.ParticleData.EffectRecursive)[]): (ƒ.ParticleData.EffectRecursive)[];
        addChildren(_children: (ƒ.ParticleData.EffectRecursive)[], _target: ƒ.ParticleData.EffectRecursive): (ƒ.ParticleData.EffectRecursive)[];
        copy(_originalData: (ƒ.ParticleData.EffectRecursive)[]): Promise<(ƒ.ParticleData.EffectRecursive)[]>;
        getPath(_data: ƒ.ParticleData.EffectRecursive): string[];
        private getKey;
        private deleteData;
    }
}
declare namespace Fudge {
    interface PanelState {
        [key: string]: string;
    }
    /**
     * Base class for all [[Panel]]s aggregating [[View]]s
     * Subclasses are presets for common panels. A user might add or delete [[View]]s at runtime
     * @authors Monika Galkewitsch, HFU, 2019 | Lukas Scheuerle, HFU, 2019 | Jirka Dell'Oro-Friedl, HFU, 2020
     */
    abstract class Panel extends View {
        protected goldenLayout: GoldenLayout;
        protected views: View[];
        constructor(_container: ComponentContainer, _state: JsonValue | undefined);
        /** Send custom copies of the given event to the views */
        broadcastEvent: (_event: FudgeEvent) => void;
        abstract getState(): PanelState;
        private addViewComponent;
    }
}
declare namespace Fudge {
    /**
     * TODO: add
     * @authors Jonas Plotzky, HFU, 2022
     */
    class PanelAnimation extends Panel {
        constructor(_container: ComponentContainer, _state: JsonValue | undefined);
        getState(): {
            [key: string]: string;
        };
        private hndEvent;
        private hndAnimate;
    }
}
declare namespace Fudge {
    import ƒ = FudgeCore;
    /**
    * Shows a graph and offers means for manipulation
    * @authors Monika Galkewitsch, HFU, 2019 | Jirka Dell'Oro-Friedl, HFU, 2020
    */
    class PanelGraph extends Panel {
        private graph;
        constructor(_container: ComponentContainer, _state: JsonValue | undefined);
        setGraph(_graph: ƒ.Graph): void;
        getState(): {
            [key: string]: string;
        };
        private hndEvent;
        private hndFocusNode;
    }
}
declare namespace Fudge {
    /**
    * Shows a help and documentation
    * @authors Jirka Dell'Oro-Friedl, HFU, 2021
    */
    class PanelHelp extends Panel {
        constructor(_container: ComponentContainer, _state: JsonValue | undefined);
        getState(): {
            [key: string]: string;
        };
    }
}
declare namespace Fudge {
    /**
     * TODO: add
     * @authors Jonas Plotzky, HFU, 2022
     */
    class PanelParticleSystem extends Panel {
        constructor(_container: ComponentContainer, _state: JsonValue | undefined);
        getState(): {
            [key: string]: string;
        };
        private hndEvent;
    }
}
declare namespace Fudge {
    /**
     * Display the project structure and offer functions for creation, deletion and adjustment of resources
     * @authors Jirka Dell'Oro-Friedl, HFU, 2020
     */
    class PanelProject extends Panel {
        constructor(_container: ComponentContainer, _state: JsonValue | undefined);
        getState(): {
            [key: string]: string;
        };
        private hndEvent;
    }
}
declare namespace Fudge {
    import ƒ = FudgeCore;
    class ViewParticleSystem extends View {
        static readonly TRANSFORMATION_KEYS: (keyof ƒ.ParticleData.Transformation)[];
        static readonly COLOR_KEYS: (keyof ƒ.ParticleData.Effect["color"])[];
        private graph;
        private node;
        private cmpParticleSystem;
        private particleEffect;
        private particleEffectData;
        private idInterval;
        private tree;
        private controller;
        constructor(_container: ComponentContainer, _state: Object);
        protected openContextMenu: (_event: Event) => void;
        protected getContextMenu(_callback: ContextMenuCallback): Electron.Menu;
        protected contextMenuCallback(_item: Electron.MenuItem, _window: Electron.BrowserWindow, _event: Electron.Event): void;
        private hndEvent;
        private setParticleEffect;
        private recreateTree;
    }
}
declare namespace Fudge {
    /**
     * TODO: add
     * @authors Lukas Scheuerle, HFU, 2019 | Jonas Plotzky, HFU, 2022
     */
    class ViewAnimation extends View {
        private graph;
        private node;
        private cmpAnimator;
        private animation;
        private playbackTime;
        private propertyList;
        private controller;
        private toolbar;
        private frameInput;
        private time;
        private idInterval;
        constructor(_container: ComponentContainer, _state: Object);
        protected getContextMenu(_callback: ContextMenuCallback): Electron.Menu;
        protected contextMenuCallback(_item: Electron.MenuItem, _window: Electron.BrowserWindow, _event: Electron.Event): void;
        private getNodeSubmenu;
        private getMutatorSubmenu;
        private createToolbar;
        private hndEvent;
        private setAnimation;
        private createPropertyList;
        private hndAnimate;
        private dispatchAnimate;
        private hndToolbarClick;
        private pause;
    }
}
declare namespace Fudge {
    import ƒ = FudgeCore;
    interface ViewAnimationSequence {
        data: ƒ.AnimationSequence;
        color: string;
    }
    /**
     * TODO: add
     * @authors Lukas Scheuerle, HFU, 2019 | Jonas Plotzky, HFU, 2022
     */
    class ViewAnimationSheet extends View {
        #private;
        private static readonly KEY_SIZE;
        private static readonly TIMELINE_HEIGHT;
        private static readonly EVENTS_HEIGHT;
        private static readonly SCALE_WIDTH;
        private static readonly PIXEL_PER_MILLISECOND;
        private static readonly PIXEL_PER_VALUE;
        private static readonly MINIMUM_PIXEL_PER_STEP;
        private static readonly STANDARD_ANIMATION_LENGTH;
        private graph;
        private animation;
        private playbackTime;
        private canvas;
        private crc2;
        private eventInput;
        private scrollContainer;
        private scrollBody;
        private mtxWorldToScreen;
        private selectedKey;
        private selectedEvent;
        private keys;
        private sequences;
        private events;
        private slopeHooks;
        private documentStyle;
        private posPanStart;
        private posRightClick;
        constructor(_container: ComponentContainer, _state: Object);
        private get mode();
        private set mode(value);
        protected openContextMenuSheet: (_event: Event) => void;
        protected getContextMenu(_callback: ContextMenuCallback): Electron.Menu;
        protected contextMenuCallback(_item: Electron.MenuItem, _window: Electron.BrowserWindow, _event: Electron.Event): void;
        private draw;
        private generateKeys;
        private generateKey;
        private drawTimeline;
        private drawEvents;
        private drawScale;
        private drawCurves;
        private drawKeys;
        private drawCursor;
        private drawHighlight;
        private hndFocus;
        private hndAnimate;
        private hndSelect;
        private hndPointerDown;
        private hndPointerMoveTimeline;
        private hndPointerMoveSlope;
        private hndPointerMovePan;
        private hndPointerMoveDragKey;
        private hndPointerMoveDragEvent;
        private hndPointerUp;
        private hndWheel;
        private hndScroll;
        private dispatchAnimate;
        private resetView;
        private screenToWorldPoint;
        private worldToScreenPoint;
        private screenToTime;
        private timeToScreen;
        private round;
    }
}
declare namespace Fudge {
    /**
     * View all components attached to a node
     * @author Jirka Dell'Oro-Friedl, HFU, 2020
     */
    class ViewComponents extends View {
        private node;
        private expanded;
        private selected;
        constructor(_container: ComponentContainer, _state: JsonValue | undefined);
        protected getContextMenu(_callback: ContextMenuCallback): Electron.Menu;
        protected contextMenuCallback(_item: Electron.MenuItem, _window: Electron.BrowserWindow, _event: Electron.Event): void;
        protected hndDragOver(_event: DragEvent, _viewSource: View): void;
        protected hndDrop(_event: DragEvent, _viewSource: View): void;
        private fillContent;
        private hndEvent;
        private hndTransform;
        private transform3;
        private transform2;
        private select;
        private getSelected;
        private createComponent;
        private findComponentType;
    }
}
declare namespace Fudge {
    import ƒ = FudgeCore;
    /**
     * View the hierarchy of a graph as tree-control
     * @author Jirka Dell'Oro-Friedl, HFU, 2020
     */
    class ViewHierarchy extends View {
        private graph;
        private tree;
        constructor(_container: ComponentContainer, _state: JsonValue | undefined);
        setGraph(_graph: ƒ.Graph): void;
        getSelection(): ƒ.Node[];
        getDragDropSources(): ƒ.Node[];
        focusNode(_node: ƒ.Node): void;
        protected hndDragOver(_event: DragEvent, _viewSource: View): void;
        protected hndDrop(_event: DragEvent, _viewSource: View): Promise<void>;
        protected getContextMenu(_callback: ContextMenuCallback): Electron.Menu;
        protected contextMenuCallback(_item: Electron.MenuItem, _window: Electron.BrowserWindow, _event: Electron.Event): void;
        private hndEvent;
    }
}
declare namespace Fudge {
    import ƒ = FudgeCore;
    /**
     * View the rendering of a graph in a viewport with an independent camera
     * @author Jirka Dell'Oro-Friedl, HFU, 2020
     */
    class ViewRender extends View {
        #private;
        private cmrOrbit;
        private viewport;
        private canvas;
        private graph;
        private nodeLight;
        constructor(_container: ComponentContainer, _state: JsonValue);
        createUserInterface(): void;
        setGraph(_node: ƒ.Graph): void;
        protected getContextMenu(_callback: ContextMenuCallback): Electron.Menu;
        protected contextMenuCallback(_item: Electron.MenuItem, _window: Electron.BrowserWindow, _event: Electron.Event): void;
        protected openContextMenu: (_event: Event) => void;
        protected hndDragOver(_event: DragEvent, _viewSource: View): void;
        protected hndDrop(_event: DragEvent, _viewSource: View): void;
        private hndPrepare;
        private hndEvent;
        private hndPick;
        private hndPointer;
        private activeViewport;
        private redraw;
    }
}
declare namespace Fudge {
    /**
     * Preview a resource
     * @author Jirka Dell'Oro-Friedl, HFU, 2020
     */
    class ViewPreview extends View {
        private static mtrStandard;
        private static meshStandard;
        private resource;
        private viewport;
        private cmrOrbit;
        private previewNode;
        constructor(_container: ComponentContainer, _state: JsonValue | undefined);
        private static createStandardMaterial;
        private static createStandardMesh;
        protected getContextMenu(_callback: ContextMenuCallback): Electron.Menu;
        protected contextMenuCallback(_item: Electron.MenuItem, _window: Electron.BrowserWindow, _event: Electron.Event): void;
        private fillContent;
        private createStandardGraph;
        private setViewObject;
        private illuminate;
        private createFilePreview;
        private createTextPreview;
        private createImagePreview;
        private createAudioPreview;
        private createScriptPreview;
        private hndEvent;
        private resetCamera;
        private redraw;
    }
}
declare namespace Fudge {
    /**
     * View the properties of a resource
     * @author Jirka Dell'Oro-Friedl, HFU, 2020
     */
    class ViewProperties extends View {
        private resource;
        constructor(_container: ComponentContainer, _state: JsonValue | undefined);
        protected hndDragOver(_event: DragEvent, _viewSource: View): void;
        private fillContent;
        private hndEvent;
    }
}
declare namespace Fudge {
    /**
     * List the scripts loaded
     * @author Jirka Dell'Oro-Friedl, HFU, 2020
     */
    class ViewScript extends View {
        private table;
        constructor(_container: ComponentContainer, _state: JsonValue | undefined);
        listScripts(): void;
        getSelection(): ScriptInfo[];
        getDragDropSources(): ScriptInfo[];
        private hndEvent;
    }
}
