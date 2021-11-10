"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticListener = void 0;
const facade_1 = require("./facade");
const antlr4ts_1 = require("antlr4ts");
const tree_1 = require("antlr4ts/tree");
class SemanticListener {
    constructor(diagnostics, symbolTable) {
        this.diagnostics = diagnostics;
        this.symbolTable = symbolTable;
        this.seenSymbols = new Map();
        this.exitTerminalRule = (ctx) => {
            const tokenRef = ctx.TOKEN_REF();
            if (tokenRef) {
                const symbol = tokenRef.text;
                this.checkSymbolExistance(true, facade_1.SymbolGroupKind.TokenRef, symbol, "Unknown token reference", tokenRef.symbol);
                this.symbolTable.incrementSymbolRefCount(symbol);
            }
        };
        this.exitRuleref = (ctx) => {
            const ruleRef = ctx.RULE_REF();
            if (ruleRef) {
                const symbol = ruleRef.text;
                this.checkSymbolExistance(true, facade_1.SymbolGroupKind.RuleRef, symbol, "Unknown parser rule", ruleRef.symbol);
                this.symbolTable.incrementSymbolRefCount(symbol);
            }
        };
        this.exitSetElement = (ctx) => {
            const tokenRef = ctx.TOKEN_REF();
            if (tokenRef) {
                const symbol = tokenRef.text;
                this.checkSymbolExistance(true, facade_1.SymbolGroupKind.TokenRef, symbol, "Unknown token reference", tokenRef.symbol);
                this.symbolTable.incrementSymbolRefCount(symbol);
            }
        };
        this.exitLexerCommand = (ctx) => {
            const lexerCommandExpr = ctx.lexerCommandExpr();
            const lexerCommandExprId = lexerCommandExpr ? lexerCommandExpr.identifier() : undefined;
            if (lexerCommandExprId) {
                let name = ctx.lexerCommandName().text;
                let kind = facade_1.SymbolGroupKind.TokenRef;
                const value = name.toLowerCase();
                if (value === "pushmode" || value === "mode") {
                    name = "mode";
                    kind = facade_1.SymbolGroupKind.LexerMode;
                }
                else if (value === "channel") {
                    kind = facade_1.SymbolGroupKind.TokenChannel;
                }
                const symbol = lexerCommandExprId.text;
                this.checkSymbolExistance(true, kind, symbol, "Unknown " + name, lexerCommandExprId.start);
                this.symbolTable.incrementSymbolRefCount(symbol);
            }
        };
        this.exitLexerRuleSpec = (ctx) => {
            const tokenRef = ctx.TOKEN_REF();
            const name = tokenRef.text;
            const seenSymbol = this.seenSymbols.get(name);
            if (seenSymbol) {
                this.reportDuplicateSymbol(name, tokenRef.symbol, seenSymbol);
            }
            else {
                const symbol = this.symbolTable.resolve(name);
                if (symbol.root !== this.symbolTable) {
                    const start = symbol.context instanceof antlr4ts_1.ParserRuleContext ?
                        symbol.context.start : symbol.context.symbol;
                    this.reportDuplicateSymbol(name, tokenRef.symbol, symbol.context ? start : undefined);
                }
                else {
                    this.seenSymbols.set(name, tokenRef.symbol);
                }
            }
        };
        this.exitParserRuleSpec = (ctx) => {
            const ruleRef = ctx.RULE_REF();
            const name = ruleRef.text;
            const seenSymbol = this.seenSymbols.get(name);
            if (seenSymbol) {
                this.reportDuplicateSymbol(name, ruleRef.symbol, seenSymbol);
            }
            else {
                const symbol = this.symbolTable.resolve(name);
                if (symbol.root !== this.symbolTable) {
                    let start;
                    if (symbol.context instanceof antlr4ts_1.ParserRuleContext) {
                        start = symbol.context.start;
                    }
                    else if (symbol.context instanceof tree_1.TerminalNode) {
                        start = symbol.context.symbol;
                    }
                    this.reportDuplicateSymbol(name, ruleRef.symbol, start);
                }
                else {
                    this.seenSymbols.set(name, ruleRef.symbol);
                }
            }
        };
    }
    checkSymbolExistance(mustExist, kind, symbol, message, offendingToken) {
        if (this.symbolTable.symbolExistsInGroup(symbol, kind, false) !== mustExist) {
            const entry = {
                type: facade_1.DiagnosticType.Error,
                message: message + " '" + symbol + "'",
                range: {
                    start: {
                        column: offendingToken.charPositionInLine,
                        row: offendingToken.line,
                    },
                    end: {
                        column: offendingToken.charPositionInLine + offendingToken.stopIndex -
                            offendingToken.startIndex + 1,
                        row: offendingToken.line,
                    },
                },
            };
            this.diagnostics.push(entry);
        }
    }
    reportDuplicateSymbol(symbol, offendingToken, previousToken) {
        const entry = {
            type: facade_1.DiagnosticType.Error,
            message: "Duplicate symbol '" + symbol + "'",
            range: {
                start: {
                    column: offendingToken.charPositionInLine,
                    row: offendingToken.line,
                },
                end: {
                    column: offendingToken.charPositionInLine + offendingToken.stopIndex -
                        offendingToken.startIndex + 1,
                    row: offendingToken.line,
                },
            },
        };
        this.diagnostics.push(entry);
    }
}
exports.SemanticListener = SemanticListener;
//# sourceMappingURL=SemanticListener.js.map