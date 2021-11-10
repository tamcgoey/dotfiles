"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntlrFacade = exports.ParseTreeNodeType = exports.DiagnosticType = exports.SymbolKind = exports.SymbolGroupKind = void 0;
const fs = require("fs");
const path = require("path");
var SymbolGroupKind;
(function (SymbolGroupKind) {
    SymbolGroupKind[SymbolGroupKind["TokenRef"] = 0] = "TokenRef";
    SymbolGroupKind[SymbolGroupKind["RuleRef"] = 1] = "RuleRef";
    SymbolGroupKind[SymbolGroupKind["LexerMode"] = 2] = "LexerMode";
    SymbolGroupKind[SymbolGroupKind["TokenChannel"] = 3] = "TokenChannel";
})(SymbolGroupKind = exports.SymbolGroupKind || (exports.SymbolGroupKind = {}));
var SymbolKind;
(function (SymbolKind) {
    SymbolKind[SymbolKind["Keyword"] = 0] = "Keyword";
    SymbolKind[SymbolKind["TokenVocab"] = 1] = "TokenVocab";
    SymbolKind[SymbolKind["Import"] = 2] = "Import";
    SymbolKind[SymbolKind["BuiltInLexerToken"] = 3] = "BuiltInLexerToken";
    SymbolKind[SymbolKind["VirtualLexerToken"] = 4] = "VirtualLexerToken";
    SymbolKind[SymbolKind["FragmentLexerToken"] = 5] = "FragmentLexerToken";
    SymbolKind[SymbolKind["LexerRule"] = 6] = "LexerRule";
    SymbolKind[SymbolKind["BuiltInMode"] = 7] = "BuiltInMode";
    SymbolKind[SymbolKind["LexerMode"] = 8] = "LexerMode";
    SymbolKind[SymbolKind["BuiltInChannel"] = 9] = "BuiltInChannel";
    SymbolKind[SymbolKind["TokenChannel"] = 10] = "TokenChannel";
    SymbolKind[SymbolKind["ParserRule"] = 11] = "ParserRule";
    SymbolKind[SymbolKind["Action"] = 12] = "Action";
    SymbolKind[SymbolKind["Predicate"] = 13] = "Predicate";
    SymbolKind[SymbolKind["Operator"] = 14] = "Operator";
    SymbolKind[SymbolKind["Option"] = 15] = "Option";
    SymbolKind[SymbolKind["TokenReference"] = 16] = "TokenReference";
    SymbolKind[SymbolKind["RuleReference"] = 17] = "RuleReference";
})(SymbolKind = exports.SymbolKind || (exports.SymbolKind = {}));
const SourceContext_1 = require("./SourceContext");
const GrammarDebugger_1 = require("./GrammarDebugger");
var DiagnosticType;
(function (DiagnosticType) {
    DiagnosticType[DiagnosticType["Hint"] = 0] = "Hint";
    DiagnosticType[DiagnosticType["Info"] = 1] = "Info";
    DiagnosticType[DiagnosticType["Warning"] = 2] = "Warning";
    DiagnosticType[DiagnosticType["Error"] = 3] = "Error";
})(DiagnosticType = exports.DiagnosticType || (exports.DiagnosticType = {}));
var ParseTreeNodeType;
(function (ParseTreeNodeType) {
    ParseTreeNodeType[ParseTreeNodeType["Rule"] = 0] = "Rule";
    ParseTreeNodeType[ParseTreeNodeType["Terminal"] = 1] = "Terminal";
    ParseTreeNodeType[ParseTreeNodeType["Error"] = 2] = "Error";
})(ParseTreeNodeType = exports.ParseTreeNodeType || (exports.ParseTreeNodeType = {}));
class AntlrFacade {
    constructor(importDir) {
        this.importDir = importDir;
        this.sourceContexts = new Map();
    }
    getSelfDiagnostics() {
        return {
            contextCount: this.sourceContexts.keys.length,
        };
    }
    getContext(fileName, source) {
        const contextEntry = this.sourceContexts.get(fileName);
        if (!contextEntry) {
            return this.loadGrammar(fileName, source);
        }
        return contextEntry.context;
    }
    setText(fileName, source) {
        const contextEntry = this.sourceContexts.get(fileName);
        if (contextEntry) {
            contextEntry.context.setText(source);
        }
    }
    reparse(fileName) {
        const contextEntry = this.sourceContexts.get(fileName);
        if (contextEntry) {
            this.parseGrammar(contextEntry);
        }
    }
    loadGrammar(fileName, source) {
        let contextEntry = this.sourceContexts.get(fileName);
        if (!contextEntry) {
            if (!source) {
                try {
                    fs.statSync(fileName);
                    source = fs.readFileSync(fileName, "utf8");
                }
                catch (e) {
                    source = "";
                }
            }
            const context = new SourceContext_1.SourceContext(fileName);
            contextEntry = { context, refCount: 0, dependencies: [], grammar: fileName };
            this.sourceContexts.set(fileName, contextEntry);
            context.setText(source);
            this.parseGrammar(contextEntry);
        }
        contextEntry.refCount++;
        return contextEntry.context;
    }
    releaseGrammar(fileName) {
        this.internalReleaseGrammar(fileName);
    }
    symbolInfoAtPosition(fileName, column, row, limitToChildren = true) {
        const context = this.getContext(fileName);
        return context.symbolAtPosition(column, row, limitToChildren);
    }
    infoForSymbol(fileName, symbol) {
        const context = this.getContext(fileName);
        return context.getSymbolInfo(symbol);
    }
    enclosingSymbolAtPosition(fileName, column, row, ruleScope = false) {
        const context = this.getContext(fileName);
        return context.enclosingSymbolAtPosition(column, row, ruleScope);
    }
    listTopLevelSymbols(fileName, fullList) {
        const context = this.getContext(fileName);
        return context.listTopLevelSymbols(!fullList);
    }
    getLexerVocabulary(fileName) {
        const context = this.getContext(fileName);
        return context.getVocabulary();
    }
    getRuleList(fileName) {
        const context = this.getContext(fileName);
        return context.getRuleList();
    }
    getChannels(fileName) {
        const context = this.getContext(fileName);
        return context.getChannels();
    }
    getModes(fileName) {
        const context = this.getContext(fileName);
        return context.getModes();
    }
    listActions(fileName) {
        const context = this.getContext(fileName);
        return context.listActions();
    }
    getCodeCompletionCandidates(fileName, column, row) {
        const context = this.getContext(fileName);
        return context.getCodeCompletionCandidates(column, row);
    }
    getDiagnostics(fileName) {
        const context = this.getContext(fileName);
        return context.getDiagnostics();
    }
    ruleFromPosition(fileName, column, row) {
        const context = this.getContext(fileName);
        return context.ruleFromPosition(column, row);
    }
    countReferences(fileName, symbol) {
        const context = this.getContext(fileName);
        return context.getReferenceCount(symbol);
    }
    getSymbolOccurences(fileName, symbolName) {
        const context = this.getContext(fileName);
        const result = context.symbolTable.getSymbolOccurences(symbolName, false);
        return result.sort((lhs, rhs) => lhs.kind - rhs.kind);
    }
    getDependencies(fileName) {
        const entry = this.sourceContexts.get(fileName);
        if (!entry) {
            return [];
        }
        const dependencies = new Set();
        this.pushDependencyFiles(entry, dependencies);
        const result = [];
        for (const dep of dependencies) {
            result.push(dep.fileName);
        }
        return result;
    }
    getReferenceGraph(fileName) {
        const context = this.getContext(fileName);
        return context.getReferenceGraph();
    }
    getRRDScript(fileName, rule) {
        const context = this.getContext(fileName);
        return context.getRRDScript(rule) || "";
    }
    generate(fileName, options) {
        const context = this.getContext(fileName);
        const dependencies = new Set();
        this.pushDependencyFiles(this.sourceContexts.get(fileName), dependencies);
        return context.generate(dependencies, options);
    }
    getATNGraph(fileName, rule) {
        const context = this.getContext(fileName);
        return context.getATNGraph(rule);
    }
    generateSentence(fileName, options, ruleDefinitions, actionFile) {
        const context = this.getContext(fileName);
        const dependencies = new Set();
        this.pushDependencyFiles(this.sourceContexts.get(fileName), dependencies);
        const basePath = path.dirname(fileName);
        for (const dependency of dependencies) {
            if (dependency.hasErrors) {
                return "[Fix grammar errors first]";
            }
            if (!dependency.isInterpreterDataLoaded) {
                dependency.setupInterpreters(path.join(basePath, ".antlr"));
            }
        }
        return context.generateSentence(dependencies, options, ruleDefinitions, actionFile);
    }
    lexTestInput(fileName, input, actionFile) {
        const context = this.getContext(fileName);
        return context.lexTestInput(input, actionFile);
    }
    parseTestInput(fileName, input, startRule, actionFile) {
        const context = this.getContext(fileName);
        return context.parseTestInput(input, startRule, actionFile);
    }
    formatGrammar(fileName, options, start, stop) {
        const context = this.getContext(fileName);
        return context.formatGrammar(options, start, stop);
    }
    hasErrors(fileName) {
        const context = this.getContext(fileName);
        return context.hasErrors;
    }
    createDebugger(fileName, actionFile, dataDir) {
        const context = this.getContext(fileName);
        if (!context) {
            return;
        }
        const contexts = new Set();
        contexts.add(context);
        this.pushDependencyFiles(this.sourceContexts.get(fileName), contexts);
        for (const dependency of contexts) {
            if (dependency.hasErrors) {
                return;
            }
            if (!dependency.isInterpreterDataLoaded) {
                dependency.setupInterpreters(dataDir);
            }
        }
        return new GrammarDebugger_1.GrammarDebugger([...contexts], actionFile);
    }
    getContextDetails(fileName) {
        const context = this.getContext(fileName);
        return context.info;
    }
    loadDependency(contextEntry, depName) {
        const basePath = path.dirname(contextEntry.grammar);
        const fullPath = path.isAbsolute(this.importDir) ? this.importDir : path.join(basePath, this.importDir);
        try {
            const depPath = path.join(fullPath, depName + ".g4");
            fs.accessSync(depPath, fs.constants.R_OK);
            contextEntry.dependencies.push(depPath);
            return this.loadGrammar(depPath);
        }
        catch (e) {
        }
        try {
            const depPath = path.join(fullPath, depName + ".g");
            fs.accessSync(depPath, fs.constants.R_OK);
            contextEntry.dependencies.push(depPath);
            return this.loadGrammar(depPath);
        }
        catch (e) {
        }
        try {
            const depPath = path.join(basePath, depName + ".g4");
            fs.statSync(depPath);
            contextEntry.dependencies.push(depPath);
            return this.loadGrammar(depPath);
        }
        catch (e) {
        }
        try {
            const depPath = path.join(basePath, depName + ".g");
            fs.statSync(depPath);
            contextEntry.dependencies.push(depPath);
            return this.loadGrammar(depPath);
        }
        catch (e) {
        }
        return undefined;
    }
    parseGrammar(contextEntry) {
        const oldDependencies = contextEntry.dependencies;
        contextEntry.dependencies = [];
        const newDependencies = contextEntry.context.parse();
        for (const dep of newDependencies) {
            const depContext = this.loadDependency(contextEntry, dep);
            if (depContext) {
                contextEntry.context.addAsReferenceTo(depContext);
            }
        }
        for (const dep of oldDependencies) {
            this.releaseGrammar(dep);
        }
    }
    internalReleaseGrammar(fileName, referencing) {
        const contextEntry = this.sourceContexts.get(fileName);
        if (contextEntry) {
            if (referencing) {
                referencing.context.removeDependency(contextEntry.context);
            }
            contextEntry.refCount--;
            if (contextEntry.refCount === 0) {
                this.sourceContexts.delete(fileName);
                for (const dep of contextEntry.dependencies) {
                    this.internalReleaseGrammar(dep, contextEntry);
                }
            }
        }
    }
    pushDependencyFiles(entry, contexts) {
        for (const dep of entry.dependencies) {
            const depEntry = this.sourceContexts.get(dep);
            if (depEntry) {
                this.pushDependencyFiles(depEntry, contexts);
                contexts.add(depEntry.context);
            }
        }
    }
}
exports.AntlrFacade = AntlrFacade;
//# sourceMappingURL=facade.js.map