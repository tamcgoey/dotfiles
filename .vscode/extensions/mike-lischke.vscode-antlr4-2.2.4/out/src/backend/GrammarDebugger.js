"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrammarDebugger = void 0;
const events_1 = require("events");
const antlr4ts_1 = require("antlr4ts");
const tree_1 = require("antlr4ts/tree");
const antlr4_c3_1 = require("antlr4-c3");
const facade_1 = require("./facade");
const ContextSymbolTable_1 = require("./ContextSymbolTable");
const GrammarInterpreters_1 = require("./GrammarInterpreters");
const vm = require("vm");
const fs = require("fs");
class GrammarDebugger extends events_1.EventEmitter {
    constructor(contexts, actionFile) {
        super();
        this.contexts = contexts;
        this.breakPoints = new Map();
        this.nextBreakPointId = 0;
        if (this.contexts.length === 0) {
            return;
        }
        if (actionFile) {
            const code = fs.readFileSync(actionFile, { encoding: "utf-8" });
            this.predicateEvaluator = vm.runInThisContext(code);
        }
        if (this.isValid) {
            let lexerName = "";
            for (const context of this.contexts) {
                const [lexerData, parserData] = context.interpreterData;
                if (!this.lexerData && lexerData) {
                    this.lexerData = lexerData;
                    lexerName = context.fileName;
                }
                if (!this.parserData && parserData) {
                    this.parserData = parserData;
                }
            }
            const eventSink = (event, ...args) => {
                setImmediate((_) => this.emit(event, args));
            };
            if (this.lexerData) {
                const stream = antlr4ts_1.CharStreams.fromString("");
                this.lexer = new GrammarInterpreters_1.GrammarLexerInterpreter(this.predicateEvaluator, this.contexts[0], lexerName, this.lexerData, stream);
                this.lexer.removeErrorListeners();
                this.lexer.addErrorListener(new GrammarInterpreters_1.InterpreterLexerErrorListener(eventSink));
                this.tokenStream = new antlr4ts_1.CommonTokenStream(this.lexer);
            }
            if (this.parserData) {
                this.parser = new GrammarInterpreters_1.GrammarParserInterpreter(eventSink, this.predicateEvaluator, this.contexts[0], this.parserData, this.tokenStream);
                this.parser.buildParseTree = true;
                this.parser.removeErrorListeners();
                this.parser.addErrorListener(new GrammarInterpreters_1.InterpreterParserErrorListener(eventSink));
            }
        }
    }
    get isValid() {
        return this.contexts.find((context) => !context.isInterpreterDataLoaded) === undefined;
    }
    start(startRuleIndex, input, noDebug) {
        const stream = antlr4ts_1.CharStreams.fromString(input);
        this.lexer.inputStream = stream;
        if (!this.parser) {
            this.sendEvent("end");
            return;
        }
        this.parseTree = undefined;
        this.parser.breakPoints.clear();
        if (noDebug) {
            void this.parser.setProfile(false).then(() => {
                this.parseTree = this.parser.parse(startRuleIndex);
                this.sendEvent("end");
            });
        }
        else {
            for (const bp of this.breakPoints) {
                this.validateBreakPoint(bp[1]);
            }
            this.parser.start(startRuleIndex);
            this.continue();
        }
    }
    continue() {
        if (this.parser) {
            this.parseTree = this.parser.continue(GrammarInterpreters_1.RunMode.Normal);
        }
    }
    stepIn() {
        if (this.parser) {
            this.parseTree = this.parser.continue(GrammarInterpreters_1.RunMode.StepIn);
        }
    }
    stepOut() {
        if (this.parser) {
            this.parseTree = this.parser.continue(GrammarInterpreters_1.RunMode.StepOut);
        }
    }
    stepOver() {
        if (this.parser) {
            this.parseTree = this.parser.continue(GrammarInterpreters_1.RunMode.StepOver);
        }
    }
    stop() {
    }
    pause() {
    }
    clearBreakPoints() {
        this.breakPoints.clear();
        if (this.parser) {
            this.parser.breakPoints.clear();
        }
    }
    addBreakPoint(path, line) {
        const breakPoint = { source: path, validated: false, line, id: this.nextBreakPointId++ };
        this.breakPoints.set(breakPoint.id, breakPoint);
        this.validateBreakPoint(breakPoint);
        return breakPoint;
    }
    get tokenList() {
        this.tokenStream.fill();
        return this.tokenStream.getTokens();
    }
    get errorCount() {
        if (!this.parser) {
            return 0;
        }
        return this.parser.numberOfSyntaxErrors;
    }
    get inputSize() {
        if (!this.parser) {
            return 0;
        }
        return this.parser.inputStream.size;
    }
    ruleNameFromIndex(ruleIndex) {
        if (!this.parser) {
            return;
        }
        if (ruleIndex < 0 || ruleIndex >= this.parser.ruleNames.length) {
            return;
        }
        return this.parser.ruleNames[ruleIndex];
    }
    ruleIndexFromName(ruleName) {
        if (!this.parser) {
            return -1;
        }
        return this.parser.ruleNames.findIndex((entry) => entry === ruleName);
    }
    get currentParseTree() {
        if (!this.parseTree) {
            return undefined;
        }
        return this.parseContextToNode(this.parseTree);
    }
    get currentStackTrace() {
        const result = [];
        if (this.parser) {
            for (const frame of this.parser.callStack) {
                const externalFrame = {
                    name: frame.name,
                    source: frame.source,
                    next: [],
                };
                for (const next of frame.next) {
                    if (next.context instanceof antlr4ts_1.ParserRuleContext) {
                        const start = next.context.start;
                        const stop = next.context.stop;
                        externalFrame.next.push({
                            start: { column: start.charPositionInLine, row: start.line },
                            end: { column: stop ? stop.charPositionInLine : 0, row: stop ? stop.line : start.line },
                        });
                    }
                    else {
                        const terminal = next.context.symbol;
                        const length = terminal.stopIndex - terminal.startIndex + 1;
                        externalFrame.next.push({
                            start: { column: terminal.charPositionInLine, row: terminal.line },
                            end: { column: terminal.charPositionInLine + length, row: terminal.line },
                        });
                    }
                }
                result.push(externalFrame);
            }
        }
        return result.reverse();
    }
    get currentTokenIndex() {
        return this.tokenStream.index;
    }
    getStackInfo(index) {
        if (!this.parser || index < 0 || index > this.parser.callStack.length) {
            return "Invalid Stack Frame";
        }
        const frame = this.parser.callStack[this.parser.callStack.length - index - 1];
        return "Context " + frame.name;
    }
    getVariables(index) {
        const result = [];
        if (!this.parser || index < 0 || index > this.parser.callStack.length) {
            return [];
        }
        const frame = this.parser.callStack[this.parser.callStack.length - index - 1];
        let run = frame.current[0];
        while (run && !(run instanceof ContextSymbolTable_1.RuleSymbol)) {
            run = run.parent;
        }
        if (run) {
            let context = this.parser.context;
            while (index-- > 0) {
                context = context.parent;
            }
            const symbols = run.getNestedSymbolsOfType(antlr4_c3_1.VariableSymbol);
            const variables = new Set();
            for (const symbol of symbols) {
                variables.add(symbol.name);
            }
        }
        return result;
    }
    tokenTypeName(token) {
        return this.lexer.vocabulary.getSymbolicName(token.type) || "T__" + token.type;
    }
    sendEvent(event, ...args) {
        setImmediate((_) => {
            this.emit(event, ...args);
        });
    }
    parseContextToNode(tree) {
        if (tree instanceof antlr4ts_1.ParserRuleContext) {
            const children = [];
            if (tree.children) {
                for (const child of tree.children) {
                    if ((child instanceof tree_1.TerminalNode) && (child.symbol.type === antlr4ts_1.Token.EOF)) {
                        continue;
                    }
                    children.push(this.parseContextToNode(child));
                }
            }
            return {
                type: facade_1.ParseTreeNodeType.Rule,
                ruleIndex: tree.ruleIndex,
                name: this.parser.ruleNames[tree.ruleIndex],
                start: this.convertToken(tree.start),
                stop: this.convertToken(tree.stop),
                id: this.computeHash(tree),
                range: {
                    startIndex: tree.sourceInterval.a,
                    stopIndex: tree.sourceInterval.b,
                    length: tree.sourceInterval.length,
                },
                children,
            };
        }
        else if (tree instanceof tree_1.ErrorNode) {
            const symbol = this.convertToken(tree.symbol);
            return {
                type: facade_1.ParseTreeNodeType.Error,
                symbol,
                id: this.computeHash(tree.symbol),
                name: symbol ? symbol.name : "<no name>",
                children: [],
            };
        }
        else {
            const token = tree.symbol;
            const symbol = this.convertToken(tree.symbol);
            return {
                type: facade_1.ParseTreeNodeType.Terminal,
                symbol,
                id: this.computeHash(token),
                name: symbol ? symbol.name : "<no name>",
                children: [],
            };
        }
    }
    computeHash(input) {
        let hash = 0;
        if (input instanceof antlr4ts_1.ParserRuleContext) {
            hash = (31 * hash) + input.start.inputStream.size;
            if (input.parent) {
                hash = (31 * hash) + input.parent.children.findIndex((element) => element === input);
            }
            hash = (31 * hash) + input.depth();
            hash = (31 * hash) + input.ruleIndex;
            hash = (31 * hash) + input.start.type >>> 0;
            hash = (31 * hash) + input.start.tokenIndex >>> 0;
            hash = (31 * hash) + input.start.channel >>> 0;
        }
        else if (input instanceof antlr4ts_1.CommonToken) {
            hash = (31 * hash) + input.tokenIndex >>> 0;
            hash = (31 * hash) + input.type >>> 0;
            hash = (31 * hash) + input.channel >>> 0;
        }
        return hash;
    }
    convertToken(token) {
        if (!token) {
            return;
        }
        return {
            text: token.text ? token.text : "",
            type: token.type,
            name: this.tokenTypeName(token),
            line: token.line,
            offset: token.charPositionInLine,
            channel: token.channel,
            tokenIndex: token.tokenIndex,
            startIndex: token.startIndex,
            stopIndex: token.stopIndex,
        };
    }
    validateBreakPoint(breakPoint) {
        const context = this.contexts.find((entry) => entry.fileName === breakPoint.source);
        if (!context || !this.parserData) {
            return;
        }
        const rule = context.enclosingSymbolAtPosition(0, breakPoint.line, true);
        if (rule) {
            breakPoint.validated = true;
            const index = this.ruleIndexFromName(rule.name);
            if (breakPoint.line === rule.definition.range.end.row) {
                const stop = this.parserData.atn.ruleToStopState[index];
                this.parser.breakPoints.add(stop);
            }
            else {
                const start = this.parserData.atn.ruleToStartState[index];
                this.parser.breakPoints.add(start);
                breakPoint.line = rule.definition.range.start.row;
            }
            this.sendEvent("breakpointValidated", breakPoint);
        }
    }
}
exports.GrammarDebugger = GrammarDebugger;
//# sourceMappingURL=GrammarDebugger.js.map