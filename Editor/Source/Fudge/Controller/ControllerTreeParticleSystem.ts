namespace Fudge {
  import ƒ = FudgeCore;
  import ƒui = FudgeUserInterface;

  const enum ID {
    KEY = "key",
    FUNCTION = "function",
    VALUE = "value",
    TRANSFORMATION = "transformation"
  }

  export class ControllerTreeParticleSystem extends ƒui.CustomTreeController<ƒ.ParticleData.EffectRecursive> {
    private mapChildToParent: Map<Object, Object> = new Map();

    public createContent(_data: ƒ.ParticleData.EffectRecursive): HTMLFormElement {
      let content: HTMLFormElement = document.createElement("form");
      let labelKey: HTMLInputElement = document.createElement("input");
      labelKey.type = "text";
      labelKey.disabled = true;
      let parentData: ƒ.ParticleData.EffectRecursive = this.mapChildToParent.get(_data);
      let paramterName: string;
      if (ƒ.ParticleData.isFunction(parentData) && ƒ.ParticleData.isExpression(_data)) {
        let paramterNames: string[] = ƒ.ParticleData.FUNCTION_PARAMETER_NAMES[parentData.function];
        if (paramterNames)
          paramterName = paramterNames[parentData.parameters.indexOf(_data)];
      }
      labelKey.value = parentData ? 
        paramterName != null ? paramterName : this.getKey(_data, parentData) : 
        "root";
      labelKey.id = ID.KEY;
      content.appendChild(labelKey);

      if (ƒ.ParticleData.isExpression(_data)) {
        if (ƒ.ParticleData.isFunction(_data)) {
          let select: HTMLSelectElement = document.createElement("select");
          select.id = ID.FUNCTION;
          for (let name of Object.values(ƒ.ParticleData.FUNCTION)) {
            let entry: HTMLOptionElement = document.createElement("option");
            entry.text = name;
            entry.value = name;
            select.add(entry);
          }
          select.value = _data.function;
          content.appendChild(select);
        } else {
          let input: HTMLInputElement = document.createElement("input");
          input.type = "text";
          input.disabled = true;
          input.id = ID.VALUE;
          if (ƒ.ParticleData.isVariable(_data)) {  
            input.value = _data.name;
          } else if (ƒ.ParticleData.isConstant(_data)) {
            input.value = _data.value.toString();
          }
          content.appendChild(input);
        } 
      } else if (ƒ.ParticleData.isTransformation(_data)) {
        let select: HTMLSelectElement = document.createElement("select");
        select.id = ID.TRANSFORMATION;
        for (let key of [ƒ.Matrix4x4.prototype.translate.name, ƒ.Matrix4x4.prototype.rotate.name, ƒ.Matrix4x4.prototype.scale.name]) {
          let entry: HTMLOptionElement = document.createElement("option");
          entry.text = key;
          entry.value = key;
          select.add(entry);
        }
        select.value = _data.transformation;
        content.appendChild(select);
      }

      return content;
    }

    public getAttributes(_data: ƒ.ParticleData.EffectRecursive): string {
      let attributes: string[] = [];
      if (ƒ.ParticleData.isFunction(_data) && this.getPath(_data).includes("variables")) 
        attributes.push("function");
      if (ƒ.ParticleData.isVariable(_data)) 
        attributes.push("variable");

      return attributes.join(" ");
    }
    
    public rename(_data: ƒ.ParticleData.EffectRecursive, _id: string, _new: string): void {
      let inputAsNumber: number = Number.parseFloat(_new);

      if (_id == ID.KEY && ƒ.ParticleData.isExpression(_data)) {
        // let parentData: Object | ƒ.ParticleData.Function = this.parentMap.get(_data);
        // if (ƒ.ParticleData.isFunction(parentData) && parentData.parameters[_new]) {
        //   let key: string = this.getKey(_data, parentData);
        //   parentData.parameters[key] = parentData.parameters[_new];
        //   parentData.parameters[_new] = _data;
        // }

        // if (!ƒ.ParticleData.isFunction(parentData)) {
        //   let key: string = this.getKey(_data, parentData);
        //   if (parentData[_new]) {
        //     parentData[key] = parentData[_new];
        //   } else {
        //     delete parentData[key];
        //   }
        //   parentData[_new] = _data;
        // }

        return;
      }
      
      if (_id == ID.FUNCTION && ƒ.ParticleData.isFunction(_data) && Number.isNaN(inputAsNumber)) {
        _data.function = <ƒ.ParticleData.FUNCTION>_new;
        return;
      }

      if (_id == ID.VALUE && (ƒ.ParticleData.isVariable(_data) || ƒ.ParticleData.isConstant(_data))) {
        let input: string | number = Number.isNaN(inputAsNumber) ? _new : inputAsNumber;
        _data.type = typeof input == "string" ? "variable" : "constant";
        if (ƒ.ParticleData.isVariable(_data))
          _data.name = input as string;
        else if (ƒ.ParticleData.isConstant(_data))
          _data.value = input as number;
        return;
      }
    }

    public hasChildren(_data: ƒ.ParticleData.EffectRecursive): boolean {
      let length: number = 0;
      if (!ƒ.ParticleData.isVariable(_data) && !ƒ.ParticleData.isConstant(_data))
        length = ƒ.ParticleData.isFunction(_data) ? _data.parameters.length : Object.keys(_data).length;

      return length > 0;
    }

    public getChildren(_data: ƒ.ParticleData.EffectRecursive): (ƒ.ParticleData.EffectRecursive)[] {
      let children: (ƒ.ParticleData.EffectRecursive)[] = [];
      if (!ƒ.ParticleData.isVariable(_data) && !ƒ.ParticleData.isConstant(_data)) {
        let subData: Object = ƒ.ParticleData.isFunction(_data) ? _data.parameters : _data;
        let subKeys: string[] = Object.keys(subData);

        // sort keys for color and vector e.g. ("r", "g", "b", "a")
        if (ƒ.ParticleData.isTransformation(_data))
          subKeys = ViewParticleSystem.TRANSFORMATION_KEYS.filter(_key => subKeys.includes(_key));
        let path: string[] = this.getPath(_data);
        if (path[path.length - 1] == "color")
          subKeys = ViewParticleSystem.COLOR_KEYS.filter(_key => subKeys.includes(_key));

        subKeys.forEach(_key => {
          let child: ƒ.ParticleData.EffectRecursive = subData[_key];
          if (ƒ.ParticleData.isExpression(child) || typeof child == "object") {
            children.push(child);
            this.mapChildToParent.set(subData[_key], _data);
          }
        });
      }

      return children;
    }

    public delete(_focused: (ƒ.ParticleData.EffectRecursive)[]): (ƒ.ParticleData.EffectRecursive)[] {
      // delete selection independend of focussed item
      let deleted: (ƒ.ParticleData.EffectRecursive)[] = [];
      let expend: (ƒ.ParticleData.EffectRecursive)[] = this.selection.length > 0 ? this.selection : _focused;
      for (let data of expend) {
        if (this.deleteData(data))
          deleted.push(data);
      }
      this.selection.splice(0);
      return deleted;
    }

    public addChildren(_children: (ƒ.ParticleData.EffectRecursive)[], _target: ƒ.ParticleData.EffectRecursive): (ƒ.ParticleData.EffectRecursive)[] {
      let move: ƒ.ParticleData.Expression[] = [];
      if (ƒ.ParticleData.isFunction(_target) && _children.every(_data => ƒ.ParticleData.isExpression(_data))) {
        for (let moveData of <ƒ.ParticleData.Expression[]>_children) {
          let parent: ƒ.ParticleData.Function = <ƒ.ParticleData.Function>this.mapChildToParent.get(moveData);
          if (parent) {
            if (parent == _target) {
              _target.parameters.push(moveData);
              this.deleteData(moveData);
              move.push(moveData);
            } else {
              if (this.deleteData(moveData))  {
                _target.parameters.push(moveData);
                move.push(moveData);
                this.mapChildToParent.set(moveData, _target);
              }
            }
          } else {
            _target.parameters.push(moveData);
            move.push(moveData);
            this.mapChildToParent.set(moveData, _target);
          }
        }
      }

      return move;
    }

    public async copy(_originalData: (ƒ.ParticleData.EffectRecursive)[]): Promise<(ƒ.ParticleData.EffectRecursive)[]> {
      let copies: (ƒ.ParticleData.EffectRecursive)[] = [];
      if (_originalData.every(_data => ƒ.ParticleData.isExpression(_data))) {
        for (let originalData of _originalData) {
          let newData: ƒ.ParticleData.EffectRecursive = JSON.parse(JSON.stringify(originalData));
          // this.mapChildToParent.set(newData, this.mapChildToParent.get(originalData));
          copies.push(newData);
        }
      }

      return copies;
    }

    public getPath(_data:  ƒ.ParticleData.EffectRecursive): string[] {
      let path: string[] = [];
      let parent: ƒ.ParticleData.EffectRecursive;
      while (this.mapChildToParent.has(_data)) {
        parent = this.mapChildToParent.get(_data);
        path.unshift(this.getKey(_data, parent));
        _data = parent;
      }
      return path;
    }

    private getKey(_data: ƒ.ParticleData.EffectRecursive, _parentData: ƒ.ParticleData.EffectRecursive): string {
      let key: string;
      if (ƒ.ParticleData.isExpression(_data) && ƒ.ParticleData.isFunction(_parentData)) {
        key = _parentData.parameters.indexOf(_data).toString();
      } else {
        key = Object.entries(_parentData).find(entry => entry[1] == _data)[0];
      }
      return key;
    }

    private deleteData(_data: ƒ.ParticleData.EffectRecursive): boolean {
      let parentData: ƒ.ParticleData.EffectRecursive = this.mapChildToParent.get(_data);
      let key: string = this.getKey(_data, parentData);
      let index: number = Number.parseInt(key);
      if (ƒ.ParticleData.isFunction(parentData)) {
        if (parentData.parameters.length > ƒ.ParticleData.FUNCTION_MINIMUM_PARAMETERS[parentData.function])
          parentData.parameters.splice(index, 1);
        else
          return false;
          // parentData.parameters[index] = JSON.parse(JSON.stringify(_data));
      } else if (ƒ.ParticleData.isTransformation(_data) && Array.isArray(parentData)) {
        parentData.splice(index, 1);
      } else {
        delete parentData[key];
      }
      this.mapChildToParent.delete(_data);
      return true;
    }
  }
}