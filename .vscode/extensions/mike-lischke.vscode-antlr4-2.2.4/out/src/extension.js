"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const path = require("path");
const fs = require("fs-extra");
const Net = require("net");
const vscode_1 = require("vscode");
const HoverProvider_1 = require("./frontend/HoverProvider");
const DefinitionProvider_1 = require("./frontend/DefinitionProvider");
const SymbolProvider_1 = require("./frontend/SymbolProvider");
const CodeLensProvider_1 = require("./frontend/CodeLensProvider");
const CompletionItemProvider_1 = require("./frontend/CompletionItemProvider");
const RailroadDiagramProvider_1 = require("./frontend/RailroadDiagramProvider");
const ATNGraphProvider_1 = require("./frontend/ATNGraphProvider");
const FormattingProvider_1 = require("./frontend/FormattingProvider");
const CallGraphProvider_1 = require("./frontend/CallGraphProvider");
const ImportsProvider_1 = require("./frontend/ImportsProvider");
const LexerSymbolsProvider_1 = require("./frontend/LexerSymbolsProvider");
const ParserSymbolsProvider_1 = require("./frontend/ParserSymbolsProvider");
const ChannelsProvider_1 = require("./frontend/ChannelsProvider");
const ModesProvider_1 = require("./frontend/ModesProvider");
const ActionsProvider_1 = require("./frontend/ActionsProvider");
const ParseTreeProvider_1 = require("./frontend/ParseTreeProvider");
const RenameProvider_1 = require("./frontend/RenameProvider");
const ProgressIndicator_1 = require("./frontend/ProgressIndicator");
const AntlrDebugAdapter_1 = require("./frontend/AntlrDebugAdapter");
const facade_1 = require("./backend/facade");
const ReferenceProvider_1 = require("./frontend/ReferenceProvider");
const Utils_1 = require("./frontend/Utils");
const SourceContext_1 = require("./backend/SourceContext");
const ANTLR = { language: "antlr", scheme: "file" };
const diagnosticCollection = vscode_1.languages.createDiagnosticCollection("antlr");
const DiagnosticTypeMap = new Map();
let backend;
let progress;
let outputChannel;
let importsProvider;
let lexerSymbolsProvider;
let parserSymbolsProvider;
let channelsProvider;
let modesProvider;
let actionsProvider;
let parseTreeProvider;
let codeLensProvider;
exports.activate = (context) => {
    const isGrammarFile = (document) => document.languageId === "antlr" && document.uri.scheme === "file";
    const updateTreeProviders = (document) => {
        lexerSymbolsProvider.refresh(document);
        parserSymbolsProvider.refresh(document);
        importsProvider.refresh(document);
        channelsProvider.refresh(document);
        modesProvider.refresh(document);
        actionsProvider.refresh(document);
    };
    DiagnosticTypeMap.set(facade_1.DiagnosticType.Hint, vscode_1.DiagnosticSeverity.Hint);
    DiagnosticTypeMap.set(facade_1.DiagnosticType.Info, vscode_1.DiagnosticSeverity.Information);
    DiagnosticTypeMap.set(facade_1.DiagnosticType.Warning, vscode_1.DiagnosticSeverity.Warning);
    DiagnosticTypeMap.set(facade_1.DiagnosticType.Error, vscode_1.DiagnosticSeverity.Error);
    backend = new facade_1.AntlrFacade(vscode_1.workspace.getConfiguration("antlr4.generation").importDir || "");
    progress = new ProgressIndicator_1.ProgressIndicator();
    outputChannel = vscode_1.window.createOutputChannel("ANTLR Exceptions");
    for (const document of vscode_1.workspace.textDocuments) {
        if (isGrammarFile(document)) {
            const antlrPath = path.join(path.dirname(document.fileName), ".antlr");
            void backend.generate(document.fileName, { outputDir: antlrPath, loadOnly: true });
            ATNGraphProvider_1.AntlrATNGraphProvider.addStatesForGrammar(antlrPath, document.fileName);
        }
    }
    context.subscriptions.push(vscode_1.languages.registerHoverProvider(ANTLR, new HoverProvider_1.AntlrHoverProvider(backend)));
    context.subscriptions.push(vscode_1.languages.registerDefinitionProvider(ANTLR, new DefinitionProvider_1.AntlrDefinitionProvider(backend)));
    context.subscriptions.push(vscode_1.languages.registerDocumentSymbolProvider(ANTLR, new SymbolProvider_1.AntlrSymbolProvider(backend)));
    codeLensProvider = new CodeLensProvider_1.AntlrCodeLensProvider(backend);
    context.subscriptions.push(vscode_1.languages.registerCodeLensProvider(ANTLR, codeLensProvider));
    context.subscriptions.push(vscode_1.languages.registerCompletionItemProvider(ANTLR, new CompletionItemProvider_1.AntlrCompletionItemProvider(backend), " ", ":", "@", "<", "{", "["));
    context.subscriptions.push(vscode_1.languages.registerDocumentRangeFormattingEditProvider(ANTLR, new FormattingProvider_1.AntlrFormattingProvider(backend)));
    context.subscriptions.push(vscode_1.languages.registerRenameProvider(ANTLR, new RenameProvider_1.AntlrRenameProvider(backend)));
    context.subscriptions.push(vscode_1.languages.registerReferenceProvider(ANTLR, new ReferenceProvider_1.AntlrReferenceProvider(backend)));
    const diagramProvider = new RailroadDiagramProvider_1.AntlrRailroadDiagramProvider(backend, context);
    context.subscriptions.push(vscode_1.commands.registerTextEditorCommand("antlr.rrd.singleRule", (textEditor, edit) => {
        diagramProvider.showWebview(textEditor, {
            title: "RRD: " + path.basename(textEditor.document.fileName),
            fullList: false,
        });
    }));
    context.subscriptions.push(vscode_1.commands.registerTextEditorCommand("antlr.rrd.allRules", (textEditor, edit) => {
        diagramProvider.showWebview(textEditor, {
            title: "RRD: " + path.basename(textEditor.document.fileName),
            fullList: true,
        });
    }));
    const atnGraphProvider = new ATNGraphProvider_1.AntlrATNGraphProvider(backend, context);
    context.subscriptions.push(vscode_1.commands.registerTextEditorCommand("antlr.atn.singleRule", (textEditor, edit) => {
        atnGraphProvider.showWebview(textEditor, {
            title: "ATN: " + path.basename(textEditor.document.fileName),
        });
    }));
    const callGraphProvider = new CallGraphProvider_1.AntlrCallGraphProvider(backend, context);
    context.subscriptions.push(vscode_1.commands.registerTextEditorCommand("antlr.call-graph", (textEditor, edit) => {
        callGraphProvider.showWebview(textEditor, {
            title: "Call Graph: " + path.basename(textEditor.document.fileName),
        });
    }));
    const genOutputChannel = vscode_1.window.createOutputChannel("Sentence Generation");
    context.subscriptions.push(vscode_1.commands.registerTextEditorCommand("antlr.tools.generateSentences", (textEditor, edit) => {
        const ruleMappings = new Map([
            ["A", "A"],
            ["B", "B"],
            ["C", "C"],
            ["D", "D"],
            ["E", "E"],
            ["F", "F"],
            ["G", "G"],
            ["H", "H"],
            ["I", "I"],
            ["J", "J"],
            ["K", "K"],
            ["L", "L"],
            ["M", "M"],
            ["N", "N"],
            ["O", "O"],
            ["P", "P"],
            ["Q", "Q"],
            ["R", "R"],
            ["S", "S"],
            ["T", "T"],
            ["U", "U"],
            ["V", "V"],
            ["W", "W"],
            ["X", "X"],
            ["Y", "Y"],
            ["Z", "Z"],
            ["NOT2_SYMBOL", "NOT"],
            ["CONCAT_PIPES_SYMBOL", "||"],
            ["INT_NUMBER", "-1111111111"],
            ["LONG_NUMBER", "1111111111"],
            ["ULONGLONG_NUMBER", "18446744073709551614"],
            ["DOUBLE_QUOTED_TEXT", "\"text\""],
            ["SINGLE_QUOTED_TEXT", "'text'"],
            ["BACK_TICK_QUOTED_ID", "`id`"],
            ["UNDERSCORE_CHARSET", "_utf8"],
            ["identifier", "`id`"],
            ["schemaRef", "sakila"],
            ["tableRef", "sakila.actor"],
            ["columnRef", "sakila.actor.actor_id"],
        ]);
        const fileName = textEditor.document.uri.fsPath;
        const caret = textEditor.selection.active;
        const [ruleName] = backend.ruleFromPosition(fileName, caret.character, caret.line + 1);
        if (!ruleName) {
            console.log("ANTLR4 sentence generation: no rule selected");
        }
        const basePath = path.dirname(fileName);
        let actionFile = vscode_1.workspace.getConfiguration("antlr4.sentenceGeneration").actionFile;
        if (actionFile) {
            if (!path.isAbsolute(actionFile)) {
                actionFile = path.join(basePath, actionFile);
            }
        }
        for (let i = 0; i < 20; ++i) {
            const sentence = backend.generateSentence(fileName, {
                startRule: ruleName,
                maxParserIterations: 3,
                maxLexerIterations: 10,
                maxRecursions: 1,
                convergenceFactor: 0.15,
            }, ruleMappings, actionFile);
            genOutputChannel.appendLine(sentence);
        }
    }));
    context.subscriptions.push(vscode_1.debug.registerDebugConfigurationProvider("antlr-debug", new AntlrDebugConfigurationProvider()));
    importsProvider = new ImportsProvider_1.ImportsProvider(backend);
    context.subscriptions.push(vscode_1.window.registerTreeDataProvider("antlr4.imports", importsProvider));
    lexerSymbolsProvider = new LexerSymbolsProvider_1.LexerSymbolsProvider(backend);
    context.subscriptions.push(vscode_1.window.registerTreeDataProvider("antlr4.lexerSymbols", lexerSymbolsProvider));
    parserSymbolsProvider = new ParserSymbolsProvider_1.ParserSymbolsProvider(backend);
    context.subscriptions.push(vscode_1.window.registerTreeDataProvider("antlr4.parserSymbols", parserSymbolsProvider));
    channelsProvider = new ChannelsProvider_1.ChannelsProvider(backend);
    context.subscriptions.push(vscode_1.window.registerTreeDataProvider("antlr4.channels", channelsProvider));
    modesProvider = new ModesProvider_1.ModesProvider(backend);
    context.subscriptions.push(vscode_1.window.registerTreeDataProvider("antlr4.modes", modesProvider));
    actionsProvider = new ActionsProvider_1.ActionsProvider(backend);
    actionsProvider.actionTree = vscode_1.window.createTreeView("antlr4.actions", { treeDataProvider: actionsProvider });
    parseTreeProvider = new ParseTreeProvider_1.AntlrParseTreeProvider(backend, context);
    const editor = vscode_1.window.activeTextEditor;
    if (editor && isGrammarFile(editor.document)) {
        updateTreeProviders(editor.document);
    }
    context.subscriptions.push(vscode_1.commands.registerCommand("antlr.openGrammar", (grammar) => {
        void vscode_1.workspace.openTextDocument(grammar).then((document) => vscode_1.window.showTextDocument(document, 0, false));
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand("antlr.selectGrammarRange", (range) => {
        if (vscode_1.window.activeTextEditor) {
            vscode_1.window.activeTextEditor.selection = new vscode_1.Selection(range.start.row - 1, range.start.column, range.end.row - 1, range.end.column + 1);
            vscode_1.window.activeTextEditor.revealRange(new vscode_1.Range(range.start.row - 1, range.start.column, range.end.row - 1, range.end.column + 1), vscode_1.TextEditorRevealType.InCenterIfOutsideViewport);
        }
    }));
    vscode_1.workspace.onDidOpenTextDocument((document) => {
        if (isGrammarFile(document)) {
            backend.loadGrammar(document.fileName);
            regenerateBackgroundData(document);
        }
    });
    vscode_1.workspace.onDidCloseTextDocument((document) => {
        if (isGrammarFile(document)) {
            backend.releaseGrammar(document.fileName);
            diagnosticCollection.set(document.uri, []);
        }
    });
    const changeTimers = new Map();
    vscode_1.workspace.onDidChangeTextDocument((event) => {
        if (event.contentChanges.length > 0 && isGrammarFile(event.document)) {
            const fileName = event.document.fileName;
            backend.setText(fileName, event.document.getText());
            if (changeTimers.has(fileName)) {
                clearTimeout(changeTimers.get(fileName));
            }
            changeTimers.set(fileName, setTimeout(() => {
                changeTimers.delete(fileName);
                backend.reparse(fileName);
                diagramProvider.update(vscode_1.window.activeTextEditor);
                callGraphProvider.update(vscode_1.window.activeTextEditor);
                processDiagnostic(event.document);
                codeLensProvider.refresh();
            }, 300));
        }
    });
    vscode_1.workspace.onDidSaveTextDocument((document) => {
        if (isGrammarFile(document)) {
            regenerateBackgroundData(document);
        }
    });
    vscode_1.window.onDidChangeTextEditorSelection((event) => {
        if (isGrammarFile(event.textEditor.document)) {
            diagramProvider.update(event.textEditor);
            atnGraphProvider.update(event.textEditor, false);
            actionsProvider.update(event.textEditor);
        }
    });
    vscode_1.window.onDidChangeActiveTextEditor((textEditor) => {
        if (isGrammarFile(textEditor.document)) {
            const info = backend.getContextDetails(textEditor.document.fileName);
            1;
            void Utils_1.Utils.switchVsCodeContext("antlr4.isLexer", info.type === SourceContext_1.GrammarType.Lexer);
            void Utils_1.Utils.switchVsCodeContext("antlr4.isParser", info.type === SourceContext_1.GrammarType.Parser);
            void Utils_1.Utils.switchVsCodeContext("antlr4.isCombined", info.type === SourceContext_1.GrammarType.Combined);
            void Utils_1.Utils.switchVsCodeContext("antlr4.hasImports", info.imports.length > 0);
        }
        else {
            void Utils_1.Utils.switchVsCodeContext("antlr4.isLexer", false);
            void Utils_1.Utils.switchVsCodeContext("antlr4.isParser", false);
            void Utils_1.Utils.switchVsCodeContext("antlr4.isCombined", false);
            void Utils_1.Utils.switchVsCodeContext("antlr4.hasImports", false);
        }
        updateTreeProviders(textEditor.document);
    });
    const processDiagnostic = (document) => {
        const diagnostics = [];
        const entries = backend.getDiagnostics(document.fileName);
        for (const entry of entries) {
            const startRow = entry.range.start.row === 0 ? 0 : entry.range.start.row - 1;
            const endRow = entry.range.end.row === 0 ? 0 : entry.range.end.row - 1;
            const range = new vscode_1.Range(startRow, entry.range.start.column, endRow, entry.range.end.column);
            const diagnostic = new vscode_1.Diagnostic(range, entry.message, DiagnosticTypeMap.get(entry.type));
            diagnostics.push(diagnostic);
        }
        diagnosticCollection.set(document.uri, diagnostics);
    };
    const regenerateBackgroundData = (document) => {
        if (vscode_1.workspace.getConfiguration("antlr4.generation").mode === "none") {
            return;
        }
        const externalMode = vscode_1.workspace.getConfiguration("antlr4.generation").mode === "external";
        progress.startAnimation();
        const basePath = path.dirname(document.fileName);
        const antlrPath = path.join(basePath, ".antlr");
        let outputDir = antlrPath;
        if (externalMode) {
            outputDir = vscode_1.workspace.getConfiguration("antlr4.generation").outputDir;
            if (!outputDir) {
                outputDir = basePath;
            }
            else {
                if (!path.isAbsolute(outputDir)) {
                    outputDir = path.join(basePath, outputDir);
                }
            }
        }
        try {
            fs.ensureDirSync(outputDir);
        }
        catch (error) {
            progress.stopAnimation();
            void vscode_1.window.showErrorMessage("Cannot create output folder: " + error);
            return;
        }
        const options = {
            baseDir: basePath,
            libDir: vscode_1.workspace.getConfiguration("antlr4.generation").importDir,
            outputDir,
            listeners: false,
            visitors: false,
            alternativeJar: vscode_1.workspace.getConfiguration("antlr4.generation").alternativeJar,
            additionalParameters: vscode_1.workspace.getConfiguration("antlr4.generation").additionalParameters,
        };
        if (externalMode) {
            options.language = vscode_1.workspace.getConfiguration("antlr4.generation").language;
            options.package = vscode_1.workspace.getConfiguration("antlr4.generation").package;
            options.listeners = vscode_1.workspace.getConfiguration("antlr4.generation").listeners;
            options.visitors = vscode_1.workspace.getConfiguration("antlr4.generation").visitors;
        }
        const result = backend.generate(document.fileName, options);
        result.then((affectedFiles) => {
            for (const file of affectedFiles) {
                const fullPath = path.resolve(basePath, file);
                vscode_1.workspace.textDocuments.forEach((textDocument) => {
                    if (textDocument.fileName === fullPath) {
                        processDiagnostic(textDocument);
                    }
                });
            }
            if (externalMode && antlrPath !== outputDir) {
                try {
                    const files = fs.readdirSync(outputDir);
                    for (const file of files) {
                        if (file.endsWith(".interp")) {
                            const sourceFile = path.join(outputDir, file);
                            fs.moveSync(sourceFile, path.join(antlrPath, file), { overwrite: true });
                        }
                    }
                }
                catch (reason) {
                    progress.stopAnimation();
                    outputChannel.appendLine(reason);
                    outputChannel.show(true);
                }
            }
            backend.generate(document.fileName, { outputDir: antlrPath, loadOnly: true }).then(() => {
                atnGraphProvider.update(vscode_1.window.activeTextEditor, true);
                updateTreeProviders(document);
                progress.stopAnimation();
            }).catch((reason) => {
                progress.stopAnimation();
                outputChannel.appendLine(reason);
                outputChannel.show(true);
            });
        }).catch((reason) => {
            progress.stopAnimation();
            outputChannel.appendLine(reason);
            outputChannel.show(true);
        });
    };
};
class AntlrDebugConfigurationProvider {
    resolveDebugConfiguration(folder, config, token) {
        if (vscode_1.workspace.getConfiguration("antlr4.generation").mode === "none") {
            return vscode_1.window.showErrorMessage("Interpreter data generation is disabled in the preferences (see " +
                "'antlr4.generation'). Set this at least to 'internal' to enable debugging.").then((_) => undefined);
        }
        if (!this.server) {
            this.server = Net.createServer((socket) => {
                socket.on("end", () => {
                });
                const session = new AntlrDebugAdapter_1.AntlrDebugSession(folder, backend, [
                    parseTreeProvider,
                ]);
                session.setRunAsServer(true);
                session.start(socket, socket);
            }).listen(0);
        }
        const info = this.server.address();
        if (info) {
            config.debugServer = info.port;
        }
        else {
            config.debugServer = 0;
        }
        return config;
    }
    dispose() {
        if (this.server) {
            this.server.close();
        }
    }
}
//# sourceMappingURL=extension.js.map