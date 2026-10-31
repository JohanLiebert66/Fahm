import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HoldButton } from './HoldButton';

describe('HoldButton', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with accessible label and minimum 48px touch target', () => {
    render(
      <HoldButton aria-label="Hold to enter" onComplete={vi.fn()}>
        <span>Icon</span>
      </HoldButton>
    );

    const button = screen.getByRole('button', { name: 'Hold to enter' });
    expect(button).toBeInTheDocument();
    expect(button.className).toMatch(/min-w-\[48px\]/);
    expect(button.className).toMatch(/min-h-\[48px\]/);
    expect(button.className).toMatch(/touch-none/);
    expect(button.className).toMatch(/select-none/);
  });

  it('calls onComplete when pointer is held for full duration (3000ms)', () => {
    const onComplete = vi.fn();
    render(
      <HoldButton aria-label="Hold" onComplete={onComplete}>
        <span>Icon</span>
      </HoldButton>
    );

    const button = screen.getByRole('button', { name: 'Hold' });

    fireEvent.pointerDown(button, { button: 0 });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2990);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('cancels when pointer is released early', () => {
    const onComplete = vi.fn();
    const onCancel = vi.fn();
    render(
      <HoldButton aria-label="Hold" onComplete={onComplete} onCancel={onCancel}>
        <span>Icon</span>
      </HoldButton>
    );

    const button = screen.getByRole('button', { name: 'Hold' });

    fireEvent.pointerDown(button, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    fireEvent.pointerUp(button);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('cancels on pointerleave and pointercancel', () => {
    const onComplete = vi.fn();
    const onCancel = vi.fn();
    render(
      <HoldButton aria-label="Hold" onComplete={onComplete} onCancel={onCancel}>
        <span>Icon</span>
      </HoldButton>
    );

    const button = screen.getByRole('button', { name: 'Hold' });

    // pointerleave
    fireEvent.pointerDown(button, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.pointerLeave(button);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();

    // pointercancel
    fireEvent.pointerDown(button, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.pointerCancel(button);
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('supports keyboard hold with Space or Enter for 3 seconds', () => {
    const onComplete = vi.fn();
    render(
      <HoldButton aria-label="Hold" onComplete={onComplete}>
        <span>Icon</span>
      </HoldButton>
    );

    const button = screen.getByRole('button', { name: 'Hold' });

    // Test Space key
    fireEvent.keyDown(button, { key: ' ' });
    act(() => {
      vi.advanceTimersByTime(3050);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Test Enter key
    onComplete.mockClear();
    fireEvent.keyDown(button, { key: 'Enter' });
    act(() => {
      vi.advanceTimersByTime(3050);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('cancels on keyUp if released before full duration', () => {
    const onComplete = vi.fn();
    const onCancel = vi.fn();
    render(
      <HoldButton aria-label="Hold" onComplete={onComplete} onCancel={onCancel}>
        <span>Icon</span>
      </HoldButton>
    );

    const button = screen.getByRole('button', { name: 'Hold' });

    fireEvent.keyDown(button, { key: ' ' });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.keyUp(button, { key: ' ' });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('ignores keyboard repeat events', () => {
    const onComplete = vi.fn();
    render(
      <HoldButton aria-label="Hold" onComplete={onComplete}>
        <span>Icon</span>
      </HoldButton>
    );

    const button = screen.getByRole('button', { name: 'Hold' });

    fireEvent.keyDown(button, { key: 'Enter', repeat: false });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    // Simulate auto-repeat event from OS
    fireEvent.keyDown(button, { key: 'Enter', repeat: true });
    act(() => {
      vi.advanceTimersByTime(1550);
    });

    // Total 3000ms elapsed from initial keydown
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('cancels on window blur', () => {
    const onComplete = vi.fn();
    const onCancel = vi.fn();
    render(
      <HoldButton aria-label="Hold" onComplete={onComplete} onCancel={onCancel}>
        <span>Icon</span>
      </HoldButton>
    );

    const button = screen.getByRole('button', { name: 'Hold' });

    fireEvent.pointerDown(button, { button: 0 });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    fireEvent.blur(window);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('prevents default contextmenu on long-press', () => {
    render(
      <HoldButton aria-label="Hold" onComplete={vi.fn()}>
        <span>Icon</span>
      </HoldButton>
    );

    const button = screen.getByRole('button', { name: 'Hold' });
    const defaultPrevented = fireEvent.contextMenu(button);
    expect(defaultPrevented).toBe(false); // fireEvent returns false when preventDefault is called
  });
});
