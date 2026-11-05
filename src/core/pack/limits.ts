import { z } from 'zod';

export interface PackLimits {
  entries: number;
  totalBytes: number;
  imageBytes: number;
  audioBytes: number;
}

export const defaultPackLimits: PackLimits = {
  entries: 2000,
  totalBytes: 250 * 1024 * 1024,
  imageBytes: 5 * 1024 * 1024,
  audioBytes: 10 * 1024 * 1024,
};

const boundedInteger = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const limitsSchema = z.object({
  entries: boundedInteger.max(defaultPackLimits.entries).catch(defaultPackLimits.entries),
  totalBytes: boundedInteger.max(defaultPackLimits.totalBytes).catch(defaultPackLimits.totalBytes),
  imageBytes: boundedInteger.max(defaultPackLimits.imageBytes).catch(defaultPackLimits.imageBytes),
  audioBytes: boundedInteger.max(defaultPackLimits.audioBytes).catch(defaultPackLimits.audioBytes),
});

/** Invalid overrides fall back per field; never weaken bounds with NaN/Infinity. */
export function resolveLimits(overrides?: Partial<PackLimits>): PackLimits {
  return limitsSchema.parse(overrides ?? {});
}

export function entryByteLimit(path: string, limits: PackLimits): number {
  if (path.startsWith('images/') || path.startsWith('puzzles/')) return limits.imageBytes;
  if (path.startsWith('audio/')) return limits.audioBytes;
  return limits.totalBytes;
}
