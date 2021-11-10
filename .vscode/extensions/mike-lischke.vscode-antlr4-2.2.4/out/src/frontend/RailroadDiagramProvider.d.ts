import * as vscode from "vscode";
import { WebviewProvider, WebviewShowOptions } from "./WebviewProvider";
export declare class AntlrRailroadDiagramProvider extends WebviewProvider {
    generateContent(webView: vscode.Webview, editor: vscode.TextEditor, options: WebviewShowOptions): string;
}
