import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../../i18n';
import { ModeProvider } from '../../app/ModeProvider';
import { TeacherHome } from './TeacherHome';

describe('TeacherHome', () => {
  it('links to the pack import tool with a large touch target', () => {
    render(<MemoryRouter><ModeProvider initialMode="teacher"><TeacherHome /></ModeProvider></MemoryRouter>);
    const link = screen.getByRole('link', { name: 'Import pack' });
    expect(link).toHaveAttribute('href', '/teacher/import');
    expect(link.className).toContain('min-h-[48px]');
    expect(link.className).toContain('min-w-[48px]');
  });
  it('renders teacher placeholder and does not render a local exit button', () => {
    render(
      <MemoryRouter initialEntries={['/teacher']}>
        <ModeProvider initialMode="teacher">
          <TeacherHome />
        </ModeProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Teacher Mode');
    expect(screen.queryByRole('button', { name: 'Exit teacher mode' })).not.toBeInTheDocument();
  });
});
