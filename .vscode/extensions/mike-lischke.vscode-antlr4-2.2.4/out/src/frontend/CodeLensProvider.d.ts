import { CodeLensProvider, TextDocument, CancellationToken, CodeLens, Event } from "vscode";
import { AntlrFacade } from "../backend/facade";
export declare class AntlrCodeLensProvider implements CodeLensProvider {
    private backend;
    private changeEvent;
    private documentName;
    constructor(backend: AntlrFacade);
    get onDidChangeCodeLenses(): Event<void>;
    refresh(): void;
    provideCodeLenses(document: TextDocument, token: CancellationToken): CodeLens[] | Thenable<CodeLens[]>;
    resolveCodeLens(codeLens: CodeLens, token: CancellationToken): CodeLens | Thenable<CodeLens>;
}
