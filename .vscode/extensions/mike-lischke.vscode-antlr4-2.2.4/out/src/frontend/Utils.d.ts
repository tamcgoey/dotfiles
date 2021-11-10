import { ExtensionContext, Webview } from "vscode";
import { LexicalRange } from "../backend/facade";
export interface RangeHolder {
    range: LexicalRange;
}
export declare class Utils {
    static getMiscPath(file: string, context: ExtensionContext, webView?: Webview): string;
    static getNodeModulesPath(file: string, context: ExtensionContext): string;
    static isAbsolute(p: string): boolean;
    static deleteFolderRecursive(target: string): void;
    static hashForPath(dataPath: string): string;
    static copyFilesIfNewer(files: string[], targetPath: string): void;
    static exportDataWithConfirmation(fileName: string, filters: {
        [name: string]: string[];
    }, data: string, extraFiles: string[]): void;
    static findInListFromPosition<T extends RangeHolder>(list: T[], column: number, row: number): T | undefined;
    static switchVsCodeContext(key: string, enable: boolean): Thenable<unknown>;
}
