import { TreeItem, Command, TextEditor, TreeView, ProviderResult } from "vscode";
import { AntlrTreeDataProvider } from "./AntlrTreeDataProvider";
import { LexicalRange } from "../backend/facade";
import { RangeHolder } from "./Utils";
export declare class ActionsProvider extends AntlrTreeDataProvider<TreeItem> {
    actionTree: TreeView<TreeItem>;
    private actionsTreeItem;
    private predicatesTreeItem;
    private actions;
    private predicates;
    update(editor: TextEditor): void;
    getParent?(element: TreeItem): ProviderResult<TreeItem>;
    getChildren(element?: TreeItem): ProviderResult<TreeItem[]>;
}
export declare class RootEntry extends TreeItem {
    contextValue: string;
    constructor(label: string, id: string);
}
export declare class ActionEntry extends TreeItem implements RangeHolder {
    range: LexicalRange;
    contextValue: string;
    constructor(label: string, range: LexicalRange, command_?: Command);
}
export declare class PredicateEntry extends TreeItem implements RangeHolder {
    range: LexicalRange;
    contextValue: string;
    constructor(label: string, range: LexicalRange, command_?: Command);
}
