"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_debugadapter_1 = require("vscode-debugadapter");
const vscode_1 = require("vscode");
const fs = require("fs-extra");
const path = require("path");
const await_notify_1 = require("await-notify");
const facade_1 = require("../backend/facade");
var VarRef;
(function (VarRef) {
    VarRef[VarRef["Globals"] = 1000] = "Globals";
    VarRef[VarRef["ParseTree"] = 1002] = "ParseTree";
    VarRef[VarRef["Context"] = 2000] = "Context";
    VarRef[VarRef["Tokens"] = 3000] = "Tokens";
    VarRef[VarRef["SingleToken"] = 10000] = "SingleToken";
})(VarRef || (VarRef = {}));
class AntlrDebugSession extends vscode_debugadapter_1.DebugSession {
    constructor(folder, backend, consumers) {
        super();
        this.folder = folder;
        this.backend = backend;
        this.consumers = consumers;
        this.configurationDone = new await_notify_1.Subject();
        this.showTextualParseTree = false;
        this.showGraphicalParseTree = false;
        this.testInput = "";
        this.setDebuggerLinesStartAt1(true);
        this.setDebuggerColumnsStartAt1(false);
        this.parseTreeProvider = consumers[0];
    }
    shutdown() {
    }
    initializeRequest(response, args) {
        response.body = response.body || {};
        response.body.supportsConfigurationDoneRequest = true;
        response.body.supportsStepInTargetsRequest = true;
        this.sendResponse(response);
    }
    configurationDoneRequest(response, args) {
        super.configurationDoneRequest(response, args);
        this.configurationDone.notify();
    }
    launchRequest(response, args) {
        if (!args.input) {
            this.sendErrorResponse(response, {
                id: 1,
                format: "Could not launch debug session: no test input file specified",
            });
            return;
        }
        if (!path.isAbsolute(args.input) && this.folder) {
            args.input = path.join(this.folder.uri.fsPath, args.input);
        }
        if (!fs.existsSync(args.input)) {
            this.sendErrorResponse(response, {
                id: 1,
                format: "Could not launch debug session: test input file not found.",
            });
            return;
        }
        if (args.actionFile) {
            if (!path.isAbsolute(args.actionFile) && this.folder) {
                args.actionFile = path.join(this.folder.uri.fsPath, args.actionFile);
            }
            if (!fs.existsSync(args.actionFile)) {
                void vscode_1.window.showInformationMessage("Cannot find file for semantic predicate evaluation. No evaluation will take place.");
            }
        }
        if (!args.grammar) {
            this.sendErrorResponse(response, {
                id: 1,
                format: "Could not launch debug session: no grammar file specified (use the ${file} macro for the " +
                    "current editor).",
            });
            return;
        }
        if (path.extname(args.grammar) !== ".g4") {
            this.sendErrorResponse(response, {
                id: 1,
                format: "Could not launch debug session: " + args.grammar + " is not a grammar file",
            });
            return;
        }
        if (!path.isAbsolute(args.grammar) && this.folder) {
            args.grammar = path.join(this.folder.uri.fsPath, args.grammar);
        }
        if (!fs.existsSync(args.grammar)) {
            this.sendErrorResponse(response, {
                id: 1,
                format: "Could not launch debug session: cannot find grammar file.",
            });
            return;
        }
        if (this.backend.hasErrors(args.grammar)) {
            this.sendErrorResponse(response, {
                id: 1,
                format: "Could not launch debug session: the grammar contains issues.",
            });
            return;
        }
        try {
            this.setup(args.grammar, args.actionFile);
            for (const consumer of this.consumers) {
                consumer.debugger = this.debugger;
                consumer.refresh();
            }
            this.sendEvent(new vscode_debugadapter_1.InitializedEvent());
        }
        catch (e) {
            this.sendErrorResponse(response, { id: 1, format: "Could not prepare debug session:\n\n" + e });
            return;
        }
        this.configurationDone.wait(1000).then(() => {
            this.showTextualParseTree = args.printParseTree || false;
            this.showGraphicalParseTree = args.visualParseTree || false;
            this.testInput = args.input;
            try {
                const testInput = fs.readFileSync(args.input, { encoding: "utf8" });
                const startRuleIndex = args.startRule ? this.debugger.ruleIndexFromName(args.startRule) : 0;
                if (startRuleIndex < 0) {
                    this.sendErrorResponse(response, {
                        id: 2,
                        format: "Error while launching debug session: start rule \"" + args.startRule + "\" not found",
                    });
                    return;
                }
                this.debugger.start(startRuleIndex, testInput, args.noDebug ? true : false);
                if (this.showGraphicalParseTree) {
                    this.parseTreeProvider.showWebview(vscode_1.Uri.file(args.grammar), { title: "Parse Tree: " + path.basename(args.grammar) });
                }
            }
            catch (e) {
                this.sendErrorResponse(response, { id: 3, format: "Could not launch debug session:\n\n" + e });
                return;
            }
            this.sendResponse(response);
        });
    }
    setBreakPointsRequest(response, args) {
        this.debugger.clearBreakPoints();
        if (args.breakpoints && args.source.path) {
            const actualBreakpoints = args.breakpoints.map((sourceBreakPoint) => {
                const { validated, line, id } = this.debugger.addBreakPoint(args.source.path, this.convertDebuggerLineToClient(sourceBreakPoint.line));
                const targetBreakPoint = new vscode_debugadapter_1.Breakpoint(validated, this.convertClientLineToDebugger(line));
                targetBreakPoint.id = id;
                return targetBreakPoint;
            });
            response.body = {
                breakpoints: actualBreakpoints,
            };
        }
        this.sendResponse(response);
    }
    threadsRequest(response) {
        response.body = {
            threads: [
                new vscode_debugadapter_1.Thread(AntlrDebugSession.THREAD_ID, "Interpreter"),
            ],
        };
        this.sendResponse(response);
    }
    stackTraceRequest(response, args) {
        const startFrame = typeof args.startFrame === "number" ? args.startFrame : 0;
        const maxLevels = typeof args.levels === "number" ? args.levels : 1000;
        const stack = this.debugger.currentStackTrace;
        const frames = [];
        for (let i = startFrame; i < stack.length; ++i) {
            const entry = stack[i];
            let frame;
            if (entry.next[0]) {
                frame = new vscode_debugadapter_1.StackFrame(i, entry.name, this.createSource(entry.source), this.convertDebuggerLineToClient(entry.next[0].start.row), this.convertDebuggerColumnToClient(entry.next[0].start.column));
            }
            else {
                frame = new vscode_debugadapter_1.StackFrame(i, entry.name + " <missing next>", this.createSource(entry.source), this.convertDebuggerLineToClient(1), this.convertDebuggerColumnToClient(0));
            }
            frames.push(frame);
            if (frames.length > maxLevels) {
                break;
            }
        }
        response.body = {
            stackFrames: frames,
            totalFrames: stack.length,
        };
        this.sendResponse(response);
    }
    scopesRequest(response, args) {
        this.tokens = this.debugger.tokenList;
        this.variables = this.debugger.getVariables(args.frameId);
        const scopes = [];
        scopes.push(new vscode_debugadapter_1.Scope("Globals", VarRef.Globals, true));
        response.body = {
            scopes,
        };
        this.sendResponse(response);
    }
    variablesRequest(response, args) {
        const variables = [];
        switch (args.variablesReference) {
            case VarRef.Globals: {
                variables.push({
                    name: "Test Input",
                    type: "string",
                    value: this.testInput,
                    variablesReference: 0,
                });
                variables.push({
                    name: "Input Size",
                    type: "number",
                    value: this.debugger.inputSize.toString(),
                    variablesReference: 0,
                });
                variables.push({
                    name: "Error Count",
                    type: "number",
                    value: this.debugger.errorCount.toString(),
                    variablesReference: 0,
                });
                variables.push({
                    name: "Input Tokens",
                    value: (this.tokens.length - this.debugger.currentTokenIndex).toString(),
                    variablesReference: VarRef.Tokens,
                    indexedVariables: this.tokens.length - this.debugger.currentTokenIndex,
                });
                break;
            }
            case VarRef.Context: {
                break;
            }
            case VarRef.Tokens: {
                const start = this.debugger.currentTokenIndex + (args.start ? args.start : 0);
                const length = args.count ? args.count : this.tokens.length;
                for (let i = 0; i < length; ++i) {
                    const index = start + i;
                    variables.push({
                        name: index + ": " + this.debugger.tokenTypeName(this.tokens[index]),
                        type: "Token",
                        value: "",
                        variablesReference: VarRef.Tokens + index,
                        presentationHint: { kind: "class", attributes: ["readonly"] },
                    });
                }
                break;
            }
            default: {
                if (args.variablesReference >= VarRef.Tokens) {
                    const tokenIndex = args.variablesReference % VarRef.Tokens;
                    if (tokenIndex >= 0 && tokenIndex < this.tokens.length) {
                        const token = this.tokens[tokenIndex];
                        variables.push({
                            name: "text",
                            type: "string",
                            value: token.text ? token.text : "",
                            variablesReference: 0,
                        });
                        variables.push({
                            name: "type",
                            type: "number",
                            value: token.type + "",
                            variablesReference: 0,
                        });
                        variables.push({
                            name: "line",
                            type: "number",
                            value: token.line + "",
                            variablesReference: 0,
                        });
                        variables.push({
                            name: "offset",
                            type: "number",
                            value: token.charPositionInLine + "",
                            variablesReference: 0,
                        });
                        variables.push({
                            name: "channel",
                            type: "number",
                            value: token.channel + "",
                            variablesReference: 0,
                        });
                        variables.push({
                            name: "tokenIndex",
                            type: "number",
                            value: token.tokenIndex + "",
                            variablesReference: 0,
                        });
                        variables.push({
                            name: "startIndex",
                            type: "number",
                            value: token.startIndex + "",
                            variablesReference: 0,
                        });
                        variables.push({
                            name: "stopIndex",
                            type: "number",
                            value: token.stopIndex + "",
                            variablesReference: 0,
                        });
                    }
                }
                break;
            }
        }
        response.body = {
            variables,
        };
        this.sendResponse(response);
    }
    pauseRequest(response, args) {
        this.debugger.pause();
        this.sendResponse(response);
    }
    continueRequest(response, args) {
        this.debugger.continue();
        this.sendResponse(response);
    }
    nextRequest(response, args) {
        this.debugger.stepOver();
        this.sendResponse(response);
    }
    stepInRequest(response, args) {
        this.debugger.stepIn();
        this.sendResponse(response);
    }
    stepOutRequest(response, args) {
        this.debugger.stepOut();
        this.sendResponse(response);
    }
    evaluateRequest(response, args) {
        response.body = {
            result: "evaluation not supported",
            variablesReference: 0,
        };
        this.sendResponse(response);
    }
    setup(grammar, actionFile) {
        const basePath = path.dirname(grammar);
        this.debugger = this.backend.createDebugger(grammar, actionFile, path.join(basePath, ".antlr"));
        if (!this.debugger) {
            throw Error("Debugger creation failed. There are grammar errors.");
        }
        if (!this.debugger.isValid) {
            throw Error("Debugger creation failed. You are either trying to debug an unsupported file type or " +
                "no interpreter data has been generated yet for the given grammar.");
        }
        this.debugger.on("stopOnStep", () => {
            this.notifyConsumers(vscode_1.Uri.file(grammar));
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent("step", AntlrDebugSession.THREAD_ID));
        });
        this.debugger.on("stopOnPause", () => {
            this.notifyConsumers(vscode_1.Uri.file(grammar));
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent("pause", AntlrDebugSession.THREAD_ID));
        });
        this.debugger.on("stopOnBreakpoint", () => {
            this.notifyConsumers(vscode_1.Uri.file(grammar));
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent("breakpoint", AntlrDebugSession.THREAD_ID));
        });
        this.debugger.on("stopOnException", () => {
            this.notifyConsumers(vscode_1.Uri.file(grammar));
            this.sendEvent(new vscode_debugadapter_1.StoppedEvent("exception", AntlrDebugSession.THREAD_ID));
        });
        this.debugger.on("breakpointValidated", (bp) => {
            const breakpoint = {
                verified: bp.validated,
                id: bp.id,
            };
            this.sendEvent(new vscode_debugadapter_1.BreakpointEvent("changed", breakpoint));
        });
        this.debugger.on("output", (...args) => {
            const isError = args[4];
            const column = args[3];
            const line = args[2];
            const filePath = args[1];
            const text = args[0];
            const e = new vscode_debugadapter_1.OutputEvent(`${text}\n`);
            e.body.source = filePath ? this.createSource(filePath) : undefined;
            e.body.line = line;
            e.body.column = column;
            e.body.category = isError ? "stderr" : "stdout";
            this.sendEvent(e);
        });
        this.debugger.on("end", () => {
            this.notifyConsumers(vscode_1.Uri.file(grammar));
            if (this.showTextualParseTree) {
                let text = "";
                if (!this.tokens) {
                    this.tokens = this.debugger.tokenList;
                }
                for (const token of this.tokens) {
                    text += token.toString() + "\n";
                }
                this.sendEvent(new vscode_debugadapter_1.OutputEvent("Tokens:\n" + text + "\n"));
                const tree = this.debugger.currentParseTree;
                if (tree) {
                    const treeText = this.parseNodeToString(tree);
                    this.sendEvent(new vscode_debugadapter_1.OutputEvent("Parse Tree:\n" + treeText + "\n"));
                }
                else {
                    this.sendEvent(new vscode_debugadapter_1.OutputEvent("No Parse Tree\n"));
                }
            }
            if (this.showGraphicalParseTree) {
                this.parseTreeProvider.showWebview(vscode_1.Uri.file(grammar), {
                    title: "Parse Tree: " + path.basename(grammar),
                });
            }
            this.sendEvent(new vscode_debugadapter_1.TerminatedEvent());
        });
    }
    createSource(filePath) {
        return new vscode_debugadapter_1.Source(path.basename(filePath), this.convertDebuggerPathToClient(filePath), undefined, undefined, "antlr-data");
    }
    parseNodeToString(node, level = 0) {
        let result = " ".repeat(level);
        switch (node.type) {
            case facade_1.ParseTreeNodeType.Rule: {
                const name = this.debugger.ruleNameFromIndex(node.ruleIndex);
                result += name ? name : "<unknown rule>";
                if (node.children.length > 0) {
                    result += " (\n";
                    for (const child of node.children) {
                        result += this.parseNodeToString(child, level + 1);
                    }
                    result += " ".repeat(level) + ")\n";
                }
                break;
            }
            case facade_1.ParseTreeNodeType.Error: {
                result += " <Error>";
                if (node.symbol) {
                    result += "\"" + node.symbol.text + "\"\n";
                }
                break;
            }
            case facade_1.ParseTreeNodeType.Terminal: {
                result += "\"" + node.symbol.text + "\"\n";
                break;
            }
            default:
                break;
        }
        return result;
    }
    notifyConsumers(uri) {
        for (const consumer of this.consumers) {
            consumer.debuggerStopped(uri);
        }
    }
    escapeText(input) {
        let result = "";
        for (const c of input) {
            switch (c) {
                case "\n": {
                    result += "\\n";
                    break;
                }
                case "\r": {
                    result += "\\r";
                    break;
                }
                case "\t": {
                    result += "\\t";
                    break;
                }
                default: {
                    result += c;
                    break;
                }
            }
        }
        return result;
    }
}
exports.AntlrDebugSession = AntlrDebugSession;
AntlrDebugSession.THREAD_ID = 1;
//# sourceMappingURL=AntlrDebugAdapter.js.map