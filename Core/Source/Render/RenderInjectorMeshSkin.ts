namespace FudgeCore {
  export class RenderInjectorMeshSkin extends RenderInjectorMesh {

    public static decorate(_constructor: Function): void {
      Object.defineProperty(_constructor.prototype, "useRenderBuffers", {
        value: RenderInjectorMeshSkin.useRenderBuffers
      });
      Object.defineProperty(_constructor.prototype, "createRenderBuffers", {
        value: RenderInjectorMeshSkin.createRenderBuffers
      });
      Object.defineProperty(_constructor.prototype, "deleteRenderBuffers", {
        value: RenderInjectorMeshSkin.deleteRenderBuffers
      });
    }

    protected static createRenderBuffers(this: MeshSkin): void {
      super.createRenderBuffers.call(this);
      const crc3: WebGL2RenderingContext = RenderWebGL.getRenderingContext();

      this.renderBuffers.iBones = RenderWebGL.assert(crc3.createBuffer());
      crc3.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.renderBuffers.iBones);
      crc3.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, this.iBones, WebGL2RenderingContext.STATIC_DRAW);

      this.renderBuffers.weights = RenderWebGL.assert(crc3.createBuffer());
      crc3.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.renderBuffers.weights);
      crc3.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, this.weights, WebGL2RenderingContext.STATIC_DRAW);
    }

    protected static useRenderBuffers(this: MeshSkin, _shader: typeof Shader, _mtxMeshToWorld: Matrix4x4, _mtxMeshToView: Matrix4x4, _id?: number, _mtxBones?: Matrix4x4[]): number {
      let nIndices: number = super.useRenderBuffers.call(this, _shader, _mtxMeshToWorld, _mtxMeshToView, _id);
      const crc3: WebGL2RenderingContext = RenderWebGL.getRenderingContext();

      const aIBone: number = _shader.attributes["a_iBone"];
      if (aIBone) {
        crc3.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.renderBuffers.iBones);
        crc3.enableVertexAttribArray(aIBone);
        crc3.vertexAttribIPointer(aIBone, 4, WebGL2RenderingContext.UNSIGNED_BYTE, 0, 0);
      }

      const aWeight: number = _shader.attributes["a_fWeight"];
      if (aWeight) {
        crc3.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.renderBuffers.weights);
        crc3.enableVertexAttribArray(aWeight);
        crc3.vertexAttribPointer(aWeight, 4, WebGL2RenderingContext.FLOAT, false, 0, 0);
      }

      _mtxBones.forEach((mtxBone, iBone) => {
        const uMtxBone: WebGLUniformLocation = _shader.uniforms[`u_bones[${iBone}].matrix`];
        if (uMtxBone)
          crc3.uniformMatrix4fv(uMtxBone, false, mtxBone.get());
      });

      return nIndices;
    }

    protected static deleteRenderBuffers(_renderBuffers: RenderBuffers): void {
      super.deleteRenderBuffers(_renderBuffers);
      const crc3: WebGL2RenderingContext = RenderWebGL.getRenderingContext();
      
      if (_renderBuffers) {
        crc3.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, null);
        crc3.deleteBuffer(_renderBuffers.iBones);
        crc3.deleteBuffer(_renderBuffers.weights);
      }
    }

  }
}