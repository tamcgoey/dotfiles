import { TreeDataProvider, TreeItem, TextDocument, ProviderResult, Event } from "vscode";
import { AntlrFacade } from "../backend/facade";
export declare class AntlrTreeDataProvider<T> implements TreeDataProvider<T> {
    protected backend: AntlrFacade;
    protected currentFile: string | undefined;
    private changeEvent;
    constructor(backend: AntlrFacade);
    get onDidChangeTreeData(): Event<void>;
    refresh(document: TextDocument): void;
    getTreeItem(element: T): TreeItem;
    getChildren(element?: T): ProviderResult<T[]>;
}
