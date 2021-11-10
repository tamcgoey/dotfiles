import { Vocabulary } from "antlr4ts";
import { ParseTree } from "antlr4ts/tree";
import { Symbol } from "antlr4-c3";
import { SymbolKind, SymbolInfo, DiagnosticEntry, ReferenceNode, ATNGraphData, GenerationOptions, SentenceGenerationOptions, FormattingOptions, Definition, RuleMappings, ContextDetails } from "./facade";
import { InterpreterData } from "./InterpreterDataReader";
import { ContextSymbolTable } from "./ContextSymbolTable";
export declare enum GrammarType {
    Unknown = 0,
    Parser = 1,
    Lexer = 2,
    Combined = 3
}
export declare class SourceContext {
    fileName: string;
    private static globalSymbols;
    private static symbolToKindMap;
    symbolTable: ContextSymbolTable;
    sourceId: string;
    info: ContextDetails;
    diagnostics: DiagnosticEntry[];
    private references;
    private rrdScripts;
    private semanticAnalysisDone;
    private tokenStream;
    private parser;
    private errorListener;
    private lexerErrorListener;
    private grammarLexerData;
    private grammarLexerRuleMap;
    private grammarParserData;
    private grammarParserRuleMap;
    private tree;
    constructor(fileName: string);
    static getKindFromSymbol(symbol: Symbol): SymbolKind;
    static definitionForContext(ctx: ParseTree | undefined, keepQuotes: boolean): Definition | undefined;
    symbolAtPosition(column: number, row: number, limitToChildren: boolean): SymbolInfo | undefined;
    enclosingSymbolAtPosition(column: number, row: number, ruleScope: boolean): SymbolInfo | undefined;
    listTopLevelSymbols(includeDependencies: boolean): SymbolInfo[];
    getVocabulary(): Vocabulary | undefined;
    getRuleList(): string[] | undefined;
    getChannels(): string[] | undefined;
    getModes(): string[] | undefined;
    listActions(): SymbolInfo[];
    getCodeCompletionCandidates(column: number, row: number): SymbolInfo[];
    setText(source: string): void;
    parse(): string[];
    getDiagnostics(): DiagnosticEntry[];
    getReferenceGraph(): Map<string, ReferenceNode>;
    getRRDScript(ruleName: string): string | undefined;
    addAsReferenceTo(context: SourceContext): void;
    removeDependency(context: SourceContext): void;
    getReferenceCount(symbol: string): number;
    getAllSymbols(recursive: boolean): Set<Symbol>;
    ruleFromPosition(column: number, row: number): [string | undefined, number | undefined];
    generate(dependencies: Set<SourceContext>, options: GenerationOptions): Promise<string[]>;
    getATNGraph(rule: string): ATNGraphData | undefined;
    generateSentence(dependencies: Set<SourceContext>, options: SentenceGenerationOptions, ruleDefinitions: RuleMappings | undefined, actionFile: string | undefined): string;
    lexTestInput(input: string, actionFile?: string): [string[], string];
    parseTestInput(input: string, startRule: string, actionFile?: string): string[];
    getSymbolInfo(symbol: string | Symbol): SymbolInfo | undefined;
    resolveSymbol(symbolName: string): Symbol | undefined;
    formatGrammar(options: FormattingOptions, start: number, stop: number): [string, number, number];
    get isInterpreterDataLoaded(): boolean;
    get interpreterData(): [InterpreterData | undefined, InterpreterData | undefined];
    get hasErrors(): boolean;
    setupInterpreters(outputDir?: string): void;
    private runSemanticAnalysisIfNeeded;
    private intervalSetToStrings;
}
