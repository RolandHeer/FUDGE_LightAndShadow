/// <reference path="../../../Core/build/Fudge.d.ts" />
//import * as ƒ from "../../../Core/build/Fudge";
var SumUp;
(function (SumUp) {
    var ƒ = Fudge;
    let v1 = new ƒ.Vector3(1, 0, 0);
    let v2 = new ƒ.Vector3(0, 1, 0);
    let v3 = new ƒ.Vector3(0, 0, 1);
    let sum = ƒ.Vector3.sum(v1, v2, v3);
    console.log(sum);
})(SumUp || (SumUp = {}));
//# sourceMappingURL=SumUp.js.map