"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredicateMarkerSymbol = exports.ActionSymbol = exports.OperatorSymbol = exports.ArgumentSymbol = exports.OptionsSymbol = exports.EbnfSuffixSymbol = exports.AlternativeSymbol = exports.RuleReferenceSymbol = exports.RuleSymbol = exports.TokenChannelSymbol = exports.BuiltInChannelSymbol = exports.LexerModeSymbol = exports.BuiltInModeSymbol = exports.TokenReferenceSymbol = exports.TokenSymbol = exports.FragmentTokenSymbol = exports.VirtualTokenSymbol = exports.BuiltInTokenSymbol = exports.ImportSymbol = exports.OptionSymbol = exports.ContextSymbolTable = void 0;
const antlr4_c3_1 = require("antlr4-c3");
const facade_1 = require("../backend/facade");
const SourceContext_1 = require("./SourceContext");
class ContextSymbolTable extends antlr4_c3_1.SymbolTable {
    constructor(name, options, owner) {
        super(name, options);
        this.owner = owner;
        this.symbolReferences = new Map();
    }
    clear() {
        if (this.owner) {
            for (const dep of this.dependencies) {
                if (dep.owner) {
                    this.owner.removeDependency(dep.owner);
                }
            }
        }
        this.symbolReferences.clear();
        super.clear();
    }
    symbolExists(name, kind, localOnly) {
        return this.getSymbolOfType(name, kind, localOnly) !== undefined;
    }
    symbolExistsInGroup(symbol, kind, localOnly) {
        switch (kind) {
            case facade_1.SymbolGroupKind.TokenRef: {
                if (this.symbolExists(symbol, facade_1.SymbolKind.BuiltInLexerToken, localOnly)) {
                    return true;
                }
                if (this.symbolExists(symbol, facade_1.SymbolKind.VirtualLexerToken, localOnly)) {
                    return true;
                }
                if (this.symbolExists(symbol, facade_1.SymbolKind.FragmentLexerToken, localOnly)) {
                    return true;
                }
                if (this.symbolExists(symbol, facade_1.SymbolKind.LexerRule, localOnly)) {
                    return true;
                }
                break;
            }
            case facade_1.SymbolGroupKind.LexerMode: {
                if (this.symbolExists(symbol, facade_1.SymbolKind.BuiltInMode, localOnly)) {
                    return true;
                }
                if (this.symbolExists(symbol, facade_1.SymbolKind.LexerMode, localOnly)) {
                    return true;
                }
                break;
            }
            case facade_1.SymbolGroupKind.TokenChannel: {
                if (this.symbolExists(symbol, facade_1.SymbolKind.BuiltInChannel, localOnly)) {
                    return true;
                }
                if (this.symbolExists(symbol, facade_1.SymbolKind.TokenChannel, localOnly)) {
                    return true;
                }
                break;
            }
            case facade_1.SymbolGroupKind.RuleRef: {
                if (this.symbolExists(symbol, facade_1.SymbolKind.ParserRule, localOnly)) {
                    return true;
                }
                break;
            }
            default: {
                break;
            }
        }
        return false;
    }
    contextForSymbol(symbolName, kind, localOnly) {
        const symbol = this.getSymbolOfType(symbolName, kind, localOnly);
        if (!symbol) {
            return undefined;
        }
        return symbol.context;
    }
    getSymbolInfo(symbol) {
        if (!(symbol instanceof antlr4_c3_1.Symbol)) {
            const temp = this.resolve(symbol);
            if (!temp) {
                return undefined;
            }
            symbol = temp;
        }
        const kind = SourceContext_1.SourceContext.getKindFromSymbol(symbol);
        const name = (symbol).name;
        if (kind === facade_1.SymbolKind.TokenVocab || kind === facade_1.SymbolKind.Import) {
            this.dependencies.forEach((table) => {
                if (table.owner && table.owner.sourceId.includes(name)) {
                    return {
                        kind,
                        name,
                        source: table.owner.fileName,
                        definition: SourceContext_1.SourceContext.definitionForContext(table.tree, true),
                    };
                }
            });
        }
        const symbolTable = symbol.symbolTable;
        return {
            kind,
            name,
            source: (symbol.context && symbolTable && symbolTable.owner) ? symbolTable.owner.fileName : "ANTLR runtime",
            definition: SourceContext_1.SourceContext.definitionForContext(symbol.context, true),
            description: undefined,
        };
    }
    listTopLevelSymbols(localOnly) {
        const result = [];
        const options = this.resolve("options", true);
        if (options) {
            const tokenVocab = options.resolve("tokenVocab", true);
            if (tokenVocab) {
                result.push(this.getSymbolInfo(tokenVocab));
            }
        }
        result.push(...this.symbolsOfType(ImportSymbol, localOnly));
        result.push(...this.symbolsOfType(BuiltInTokenSymbol, localOnly));
        result.push(...this.symbolsOfType(VirtualTokenSymbol, localOnly));
        result.push(...this.symbolsOfType(FragmentTokenSymbol, localOnly));
        result.push(...this.symbolsOfType(TokenSymbol, localOnly));
        result.push(...this.symbolsOfType(BuiltInModeSymbol, localOnly));
        result.push(...this.symbolsOfType(LexerModeSymbol, localOnly));
        result.push(...this.symbolsOfType(BuiltInChannelSymbol, localOnly));
        result.push(...this.symbolsOfType(TokenChannelSymbol, localOnly));
        result.push(...this.symbolsOfType(RuleSymbol, localOnly));
        return result;
    }
    listActions() {
        const result = [];
        const actions = this.getNestedSymbolsOfType(ActionSymbol);
        for (const action of actions) {
            const definition = SourceContext_1.SourceContext.definitionForContext(action.context, true);
            if (action.isPredicate) {
                const questionMark = action.nextSibling;
                if (questionMark) {
                    const context = questionMark.context;
                    definition.range.end.row = context.symbol.line;
                    definition.range.end.column = context.symbol.charPositionInLine;
                }
            }
            result.push({
                kind: SourceContext_1.SourceContext.getKindFromSymbol(action),
                name: action.name,
                source: this.owner ? this.owner.fileName : "",
                definition,
                isPredicate: action.isPredicate,
                description: action.context.text,
            });
        }
        return result;
    }
    getReferenceCount(symbolName) {
        const reference = this.symbolReferences.get(symbolName);
        if (reference) {
            return reference;
        }
        else {
            return 0;
        }
    }
    getUnreferencedSymbols() {
        const result = [];
        for (const entry of this.symbolReferences) {
            if (entry[1] === 0) {
                result.push(entry[0]);
            }
        }
        return result;
    }
    incrementSymbolRefCount(symbolName) {
        const reference = this.symbolReferences.get(symbolName);
        if (reference) {
            this.symbolReferences.set(symbolName, reference + 1);
        }
        else {
            this.symbolReferences.set(symbolName, 1);
        }
    }
    getSymbolOccurences(symbolName, localOnly) {
        const result = [];
        const symbols = this.getAllSymbols(antlr4_c3_1.Symbol, localOnly);
        for (const symbol of symbols) {
            const owner = symbol.root.owner;
            if (owner) {
                if (symbol.context && symbol.name === symbolName) {
                    let context = symbol.context;
                    if (symbol instanceof FragmentTokenSymbol) {
                        context = symbol.context.children[1];
                    }
                    else if (symbol instanceof TokenSymbol || symbol instanceof RuleSymbol) {
                        context = symbol.context.children[0];
                    }
                    result.push({
                        kind: SourceContext_1.SourceContext.getKindFromSymbol(symbol),
                        name: symbolName,
                        source: owner.fileName,
                        definition: SourceContext_1.SourceContext.definitionForContext(context, true),
                        description: undefined,
                    });
                }
                if (symbol instanceof antlr4_c3_1.ScopedSymbol) {
                    const references = symbol.getAllNestedSymbols(symbolName);
                    for (const reference of references) {
                        result.push({
                            kind: SourceContext_1.SourceContext.getKindFromSymbol(reference),
                            name: symbolName,
                            source: owner.fileName,
                            definition: SourceContext_1.SourceContext.definitionForContext(reference.context, true),
                            description: undefined,
                        });
                    }
                }
            }
        }
        return result;
    }
    symbolsOfType(t, localOnly = false) {
        const result = [];
        const symbols = this.getAllSymbols(t, localOnly);
        for (const symbol of symbols) {
            const root = symbol.root;
            result.push({
                kind: SourceContext_1.SourceContext.getKindFromSymbol(symbol),
                name: symbol.name,
                source: root.owner ? root.owner.fileName : "ANTLR runtime",
                definition: SourceContext_1.SourceContext.definitionForContext(symbol.context, true),
                description: undefined,
            });
        }
        return result;
    }
    getSymbolOfType(name, kind, localOnly) {
        switch (kind) {
            case facade_1.SymbolKind.TokenVocab: {
                const options = this.resolve("options", true);
                if (options) {
                    return options.resolve(name, localOnly);
                }
            }
            case facade_1.SymbolKind.Import: {
                return this.resolve(name, localOnly);
            }
            case facade_1.SymbolKind.BuiltInLexerToken: {
                return this.resolve(name, localOnly);
            }
            case facade_1.SymbolKind.VirtualLexerToken: {
                return this.resolve(name, localOnly);
            }
            case facade_1.SymbolKind.FragmentLexerToken: {
                return this.resolve(name, localOnly);
            }
            case facade_1.SymbolKind.LexerRule: {
                return this.resolve(name, localOnly);
            }
            case facade_1.SymbolKind.BuiltInMode: {
                return this.resolve(name, localOnly);
            }
            case facade_1.SymbolKind.LexerMode: {
                return this.resolve(name, localOnly);
            }
            case facade_1.SymbolKind.BuiltInChannel: {
                return this.resolve(name, localOnly);
            }
            case facade_1.SymbolKind.TokenChannel: {
                return this.resolve(name, localOnly);
            }
            case facade_1.SymbolKind.ParserRule: {
                return this.resolve(name, localOnly);
            }
            default: {
                break;
            }
        }
        return undefined;
    }
}
exports.ContextSymbolTable = ContextSymbolTable;
class OptionSymbol extends antlr4_c3_1.Symbol {
}
exports.OptionSymbol = OptionSymbol;
class ImportSymbol extends antlr4_c3_1.Symbol {
}
exports.ImportSymbol = ImportSymbol;
class BuiltInTokenSymbol extends antlr4_c3_1.Symbol {
}
exports.BuiltInTokenSymbol = BuiltInTokenSymbol;
class VirtualTokenSymbol extends antlr4_c3_1.Symbol {
}
exports.VirtualTokenSymbol = VirtualTokenSymbol;
class FragmentTokenSymbol extends antlr4_c3_1.ScopedSymbol {
}
exports.FragmentTokenSymbol = FragmentTokenSymbol;
class TokenSymbol extends antlr4_c3_1.ScopedSymbol {
}
exports.TokenSymbol = TokenSymbol;
class TokenReferenceSymbol extends antlr4_c3_1.Symbol {
}
exports.TokenReferenceSymbol = TokenReferenceSymbol;
class BuiltInModeSymbol extends antlr4_c3_1.Symbol {
}
exports.BuiltInModeSymbol = BuiltInModeSymbol;
class LexerModeSymbol extends antlr4_c3_1.Symbol {
}
exports.LexerModeSymbol = LexerModeSymbol;
class BuiltInChannelSymbol extends antlr4_c3_1.Symbol {
}
exports.BuiltInChannelSymbol = BuiltInChannelSymbol;
class TokenChannelSymbol extends antlr4_c3_1.Symbol {
}
exports.TokenChannelSymbol = TokenChannelSymbol;
class RuleSymbol extends antlr4_c3_1.ScopedSymbol {
}
exports.RuleSymbol = RuleSymbol;
class RuleReferenceSymbol extends antlr4_c3_1.Symbol {
}
exports.RuleReferenceSymbol = RuleReferenceSymbol;
class AlternativeSymbol extends antlr4_c3_1.ScopedSymbol {
}
exports.AlternativeSymbol = AlternativeSymbol;
class EbnfSuffixSymbol extends antlr4_c3_1.Symbol {
}
exports.EbnfSuffixSymbol = EbnfSuffixSymbol;
class OptionsSymbol extends antlr4_c3_1.ScopedSymbol {
}
exports.OptionsSymbol = OptionsSymbol;
class ArgumentSymbol extends antlr4_c3_1.ScopedSymbol {
}
exports.ArgumentSymbol = ArgumentSymbol;
class OperatorSymbol extends antlr4_c3_1.Symbol {
}
exports.OperatorSymbol = OperatorSymbol;
class ActionSymbol extends antlr4_c3_1.ScopedSymbol {
    constructor() {
        super(...arguments);
        this.isPredicate = false;
    }
}
exports.ActionSymbol = ActionSymbol;
class PredicateMarkerSymbol extends antlr4_c3_1.Symbol {
}
exports.PredicateMarkerSymbol = PredicateMarkerSymbol;
//# sourceMappingURL=ContextSymbolTable.js.map