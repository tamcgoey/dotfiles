"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntlrRenameProvider = void 0;
const vscode_1 = require("vscode");
class AntlrRenameProvider {
    constructor(backend) {
        this.backend = backend;
    }
    provideRenameEdits(document, position, newName, token) {
        const info = this.backend.symbolInfoAtPosition(document.fileName, position.character, position.line + 1, false);
        if (!info) {
            return undefined;
        }
        const result = new vscode_1.WorkspaceEdit();
        const occurences = this.backend.getSymbolOccurences(document.fileName, info.name);
        for (const symbol of occurences) {
            if (symbol.definition) {
                const range = new vscode_1.Range(symbol.definition.range.start.row - 1, symbol.definition.range.start.column, symbol.definition.range.end.row - 1, symbol.definition.range.start.column + info.name.length);
                result.replace(vscode_1.Uri.file(symbol.source), range, newName);
            }
        }
        return result;
    }
}
exports.AntlrRenameProvider = AntlrRenameProvider;
//# sourceMappingURL=RenameProvider.js.map