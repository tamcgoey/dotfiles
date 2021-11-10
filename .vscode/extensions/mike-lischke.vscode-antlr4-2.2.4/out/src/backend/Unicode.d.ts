import { IntervalSet, Interval } from "antlr4ts/misc";
export declare const FULL_UNICODE_SET: IntervalSet;
export interface UnicodeOptions {
    excludeCJK?: boolean;
    excludeRTL?: boolean;
    limitToBMP?: boolean;
}
export declare const printableUnicodePoints: (options: UnicodeOptions) => IntervalSet;
export declare const randomCodeBlock: (blockOverrides?: Map<string, number> | undefined) => Interval;
