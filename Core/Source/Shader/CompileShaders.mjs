/**
 * Goes through all GLSL-Shaders in this folder and turns them into "TypeScript-Shaders".
 * A vertex-shader (.vert) and a fragment-shader(.frag) with the same file name are required
 * @authors Luis Keck, HFU, 2021
 */
import * as fs from "fs";
import { argv } from "process";

let json = JSON.parse(fs.readFileSync(argv[2], { encoding: 'utf8' }));
// console.log(json);

for (let name in json) {
  console.log(name);
  let description = json[name];
  let code = "";

  code += `/** Code generated by CompileShaders.mjs using the information in ${argv[2]} */\n\n`;

  code += `export abstract class ${name} extends Shader {\n`;

  if (description.register == "true")
    code += `  public static readonly iSubclass: number = Shader.registerSubclass(${name});\n\n`;

  if (description.define)
  code += `  public static define: string[] = ${JSON.stringify(description.define, null, 4)};\n\n`;
  else
  code += `  public static define: string[] = [];\n\n`;

  if (description.coat)
    code += `  public static getCoat(): typeof Coat { return ${description.coat}; }\n\n`;

  let vertex = fs.readFileSync(description.vertex, { encoding: 'utf8' })
  vertex = insertDefines(vertex, description.define);
  code += "  public static getVertexShaderSource(): string { \n";
  code += "return `";
  code += vertex;
  code += "\n`; }\n\n";

  let fragment = fs.readFileSync(description.fragment, { encoding: 'utf8' })
  fragment = insertDefines(fragment, description.define);
  code += "  public static getFragmentShaderSource(): string { \n";
  code += "return `";
  code += fragment;
  code += "\n`; }\n";

  code += `}`;

  if (description.namespace) {
    code = `namespace ${description.namespace} {\n` + code + `\n}`;
  }

  fs.writeFileSync(description.outdir + "/" + name + ".ts", code);

  // replace the mandatory header of the shader with itself plus the definitions given
  function insertDefines(_shader, _defines) {
    if (!_defines)
      return _shader;

    let code = `#version 300 es\n`;
    for (let define of _defines)
      code += `#define ${define}\n`;

    return _shader.replace("#version 300 es", code);
  }
}
