import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '../../i18n';
import { ModeProvider } from '../../app/ModeProvider';
import { TeacherGate } from '../../app/TeacherGate';
import { createDatabase, type FahmDatabase } from '../../storage/db';
import { seedPack } from '../../../tests/storageFixtures';
import { TeacherHome } from './TeacherHome';

let db: FahmDatabase;

beforeEach(() => {
  db = createDatabase(`test-teacher-home-${crypto.randomUUID()}`);
});

afterEach(async () => {
  await db.delete();
});

describe('TeacherHome', () => {
  it('links to the pack import tool with a large touch target', async () => {
    render(
      <MemoryRouter>
        <ModeProvider initialMode="teacher">
          <TeacherHome db={db} />
        </ModeProvider>
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: 'Import pack' });
    expect(link).toHaveAttribute('href', '/teacher/import');
    expect(link.className).toContain('min-h-[48px]');
    expect(link.className).toContain('min-w-[48px]');
    await screen.findByText('No packs imported yet.');
  });

  it('links to /about with a large touch target', async () => {
    render(
      <MemoryRouter>
        <ModeProvider initialMode="teacher">
          <TeacherHome db={db} />
        </ModeProvider>
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: 'About Fahm' });
    expect(link).toHaveAttribute('href', '/about');
    expect(link.className).toContain('min-h-[48px]');
    expect(link.className).toContain('min-w-[48px]');
    await screen.findByText('No packs imported yet.');
  });

  it('renders teacher placeholder and does not render a local exit button', async () => {
    render(
      <MemoryRouter initialEntries={['/teacher']}>
        <ModeProvider initialMode="teacher">
          <TeacherHome db={db} />
        </ModeProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Teacher Mode');
    expect(screen.queryByRole('button', { name: 'Exit teacher mode' })).not.toBeInTheDocument();
    await screen.findByText('No packs imported yet.');
  });

  it('displays the pack list and its packs', async () => {
    await seedPack(db, 'pack-alpha');
    render(
      <MemoryRouter>
        <ModeProvider initialMode="teacher">
          <TeacherHome db={db} />
        </ModeProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Classroom vocabulary')).toBeInTheDocument();
    expect(screen.getByText('pack-alpha')).toBeInTheDocument();
  });

  it('is redirected to / when accessed in child mode via TeacherGate', () => {
    render(
      <MemoryRouter initialEntries={['/teacher']}>
        <ModeProvider initialMode="child">
          <Routes>
            <Route path="/" element={<div>Child Screen</div>} />
            <Route
              path="/teacher"
              element={
                <TeacherGate>
                  <TeacherHome db={db} />
                </TeacherGate>
              }
            />
          </Routes>
        </ModeProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Child Screen')).toBeInTheDocument();
    expect(screen.queryByText('Teacher Mode')).not.toBeInTheDocument();
  });
});
