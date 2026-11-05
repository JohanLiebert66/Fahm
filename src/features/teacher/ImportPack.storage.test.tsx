import 'fake-indexeddb/auto';
import { StrictMode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import pack from '../../../tests/fixtures/en-vocab/pack.json';
import items from '../../../tests/fixtures/en-vocab/items.json';
import { changeLanguage } from '../../i18n';
import * as database from '../../storage/db';
import { ImportPack } from './ImportPack';

const connections: database.FahmDatabase[] = [];

it('localizes real validator diagnostics in Arabic while retaining file and field paths', async () => {
  await changeLanguage('ar');
  const db = database.createDatabase(`invalid-import-${crypto.randomUUID()}`);
  connections.push(db);
  render(<ImportPack db={db} />);
  fireEvent.change(screen.getByLabelText('اختر مجلداً'), { target: { files: [
    new File([JSON.stringify({ ...pack, schemaVersion: 99, extra: true })], 'pack.json'),
    new File([JSON.stringify([items[0], items[0]])], 'items.json'),
  ] } });
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('لم يتم استيراد الحزمة.'));
  expect(screen.getByRole('alert')).toHaveTextContent('إصدار مخطط الحزمة غير مدعوم');
  expect(screen.getByRole('alert')).toHaveTextContent('يوجد معرّف مكرر.');
  expect(screen.getByRole('status')).toHaveTextContent('تم تجاهل حقل غير معروف.');
  expect(screen.getByRole('alert')).toHaveTextContent('pack.json $.schemaVersion');
  expect(screen.getByRole('alert')).toHaveTextContent('items.json $[1].id');
  expect(document.body).not.toHaveTextContent('Unsupported schemaVersion');
  expect(document.body).not.toHaveTextContent('Duplicate item id');
  expect(document.body).not.toHaveTextContent('Unknown field ignored');
  expect(await db.packs.count()).toBe(0);
});

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  for (const db of connections.splice(0)) await db.delete();
});

it('imports through the real folder picker after Strict Mode effect cleanup and remount', async () => {
  await changeLanguage('en');
  const create = database.createDatabase;
  const name = `strict-import-${crypto.randomUUID()}`;
  vi.spyOn(database, 'createDatabase').mockImplementation(() => {
    const db = create(name); connections.push(db); return db;
  });
  render(<StrictMode><ImportPack /></StrictMode>);
  fireEvent.change(screen.getByLabelText('Choose folder'), { target: { files: [
    new File([JSON.stringify(pack)], 'pack.json'), new File([JSON.stringify(items)], 'items.json'),
  ] } });
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Pack imported.'));
  const current = connections.at(-1)!;
  expect(await current.packs.get(pack.id)).toMatchObject({ id: pack.id, meta: pack });
  expect(await current.items.count()).toBe(items.length);
});
