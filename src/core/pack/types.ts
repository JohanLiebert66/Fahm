import type { z } from 'zod';
import type {
  annotationSchema, bindingSchema, itemSchema, packContentsSchema,
  packSchema, segmentSchema, textSchema,
} from './schema';

export type Pack = z.infer<typeof packSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Text = z.infer<typeof textSchema>;
export type Segment = z.infer<typeof segmentSchema>;
export type Annotation = z.infer<typeof annotationSchema>;
export type Binding = z.infer<typeof bindingSchema>;
export type PackContents = z.infer<typeof packContentsSchema>;

/** JSON is parsed by the caller. Keys in texts/annotations are file stems. */
export interface PackInput {
  pack: unknown;
  items: unknown;
  texts?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  bindings?: unknown;
  assets: string[];
}

/** A JSON-style path: $ for the root, [index] for array entries. */
export interface PackIssue { file: string; path: string; message: string }
export type PackValidationResult =
  | { ok: true; value: PackContents; warnings: PackIssue[] }
  | { ok: false; errors: PackIssue[]; warnings: PackIssue[] };
