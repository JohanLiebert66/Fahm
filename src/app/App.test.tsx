import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { App } from './App';
import { changeLanguage } from '../i18n';

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

  it('renders the header with ONLY the language toggle button', () => {
    render(<App />);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    // Header should contain the title
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Fahm');

    // Header has exactly one button: the language toggle
    const buttonsInHeader = header.querySelectorAll('button');
    expect(buttonsInHeader).toHaveLength(1);
    expect(buttonsInHeader[0]).toHaveTextContent('العربية');

    // Confirm no teacher or settings buttons exist anywhere
    expect(screen.queryByText(/teacher/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/المعلم/)).not.toBeInTheDocument();
    expect(screen.queryByText(/settings/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/الإعدادات/)).not.toBeInTheDocument();
  });

  it('renders exactly four large buttons for child mode', () => {
    render(<App />);

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
    render(<App />);

    const allButtons = screen.getAllByRole('button');
    expect(allButtons.length).toBeGreaterThanOrEqual(5); // 1 header toggle + 4 cards

    for (const btn of allButtons) {
      expect(btn.className).toMatch(/min-w-\[48px\]/);
      expect(btn.className).toMatch(/min-h-\[48px\]/);
    }
  });

  it('toggles language, switches direction to RTL, and updates UI labels', async () => {
    render(<App />);

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
