import { z } from 'zod';
import { annotationSchema, bindingSchema, itemSchema, packSchema, textSchema } from './schema';
import type { PackInput, PackIssue } from './types';

export function issuePath(parts: (string | number)[]): string {
  return '$' + parts.map((part) => typeof part === 'number' ? `[${part}]`
    : /^[A-Za-z_$][\w$]*$/.test(part) ? `.${part}` : `[${JSON.stringify(part)}]`).join('');
}

/** Walk schema shapes, not parsed output, so invalid files still produce warnings. */
function unknownFields(schema: z.ZodTypeAny, input: unknown, file: string,
  warnings: PackIssue[], path: (string | number)[] = []): void {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault) {
    unknownFields(schema._def.innerType, input, file, warnings, path);
  } else if (schema instanceof z.ZodEffects) {
    unknownFields(schema.innerType(), input, file, warnings, path);
  } else if (schema instanceof z.ZodArray && Array.isArray(input)) {
    input.forEach((value, index) => unknownFields(schema.element, value, file, warnings, [...path, index]));
  } else if (input !== null && typeof input === 'object' && !Array.isArray(input)) {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape as Record<string, z.ZodTypeAny>;
      // Known fields first gives stable paths independent of extra field placement.
      for (const key of Object.keys(shape)) {
        unknownFields(shape[key]!, (input as Record<string, unknown>)[key], file, warnings, [...path, key]);
      }
      for (const key of Object.keys(input)) {
        if (!Object.hasOwn(shape, key)) warnings.push({
          file, path: issuePath([...path, key]), message: 'Unknown field ignored',
        });
      }
    } else if (schema instanceof z.ZodRecord) {
      for (const [key, value] of Object.entries(input)) {
        unknownFields(schema.valueSchema, value, file, warnings, [...path, key]);
      }
    }
  }
}

export function parseFiles(input: PackInput) {
  const errors: PackIssue[] = [];
  const warnings: PackIssue[] = [];
  function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, raw: unknown, file: string) {
    unknownFields(schema, raw, file, warnings);
    const result = schema.safeParse(raw);
    if (result.success) return result.data;
    errors.push(...result.error.issues.map((issue) => ({
      file, path: issuePath(issue.path), message: issue.message,
    })));
    return undefined;
  }
  function fields<S extends z.AnyZodObject>(schema: S, raw: unknown): Partial<z.infer<S>> | undefined {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    return Object.fromEntries(Object.entries(shape).flatMap(([key, field]) => {
      const result = field.safeParse((raw as Record<string, unknown>)[key]);
      return result.success && result.data !== undefined ? [[key, result.data]] : [];
    })) as Partial<z.infer<S>>;
  }
  function list<S extends z.AnyZodObject>(schema: S, raw: unknown, file: string) {
    parse(z.array(schema), raw, file);
    // Recover independently valid fields so one error cannot hide unrelated checks.
    return (Array.isArray(raw) ? raw : []).flatMap((entry: unknown, index) => {
      const value = fields(schema, entry);
      return value ? [{ index, value }] : [];
    });
  }
  const pack = parse(packSchema, input.pack, 'pack.json');
  const items = list(itemSchema, input.items, 'items.json');
  const texts = Object.fromEntries(Object.entries(input.texts ?? {}).map(([id, raw]) => {
    parse(textSchema, raw, `texts/${id}.json`);
    return [id, fields(textSchema, raw)];
  }));
  const annotations = Object.fromEntries(Object.entries(input.annotations ?? {}).map(([id, raw]) =>
    [id, list(annotationSchema, raw, `annotations/${id}.json`)]));
  const bindings = list(bindingSchema, input.bindings === undefined ? [] : input.bindings, 'bindings.json');
  return { pack, items, texts, annotations, bindings, errors, warnings };
}
