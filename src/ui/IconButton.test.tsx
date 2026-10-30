import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IconButton } from './IconButton';

describe('IconButton component', () => {
  it('renders with accessible name and touch target sizing', () => {
    render(
      <IconButton aria-label="Close dialog">
        <span>X</span>
      </IconButton>
    );

    const btn = screen.getByRole('button', { name: 'Close dialog' });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('min-w-[48px]');
    expect(btn.className).toContain('min-h-[48px]');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(
      <IconButton aria-label="Action" onClick={handleClick}>
        <span>Click</span>
      </IconButton>
    );

    const btn = screen.getByRole('button', { name: 'Action' });
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state', () => {
    const handleClick = vi.fn();
    render(
      <IconButton aria-label="Disabled action" disabled onClick={handleClick}>
        <span>Click</span>
      </IconButton>
    );

    const btn = screen.getByRole('button', { name: 'Disabled action' });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
