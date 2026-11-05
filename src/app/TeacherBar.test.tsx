import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { TeacherBar } from './TeacherBar';
import { ModeProvider } from './ModeProvider';
import { changeLanguage } from '../i18n';

function renderApp(initialEntries = ['/'], initialMode: 'child' | 'teacher' = 'child') {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ModeProvider initialMode={initialMode}>
        <App />
      </ModeProvider>
    </MemoryRouter>
  );
}

describe('TeacherBar component and integration', () => {
  beforeEach(async () => {
    localStorage.clear();
    await act(async () => {
      await changeLanguage('en');
    });
  });

  afterEach(async () => {
    localStorage.clear();
    await act(async () => {
      await changeLanguage('en');
    });
  });

  it('does not render in child mode on child home /', () => {
    renderApp(['/'], 'child');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByText('Teacher Mode')).not.toBeInTheDocument();
  });

  it('does not render in child mode on /read', () => {
    renderApp(['/read'], 'child');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('redirects /teacher to / in child mode and does not render the teacher bar', () => {
    renderApp(['/teacher'], 'child');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Teacher Mode' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Learn' })).toBeInTheDocument();
  });

  it('redirects /teacher/import to / in child mode and does not render the teacher bar', () => {
    renderApp(['/teacher/import'], 'child');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Import pack' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Learn' })).toBeInTheDocument();
  });

  it('renders teacher bar on /teacher in teacher mode with visible text, link, and button', () => {
    renderApp(['/teacher'], 'teacher');
    const nav = screen.getByRole('navigation', { name: 'Teacher mode navigation' });
    expect(nav).toBeInTheDocument();
    expect(screen.getAllByText('Teacher Mode').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: 'Teacher home' })).toHaveAttribute('href', '/teacher');
    expect(screen.getByRole('button', { name: 'Exit teacher mode' })).toBeInTheDocument();
  });

  it('renders teacher bar on /teacher/import in teacher mode', () => {
    renderApp(['/teacher/import'], 'teacher');
    expect(screen.getByRole('navigation', { name: 'Teacher mode navigation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Import pack' })).toBeInTheDocument();
  });

  it('renders teacher bar on /read in teacher mode', () => {
    renderApp(['/read'], 'teacher');
    expect(screen.getByRole('navigation', { name: 'Teacher mode navigation' })).toBeInTheDocument();
  });

  it('renders teacher bar on / in teacher mode', () => {
    renderApp(['/'], 'teacher');
    expect(screen.getByRole('navigation', { name: 'Teacher mode navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Learn' })).toBeInTheDocument();
  });

  it('navigates to /teacher when clicking Teacher home link from another screen', () => {
    renderApp(['/teacher/import'], 'teacher');
    expect(screen.getByRole('heading', { name: 'Import pack' })).toBeInTheDocument();

    const homeLink = screen.getByRole('link', { name: 'Teacher home' });
    fireEvent.click(homeLink);

    expect(screen.getByRole('heading', { level: 2, name: 'Teacher Mode' })).toBeInTheDocument();
  });

  it('switches to child mode and navigates to / when clicking Exit teacher mode', () => {
    renderApp(['/teacher/import'], 'teacher');
    expect(screen.getByRole('heading', { name: 'Import pack' })).toBeInTheDocument();

    const exitBtn = screen.getByRole('button', { name: 'Exit teacher mode' });
    fireEvent.click(exitBtn);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Learn' })).toBeInTheDocument();
  });

  it('ensures all interactive targets have >= 48px touch target classes and focus styling', () => {
    renderApp(['/teacher'], 'teacher');
    const nav = screen.getByRole('navigation', { name: 'Teacher mode navigation' });
    const homeLink = screen.getByRole('link', { name: 'Teacher home' });
    const exitBtn = screen.getByRole('button', { name: 'Exit teacher mode' });

    expect(homeLink.className).toMatch(/min-w-\[48px\]/);
    expect(homeLink.className).toMatch(/min-h-\[48px\]/);
    expect(homeLink.className).toContain('focus-visible:outline-none');

    expect(exitBtn.className).toMatch(/min-w-\[48px\]/);
    expect(exitBtn.className).toMatch(/min-h-\[48px\]/);
    expect(exitBtn.className).toContain('focus-visible:outline-none');

    // Sits in normal flow (not fixed or absolute) and wraps on narrow widths
    expect(nav.className).toContain('flex-wrap');
    expect(nav.className).not.toMatch(/\b(fixed|absolute)\b/);
  });

  it('renders localized labels in Arabic with RTL', async () => {
    await act(async () => {
      await changeLanguage('ar');
    });

    renderApp(['/teacher'], 'teacher');

    expect(screen.getByRole('navigation', { name: 'التنقل في وضع المعلم' })).toBeInTheDocument();
    expect(screen.getAllByText('وضع المعلم').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('link', { name: 'الرئيسية للمعلم' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'الخروج من وضع المعلم' })).toBeInTheDocument();
  });

  it('standalone component returns null when mode is not teacher', () => {
    const { container } = render(
      <MemoryRouter>
        <ModeProvider initialMode="child">
          <TeacherBar />
        </ModeProvider>
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });
});
