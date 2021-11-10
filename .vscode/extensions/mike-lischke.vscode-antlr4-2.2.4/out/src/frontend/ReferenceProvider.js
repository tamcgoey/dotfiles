"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntlrReferenceProvider = void 0;
const vscode_1 = require("vscode");
class AntlrReferenceProvider {
    constructor(backend) {
        this.backend = backend;
    }
    provideReferences(document, position, context, token) {
        const info = this.backend.symbolInfoAtPosition(document.fileName, position.character, position.line + 1, false);
        if (!info) {
            return undefined;
        }
        const result = [];
        const occurences = this.backend.getSymbolOccurences(document.fileName, info.name);
        for (const symbol of occurences) {
            if (symbol.definition) {
                const range = new vscode_1.Range(symbol.definition.range.start.row - 1, symbol.definition.range.start.column, symbol.definition.range.end.row - 1, symbol.definition.range.start.column + info.name.length);
                const location = new vscode_1.Location(vscode_1.Uri.file(symbol.source), range);
                result.push(location);
            }
        }
        return result;
    }
}
exports.AntlrReferenceProvider = AntlrReferenceProvider;
//# sourceMappingURL=ReferenceProvider.js.map