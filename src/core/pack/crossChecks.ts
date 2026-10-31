import type { parseFiles } from './parseFiles';
import type { PackIssue } from './types';

type ParsedFiles = ReturnType<typeof parseFiles>;

/** Cross-file checks also run when unrelated files or entries fail their schemas. */
export function crossChecks(parsed: ParsedFiles, assetPaths: string[]): PackIssue[] {
  const errors: PackIssue[] = [];
  const add = (file: string, path: string, message: string) => errors.push({ file, path, message });
  const itemIds = new Set<string>();
  for (const { index, value: item } of parsed.items) {
    if (item.id === undefined) continue;
    if (itemIds.has(item.id)) add('items.json', `$[${index}].id`, `Duplicate item id: ${item.id}`);
    itemIds.add(item.id);
  }
  for (const [id, text] of Object.entries(parsed.texts)) {
    if (!text) continue;
    const segments = new Set<string>();
    text.segments?.forEach((segment, index) => {
      if (segments.has(segment.id)) add(`texts/${id}.json`, `$.segments[${index}].id`, `Duplicate segment id: ${segment.id}`);
      segments.add(segment.id);
    });
  }
  for (const [id, annotations] of Object.entries(parsed.annotations)) {
    const file = `annotations/${id}.json`;
    const text = Object.hasOwn(parsed.texts, id) ? parsed.texts[id] : undefined;
    if (!Object.hasOwn(parsed.texts, id)) add(file, '$', `Unknown text: ${id}`);
    const segments = new Map(text?.segments?.map((segment) => [segment.id, segment]) ?? []);
    const previous = new Map<string, { start: number; end: number }>();
    for (const { index, value: annotation } of annotations) {
      const path = `$[${index}]`;
      if (annotation.item !== undefined && !itemIds.has(annotation.item)) add(file, `${path}.item`, `Unknown item: ${annotation.item}`);
      if (annotation.segment === undefined) continue;
      const segment = segments.get(annotation.segment);
      // Avoid inventing unknown-segment errors when the source file itself is invalid.
      if (!segment) {
        if (text?.segments) add(file, `${path}.segment`, `Unknown segment: ${annotation.segment}`);
        continue;
      }
      const { start, end } = annotation;
      if (start === undefined || end === undefined) continue;
      if (end <= start) add(file, `${path}.end`, 'Span end must be greater than start');
      if (start > segment.text.length) add(file, `${path}.start`, 'Span must be inside segment text (UTF-16 offsets)');
      if (end > segment.text.length) add(file, `${path}.end`, 'Span must be inside segment text (UTF-16 offsets)');
      const prev = previous.get(annotation.segment);
      if (prev && start < prev.start) add(file, `${path}.start`, 'Spans must be ordered within each segment');
      if (prev && start < prev.end) add(file, `${path}.start`, 'Spans must not overlap within a segment');
      previous.set(annotation.segment, { start, end: Math.max(prev?.end ?? 0, end) });
      if (annotation.text !== undefined && annotation.text !== segment.text.slice(start, end)) {
        add(file, `${path}.text`, 'Annotation text must equal the exact segment slice');
      }
    }
  }
  const assets = new Set(assetPaths);
  const bound = new Set<string>();
  for (const { index, value: binding } of parsed.bindings) {
    const path = `$[${index}]`;
    if (binding.role === 'puzzle') {
      if (binding.item !== undefined) add('bindings.json', `${path}.item`, 'Puzzle binding must not have an item');
    } else if (binding.role !== undefined && binding.item === undefined) {
      add('bindings.json', `${path}.item`, `${binding.role} binding requires an item`);
    } else if (binding.item !== undefined && !itemIds.has(binding.item)) {
      add('bindings.json', `${path}.item`, `Unknown item: ${binding.item}`);
    }
    if (binding.path === undefined) continue;
    if (!assets.has(binding.path)) add('bindings.json', `${path}.path`, `Asset path not found: ${binding.path}`);
    if (bound.has(binding.path)) add('bindings.json', `${path}.path`, `Asset path is already bound: ${binding.path}`);
    bound.add(binding.path);
  }
  return errors;
}
