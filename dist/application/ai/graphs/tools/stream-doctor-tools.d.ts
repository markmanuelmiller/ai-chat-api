import { z } from 'zod';
export declare const listStatsFiles: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    m: z.ZodOptional<z.ZodNumber>;
    c: z.ZodOptional<z.ZodNumber>;
    n: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    m?: number | undefined;
    c?: number | undefined;
    n?: string | undefined;
}, {
    m?: number | undefined;
    c?: number | undefined;
    n?: string | undefined;
}>, {
    m?: number | undefined;
    c?: number | undefined;
    n?: string | undefined;
}, {
    m?: number | undefined;
    c?: number | undefined;
    n?: string | undefined;
}, string>;
export declare const convertBinaryToCsv: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    files: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    files?: string | undefined;
}, {
    files?: string | undefined;
}>, {
    files?: string | undefined;
}, {
    files?: string | undefined;
}, string>;
export declare const describeData: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    record_types: z.ZodOptional<z.ZodString>;
    json_output: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    record_types?: string | undefined;
    json_output?: boolean | undefined;
}, {
    record_types?: string | undefined;
    json_output?: boolean | undefined;
}>, {
    record_types?: string | undefined;
    json_output?: boolean | undefined;
}, {
    record_types?: string | undefined;
    json_output?: boolean | undefined;
}, string>;
export declare const processData: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    command: z.ZodString;
}, "strip", z.ZodTypeAny, {
    command: string;
}, {
    command: string;
}>, {
    command: string;
}, {
    command: string;
}, string>;
export declare const streamDoctorTools: (import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    m: z.ZodOptional<z.ZodNumber>;
    c: z.ZodOptional<z.ZodNumber>;
    n: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    m?: number | undefined;
    c?: number | undefined;
    n?: string | undefined;
}, {
    m?: number | undefined;
    c?: number | undefined;
    n?: string | undefined;
}>, {
    m?: number | undefined;
    c?: number | undefined;
    n?: string | undefined;
}, {
    m?: number | undefined;
    c?: number | undefined;
    n?: string | undefined;
}, string> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    files: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    files?: string | undefined;
}, {
    files?: string | undefined;
}>, {
    files?: string | undefined;
}, {
    files?: string | undefined;
}, string> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    record_types: z.ZodOptional<z.ZodString>;
    json_output: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    record_types?: string | undefined;
    json_output?: boolean | undefined;
}, {
    record_types?: string | undefined;
    json_output?: boolean | undefined;
}>, {
    record_types?: string | undefined;
    json_output?: boolean | undefined;
}, {
    record_types?: string | undefined;
    json_output?: boolean | undefined;
}, string> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    command: z.ZodString;
}, "strip", z.ZodTypeAny, {
    command: string;
}, {
    command: string;
}>, {
    command: string;
}, {
    command: string;
}, string>)[];
