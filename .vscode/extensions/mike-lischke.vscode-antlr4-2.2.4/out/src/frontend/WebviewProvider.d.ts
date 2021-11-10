import { AntlrFacade } from "../backend/facade";
import { TextEditor, ExtensionContext, Uri, Webview } from "vscode";
export interface WebviewShowOptions {
    [key: string]: boolean | number | string;
    title: string;
}
export interface WebviewMessage {
    [key: string]: any;
}
export declare class WebviewProvider {
    protected backend: AntlrFacade;
    protected context: ExtensionContext;
    protected currentRule: string | undefined;
    protected currentRuleIndex: number | undefined;
    protected currentEditor: TextEditor | undefined;
    private webViewMap;
    constructor(backend: AntlrFacade, context: ExtensionContext);
    showWebview(source: TextEditor | Uri, options: WebviewShowOptions): void;
    update(editor: TextEditor): void;
    protected generateContent(webView: Webview, source: TextEditor | Uri, options: WebviewShowOptions): string;
    protected generateContentSecurityPolicy(_: TextEditor | Uri): string;
    protected updateContent(uri: Uri): boolean;
    protected sendMessage(uri: Uri, args: WebviewMessage): boolean;
    protected handleMessage(message: WebviewMessage): boolean;
    protected getStyles(webView: Webview): string;
    protected getScripts(nonce: string, scripts: string[]): string;
    protected findCurrentRule(editor: TextEditor): [string | undefined, number | undefined];
}
