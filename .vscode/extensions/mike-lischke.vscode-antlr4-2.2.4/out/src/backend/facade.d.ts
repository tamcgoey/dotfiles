import { ATNStateType, TransitionType } from "antlr4ts/atn";
import { Vocabulary, Lexer, Parser } from "antlr4ts";
export declare enum SymbolGroupKind {
    TokenRef = 0,
    RuleRef = 1,
    LexerMode = 2,
    TokenChannel = 3
}
export declare enum SymbolKind {
    Keyword = 0,
    TokenVocab = 1,
    Import = 2,
    BuiltInLexerToken = 3,
    VirtualLexerToken = 4,
    FragmentLexerToken = 5,
    LexerRule = 6,
    BuiltInMode = 7,
    LexerMode = 8,
    BuiltInChannel = 9,
    TokenChannel = 10,
    ParserRule = 11,
    Action = 12,
    Predicate = 13,
    Operator = 14,
    Option = 15,
    TokenReference = 16,
    RuleReference = 17
}
import { SourceContext, GrammarType } from "./SourceContext";
import { GrammarDebugger } from "./GrammarDebugger";
export interface LexicalRange {
    start: {
        column: number;
        row: number;
    };
    end: {
        column: number;
        row: number;
    };
}
export interface Definition {
    text: string;
    range: LexicalRange;
}
export interface SymbolInfo {
    kind: SymbolKind;
    name: string;
    source: string;
    definition?: Definition;
    description?: string;
    isPredicate?: boolean;
}
export declare enum DiagnosticType {
    Hint = 0,
    Info = 1,
    Warning = 2,
    Error = 3
}
export interface DiagnosticEntry {
    type: DiagnosticType;
    message: string;
    range: LexicalRange;
}
export interface LexerToken {
    [key: string]: string | number | object;
    text: string;
    type: number;
    name: string;
    line: number;
    offset: number;
    channel: number;
    tokenIndex: number;
    startIndex: number;
    stopIndex: number;
}
export declare enum ParseTreeNodeType {
    Rule = 0,
    Terminal = 1,
    Error = 2
}
export interface IndexRange {
    startIndex: number;
    stopIndex: number;
    length: number;
}
export interface ParseTreeNode {
    type: ParseTreeNodeType;
    id: number;
    ruleIndex?: number;
    name: string;
    start?: LexerToken;
    stop?: LexerToken;
    range?: IndexRange;
    symbol?: LexerToken;
    children: ParseTreeNode[];
}
export interface ReferenceNode {
    kind: SymbolKind;
    rules: Set<string>;
    tokens: Set<string>;
    literals: Set<string>;
}
export interface ATNNode {
    [key: string]: any;
    id: number;
    name: string;
    type: ATNStateType;
}
export interface ATNGraphData {
    nodes: ATNNode[];
    links: Array<{
        source: number;
        target: number;
        type: TransitionType;
        labels: string[];
    }>;
}
export interface GenerationOptions {
    baseDir?: string;
    libDir?: string;
    outputDir?: string;
    package?: string;
    language?: string;
    listeners?: boolean;
    visitors?: boolean;
    loadOnly?: boolean;
    alternativeJar?: string;
    additionalParameters?: string;
}
export interface SentenceGenerationOptions {
    startRule: string;
    convergenceFactor?: number;
    minParserIterations?: number;
    maxParserIterations?: number;
    minLexerIterations?: number;
    maxLexerIterations?: number;
    maxRecursions?: number;
}
export declare type RuleMappings = Map<string, string>;
export interface FormattingOptions {
    [key: string]: boolean | number | string | undefined;
    alignTrailingComments?: boolean;
    allowShortBlocksOnASingleLine?: boolean;
    breakBeforeBraces?: boolean;
    columnLimit?: number;
    continuationIndentWidth?: number;
    indentWidth?: number;
    keepEmptyLinesAtTheStartOfBlocks?: boolean;
    maxEmptyLinesToKeep?: number;
    reflowComments?: boolean;
    spaceBeforeAssignmentOperators?: boolean;
    tabWidth?: number;
    useTab?: boolean;
    alignColons?: "none" | "trailing" | "hanging";
    singleLineOverrulesHangingColon?: boolean;
    allowShortRulesOnASingleLine?: boolean;
    alignSemicolons?: "none" | "ownLine" | "hanging";
    breakBeforeParens?: boolean;
    ruleInternalsOnSingleLine?: boolean;
    minEmptyLines?: number;
    groupedAlignments?: boolean;
    alignFirstTokens?: boolean;
    alignLexerCommands?: boolean;
    alignActions?: boolean;
    alignLabels?: boolean;
    alignTrailers?: boolean;
}
export interface PredicateEvaluator {
    evaluateLexerPredicate(recognizer: Lexer | undefined, ruleIndex: number, actionIndex: number, predicate: string): boolean;
    evaluateParserPredicate(recognizer: Parser | undefined, ruleIndex: number, actionIndex: number, predicate: string): boolean;
}
export interface ContextDetails {
    type: GrammarType;
    unreferencedRules: string[];
    imports: string[];
}
export interface SelfDiagnostics {
    contextCount: number;
}
export declare class AntlrFacade {
    private importDir;
    private sourceContexts;
    constructor(importDir: string);
    getSelfDiagnostics(): SelfDiagnostics;
    getContext(fileName: string, source?: string | undefined): SourceContext;
    setText(fileName: string, source: string): void;
    reparse(fileName: string): void;
    loadGrammar(fileName: string, source?: string): SourceContext;
    releaseGrammar(fileName: string): void;
    symbolInfoAtPosition(fileName: string, column: number, row: number, limitToChildren?: boolean): SymbolInfo | undefined;
    infoForSymbol(fileName: string, symbol: string): SymbolInfo | undefined;
    enclosingSymbolAtPosition(fileName: string, column: number, row: number, ruleScope?: boolean): SymbolInfo | undefined;
    listTopLevelSymbols(fileName: string, fullList: boolean): SymbolInfo[];
    getLexerVocabulary(fileName: string): Vocabulary | undefined;
    getRuleList(fileName: string): string[] | undefined;
    getChannels(fileName: string): string[] | undefined;
    getModes(fileName: string): string[] | undefined;
    listActions(fileName: string): SymbolInfo[];
    getCodeCompletionCandidates(fileName: string, column: number, row: number): SymbolInfo[];
    getDiagnostics(fileName: string): DiagnosticEntry[];
    ruleFromPosition(fileName: string, column: number, row: number): [string | undefined, number | undefined];
    countReferences(fileName: string, symbol: string): number;
    getSymbolOccurences(fileName: string, symbolName: string): SymbolInfo[];
    getDependencies(fileName: string): string[];
    getReferenceGraph(fileName: string): Map<string, ReferenceNode>;
    getRRDScript(fileName: string, rule: string): string;
    generate(fileName: string, options: GenerationOptions): Promise<string[]>;
    getATNGraph(fileName: string, rule: string): ATNGraphData | undefined;
    generateSentence(fileName: string, options: SentenceGenerationOptions, ruleDefinitions: RuleMappings | undefined, actionFile: string | undefined): string;
    lexTestInput(fileName: string, input: string, actionFile?: string): [string[], string];
    parseTestInput(fileName: string, input: string, startRule: string, actionFile?: string): string[];
    formatGrammar(fileName: string, options: FormattingOptions, start: number, stop: number): [string, number, number];
    hasErrors(fileName: string): boolean;
    createDebugger(fileName: string, actionFile: string, dataDir: string): GrammarDebugger | undefined;
    getContextDetails(fileName: string): ContextDetails;
    private loadDependency;
    private parseGrammar;
    private internalReleaseGrammar;
    private pushDependencyFiles;
}
