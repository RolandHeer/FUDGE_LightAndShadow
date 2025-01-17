namespace FudgeCore {
    export abstract class ShaderMist extends Shader {
        public static readonly iSubclass: number = Shader.registerSubclass(ShaderMist);

        public static define: string[] = [];

        public static getCoat(): typeof Coat { return CoatColored; }

        public static getVertexShaderSource(): string {
            return this.insertDefines(shaderSources["ShaderMist.vert"], this.define);
        }

        public static getFragmentShaderSource(): string {
            return this.insertDefines(shaderSources["ShaderMist.frag"], this.define);
        }
    }
}