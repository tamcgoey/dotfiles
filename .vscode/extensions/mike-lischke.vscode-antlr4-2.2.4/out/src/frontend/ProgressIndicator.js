"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressIndicator = void 0;
const vscode_1 = require("vscode");
class ProgressIndicator {
    constructor() {
        this.progress = 0;
        this.statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left, 0);
        this.statusBarItem.hide();
        this.statusBarItem.tooltip = "ANTLR4 generating interpreter data";
    }
    startAnimation() {
        this.statusBarItem.show();
        this.timer = setInterval(() => {
            const index = this.progress % ProgressIndicator.progressChars.length;
            this.statusBarItem.text = "ANTLR " + ProgressIndicator.progressChars.charAt(index);
            this.progress++;
        }, 50);
    }
    stopAnimation() {
        clearInterval(this.timer);
        this.timer = null;
        this.statusBarItem.hide();
    }
}
exports.ProgressIndicator = ProgressIndicator;
ProgressIndicator.progressChars = "⠁⠃⠅⡁⢁⠡⠑⠉⠁⠃⠇⡃⢃⠣⠓⠋⠃⠃⠇⡇⢇⠧⠗⠏⠇⠇⠇⡇⣇⡧⡗⡏⡇⡇⡇⡇⣇⣧⣗⣏⣇⣇⣇⣇⣇⣧⣷⣯⣧⣧⣧⣧⣧⣧⣷⣿⣿⣿⣿⣿⣿⣿⣿";
//# sourceMappingURL=ProgressIndicator.js.map