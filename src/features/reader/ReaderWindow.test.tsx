import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { changeLanguage } from '../../i18n';
import type { FahmDatabase } from '../../storage/db';
import { readerDatabase, enPack, enItems, enText } from './readerTestFixtures';
import { renderReader } from './readerTestRender';

let db: FahmDatabase;
beforeEach(async () => {
  db = await readerDatabase(); await changeLanguage('en');
  // Synthetic copies of fixture content, each with a unique segment identifier/reference.
  await db.texts.update([enPack.id, enText.id], { segments: Array.from({ length: 5 }, (_, index) => ({
    ...enText.segments[0]!, id: `segment-${index}`, ref: `Synthetic line ${index}`,
  })) });
  await db.annotations.clear();
});
afterEach(async () => { cleanup(); await db.delete(); });

it.each([{ size: undefined, count: 1 }, { size: 2, count: 2 }, { size: 3, count: 3 },
  { size: 99, count: 3 }, { size: 0, count: 1 }])('shows a bounded window ($size)', async ({ size, count }) => {
  const { container } = renderReader(db, { windowSize: size });
  await screen.findByText('Synthetic line 0');
  expect(container.querySelectorAll('[data-segment-text]')).toHaveLength(count);
});

it('moves a three-segment window one segment at a time with stable previous/next bounds', async () => {
  const { container } = renderReader(db, { windowSize: 3 });
  await screen.findByText('Synthetic line 0');
  const prev = screen.getByRole('button', { name: 'Previous' }), next = screen.getByRole('button', { name: 'Next' });
  expect(prev).toBeDisabled();
  fireEvent.click(next);
  expect(screen.queryByText('Synthetic line 0')).not.toBeInTheDocument();
  expect(screen.getByText('Synthetic line 3')).toBeInTheDocument();
  fireEvent.click(next);
  expect(screen.getByText('Synthetic line 4')).toBeInTheDocument();
  expect(next).toBeDisabled();
  fireEvent.click(next);
  expect(container.querySelectorAll('[data-segment-text]')).toHaveLength(3);
  fireEvent.click(prev); fireEvent.click(prev);
  expect(prev).toBeDisabled();
  expect(screen.getByText('Synthetic line 0')).toBeInTheDocument();
});

it('clears token selection when moving a segment', async () => {
  renderReader(db);
  fireEvent.click(await screen.findByRole('button', { name: enItems[0]!.term }));
  expect(screen.getByText(enItems[0]!.explain.en.meaning)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.queryByText(enItems[0]!.explain.en.meaning)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: enItems[0]!.term })).toHaveAttribute('aria-pressed', 'false');
});

it('disables both navigation buttons for an empty text', async () => {
  await db.texts.update([enPack.id, enText.id], { segments: [] });
  const { container } = renderReader(db);
  expect(await screen.findByRole('button', { name: 'Previous' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  expect(container.querySelectorAll('[data-segment-text]')).toHaveLength(0);
});
