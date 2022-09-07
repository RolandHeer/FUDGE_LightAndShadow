///<reference path="../../../../Core/Build/FudgeCore.d.ts"/>
namespace FudgeUserInterface {

  /**
   * Extension of ul-element that keeps a list of {@link CustomTreeItem}s to represent a branch in a tree
   */
  export class CustomTreeList<T> extends HTMLUListElement {
    public controller: CustomTreeController<T>;

    constructor(_controller: CustomTreeController<T>, _items: CustomTreeItem<T>[] = []) {
      super();
      this.controller = _controller;
      this.addItems(_items);
      this.className = "tree";
    }

    /**
     * Expands the tree along the given path to show the objects the path includes
     * @param _path An array of objects starting with one being contained in this treelist and following the correct hierarchy of successors
     * @param _focus If true (default) the last object found in the tree gets the focus
     */
    public show(_path: T[], _focus: boolean = true): void {
      let currentTree: CustomTreeList<T> = this;

      for (let data of _path) {
        let item: CustomTreeItem<T> = currentTree.findItem(data);
        item.focus();
        let content: CustomTreeList<T> = item.getBranch();
        if (!content) {
          item.expand(true);
          content = item.getBranch();
        }
        currentTree = content;
      }
    }

    /**
     * Restructures the list to sync with the given list. 
     * {@link CustomTreeItem}s referencing the same object remain in the list, new items get added in the order of appearance, obsolete ones are deleted.
     * @param _tree A list to sync this with
     */
    public restructure(_tree: CustomTreeList<T>): void {
      let items: CustomTreeItem<T>[] = [];
      for (let item of _tree.getItems()) {
        let found: CustomTreeItem<T> = this.findItem(item.data);
        if (found) {
          found.content = item.content;
          found.hasChildren = item.hasChildren;
          if (!found.hasChildren)
            found.expand(false);
          items.push(found);
        }
        else
          items.push(item);
      }

      this.innerHTML = "";
      this.addItems(items);
    }

    /**
     * Returns the {@link CustomTreeItem} of this list referencing the given object or null, if not found
     */
    public findItem(_data: T): CustomTreeItem<T> {
      for (let item of this.children)
      if ((<CustomTreeItem<T>>item).data == _data)
          return <CustomTreeItem<T>>item;

      return null;
    }

    /**
     * Adds the given {@link CustomTreeItem}s at the end of this list
     */
    public addItems(_items: CustomTreeItem<T>[]): void {
      for (let item of _items) {
        this.appendChild(item);
      }
    }

    /**
     * Returns the content of this list as array of {@link CustomTreeItem}s
     */
    public getItems(): CustomTreeItem<T>[] {
      return <CustomTreeItem<T>[]><unknown>this.children;
    }

    public displaySelection(_data: T[]): void {
      let items: NodeListOf<CustomTreeItem<T>> = <NodeListOf<CustomTreeItem<T>>>this.querySelectorAll("li");
      for (let item of items)
        item.selected = (_data != null && _data.indexOf(item.data) > -1);
    }

    public selectInterval(_dataStart: T, _dataEnd: T): void {
      let items: NodeListOf<CustomTreeItem<T>> = <NodeListOf<CustomTreeItem<T>>>this.querySelectorAll("li");
      let selecting: boolean = false;
      let end: T = null;
      for (let item of items) {
        if (!selecting) {
          selecting = true;
          if (item.data == _dataStart)
            end = _dataEnd;
          else if (item.data == _dataEnd)
            end = _dataStart;
          else
            selecting = false;
        }
        if (selecting) {
          item.select(true, false);
          if (item.data == end)
            break;
        }
      }
    }

    public delete(_data: T[]): CustomTreeItem<T>[] {
      let items: NodeListOf<CustomTreeItem<T>> = <NodeListOf<CustomTreeItem<T>>>this.querySelectorAll("li");
      let deleted: CustomTreeItem<T>[] = [];

      for (let item of items)
        if (_data.indexOf(item.data) > -1) {
          // item.dispatchEvent(new Event(EVENT.UPDATE, { bubbles: true }));
          item.dispatchEvent(new Event(EVENT.REMOVE_CHILD, { bubbles: true }));
          let parentNode: ParentNode = item.parentNode;
          deleted.push(parentNode.removeChild(item));
          // siblings might need to refresh their content i.e. if they display their own index
          Array.from(parentNode.children)
            .filter(_element => _element instanceof CustomTreeItem)
            .forEach(_sibling => (<CustomTreeItem<T>>_sibling).refreshContent()); 
        }

      return deleted;
    }

    public findVisible(_data: T): CustomTreeItem<T> {
      let items: NodeListOf<CustomTreeItem<T>> = <NodeListOf<CustomTreeItem<T>>>this.querySelectorAll("li");
      for (let item of items)
        if (_data == item.data)
          return item;
      return null;
    }
  }

  customElements.define("ul-custom-tree-list", CustomTreeList, { extends: "ul" });
}