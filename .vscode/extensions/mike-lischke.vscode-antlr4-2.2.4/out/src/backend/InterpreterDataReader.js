"use strict";
/*!
 * Copyright 2016 The ANTLR Project. All rights reserved.
 * Licensed under the BSD-3-Clause license. See LICENSE file in the project root for license information.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterpreterDataReader = void 0;
const fs = require("fs");
const antlr4ts_1 = require("antlr4ts");
const CompatibleATNDeserializer_1 = require("./CompatibleATNDeserializer");
class InterpreterDataReader {
    static parseFile(fileName) {
        const ruleNames = [];
        const channels = [];
        const modes = [];
        const literalNames = [];
        const symbolicNames = [];
        const source = fs.readFileSync(fileName, "utf8");
        const lines = source.split("\n");
        let index = 0;
        let line = lines[index++];
        if (line !== "token literal names:") {
            throw new Error("Unexpected data entry");
        }
        do {
            line = lines[index++];
            if (line.length === 0) {
                break;
            }
            literalNames.push(line === "null" ? "" : line);
        } while (true);
        line = lines[index++];
        if (line !== "token symbolic names:") {
            throw new Error("Unexpected data entry");
        }
        do {
            line = lines[index++];
            if (line.length === 0) {
                break;
            }
            symbolicNames.push(line === "null" ? "" : line);
        } while (true);
        line = lines[index++];
        if (line !== "rule names:") {
            throw new Error("Unexpected data entry");
        }
        do {
            line = lines[index++];
            if (line.length === 0) {
                break;
            }
            ruleNames.push(line);
        } while (true);
        line = lines[index++];
        if (line === "channel names:") {
            do {
                line = lines[index++];
                if (line.length === 0) {
                    break;
                }
                channels.push(line);
            } while (true);
            line = lines[index++];
            if (line !== "mode names:") {
                throw new Error("Unexpected data entry");
            }
            do {
                line = lines[index++];
                if (line.length === 0) {
                    break;
                }
                modes.push(line);
            } while (true);
        }
        line = lines[index++];
        if (line !== "atn:") {
            throw new Error("Unexpected data entry");
        }
        line = lines[index++];
        const elements = line.split(",");
        let value;
        const serializedATN = new Uint16Array(elements.length);
        for (let i = 0; i < elements.length; ++i) {
            const element = elements[i];
            if (element.startsWith("[")) {
                value = Number(element.substring(1).trim());
            }
            else if (element.endsWith("]")) {
                value = Number(element.substring(0, element.length - 1).trim());
            }
            else {
                value = Number(element.trim());
            }
            serializedATN[i] = value;
        }
        const deserializer = new CompatibleATNDeserializer_1.CompatibleATNDeserializer();
        return {
            atn: deserializer.deserialize(serializedATN),
            vocabulary: new antlr4ts_1.VocabularyImpl(literalNames, symbolicNames, []),
            ruleNames,
            channels,
            modes,
        };
    }
}
exports.InterpreterDataReader = InterpreterDataReader;
//# sourceMappingURL=InterpreterDataReader.js.map