///<reference path="./Code/Build/Compiled.d.ts"/>
namespace Project {
  export import ƒ = FudgeCore;
  export import ƒAid = FudgeAid;

  // register namespace of custom resources
  ƒ.Serializer.registerNamespace(Project);
  ƒ.Project.baseURL = new URL(location.href);
  console.log(ƒ.Project.baseURL);

  window.addEventListener("DOMContentLoaded", init);
  // document.addEventListener("click", init);

  // Test custom resource
  export class Resource implements ƒ.SerializableResource {
    public idResource: string = null;
    public reference: Resource = null;

    public serialize(): ƒ.Serialization {
      return {
        idResource: this.idResource,
        idReference: (this.reference) ? this.reference.idResource : null
      };
    }
    public async deserialize(_serialization: ƒ.Serialization): Promise<Resource> {
      this.idResource = _serialization.idResource;
      if (_serialization.idReference)
        this.reference = <Resource>await ƒ.Project.getResource(_serialization.idReference);
      return this;
    }
  }

  function init(_event: Event): void {
    for (let call of [TestCustomResource, CreateTestScene, LoadScene]) {
      let button: HTMLButtonElement = document.createElement("button");
      button.addEventListener("click", call);
      button.innerText = call.name;
      document.body.appendChild(button);
    }
    document.body.appendChild(document.createElement("hr"));
  }

  async function TestCustomResource(): Promise<void> {
    let a: Resource = new Resource();
    let c: Resource = new Resource();
    let b: Resource = new Resource();

    ƒ.Project.register(a);
    ƒ.Project.register(c);
    ƒ.Project.register(b);
    a.reference = b;
    c.reference = b;
    // b.reference = b; // cyclic references disallowed at this point in time

    let result: ƒ.Resources = await testSerialization();
    console.group("Comparison");
    Compare.compare(ƒ.Project.resources, result);
    console.groupEnd();
  }


  async function CreateTestScene(): Promise<void> {
    let texture: ƒ.TextureImage = new ƒ.TextureImage();
    await texture.load("Image/Fudge_360.png");

    let coatTextured: ƒ.CoatTextured = new ƒ.CoatTextured();
    coatTextured.texture = texture;
    coatTextured.color = ƒ.Color.CSS("red");
    let mtrTexture: ƒ.Material = new ƒ.Material("Textured", ƒ.ShaderTexture, coatTextured);

    let pyramid: ƒ.Mesh = new ƒ.MeshPyramid();
    ƒ.Project.register(pyramid);

    let cube: ƒ.Mesh = new ƒ.MeshCube();
    ƒ.Project.register(cube);
    let mtrFlat: ƒ.Material = new ƒ.Material("Flat", ƒ.ShaderUniColor, new ƒ.CoatColored(ƒ.Color.CSS("lightblue")));



    let audio: ƒ.Audio = new ƒ.Audio("Audio/hypnotic.mp3");
    let cmpAudio: ƒ.ComponentAudio = new ƒ.ComponentAudio(audio, true, true);


    let source: ƒAid.Node = new ƒAid.Node("Source", ƒ.Matrix4x4.IDENTITY(), mtrTexture, pyramid);
    // TODO: dynamically load Script! Is it among Resources?
    source.addComponent(new Script.TimerMessage());
    source.addComponent(cmpAudio);
    let child: ƒ.Node = new ƒAid.Node("Cube", ƒ.Matrix4x4.TRANSLATION(ƒ.Vector3.Y()), mtrFlat, cube);
    child.getComponent(ƒ.ComponentMesh).pivot.scale(ƒ.Vector3.ONE(0.5));
    source.addChild(child);


    let graph: ƒ.NodeResource = await ƒ.Project.registerNodeAsResource(source, true);
    let instance: ƒ.NodeResourceInstance = await ƒ.Project.createGraphInstance(graph);
    console.log("Source", source);
    console.log("Graph", graph);
    console.log("Instance", instance);

    graph.name = "Graph";
    instance.name = "Instance";
    let id: string = graph.idResource;

    let old: ƒ.Resources = ƒ.Project.resources;
    let reconstruction: ƒ.Resources = await testSerialization();
    // for (let id in old) {
    //   if (id.startsWith("Node"))
    //     old[id]["name"] = "Test";
    // }

    console.groupCollapsed("Comparison");
    // console.group("Comparison");
    ƒ.Debug.setFilter(ƒ.DebugConsole, ƒ.DEBUG_FILTER.WARN | ƒ.DEBUG_FILTER.ERROR);
    let comparison: boolean = await Compare.compare(old, reconstruction);
    ƒ.Debug.setFilter(ƒ.DebugConsole, ƒ.DEBUG_FILTER.ALL);
    // console.log("Originael resources: ", old);
    // console.log("Reconstructed: ", reconstruction);
    console.groupEnd();
    if (comparison)
      console.error("Comparison failed");
    else
      console.log("Comparison succeeded");

    ƒ.AudioManager.default.listenTo(instance);

    let reconstrucedGraph: ƒ.NodeResource = <ƒ.NodeResource>reconstruction[id];
    reconstrucedGraph.name = "ReconstructedGraph";
    let reconstructedInstance: ƒ.NodeResourceInstance = await ƒ.Project.createGraphInstance(reconstrucedGraph);
    reconstructedInstance.name = "ReconstructedInstance";

    tweakGraphs(10, reconstructedInstance, [source, graph, instance, reconstrucedGraph, reconstructedInstance]);
    showGraphs([source, graph, instance, reconstrucedGraph, reconstructedInstance]);
  }


  async function LoadScene(): Promise<ƒ.Resources> {
    let response: Response = await fetch("Test.json");
    let content: string = await response.text();

    console.groupCollapsed("Content");
    console.log(content);
    console.groupEnd();

    let serialization: ƒ.Serialization = ƒ.Serializer.parse(content);

    console.groupCollapsed("Parsed");
    console.log(serialization);
    console.groupEnd();

    console.groupCollapsed("Reconstructed");
    let reconstruction: ƒ.Resources = await ƒ.Project.deserialize(serialization);
    console.log(reconstruction);
    console.groupEnd();

    for (let id in reconstruction) {
      let resource: ƒ.SerializableResource = reconstruction[id];
      if (resource instanceof ƒ.NodeResource) {
        resource.name = "ReconstructedGraph";
        let reconstructedInstance: ƒ.NodeResourceInstance = await ƒ.Project.createGraphInstance(resource);
        reconstructedInstance.name = "ReconstructedInstance";

        tweakGraphs(10, reconstructedInstance, [resource, reconstructedInstance]);
        showGraphs([resource, reconstructedInstance]);
        ƒ.AudioManager.default.listenTo(reconstructedInstance);
      }
    }
    return reconstruction;
  }

  function tweakGraphs(_angleIncrement: number, _keepScript: ƒ.Node, _graphs: ƒ.Node[]): void {
    let angle: number = 0;
    for (let node of _graphs) {
      node.getChild(0).getComponent(ƒ.ComponentMesh).pivot.rotateX(angle);
      node.mtxLocal.rotateY(angle);
      angle += _angleIncrement;
      if (node != _keepScript)
        node.removeComponent(node.getComponent(Script.TimerMessage));
    }
  }

  function showGraphs(_graphs: ƒ.Node[]): void {
    let cmpCamera: ƒ.ComponentCamera = new ƒ.ComponentCamera();
    cmpCamera.pivot.translate(new ƒ.Vector3(1, 1, -2));
    cmpCamera.pivot.lookAt(ƒ.Vector3.Y(0.4));

    for (let node of _graphs) {
      console.log(node.name, node);
      let viewport: ƒ.Viewport = new ƒ.Viewport();
      let canvas: HTMLCanvasElement = document.createElement("canvas");
      let figure: HTMLElement = document.createElement("figure");
      let caption: HTMLElement = document.createElement("figcaption");
      caption.textContent = node.name;
      figure.appendChild(canvas);
      figure.appendChild(caption);
      document.body.appendChild(figure);
      viewport.initialize(node.name, node, cmpCamera, canvas);
      viewport.draw();
    }
  }

  async function testSerialization(): Promise<ƒ.Resources> {
    console.groupCollapsed("Original");
    console.log(ƒ.Project.resources);
    console.groupEnd();

    console.groupCollapsed("Serialized");
    let serialization: ƒ.SerializationOfResources = ƒ.Project.serialize();
    console.log(serialization);
    console.groupEnd();

    console.log(ƒ.Project.resources);
    console.log(ƒ.Project.serialization);
    ƒ.Project.clear();
    console.log(ƒ.Project.resources);
    console.log(ƒ.Project.serialization);

    console.group("Stringified");
    let json: string = ƒ.Serializer.stringify(serialization);
    console.log(json);
    console.groupEnd();

    console.groupCollapsed("Parsed");
    serialization = ƒ.Serializer.parse(json);
    console.log(serialization);
    console.groupEnd();

    console.groupCollapsed("Reconstructed");
    let reconstruction: ƒ.Resources = await ƒ.Project.deserialize(serialization);
    console.log(reconstruction);
    console.groupEnd();

    return reconstruction;
  }
}