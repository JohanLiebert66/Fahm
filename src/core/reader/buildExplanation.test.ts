import { expect, it, vi } from 'vitest';
import { buildExplanation, type ExplanationInput } from './buildExplanation';
import { tokenize } from './tokenize';
import { linkTokens } from './linkTokens';

it.each(['zorpli zorpli', '(zorpli), zorpli', '😀 (zórpli), zórpli']) (
  'copies the tokenizer core spans and exact core term: %s', text => {
    const segment = { id: 's', text };
    const token = tokenize(text).find(entry => entry.kind === 'word')!;
    const result = buildExplanation({ segment, token, items: [], annotations: [],
      language: 'en', meaning: 'An invented fixture explanation.', generateId: () => 'fixed-id' });
    expect(result).toEqual({ ok: true, value: {
      item: { id: 'fixed-id', term: text.slice(token.coreStart, token.coreEnd),
        explain: { en: { meaning: 'An invented fixture explanation.' } } },
      annotation: { segment: 's', start: token.coreStart, end: token.coreEnd, item: 'fixed-id' },
    } });
    if (result.ok && !text.startsWith('😀')) {
      expect(linkTokens(segment, [result.value.item], [result.value.annotation]).tokens
        .filter(entry => entry.kind === 'word').map(entry => entry.itemId)).toEqual(['fixed-id', 'fixed-id']);
    }
  },
);

function input(text = 'zorpli'): ExplanationInput {
  const segment = { id: 's', text };
  return { segment, token: tokenize(text)[0]!, items: [], annotations: [],
    language: 'en', meaning: 'An invented meaning.' };
}

it('injects a normalized-term ID generator and suffixes collisions without dots or mutation', () => {
  const source = input('(Zorpli),');
  const generateId = vi.fn(() => 'fixed-id');
  source.items = ['fixed-id', 'fixed-id-2'].map(id => ({ id, term: `other-${id}`, explain: {} }));
  const before = structuredClone(source);
  const result = buildExplanation({ ...source, generateId });
  expect(generateId).toHaveBeenCalledExactlyOnceWith('zorpli');
  expect(result).toMatchObject({ ok: true, value: {
    item: { id: 'fixed-id-3', term: 'Zorpli' }, annotation: { item: 'fixed-id-3' },
  } });
  expect(source).toEqual(before);
});

it('generates a valid default slug from a normalized core, not edge punctuation', () => {
  expect(buildExplanation(input('(Zorpli),'))).toMatchObject({ ok: true,
    value: { item: { id: 'zorpli' }, annotation: { item: 'zorpli' } } });
});

it.each(['\u200B', '\u0640', '!!!'])('rejects empty normalized cores: %s', text => {
  expect(buildExplanation(input(text))).toEqual({ ok: false, errors: ['emptyTerm'] });
});

it.each(['term', 'forms'])('rejects a normalized match in an existing item %s', field => {
  const source = input('ZORPLI');
  source.items = [{ id: 'other', term: field === 'term' ? 'zorpli' : 'blimzo',
    forms: field === 'forms' ? ['zor\u200Bpli'] : [], explain: {} }];
  expect(buildExplanation(source)).toEqual({ ok: false, errors: ['duplicateTerm'] });
});

it.each(['full', 'core', 'phrase'])('rejects an accepted %s annotation overlapping the core', span => {
  const source = input('(zorpli), blimzo');
  const last = tokenize(source.segment.text).at(-1)!;
  source.annotations = [{ segment: 's',
    start: span === 'full' ? source.token.start : source.token.coreStart,
    end: span === 'phrase' ? last.coreEnd : span === 'full' ? source.token.end : source.token.coreEnd,
    item: 'other' }];
  expect(buildExplanation(source)).toEqual({ ok: false, errors: ['overlap'] });
});

it('does not reserve ignored misaligned annotations or annotations from other segments', () => {
  const source = input();
  source.annotations = [{ segment: 's', start: 1, end: 2, item: 'other' },
    { segment: 'elsewhere', start: source.token.coreStart, end: source.token.coreEnd, item: 'other' }];
  expect(buildExplanation(source).ok).toBe(true);
});

it.each(['language', 'meaning', 'token', 'id'])('rejects invalid %s without throwing', field => {
  const source = input();
  if (field === 'language') source.language = ' ';
  if (field === 'meaning') source.meaning = ' ';
  if (field === 'token') source.token = { ...source.token, coreStart: source.token.coreEnd };
  if (field === 'id') source.generateId = () => 'invalid.id';
  expect(buildExplanation(source)).toEqual({ ok: false, errors: ['invalid'] });
});

it('returns a typed failure if the injected generator throws', () => {
  expect(buildExplanation({ ...input(), generateId: () => { throw new Error('Synthetic'); } }))
    .toEqual({ ok: false, errors: ['invalid'] });
});
