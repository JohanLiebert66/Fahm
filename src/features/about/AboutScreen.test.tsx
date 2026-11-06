import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { changeLanguage } from '../../i18n';
import { createDatabase, type FahmDatabase } from '../../storage/db';
import { storageRecords } from '../../../tests/storageFixtures';
import { AboutScreen } from './AboutScreen';
import { storageErrorKeys } from '../../storage/tx';
import * as packSummaryModule from '../../storage/packSummary';

let db: FahmDatabase;

beforeEach(async () => {
  await act(async () => {
    await changeLanguage('en');
  });
  db = createDatabase(`test-about-${crypto.randomUUID()}`);
});

afterEach(async () => {
  await db.delete();
});

function renderAbout(customDb?: FahmDatabase) {
  return render(
    <MemoryRouter>
      <AboutScreen db={customDb ?? db} />
    </MemoryRouter>
  );
}

describe('AboutScreen', () => {
  it('shows empty state when no packs are imported', async () => {
    renderAbout();
    expect(await screen.findByText('No packs imported yet.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Fahm' })).toBeInTheDocument();
    expect(screen.getByText('An open-source app to explore and learn with rich multimedia packs.')).toBeInTheDocument();
    expect(screen.getByText('Code licensed under the MIT License.')).toBeInTheDocument();
  });

  it('lists credits for several packs with title, id, source, and license', async () => {
    const row1 = storageRecords('synthetic-pack-one');
    row1.pack.meta.title = { en: 'Synthetic Pack One', ar: 'حزمة تجريبية أولى' };
    row1.pack.meta.source = 'Invented test source description';
    row1.pack.meta.license = 'CC0-1.0';

    const row2 = storageRecords('synthetic-pack-two');
    row2.pack.meta.title = { en: 'Synthetic Pack Two' };
    row2.pack.meta.source = 'https://example.com/pack-two';
    row2.pack.meta.license = 'MIT';

    await db.packs.bulkAdd([row1.pack, row2.pack]);

    renderAbout();

    expect(await screen.findByText('Synthetic Pack One')).toBeInTheDocument();
    expect(screen.getByText('Synthetic Pack Two')).toBeInTheDocument();
    expect(screen.getByText('ID: synthetic-pack-one')).toBeInTheDocument();
    expect(screen.getByText('ID: synthetic-pack-two')).toBeInTheDocument();
    expect(screen.getByText('Invented test source description')).toBeInTheDocument();
    expect(screen.getByText('CC0-1.0')).toBeInTheDocument();
    expect(screen.getByText('MIT')).toBeInTheDocument();
  });

  it('renders a link only when source is a URL, opening in a new tab with rel noopener noreferrer', async () => {
    const rowUrl = storageRecords('pack-with-url');
    rowUrl.pack.meta.source = 'https://example.com/source-repo';

    const rowPlain = storageRecords('pack-plain-source');
    rowPlain.pack.meta.source = 'Synthetic non-url source attribution';

    await db.packs.bulkAdd([rowUrl.pack, rowPlain.pack]);

    renderAbout();

    const link = await screen.findByRole('link', { name: 'https://example.com/source-repo' });
    expect(link).toHaveAttribute('href', 'https://example.com/source-repo');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    expect(screen.queryByRole('link', { name: 'Synthetic non-url source attribution' })).not.toBeInTheDocument();
    expect(screen.getByText('Synthetic non-url source attribution')).toBeInTheDocument();
  });

  it('renders copyright notice in collapsed details in a pre with dir ltr preserving exact whitespace', async () => {
    const noticeText = [
      'PLEASE DO NOT MODIFY THIS NOTICE',
      '================================',
      '  Line with two leading spaces',
      '',
      'End of notice.',
    ].join('\n');

    const row = storageRecords('pack-with-notice');
    row.pack.meta.description = noticeText;
    await db.packs.add(row.pack);

    renderAbout();

    const summary = await screen.findByText('Copyright notice');
    expect(summary).toBeInTheDocument();

    const details = summary.closest('details');
    expect(details).toBeInTheDocument();
    expect(details).not.toHaveAttribute('open');

    const pre = details?.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre).toHaveAttribute('dir', 'ltr');
    expect(pre?.textContent).toBe(noticeText);
  });

  it('displays the existing clear message when storage is unavailable', async () => {
    const spy = vi.spyOn(packSummaryModule, 'getPackSummaries').mockResolvedValue({
      ok: false,
      error: {
        code: 'StorageUnavailable',
        messageKey: storageErrorKeys.StorageUnavailable,
        nextStepKey: 'storage.action.useSupportedBrowser',
      },
    });

    try {
      renderAbout();
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Local storage is unavailable.');
      expect(alert).toHaveTextContent('Use a supported browser with local storage enabled.');
    } finally {
      spy.mockRestore();
    }
  });

  it('renders Arabic UI without hard-coded English', async () => {
    await act(async () => {
      await changeLanguage('ar');
    });

    const row = storageRecords('pack-arabic');
    row.pack.meta.title = { ar: 'حزمة تجريبية', en: 'Test Pack' };
    row.pack.meta.description = 'Notice in Arabic test';
    await db.packs.add(row.pack);

    renderAbout();

    expect(await screen.findByText('حزمة تجريبية')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'فهم' })).toBeInTheDocument();
    expect(screen.getByText('حقوق المحتوى')).toBeInTheDocument();
    expect(screen.getByText('الرمز البرمجي مرخص بموجب رخصة MIT.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'رجوع' })).toBeInTheDocument();
    expect(screen.getByText('إشعار حقوق النشر')).toBeInTheDocument();
  });

  it('has accessible back button with large touch target', async () => {
    renderAbout();
    expect(await screen.findByText('No packs imported yet.')).toBeInTheDocument();
    const backLink = screen.getByRole('link', { name: 'Back' });
    expect(backLink).toHaveAttribute('href', '/');
    expect(backLink.className).toContain('min-w-[48px]');
    expect(backLink.className).toContain('min-h-[48px]');
  });
});
