var Iterator;
(function (Iterator) {
    var ƒ = Fudge;
    window.addEventListener("DOMContentLoaded", init);
    let node;
    let child;
    let grandchild;
    function init() {
        Scenes.createThreeLevelNodeHierarchy();
        node = Scenes.node;
        child = node.getChildren()[0];
        grandchild = child.getChildren()[0];
        let child2 = Scenes.createCompleteMeshNode("Child2", new ƒ.Material("Blue", ƒ.ShaderBasic, new ƒ.CoatColored()), new ƒ.MeshCube(1, 1, 7));
        child2.cmpTransform.rotateX(45);
        child.appendChild(child2);
        Scenes.createViewport();
        Scenes.viewPort.draw();
        console.group("Nodes in branch");
        for (let iter of node.branch)
            console.log(iter.name);
        console.groupEnd();
        console.group("Keys in ...");
        for (let key in node)
            console.log(key);
        console.groupEnd();
    }
})(Iterator || (Iterator = {}));
//# sourceMappingURL=Iterator.js.map