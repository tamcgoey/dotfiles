import { ANTLRErrorListener, Recognizer, RecognitionException } from "antlr4ts";
import { DiagnosticEntry } from "./facade";
export declare class ContextLexerErrorListener implements ANTLRErrorListener<number> {
    private errorList;
    constructor(errorList: DiagnosticEntry[]);
    syntaxError<T extends number>(recognizer: Recognizer<T, any>, offendingSymbol: T | undefined, line: number, charPositionInLine: number, msg: string, e: RecognitionException | undefined): void;
}
