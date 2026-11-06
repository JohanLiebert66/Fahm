import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ChildHome } from './ChildHome';
import { changeLanguage } from '../i18n';

describe('ChildHome', () => {
  beforeEach(async () => {
    await act(async () => {
      await changeLanguage('en');
    });
  });

  it('renders learning buttons and footer link to /about with >= 48px target', () => {
    render(
      <MemoryRouter>
        <ChildHome />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Learn' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Practice' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Read With Me' })).toBeInTheDocument();

    const aboutLink = screen.getByRole('link', { name: 'About Fahm' });
    expect(aboutLink).toHaveAttribute('href', '/about');
    expect(aboutLink.className).toContain('min-w-[48px]');
    expect(aboutLink.className).toContain('min-h-[48px]');
  });

  it('navigates to /read when Read With Me is clicked', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ChildHome />} />
          <Route path="/read" element={<div>Read Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Read With Me' }));
    expect(screen.getByText('Read Page')).toBeInTheDocument();
  });
});
