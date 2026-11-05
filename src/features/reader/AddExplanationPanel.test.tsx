import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AddExplanationPanel, type AddExplanationPanelProps } from './AddExplanationPanel';
import { changeLanguage } from '../../i18n';

const success = { ok: true, value: { ok: true, value: {
  item: { id: 'fixed', term: 'zorpli', explain: {} },
  annotation: { segment: 's', start: 0, end: 6, item: 'fixed' },
} } } as const;
function show(overrides: Partial<AddExplanationPanelProps> = {}) {
  const props = { word: '(zorpli),', packLanguage: 'fr', packDirection: 'ltr' as const,
    onSave: vi.fn(async () => success), onCancel: vi.fn(), onSaved: vi.fn(), ...overrides };
  render(<AddExplanationPanel {...props} />);
  return props;
}
beforeEach(async () => { await changeLanguage('en'); });
afterEach(cleanup);

it('shows the exact read-only stored word, defaults to pack language, and saves the chosen language', async () => {
  const props = show();
  expect(screen.getByText('(zorpli),')).toHaveAttribute('lang', 'fr');
  expect(screen.queryByRole('textbox', { name: 'Word' })).not.toBeInTheDocument();
  expect(screen.getByLabelText('Explanation language')).toHaveValue('fr');
  expect(screen.getByText('This explanation applies to every occurrence of the word.')).toBeInTheDocument();
  expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Explanation'), { target: { value: 'Invented meaning.' } });
  fireEvent.change(screen.getByLabelText('Explanation language'), { target: { value: 'ar' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save explanation' }));
  await waitFor(() => expect(props.onSaved).toHaveBeenCalledTimes(1));
  expect(props.onSave).toHaveBeenCalledExactlyOnceWith({ language: 'ar', meaning: 'Invented meaning.' });
});

it('blocks duplicate submit events and never confirms before the save commits', async () => {
  let complete!: () => void;
  const onSave = vi.fn(() => new Promise<typeof success>(resolve => { complete = () => resolve(success); }));
  const props = show({ onSave });
  fireEvent.change(screen.getByLabelText('Explanation'), { target: { value: 'Invented meaning.' } });
  const form = screen.getByRole('form', { name: 'Add explanation' });
  fireEvent.submit(form); fireEvent.submit(form);
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(props.onSaved).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Save explanation' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  await act(async () => complete());
  expect(props.onSaved).toHaveBeenCalledTimes(1);
});

it('cancel calls only cancel and never saves', () => {
  const props = show();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(props.onCancel).toHaveBeenCalledTimes(1); expect(props.onSave).not.toHaveBeenCalled();
});

it('shows a clear memory-only message and disables saving without storage', () => {
  show({ onSave: undefined });
  expect(screen.getByRole('alert')).toHaveTextContent('cannot be saved in memory-only mode');
  fireEvent.change(screen.getByLabelText('Explanation'), { target: { value: 'Invented meaning.' } });
  expect(screen.getByRole('button', { name: 'Save explanation' })).toBeDisabled();
});

it.each([
  ['emptyTerm', 'no matchable text'], ['duplicateTerm', 'already matches an existing item'],
  ['overlap', 'overlaps an existing annotation'], ['invalid', 'invalid or has changed'],
] as const)('shows a clear %s rejection, retains the draft, and permits retry', async (error, message) => {
  const props = show({ onSave: vi.fn(async () => ({ ok: true as const,
    value: { ok: false as const, errors: [error] } })) });
  fireEvent.change(screen.getByLabelText('Explanation'), { target: { value: 'Invented meaning.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save explanation' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.getByLabelText('Explanation')).toHaveValue('Invented meaning.');
  expect(screen.getByRole('button', { name: 'Save explanation' })).toBeEnabled();
  expect(props.onSaved).not.toHaveBeenCalled();
});

it.each(['unavailable', 'quota', 'throw'])('handles %s save failures without losing the draft', async failure => {
  const props = show({ onSave: async () => {
    if (failure === 'throw') throw new Error('Synthetic write failure');
    return { ok: false, error: failure === 'quota'
      ? { code: 'QuotaExceeded', messageKey: 'storage.error.quota', nextStepKey: 'storage.action.freeSpaceOrBackup' }
      : { code: 'StorageUnavailable', messageKey: 'storage.error.unavailable', nextStepKey: 'storage.action.useSupportedBrowser' } };
  } });
  fireEvent.change(screen.getByLabelText('Explanation'), { target: { value: 'Invented meaning.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save explanation' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(failure === 'unavailable'
    ? 'cannot be saved in memory-only mode' : failure === 'quota' ? 'not enough storage space' : 'Changes could not be saved');
  expect(screen.getByLabelText('Explanation')).toHaveValue('Invented meaning.');
  expect(props.onSaved).not.toHaveBeenCalled();
});

it('does not submit whitespace-only explanations even through a direct submit event', () => {
  const props = show();
  fireEvent.change(screen.getByLabelText('Explanation'), { target: { value: '   ' } });
  fireEvent.submit(screen.getByRole('form', { name: 'Add explanation' }));
  expect(props.onSave).not.toHaveBeenCalled();
});

it('renders localized Arabic UI while preserving the stored word and its direction', async () => {
  await changeLanguage('ar');
  show({ packDirection: 'rtl' });
  expect(screen.getByRole('form', { name: 'إضافة شرح' })).toBeInTheDocument();
  expect(screen.getByText('(zorpli),')).toHaveAttribute('dir', 'rtl');
  expect(screen.getByLabelText('لغة الشرح')).toHaveValue('fr');
});
