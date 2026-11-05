import { describe, it, expect, vi } from 'vitest';
import { useRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Dialog isOpen={false} onClose={() => {}} titleId="dlg-title" title="Test">
        <p>Content</p>
      </Dialog>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders with accessibility attributes when isOpen is true', () => {
    render(
      <Dialog isOpen={true} onClose={() => {}} titleId="dlg-title" title="Test Title">
        <p>Dialog Body</p>
      </Dialog>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'dlg-title');
    expect(screen.getByText('Test Title')).toHaveAttribute('id', 'dlg-title');
    expect(screen.getByText('Dialog Body')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <Dialog isOpen={true} onClose={onClose} titleId="dlg-title" title="Test Title">
        <p>Body</p>
      </Dialog>
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape when disableClose is true', () => {
    const onClose = vi.fn();
    render(
      <Dialog isOpen={true} onClose={onClose} titleId="dlg-title" title="Test Title" disableClose={true}>
        <p>Body</p>
      </Dialog>
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when clicking the backdrop', () => {
    const onClose = vi.fn();
    render(
      <Dialog isOpen={true} onClose={onClose} titleId="dlg-title" title="Test Title">
        <p>Body</p>
      </Dialog>
    );
    fireEvent.click(screen.getByRole('presentation'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sets initial focus on the provided initialFocusRef element', () => {
    function Wrapper() {
      const btnRef = useRef<HTMLButtonElement>(null);
      return (
        <Dialog isOpen={true} onClose={() => {}} titleId="dlg-title" title="Test" initialFocusRef={btnRef}>
          <button ref={btnRef}>Focus Me</button>
        </Dialog>
      );
    }
    render(<Wrapper />);
    expect(screen.getByRole('button', { name: 'Focus Me' })).toHaveFocus();
  });
});
