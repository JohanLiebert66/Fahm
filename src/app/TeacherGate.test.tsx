import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ModeProvider, useMode } from './ModeProvider';
import { TeacherGate } from './TeacherGate';

function ModeSwitcher() {
  const { mode, exitTeacherMode } = useMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <button type="button" onClick={exitTeacherMode}>
        Switch to Child
      </button>
    </div>
  );
}

describe('TeacherGate & Route Guard', () => {
  it('redirects to / when accessing /teacher in child mode', () => {
    render(
      <MemoryRouter initialEntries={['/teacher']}>
        <ModeProvider initialMode="child">
          <Routes>
            <Route path="/" element={<div>Child Home</div>} />
            <Route
              path="/teacher"
              element={
                <TeacherGate>
                  <div>Teacher Secret Area</div>
                </TeacherGate>
              }
            />
          </Routes>
        </ModeProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Child Home')).toBeInTheDocument();
    expect(screen.queryByText('Teacher Secret Area')).not.toBeInTheDocument();
  });

  it('allows access to /teacher when in teacher mode', () => {
    render(
      <MemoryRouter initialEntries={['/teacher']}>
        <ModeProvider initialMode="teacher">
          <Routes>
            <Route path="/" element={<div>Child Home</div>} />
            <Route
              path="/teacher"
              element={
                <TeacherGate>
                  <div>Teacher Secret Area</div>
                </TeacherGate>
              }
            />
          </Routes>
        </ModeProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Teacher Secret Area')).toBeInTheDocument();
    expect(screen.queryByText('Child Home')).not.toBeInTheDocument();
  });

  it('redirects to / when mode switches to child while on /teacher route', () => {
    render(
      <MemoryRouter initialEntries={['/teacher']}>
        <ModeProvider initialMode="teacher">
          <Routes>
            <Route path="/" element={<div>Child Home</div>} />
            <Route
              path="/teacher"
              element={
                <TeacherGate>
                  <div>
                    <div>Teacher Secret Area</div>
                    <ModeSwitcher />
                  </div>
                </TeacherGate>
              }
            />
          </Routes>
        </ModeProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Teacher Secret Area')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Switch to Child' }));
    });

    expect(screen.getByText('Child Home')).toBeInTheDocument();
    expect(screen.queryByText('Teacher Secret Area')).not.toBeInTheDocument();
  });
});
