import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { ModeProvider } from './ModeProvider';
import { changeLanguage } from '../i18n';
import { createDatabase } from '../storage/db';
import { storageRecords } from '../../tests/storageFixtures';

function renderApp(initialEntries = ['/'], initialMode: 'child' | 'teacher' = 'child') {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ModeProvider initialMode={initialMode}>
        <App />
      </ModeProvider>
    </MemoryRouter>
  );
}

describe('App Shell', () => {
  beforeEach(async () => {
    localStorage.clear();
    await act(async () => {
      await changeLanguage('en');
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('opens the import tool for teachers', () => {
    renderApp(['/teacher/import'], 'teacher');
    expect(screen.getByRole('heading', { name: 'Import pack' })).toBeInTheDocument();
  });

  it('does not expose import tools to child mode through a direct URL', () => {
    renderApp(['/teacher/import']);
    expect(screen.queryByLabelText('Choose ZIP file')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Learn' })).toBeInTheDocument();
  });

  it.each(['/read', '/read/synthetic-app/invented'])('wires teacher mode into the reader at %s and removes editing on exit', async path => {
    vi.useRealTimers();
    const db = createDatabase();
    const pack = storageRecords('synthetic-app').pack;
    const text = { packId: pack.id, id: 'invented', title: { en: 'Invented fixture' },
      segments: [{ id: 's', text: 'zorpli' }] };
    await db.packs.put(pack); await db.texts.put(text);
    try {
      renderApp([path], 'teacher');
      if (path === '/read') fireEvent.click(await screen.findByRole('link', { name: `${pack.meta.title.en} ${text.title.en}` }));
      fireEvent.click(await screen.findByRole('button', { name: 'zorpli' }));
      expect(screen.getByRole('form', { name: 'Add explanation' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Exit teacher mode' }));
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Read With Me' }));
      fireEvent.click(await screen.findByRole('link', { name: `${pack.meta.title.en} ${text.title.en}` }));
      await screen.findByRole('heading', { name: text.title.en });
      expect(screen.queryByRole('button', { name: 'zorpli' })).not.toBeInTheDocument();
      expect(await db.items.count()).toBe(0); expect(await db.annotations.count()).toBe(0);
    } finally { cleanup(); await db.delete(); }
  });

  it('renders the header with teacher entry button and language toggle in child mode', () => {
    renderApp();

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    // Header should contain the title
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fahm');

    // Header has the teacher gate button and language toggle
    const teacherGateBtn = screen.getByRole('button', {
      name: 'Enter teacher mode (hold for 3 seconds)',
    });
    expect(teacherGateBtn).toBeInTheDocument();

    const langToggle = screen.getByRole('button', { name: 'Language' });
    expect(langToggle).toBeInTheDocument();
    expect(langToggle).toHaveTextContent('العربية');
  });

  it('renders exactly four large buttons for child mode', () => {
    renderApp();

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    // Exactly 4 navigation buttons in main
    const buttonsInMain = main.querySelectorAll('button');
    expect(buttonsInMain).toHaveLength(4);

    expect(screen.getByRole('button', { name: 'Learn' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Practice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Read With Me' })).toBeInTheDocument();
  });

  it('ensures all interactive buttons have >= 48px touch target classes', () => {
    renderApp();

    const allButtons = screen.getAllByRole('button');
    expect(allButtons.length).toBeGreaterThanOrEqual(6); // 2 header buttons + 4 cards

    for (const btn of allButtons) {
      expect(btn.className).toMatch(/min-w-\[48px\]/);
      expect(btn.className).toMatch(/min-h-\[48px\]/);
    }
  });

  it('enters teacher mode after holding teacher gate button for 3 seconds', () => {
    vi.useFakeTimers();
    renderApp();

    const gateBtn = screen.getByRole('button', {
      name: 'Enter teacher mode (hold for 3 seconds)',
    });

    fireEvent.pointerDown(gateBtn, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(3050);
    });

    // Should now show teacher mode screen
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Teacher Mode');
    expect(screen.getByRole('button', { name: 'Exit teacher mode' })).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('toggles language, switches direction to RTL, and updates UI labels', async () => {
    renderApp();

    // Initial state: English / ltr
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(screen.getByText('Learn')).toBeInTheDocument();
    expect(screen.getByText('Read With Me')).toBeInTheDocument();

    const langToggle = screen.getByRole('button', { name: 'Language' });
    expect(langToggle).toHaveTextContent('العربية');

    // Click to switch to Arabic
    await act(async () => {
      fireEvent.click(langToggle);
    });

    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(langToggle).toHaveTextContent('English');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('فهم');
    expect(screen.getByText('تعلّم')).toBeInTheDocument();
    expect(screen.getByText('العب')).toBeInTheDocument();
    expect(screen.getByText('تدرّب')).toBeInTheDocument();
    expect(screen.getByText('اقرأ معي')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'الدخول إلى وضع المعلم (اضغط مطولاً لمدة 3 ثوانٍ)',
      })
    ).toBeInTheDocument();

    // Click again to switch back to English
    await act(async () => {
      fireEvent.click(langToggle);
    });

    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(langToggle).toHaveTextContent('العربية');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fahm');
    expect(screen.getByText('Learn')).toBeInTheDocument();
  });
});
