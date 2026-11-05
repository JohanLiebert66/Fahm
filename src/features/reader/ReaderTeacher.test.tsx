import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createDatabase } from '../../storage/db';
import { storageRecords, snapshot } from '../../../tests/storageFixtures';
import { changeLanguage } from '../../i18n';
import { tokenize } from '../../core/reader/tokenize';
import { ReaderPage } from './ReaderPage';

let db: ReturnType<typeof createDatabase>;
const pack = storageRecords('synthetic-reader').pack;
const text = { id: 'invented', title: { en: 'Invented fixture' },
  segments: [{ id: 's', text: '(zorpli), zorpli blimzo' }, { id: 's2', text: 'zorpli' }] };
function open(teacherMode = true) {
  return render(<MemoryRouter initialEntries={[`/read/${pack.id}/${text.id}`]}>
    <Routes><Route path="/read/:packId/:textId" element={<ReaderPage {...{ db, teacherMode }} />} /></Routes>
  </MemoryRouter>);
}
beforeEach(async () => {
  await changeLanguage('en'); db = createDatabase(`teacher-reader-${crypto.randomUUID()}`);
  await db.packs.add(pack); await db.texts.add({ ...text, packId: pack.id });
});
afterEach(async () => { cleanup(); vi.restoreAllMocks(); await db.delete(); });

it('keeps unlinked words as plain text with no editing UI in child mode', async () => {
  const before = await snapshot(db);
  const { container } = open(false);
  await screen.findByRole('heading', { name: text.title.en });
  expect(container.querySelector('[data-segment-text]')).toHaveTextContent(text.segments[0]!.text);
  expect(screen.queryByRole('button', { name: 'zorpli' })).not.toBeInTheDocument();
  expect(screen.queryByRole('form')).not.toBeInTheDocument();
  expect(await snapshot(db)).toEqual(before);
});

it('saves exactly one item and core annotation, refreshes every matching occurrence, and survives remount', async () => {
  const { unmount, container } = open();
  fireEvent.click((await screen.findAllByRole('button', { name: 'zorpli' }))[0]!);
  expect(screen.getByText('(zorpli),')).toHaveAttribute('lang', pack.meta.lang);
  expect(screen.getByLabelText('Explanation language')).toHaveValue(pack.meta.lang);
  expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Explanation'), { target: { value: 'Invented meaning.' } });
  fireEvent.change(screen.getByLabelText('Explanation language'), { target: { value: 'ar' } });
  const transaction = vi.spyOn(db, 'transaction');
  const save = screen.getByRole('button', { name: 'Save explanation' });
  fireEvent.click(save); fireEvent.click(save);
  await waitFor(() => expect(screen.queryByRole('form')).not.toBeInTheDocument());
  expect(transaction).toHaveBeenCalledTimes(1); transaction.mockRestore();
  const items = await db.items.toArray(); const annotations = await db.annotations.toArray();
  expect(items).toEqual([{ packId: pack.id, id: 'zorpli', term: 'zorpli',
    explain: { ar: { meaning: 'Invented meaning.' } } }]);
  const token = tokenize(text.segments[0]!.text)[0]!;
  expect(annotations).toEqual([{ packId: pack.id, textId: text.id, segment: 's',
    start: token.coreStart, end: token.coreEnd, item: 'zorpli' }]);
  const links = screen.getAllByRole('button', { name: 'zorpli' });
  expect(links).toHaveLength(2); links.forEach(link => expect(link).toHaveClass('underline'));
  expect(container.querySelector('[data-segment-text]')?.textContent).toBe(text.segments[0]!.text);
  fireEvent.click(links[1]!);
  expect(screen.getByText('Invented meaning.').closest('[lang]')).toHaveAttribute('lang', 'ar');
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  fireEvent.click(screen.getByRole('button', { name: 'zorpli' }));
  expect(screen.getByText('Invented meaning.')).toBeInTheDocument();
  unmount(); db.close(); await db.open(); open(false);
  fireEvent.click((await screen.findAllByRole('button', { name: 'zorpli' }))[0]!);
  expect(screen.getByText('Invented meaning.')).toBeInTheDocument();
  expect(screen.queryByRole('form')).not.toBeInTheDocument();
  expect(await db.texts.toArray()).toEqual([{ ...text, packId: pack.id }]);
});

it('cancel closes the panel without writing, and changing words starts a fresh draft', async () => {
  const before = await snapshot(db);
  open(); fireEvent.click((await screen.findAllByRole('button', { name: 'zorpli' }))[0]!);
  fireEvent.change(screen.getByLabelText('Explanation'), { target: { value: 'Unsaved invented draft.' } });
  fireEvent.click(screen.getByRole('button', { name: 'blimzo' }));
  expect(screen.getByLabelText('Explanation')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('form')).not.toBeInTheDocument();
  expect(await snapshot(db)).toEqual(before);
});

it.each([
  ['empty', 'no matchable text'], ['duplicate', 'already matches an existing item'],
  ['overlap', 'overlaps an existing annotation'],
])('shows a clear %s error from real storage and writes nothing', async (failure, message) => {
  if (failure === 'empty') await db.texts.put({ ...text, packId: pack.id,
    segments: [{ id: 's', text: '\u0640' }] });
  open();
  fireEvent.click((await screen.findAllByRole('button', { name: failure === 'empty' ? '\u0640' : 'zorpli' }))[0]!);
  // Simulate another writer after the panel opens; the transaction must recheck current data.
  if (failure !== 'empty') await db.items.add({ packId: pack.id, id: 'existing',
    term: failure === 'duplicate' ? 'ZORPLI' : 'blimzo', explain: {} });
  if (failure === 'overlap') {
    const token = tokenize(text.segments[0]!.text)[0]!;
    await db.annotations.add({ packId: pack.id, textId: text.id, segment: 's',
      start: token.coreStart, end: token.coreEnd, item: 'existing' });
  }
  const before = await snapshot(db);
  fireEvent.change(screen.getByLabelText('Explanation'), { target: { value: 'Invented meaning.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save explanation' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.getByLabelText('Explanation')).toHaveValue('Invented meaning.');
  expect(await snapshot(db)).toEqual(before);
});

it('does not offer editing existing linked explanations', async () => {
  await db.items.add({ packId: pack.id, id: 'existing', term: 'zorpli',
    explain: { en: { meaning: 'Existing invented meaning.' } } });
  const before = await snapshot(db);
  open(); fireEvent.click((await screen.findAllByRole('button', { name: 'zorpli' }))[0]!);
  expect(screen.getByText('Existing invented meaning.')).toBeInTheDocument();
  expect(screen.queryByRole('form')).not.toBeInTheDocument();
  expect(await snapshot(db)).toEqual(before);
});

it('shows a clear cannot-save message rather than crashing when storage cannot open', async () => {
  db.close(); open();
  expect(await screen.findByRole('alert')).toHaveTextContent('cannot be saved in memory-only mode');
  expect(screen.queryByRole('form')).not.toBeInTheDocument();
});

it('keeps a failed write draft, changes no tables, and saves successfully on retry', async () => {
  open(); fireEvent.click((await screen.findAllByRole('button', { name: 'zorpli' }))[0]!);
  const before = await snapshot(db);
  const fail = vi.spyOn(db.annotations, 'add').mockImplementationOnce(() => { throw new Error('Synthetic failure'); });
  fireEvent.change(screen.getByLabelText('Explanation'), { target: { value: 'Invented meaning.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save explanation' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Changes could not be saved.');
  expect(screen.getByLabelText('Explanation')).toHaveValue('Invented meaning.');
  expect(await snapshot(db)).toEqual(before);
  fail.mockRestore();
  fireEvent.click(screen.getByRole('button', { name: 'Save explanation' }));
  await waitFor(() => expect(screen.queryByRole('form')).not.toBeInTheDocument());
  expect(await db.items.count()).toBe(1); expect(await db.annotations.count()).toBe(1);
});
