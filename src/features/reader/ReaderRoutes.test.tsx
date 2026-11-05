import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../app/App';
import { ModeProvider } from '../../app/ModeProvider';
import { changeLanguage } from '../../i18n';
import * as database from '../../storage/db';
import { readerDatabase, enPack, enItems, enText } from './readerTestFixtures';

let db: database.FahmDatabase;
const connections: database.FahmDatabase[] = [];
beforeEach(async () => {
  db = await readerDatabase();
  const create = database.createDatabase;
  vi.spyOn(database, 'createDatabase').mockImplementation(() => {
    const connection = create(db.name);
    connections.push(connection);
    return connection;
  });
  await changeLanguage('en');
});
afterEach(async () => {
  cleanup(); vi.restoreAllMocks();
  for (const connection of connections.splice(0)) connection.close();
  await db.delete();
});
function open(path = '/') {
  return render(<MemoryRouter initialEntries={[path]}><ModeProvider><App /></ModeProvider></MemoryRouter>);
}

it('opens the picker from the child home card, then opens a text without entering teacher mode', async () => {
  open();
  fireEvent.click(screen.getByRole('button', { name: 'Read With Me' }));
  fireEvent.click(await screen.findByRole('link', { name: `${enPack.title.en} ${enText.title.en}` }));
  expect(await screen.findByRole('button', { name: enItems[0]!.term })).toBeInTheDocument();
  expect(screen.getByLabelText('Enter teacher mode (hold for 3 seconds)')).toBeInTheDocument();
  expect(screen.queryByLabelText('Choose ZIP file')).not.toBeInTheDocument();
});

it('opens /read directly in child mode', async () => {
  open('/read');
  expect(await screen.findByRole('link', { name: `${enPack.title.en} ${enText.title.en}` })).toBeInTheDocument();
});

it('opens a reader deep link in child mode', async () => {
  open(`/read/${enPack.id}/${enText.id}`);
  expect(await screen.findByRole('button', { name: enItems[0]!.term })).toBeInTheDocument();
});

it.each(['/teacher', '/teacher/import'])('keeps %s guarded', path => {
  open(path);
  expect(screen.getByRole('button', { name: 'Read With Me' })).toBeInTheDocument();
  expect(screen.queryByText('Teacher Mode')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Choose ZIP file')).not.toBeInTheDocument();
});
