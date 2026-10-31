import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '../../i18n';
import { ModeProvider, useMode } from '../../app/ModeProvider';
import { TeacherHome } from './TeacherHome';

function ModeWatcher() {
  const { mode } = useMode();
  return <span data-testid="current-mode">{mode}</span>;
}

describe('TeacherHome', () => {
  it('renders teacher placeholder and exit button with >= 48px touch target', () => {
    render(
      <MemoryRouter initialEntries={['/teacher']}>
        <ModeProvider initialMode="teacher">
          <TeacherHome />
        </ModeProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Teacher Mode');
    const exitButton = screen.getByRole('button', { name: 'Exit teacher mode' });
    expect(exitButton).toBeInTheDocument();
    expect(exitButton.className).toMatch(/min-w-\[48px\]/);
    expect(exitButton.className).toMatch(/min-h-\[48px\]/);
  });

  it('clicking exit button exits teacher mode and navigates to /', () => {
    render(
      <MemoryRouter initialEntries={['/teacher']}>
        <ModeProvider initialMode="teacher">
          <ModeWatcher />
          <Routes>
            <Route path="/" element={<div>Child Screen Returned</div>} />
            <Route path="/teacher" element={<TeacherHome />} />
          </Routes>
        </ModeProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('current-mode')).toHaveTextContent('teacher');
    expect(screen.queryByText('Child Screen Returned')).not.toBeInTheDocument();

    const exitBtn = screen.getByRole('button', { name: 'Exit teacher mode' });
    fireEvent.click(exitBtn);

    expect(screen.getByTestId('current-mode')).toHaveTextContent('child');
    expect(screen.getByText('Child Screen Returned')).toBeInTheDocument();
  });
});
