"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetailsListener = void 0;
const ANTLRv4Parser_1 = require("../parser/ANTLRv4Parser");
const ContextSymbolTable_1 = require("./ContextSymbolTable");
const SourceContext_1 = require("./SourceContext");
const antlr4_c3_1 = require("antlr4-c3");
class DetailsListener {
    constructor(symbolTable, imports) {
        this.symbolTable = symbolTable;
        this.imports = imports;
    }
    enterLexerRuleSpec(ctx) {
        const tokenRef = ctx.TOKEN_REF();
        if (tokenRef) {
            if (ctx.FRAGMENT()) {
                this.currentSymbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.FragmentTokenSymbol, undefined, tokenRef.text);
                this.currentSymbol.context = ctx;
            }
            else {
                this.currentSymbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.TokenSymbol, undefined, tokenRef.text);
                this.currentSymbol.context = ctx;
            }
        }
    }
    enterParserRuleSpec(ctx) {
        this.currentSymbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.RuleSymbol, undefined, ctx.RULE_REF().text);
        this.currentSymbol.context = ctx;
    }
    exitParserRuleSpec(ctx) {
        const symbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.TokenSymbol, this.currentSymbol, ";");
        try {
            symbol.context = ctx.SEMI();
        }
        catch (e) {
        }
        if (this.currentSymbol) {
            this.currentSymbol = this.currentSymbol.parent;
        }
    }
    enterRuleBlock(ctx) {
        this.currentSymbol = this.symbolTable.addNewSymbolOfType(antlr4_c3_1.BlockSymbol, this.currentSymbol, "");
    }
    exitRuleBlock(ctx) {
        if (this.currentSymbol) {
            this.currentSymbol = this.currentSymbol.parent;
        }
    }
    enterLexerRuleBlock(ctx) {
        this.currentSymbol = this.symbolTable.addNewSymbolOfType(antlr4_c3_1.BlockSymbol, this.currentSymbol, "");
    }
    exitLexerRuleBlock(ctx) {
        if (this.currentSymbol) {
            this.currentSymbol = this.currentSymbol.parent;
        }
    }
    enterBlock(ctx) {
        this.currentSymbol = this.symbolTable.addNewSymbolOfType(antlr4_c3_1.BlockSymbol, this.currentSymbol, "");
        this.currentSymbol.context = ctx;
    }
    exitBlock(ctx) {
        if (this.currentSymbol) {
            this.currentSymbol = this.currentSymbol.parent;
        }
    }
    enterAlternative(ctx) {
        this.currentSymbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.AlternativeSymbol, this.currentSymbol, "");
        this.currentSymbol.context = ctx;
    }
    exitAlternative(ctx) {
        if (this.currentSymbol) {
            this.currentSymbol = this.currentSymbol.parent;
        }
    }
    enterLexerAlt(ctx) {
        this.currentSymbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.AlternativeSymbol, this.currentSymbol, "");
        this.currentSymbol.context = ctx;
    }
    exitLexerAlt(ctx) {
        if (this.currentSymbol) {
            this.currentSymbol = this.currentSymbol.parent;
        }
    }
    enterTokensSpec(ctx) {
        const idList = ctx.idList();
        if (idList) {
            for (const identifier of idList.identifier()) {
                const symbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.VirtualTokenSymbol, undefined, identifier.text);
                symbol.context = ctx;
            }
        }
    }
    enterTerminalRule(ctx) {
        if (this.currentSymbol) {
            if (ctx.TOKEN_REF()) {
                const refName = ctx.TOKEN_REF().text;
                const symbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.TokenReferenceSymbol, this.currentSymbol, refName);
                symbol.context = ctx.TOKEN_REF();
            }
            else {
                const refName = unquote(ctx.STRING_LITERAL().text, "'");
                const symbol = this.symbolTable.addNewSymbolOfType(antlr4_c3_1.LiteralSymbol, this.currentSymbol, refName, refName);
                symbol.context = ctx.STRING_LITERAL();
            }
        }
    }
    enterRuleref(ctx) {
        if (ctx.RULE_REF() && this.currentSymbol) {
            const refName = ctx.RULE_REF().text;
            const symbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.RuleReferenceSymbol, this.currentSymbol, refName);
            symbol.context = ctx.RULE_REF();
        }
    }
    enterChannelsSpec(ctx) {
        const idList = ctx.idList();
        if (idList) {
            for (const identifier of idList.identifier()) {
                const symbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.TokenChannelSymbol, undefined, identifier.text);
                symbol.context = ctx;
            }
        }
    }
    exitModeSpec(ctx) {
        const symbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.LexerModeSymbol, undefined, ctx.identifier().text);
        symbol.context = ctx;
    }
    exitDelegateGrammar(ctx) {
        const context = ctx.identifier()[ctx.identifier().length - 1];
        if (context) {
            const name = SourceContext_1.SourceContext.definitionForContext(context, false).text;
            const symbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.ImportSymbol, undefined, name);
            symbol.context = ctx;
            this.imports.push(name);
        }
    }
    enterOptionsSpec(ctx) {
        this.currentSymbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.OptionsSymbol, undefined, "options");
        this.currentSymbol.context = ctx;
    }
    exitOption(ctx) {
        const option = ctx.identifier().text;
        const value = ctx.tryGetRuleContext(0, ANTLRv4Parser_1.OptionValueContext);
        if (value) {
            const symbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.OptionSymbol, this.currentSymbol, option);
            symbol.value = value.text;
            symbol.context = ctx;
            if (option === "tokenVocab") {
                this.imports.push(value.text);
            }
        }
    }
    enterEbnfSuffix(ctx) {
        const symbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.EbnfSuffixSymbol, this.currentSymbol, ctx.text);
        symbol.context = ctx;
    }
    enterActionBlock(ctx) {
        const symbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.ActionSymbol, this.currentSymbol, "action");
        symbol.context = ctx;
    }
    enterArgActionBlock(ctx) {
        const symbol = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.ArgumentSymbol, this.currentSymbol, "argument");
        symbol.context = ctx;
    }
    enterLabeledElement(ctx) {
        const symbol = this.symbolTable.addNewSymbolOfType(antlr4_c3_1.VariableSymbol, this.currentSymbol, ctx.identifier().text);
        symbol.context = ctx;
        if (ctx.childCount > 1) {
            const operator = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.OperatorSymbol, this.currentSymbol, ctx.getChild(1).text);
            operator.context = ctx.getChild(1);
        }
    }
    exitElement(ctx) {
        if (ctx.QUESTION() && this.currentSymbol) {
            const child = this.currentSymbol.lastChild;
            if (child instanceof ContextSymbolTable_1.ActionSymbol) {
                child.isPredicate = true;
                const questionMark = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.PredicateMarkerSymbol, this.currentSymbol, "?");
                questionMark.context = ctx.QUESTION();
            }
        }
    }
    exitLexerElement(ctx) {
        if (ctx.QUESTION() && this.currentSymbol) {
            const child = this.currentSymbol.lastChild;
            if (child instanceof ContextSymbolTable_1.ActionSymbol) {
                child.isPredicate = true;
                const questionMark = this.symbolTable.addNewSymbolOfType(ContextSymbolTable_1.PredicateMarkerSymbol, this.currentSymbol, "?");
                questionMark.context = ctx.QUESTION();
            }
        }
    }
}
exports.DetailsListener = DetailsListener;
const unquote = (input, quoteChar) => {
    quoteChar = quoteChar || '"';
    if (input[0] === quoteChar && input[input.length - 1] === quoteChar) {
        return input.slice(1, input.length - 1);
    }
    return input;
};
//# sourceMappingURL=DetailsListener.js.map