/// <reference types="node" />
import { EventEmitter } from "events";
import { CommonToken, Token, Lexer, Parser } from "antlr4ts";
import { ParseTreeNode, LexicalRange, PredicateEvaluator } from "./facade";
import { SourceContext } from "./SourceContext";
export interface GrammarBreakPoint {
    source: string;
    validated: boolean;
    line: number;
    id: number;
}
export interface GrammarStackFrame {
    name: string;
    source: string;
    next: LexicalRange[];
}
export declare class GrammarDebugger extends EventEmitter {
    private contexts;
    predicateEvaluator?: PredicateEvaluator;
    evaluateLexerPredicate?: (lexer: Lexer, ruleIndex: number, actionIndex: number, predicate: string) => boolean;
    evaluateParserPredicate?: (parser: Parser, ruleIndex: number, actionIndex: number, predicate: string) => boolean;
    private lexerData;
    private parserData;
    private lexer;
    private tokenStream;
    private parser;
    private parseTree;
    private breakPoints;
    private nextBreakPointId;
    constructor(contexts: SourceContext[], actionFile: string);
    get isValid(): boolean;
    start(startRuleIndex: number, input: string, noDebug: boolean): void;
    continue(): void;
    stepIn(): void;
    stepOut(): void;
    stepOver(): void;
    stop(): void;
    pause(): void;
    clearBreakPoints(): void;
    addBreakPoint(path: string, line: number): GrammarBreakPoint;
    get tokenList(): Token[];
    get errorCount(): number;
    get inputSize(): number;
    ruleNameFromIndex(ruleIndex: number): string | undefined;
    ruleIndexFromName(ruleName: string): number;
    get currentParseTree(): ParseTreeNode | undefined;
    get currentStackTrace(): GrammarStackFrame[];
    get currentTokenIndex(): number;
    getStackInfo(index: number): string;
    getVariables(index: number): Array<[string, string]>;
    tokenTypeName(token: CommonToken): string;
    private sendEvent;
    private parseContextToNode;
    private computeHash;
    private convertToken;
    private validateBreakPoint;
}
