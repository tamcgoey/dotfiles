"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const fs = require("fs-extra");
const crypto = require("crypto");
const path = require("path");
const vscode_1 = require("vscode");
class Utils {
    static getMiscPath(file, context, webView) {
        if (webView) {
            const uri = vscode_1.Uri.file(context.asAbsolutePath(path.join("misc", file)));
            return webView.asWebviewUri(uri).toString();
        }
        return context.asAbsolutePath(path.join("misc", file));
    }
    static getNodeModulesPath(file, context) {
        return vscode_1.Uri.file(context.asAbsolutePath(path.join("node_modules", file)))
            .with({ scheme: "vscode-resource" }).toString();
    }
    static isAbsolute(p) {
        return path.normalize(p + "/") === path.normalize(path.resolve(p) + "/");
    }
    static deleteFolderRecursive(target) {
        let files = [];
        if (fs.existsSync(target)) {
            files = fs.readdirSync(target);
            files.forEach((file) => {
                const curPath = path.join(target, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    Utils.deleteFolderRecursive(curPath);
                }
                else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(target);
        }
    }
    static hashForPath(dataPath) {
        return crypto.createHash("md5").update(dataPath).digest("hex");
    }
    static copyFilesIfNewer(files, targetPath) {
        try {
            fs.ensureDirSync(targetPath);
        }
        catch (error) {
            void vscode_1.window.showErrorMessage("Could not create target folder '" + targetPath + "'. " + error);
        }
        for (const file of files) {
            try {
                let canCopy = true;
                const targetFile = path.join(targetPath, path.basename(file));
                if (fs.existsSync(targetFile)) {
                    const sourceStat = fs.statSync(file);
                    const targetStat = fs.statSync(targetFile);
                    canCopy = targetStat.mtime < sourceStat.mtime;
                }
                if (canCopy) {
                    void fs.copy(file, targetFile, { overwrite: true });
                }
            }
            catch (error) {
                void vscode_1.window.showErrorMessage("Could not copy file '" + file + "'. " + error);
            }
        }
    }
    static exportDataWithConfirmation(fileName, filters, data, extraFiles) {
        void vscode_1.window.showSaveDialog({
            defaultUri: vscode_1.Uri.file(fileName),
            filters,
        }).then((uri) => {
            if (uri) {
                const value = uri.fsPath;
                fs.writeFile(value, data, (error) => {
                    if (error) {
                        void vscode_1.window.showErrorMessage("Could not write to file: " + value + ": " + error.message);
                    }
                    else {
                        this.copyFilesIfNewer(extraFiles, path.dirname(value));
                        void vscode_1.window.showInformationMessage("Diagram successfully written to file '" + value + "'.");
                    }
                });
            }
        });
    }
    static findInListFromPosition(list, column, row) {
        for (const entry of list) {
            if (!entry.range) {
                continue;
            }
            const start = entry.range.start;
            const stop = entry.range.end;
            let matched = start.row <= row && stop.row >= row;
            if (matched) {
                if (start.row === row) {
                    matched = start.column <= column;
                }
                else if (stop.row === row) {
                    matched = stop.column >= column;
                }
            }
            if (matched) {
                return entry;
            }
        }
    }
    static switchVsCodeContext(key, enable) {
        return vscode_1.commands.executeCommand("setContext", key, enable);
    }
}
exports.Utils = Utils;
//# sourceMappingURL=Utils.js.map