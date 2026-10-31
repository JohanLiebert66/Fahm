import { packContentsSchema } from './schema';
import { parseFiles } from './parseFiles';
import { crossChecks } from './crossChecks';
import type { PackInput, PackValidationResult } from './types';

/** Validate in memory; callers own JSON parsing and all I/O. */
export function validatePack(input: PackInput): PackValidationResult {
  const parsed = parseFiles(input);
  const { errors, warnings } = parsed;
  errors.push(...crossChecks(parsed, input.assets));
  if (errors.length) return { ok: false, errors, warnings };
  const result = packContentsSchema.safeParse(input);
  if (!result.success) return { ok: false, errors: result.error.issues.map((issue) => ({
    file: 'assets', path: '$', message: issue.message,
  })), warnings };
  return { ok: true, value: result.data, warnings };
}
