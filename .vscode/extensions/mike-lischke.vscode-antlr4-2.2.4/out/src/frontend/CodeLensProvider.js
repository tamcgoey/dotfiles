"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntlrCodeLensProvider = void 0;
const vscode_1 = require("vscode");
const facade_1 = require("../backend/facade");
class SymbolCodeLens extends vscode_1.CodeLens {
    constructor(symbol, range) {
        super(range);
        this.symbol = symbol;
    }
}
class AntlrCodeLensProvider {
    constructor(backend) {
        this.backend = backend;
        this.changeEvent = new vscode_1.EventEmitter();
    }
    get onDidChangeCodeLenses() {
        return this.changeEvent.event;
    }
    refresh() {
        this.changeEvent.fire();
    }
    provideCodeLenses(document, token) {
        if (vscode_1.workspace.getConfiguration("antlr4.referencesCodeLens").enabled !== true) {
            return [];
        }
        this.documentName = document.fileName;
        const symbols = this.backend.listTopLevelSymbols(document.fileName, false);
        const lenses = [];
        for (const symbol of symbols) {
            if (!symbol.definition) {
                continue;
            }
            switch (symbol.kind) {
                case facade_1.SymbolKind.FragmentLexerToken:
                case facade_1.SymbolKind.LexerRule:
                case facade_1.SymbolKind.LexerMode:
                case facade_1.SymbolKind.ParserRule: {
                    const range = new vscode_1.Range(symbol.definition.range.start.row - 1, symbol.definition.range.start.column, symbol.definition.range.end.row - 1, symbol.definition.range.end.column);
                    const lens = new SymbolCodeLens(symbol, range);
                    lenses.push(lens);
                }
                default:
                    break;
            }
        }
        return lenses;
    }
    resolveCodeLens(codeLens, token) {
        const refs = this.backend.countReferences(this.documentName, codeLens.symbol.name);
        codeLens.command = {
            title: (refs === 1) ? "1 reference" : refs + " references",
            command: "",
            arguments: undefined,
        };
        return codeLens;
    }
}
exports.AntlrCodeLensProvider = AntlrCodeLensProvider;
//# sourceMappingURL=CodeLensProvider.js.map