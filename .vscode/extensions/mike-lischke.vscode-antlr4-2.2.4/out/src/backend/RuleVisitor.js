"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleVisitor = void 0;
const tree_1 = require("antlr4ts/tree");
const ANTLRv4Lexer_1 = require("../parser/ANTLRv4Lexer");
const ANTLRv4Parser_1 = require("../parser/ANTLRv4Parser");
class RuleVisitor extends tree_1.AbstractParseTreeVisitor {
    constructor(scripts) {
        super();
        this.scripts = scripts;
        this.visitRuleAltList = (ctx) => {
            let script = "Choice(0";
            const alternatives = ctx.labeledAlt();
            for (const alternative of alternatives) {
                script += ", " + this.visitAlternative(alternative.alternative());
            }
            return script + ")";
        };
        this.visitLexerRuleSpec = (ctx) => {
            if (!ctx.tryGetRuleContext(0, ANTLRv4Parser_1.LexerRuleBlockContext)) {
                return "# Syntax Error #";
            }
            const diagram = "Diagram(" + this.visitLexerAltList(ctx.lexerRuleBlock().lexerAltList()) + ").addTo()";
            this.scripts.set(ctx.TOKEN_REF().text, diagram);
            return diagram;
        };
        this.visitLexerAltList = (ctx) => {
            let script = "Choice(0";
            for (const alternative of ctx.lexerAlt()) {
                script += ", " + this.visitLexerAlt(alternative);
            }
            return script + ")";
        };
        this.visitLexerAlt = (ctx) => {
            if (ctx.lexerElements()) {
                return this.visitLexerElements(ctx.lexerElements());
            }
            return "";
        };
        this.visitLexerElements = (ctx) => {
            let script = "";
            for (const element of ctx.lexerElement()) {
                if (script.length > 0) {
                    script += ", ";
                }
                script += this.visitLexerElement(element);
            }
            return "Sequence(" + script + ")";
        };
        this.visitLexerElement = (ctx) => {
            const hasEbnfSuffix = (ctx.ebnfSuffix() !== undefined);
            if (ctx.labeledLexerElement()) {
                if (hasEbnfSuffix) {
                    return this.visitEbnfSuffix(ctx.ebnfSuffix()) + "(" +
                        this.visitLabeledLexerElement(ctx.labeledLexerElement()) + ")";
                }
                else {
                    return this.visitLabeledLexerElement(ctx.labeledLexerElement());
                }
            }
            else if (ctx.lexerAtom()) {
                if (hasEbnfSuffix) {
                    return this.visitEbnfSuffix(ctx.ebnfSuffix()) + "(" + this.visitLexerAtom(ctx.lexerAtom()) + ")";
                }
                else {
                    return this.visitLexerAtom(ctx.lexerAtom());
                }
            }
            else if (ctx.lexerBlock()) {
                if (hasEbnfSuffix) {
                    return this.visitEbnfSuffix(ctx.ebnfSuffix()) + "(" +
                        this.visitLexerAltList(ctx.lexerBlock().lexerAltList()) + ")";
                }
                else {
                    return this.visitLexerAltList(ctx.lexerBlock().lexerAltList());
                }
            }
            else if (ctx.QUESTION()) {
                return "Comment('" + ctx.actionBlock().text + "?')";
            }
            else {
                return "Comment('{ action code }')";
            }
        };
        this.visitLabeledLexerElement = (ctx) => {
            if (ctx.lexerAtom()) {
                return this.visitLexerAtom(ctx.lexerAtom());
            }
            else if (ctx.block()) {
                return this.visitAltList(ctx.block().altList());
            }
            return "";
        };
        this.visitAltList = (ctx) => {
            let script = "Choice(0";
            for (const alternative of ctx.alternative()) {
                script += ", " + this.visitAlternative(alternative);
            }
            return script + ")";
        };
        this.visitAlternative = (ctx) => {
            let script = "";
            const optionsContext = ctx.elementOptions();
            if (optionsContext) {
                script += this.visitElementOptions(optionsContext);
            }
            for (const element of ctx.element()) {
                if (script.length > 0) {
                    script += ", ";
                }
                script += this.visitElement(element);
            }
            return "Sequence(" + script + ")";
        };
        this.visitElement = (ctx) => {
            const hasEbnfSuffix = (ctx.ebnfSuffix() !== undefined);
            if (ctx.labeledElement()) {
                if (hasEbnfSuffix) {
                    return this.visitEbnfSuffix(ctx.ebnfSuffix()) + "(" +
                        this.visitLabeledElement(ctx.labeledElement()) + ")";
                }
                else {
                    return this.visitLabeledElement(ctx.labeledElement());
                }
            }
            else if (ctx.atom()) {
                if (hasEbnfSuffix) {
                    return this.visitEbnfSuffix(ctx.ebnfSuffix()) + "(" + this.visitAtom(ctx.atom()) + ")";
                }
                else {
                    return this.visitAtom(ctx.atom());
                }
            }
            else if (ctx.ebnf()) {
                return this.visitEbnf(ctx.ebnf());
            }
            else if (ctx.QUESTION()) {
                return "Comment('" + ctx.actionBlock().text + "?')";
            }
            else {
                return "Comment('{ action code }')";
            }
        };
        this.visitElementOptions = (ctx) => "Comment('" + ctx.text + "')";
        this.visitLabeledElement = (ctx) => {
            if (ctx.atom()) {
                return this.visitAtom(ctx.atom());
            }
            else {
                return this.visitAltList(ctx.block().altList());
            }
        };
        this.visitEbnf = (ctx) => {
            if (!ctx.block()) {
                return "# Syntax Error #";
            }
            if (ctx.blockSuffix()) {
                return this.visitEbnfSuffix(ctx.blockSuffix().ebnfSuffix()) + "(" +
                    this.visitAltList(ctx.block().altList()) + ")";
            }
            else {
                return this.visitAltList(ctx.block().altList());
            }
        };
        this.visitEbnfSuffix = (ctx) => {
            const text = ctx.text;
            if (text === "?") {
                return "Optional";
            }
            else if (text === "*") {
                return "ZeroOrMore";
            }
            else {
                return "OneOrMore";
            }
        };
        this.visitLexerAtom = (ctx) => {
            if (ctx.characterRange()) {
                return this.visitCharacterRange(ctx.characterRange());
            }
            else if (ctx.terminalRule()) {
                return this.visitTerminalRule(ctx.terminalRule());
            }
            else if (ctx.notSet()) {
                return this.visitNotSet(ctx.notSet());
            }
            else if (ctx.LEXER_CHAR_SET()) {
                return this.visitTerminal(ctx.LEXER_CHAR_SET());
            }
            const options = ctx.elementOptions();
            if (options) {
                const text = this.visitElementOptions(options);
                if (text !== "") {
                    return "Sequence(Terminal('any char'), Comment(" + text + ")";
                }
            }
            return "Terminal('any char')";
        };
        this.visitAtom = (ctx) => {
            if (ctx.characterRange()) {
                return this.visitCharacterRange(ctx.characterRange());
            }
            else if (ctx.terminalRule()) {
                return this.visitTerminalRule(ctx.terminalRule());
            }
            else if (ctx.ruleref()) {
                return this.visitTerminal(ctx.ruleref().RULE_REF());
            }
            else if (ctx.notSet()) {
                return this.visitNotSet(ctx.notSet());
            }
            const options = ctx.elementOptions();
            if (options) {
                const text = this.visitElementOptions(options);
                if (text !== "") {
                    return "Sequence(NonTerminal('any token'), Comment(" + text + ")";
                }
            }
            return "NonTerminal('any token')";
        };
        this.visitNotSet = (ctx) => {
            if (ctx.setElement() != null) {
                return "Sequence(Comment('not'), " + this.visitSetElement(ctx.setElement()) + ")";
            }
            else {
                return "Sequence(Comment('not'), " + this.visitBlockSet(ctx.blockSet()) + ")";
            }
        };
        this.visitBlockSet = (ctx) => {
            let script = "Choice(0";
            for (const element of ctx.setElement()) {
                script += ", " + this.visitSetElement(element);
            }
            return script + ")";
        };
        this.visitSetElement = (ctx) => {
            if (ctx.characterRange()) {
                return this.visitCharacterRange(ctx.characterRange());
            }
            else if (ctx.TOKEN_REF()) {
                return this.visitTerminal(ctx.TOKEN_REF());
            }
            else if (ctx.STRING_LITERAL()) {
                return this.visitTerminal(ctx.STRING_LITERAL());
            }
            return this.visitTerminal(ctx.LEXER_CHAR_SET());
        };
        this.visitCharacterRange = (ctx) => {
            if (ctx.STRING_LITERAL().length > 1) {
                return this.escapeTerminal(ctx.STRING_LITERAL(0)) + " .. " + this.escapeTerminal(ctx.STRING_LITERAL(1));
            }
            return this.escapeTerminal(ctx.STRING_LITERAL(0)) + " .. ?";
        };
        this.visitTerminalRule = (ctx) => {
            if (ctx.TOKEN_REF()) {
                return this.visitTerminal(ctx.TOKEN_REF());
            }
            else {
                return this.visitTerminal(ctx.STRING_LITERAL());
            }
        };
        this.visitTerminal = (node) => {
            switch (node.symbol.type) {
                case ANTLRv4Lexer_1.ANTLRv4Lexer.STRING_LITERAL:
                case ANTLRv4Lexer_1.ANTLRv4Lexer.LEXER_CHAR_SET:
                    return "Terminal('" + this.escapeTerminal(node) + "')";
                case ANTLRv4Lexer_1.ANTLRv4Lexer.TOKEN_REF:
                    return "Terminal('" + node.text + "')";
                default:
                    return "NonTerminal('" + node.text + "')";
            }
        };
    }
    defaultResult() {
        return "";
    }
    visitParserRuleSpec(ctx) {
        if (!ctx.tryGetRuleContext(0, ANTLRv4Parser_1.RuleBlockContext)) {
            return "# Syntax Error #";
        }
        const diagram = "ComplexDiagram(" + this.visitRuleAltList(ctx.ruleBlock().ruleAltList()) + ").addTo()";
        this.scripts.set(ctx.RULE_REF().text, diagram);
        return diagram;
    }
    escapeTerminal(node) {
        const text = node.text;
        const escaped = text.replace(/\\/g, "\\\\");
        switch (node.symbol.type) {
            case ANTLRv4Lexer_1.ANTLRv4Lexer.STRING_LITERAL:
                return "\\'" + escaped.substring(1, escaped.length - 1).replace(/'/g, "\\'") + "\\'";
            default:
                return escaped.replace(/'/g, "\\'");
        }
    }
}
exports.RuleVisitor = RuleVisitor;
//# sourceMappingURL=RuleVisitor.js.map