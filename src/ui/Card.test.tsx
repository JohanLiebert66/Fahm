import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from './Card';

describe('Card component', () => {
  it('renders children and applies container styling', () => {
    render(<Card><span>Card Content</span></Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders interactive button with accessible attributes and >= 48px sizing when onClick is provided', () => {
    const handleClick = vi.fn();
    render(
      <Card onClick={handleClick} aria-label="Interactive Item">
        <span>Clickable</span>
      </Card>
    );

    const btn = screen.getByRole('button', { name: 'Interactive Item' });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('min-w-[48px]');
    expect(btn.className).toContain('min-h-[48px]');

    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard enter and space when rendered as custom element with onClick', () => {
    const handleClick = vi.fn();
    render(
      <Card as="div" onClick={handleClick} role="button" aria-label="Div Button">
        <span>Div Button</span>
      </Card>
    );

    const cardDiv = screen.getByRole('button', { name: 'Div Button' });
    expect(cardDiv.tabIndex).toBe(0);

    fireEvent.keyDown(cardDiv, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(cardDiv, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});
