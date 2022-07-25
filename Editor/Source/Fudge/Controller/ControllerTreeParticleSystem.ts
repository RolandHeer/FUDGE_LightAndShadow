namespace Fudge {
  import ƒ = FudgeCore;
  import ƒui = FudgeUserInterface;

  const enum IDS {
    KEY = "key",
    FUNCTION = "function",
    VALUE = "value"
  }

  export class ControllerTreeParticleSystem extends ƒui.CustomTreeController<Object | ƒ.ExpressionData> {
    private parentMap: Map<Object, Object> = new Map();
    // private particleEffectRoot: ƒ.Serialization;

    constructor(_particleEffectData: ƒ.Serialization) {
      super();
      // this.particleEffectRoot = _particleEffectData;
    }

    public createContent(_data: Object | ƒ.ExpressionData): HTMLFormElement {
      // let path: string[] = _dataAndPath.path;

      let content: HTMLFormElement = document.createElement("form");
      let labelKey: HTMLInputElement = document.createElement("input");
      labelKey.type = "text";
      labelKey.disabled = true;
      labelKey.value = this.parentMap.has(_data) ? this.getKey(_data, this.parentMap.get(_data)) : "root";
      labelKey.id = IDS.KEY;
      content.appendChild(labelKey);

      if (ƒ.ParticleEffect.isExpressionData(_data)) {
        if (ƒ.ParticleEffect.isFunctionData(_data)) {
          let select: HTMLSelectElement = document.createElement("select");
          select.id = IDS.FUNCTION;
          for (let key in ƒ.ParticleClosureFactory.closures) {
            let entry: HTMLOptionElement = document.createElement("option");
            entry.text = key;
            entry.value = key;
            select.add(entry);
          }
          select.value = _data.function;
          content.appendChild(select);
        } else {
          let input: HTMLInputElement = document.createElement("input");
          input.type = "text";
          input.disabled = true;
          input.id = IDS.VALUE;
          if (ƒ.ParticleEffect.isVariableData(_data)) {  
            input.value = _data.name;
          } else if (ƒ.ParticleEffect.isConstantData(_data)) {
            input.value = _data.value.toString();
          }
          content.appendChild(input);
        }
      }

      return content;
    }

    public getAttributes(_data: Object | ƒ.ExpressionData): string {
      let attributes: string[] = [];
      if (ƒ.ParticleEffect.isFunctionData(_data) && this.getPath(_data).includes("storage")) 
        attributes.push("function");
      if (ƒ.ParticleEffect.isVariableData(_data)) 
        attributes.push("variable");

      return attributes.join(" ");
    }
    
    public rename(_data: Object | ƒ.ExpressionData, _id: string, _new: string): void {
      let inputAsNumber: number = Number.parseFloat(_new);

      if (_id == IDS.KEY && Number.isNaN(inputAsNumber) && ƒ.ParticleEffect.isExpressionData(_data)) {
        let parentData: Object | ƒ.FunctionData = this.parentMap.get(_data);
        if (!ƒ.ParticleEffect.isFunctionData(parentData)) {
          let key: string = this.getKey(_data, parentData); // Object.entries(parentData).find(entry => entry[1] == data)[0];
          if (parentData[_new]) {
            parentData[key] = parentData[_new];
          } else {
            delete parentData[key];
          }
          parentData[_new] = _data;
        }

        return;
      }
      
      if (_id == IDS.FUNCTION && ƒ.ParticleEffect.isFunctionData(_data) && Number.isNaN(inputAsNumber)) {
        _data.function = _new;
        return;
      }

      if (_id == IDS.VALUE && ƒ.ParticleEffect.isVariableData(_data) || ƒ.ParticleEffect.isConstantData(_data)) {
        let input: string | number = Number.isNaN(inputAsNumber) ? _new : inputAsNumber;
        _data.type = typeof input == "string" ? "variable" : "constant";
        if (ƒ.ParticleEffect.isVariableData(_data))
          _data.name = input as string;
        else if (ƒ.ParticleEffect.isConstantData(_data))
          _data.value = input as number;
        return;
      }
    }

    public hasChildren(_data: Object | ƒ.ExpressionData): boolean {
      let length: number = 0;
      if (!ƒ.ParticleEffect.isVariableData(_data) && !ƒ.ParticleEffect.isConstantData(_data))
        length = ƒ.ParticleEffect.isFunctionData(_data) ? _data.parameters.length : Object.keys(_data).length;
      return length > 0;
    }

    public getChildren(_data: Object | ƒ.ExpressionData): (Object | ƒ.ExpressionData)[] {
      let children: (Object | ƒ.ExpressionData)[] = [];

      if (!ƒ.ParticleEffect.isVariableData(_data) && !ƒ.ParticleEffect.isConstantData(_data)) {
        let subData: Object = ƒ.ParticleEffect.isFunctionData(_data) ? _data.parameters : _data;
        for (const key in subData) {
          let child: Object | ƒ.ExpressionData = subData[key];
          children.push(child);
          this.parentMap.set(subData[key], _data);
        }
      }

      return children;
    }

    public delete(_focused: (Object | ƒ.ExpressionData)[]): (Object | ƒ.ExpressionData)[] {
      // delete selection independend of focussed item
      let deleted: (Object | ƒ.ExpressionData)[] = [];
      let expend: (Object | ƒ.ExpressionData)[] = this.selection.length > 0 ? this.selection : _focused;
      for (let data of expend) {
        this.deleteData(data);
        deleted.push(data);
      }
      this.selection.splice(0);
      return deleted;
    }

    public addChildren(_children: (Object | ƒ.ExpressionData)[], _target: Object | ƒ.ExpressionData): (Object | ƒ.ExpressionData)[] {
      let move: (Object | ƒ.ExpressionData)[] = [];
      let tagetPath: string[] = this.getPath(_target);

      if (!_children.every(_data => ƒ.ParticleEffect.isExpressionData(_data))) return;

      if (ƒ.ParticleEffect.isFunctionData(_target)) {
        for (let data of _children) {
          if (!this.getPath(data).every(_key => tagetPath.includes(_key)))
            move.push(data);
        }
        
        for (let data of move) {
          let moveData: ƒ.ExpressionData = data as ƒ.ExpressionData;
          if (ƒ.ParticleEffect.isExpressionData(moveData)) {
            this.deleteData(data);
            _target.parameters.push(moveData);
          }
        }
      }
      
      return move;
    }

    public async copy(_originalData: (Object | ƒ.ExpressionData)[]): Promise<(Object | ƒ.ExpressionData)[]> {
      let copies: (Object | ƒ.ExpressionData)[] = [];
      for (let data of _originalData) {
        let newData: Object | ƒ.ExpressionData = JSON.parse(JSON.stringify(data));
        copies.push({ data: newData, path: [""] });
      }

      return copies;
    }

    public getPath(_data:  Object | ƒ.ExpressionData): string[] {
      let path: string[] = [];
      let parent: Object | ƒ.ExpressionData;
      while (this.parentMap.has(_data)) {
        parent = this.parentMap.get(_data);
        path.unshift(this.getKey(_data, parent));
        _data = parent;
      }
      return path;
    }

    private getKey(_data: Object | ƒ.ExpressionData, _parentData: Object | ƒ.ExpressionData): string {
      let key: string;
      if (ƒ.ParticleEffect.isExpressionData(_data) && ƒ.ParticleEffect.isFunctionData(_parentData)) {
        key = _parentData.parameters.indexOf(_data).toString();
      } else {
        key = Object.entries(_parentData).find(entry => entry[1] == _data)[0];
      }
      return key;
    }

    private deleteData(_data: Object | ƒ.FunctionData): void {
      let parentData: Object | ƒ.FunctionData = this.parentMap.get(_data);
      let key: string = this.getKey(_data, parentData);
      if (ƒ.ParticleEffect.isFunctionData(parentData)) {
        parentData.parameters.splice(Number.parseInt(key), 1);
      } else {
        delete parentData[key];
      }
      this.parentMap.delete(_data);
    }

    // TODO: maybe remove path methods these if path becomes unnecessary
    // private getDataAtPath(_path: string[]): Object | ƒ.ExpressionData {
    //   let found: ƒ.General = this.particleEffectRoot;
      
    //   for (let i: number = 0; i < _path.length; i++) {
    //     found = ƒ.ParticleEffect.isFunctionData(found) ? found.parameters[_path[i]] : found[_path[i]];
    //   }

    //   return found;
    // }

    // private deleteDataAtPath(_path: string[]): void {
    //   let parentData: Object | ƒ.FunctionData = this.getDataAtPath(_path.slice(0, _path.length - 1));
    //   let key: string = _path[_path.length - 1];
    //   if (ƒ.ParticleEffect.isFunctionData(parentData)) {
    //     let index: number = Number.parseInt(key);
    //     parentData.parameters.splice(index, 1);
    //   } else {
    //     delete parentData[key];
    //   }
    // }
  }
}