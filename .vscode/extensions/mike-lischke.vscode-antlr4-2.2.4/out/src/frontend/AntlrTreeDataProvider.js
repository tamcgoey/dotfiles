"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntlrTreeDataProvider = void 0;
const vscode_1 = require("vscode");
class AntlrTreeDataProvider {
    constructor(backend) {
        this.backend = backend;
        this.changeEvent = new vscode_1.EventEmitter();
    }
    get onDidChangeTreeData() {
        return this.changeEvent.event;
    }
    refresh(document) {
        if (document.languageId === "antlr" && document.uri.scheme === "file") {
            this.currentFile = document.fileName;
        }
        else {
            this.currentFile = undefined;
        }
        this.changeEvent.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return new Promise((resolve) => {
            resolve([]);
        });
    }
}
exports.AntlrTreeDataProvider = AntlrTreeDataProvider;
//# sourceMappingURL=AntlrTreeDataProvider.js.map