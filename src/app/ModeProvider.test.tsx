import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ModeProvider, useMode } from './ModeProvider';

describe('ModeProvider', () => {
  it('defaults to child mode and does not persist across new provider instances', () => {
    const { result, unmount } = renderHook(() => useMode(), {
      wrapper: ({ children }) => <ModeProvider>{children}</ModeProvider>,
    });

    expect(result.current.mode).toBe('child');
    expect(result.current.isTeacher).toBe(false);

    act(() => {
      result.current.enterTeacherMode();
    });

    expect(result.current.mode).toBe('teacher');
    expect(result.current.isTeacher).toBe(true);

    // Unmount simulating page reload or new session
    unmount();

    // A new instance always defaults to child mode (in-memory state)
    const { result: newResult } = renderHook(() => useMode(), {
      wrapper: ({ children }) => <ModeProvider>{children}</ModeProvider>,
    });

    expect(newResult.current.mode).toBe('child');
    expect(newResult.current.isTeacher).toBe(false);
  });

  it('allows exiting teacher mode back to child mode', () => {
    const { result } = renderHook(() => useMode(), {
      wrapper: ({ children }) => <ModeProvider initialMode="teacher">{children}</ModeProvider>,
    });

    expect(result.current.mode).toBe('teacher');
    expect(result.current.isTeacher).toBe(true);

    act(() => {
      result.current.exitTeacherMode();
    });

    expect(result.current.mode).toBe('child');
    expect(result.current.isTeacher).toBe(false);
  });

  it('throws an error if useMode is used outside ModeProvider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useMode());
    }).toThrow('useMode must be used within a ModeProvider');
    consoleErrorSpy.mockRestore();
  });
});
