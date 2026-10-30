import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import en from './en.json';
import ar from './ar.json';
import i18n, {
  getInitialLanguage,
  setDocumentLanguage,
  changeLanguage,
  LANGUAGE_STORAGE_KEY,
} from './index';

describe('i18n translations', () => {
  it('en.json and ar.json have identical key sets', () => {
    const enKeys = Object.keys(en).sort();
    const arKeys = Object.keys(ar).sort();
    expect(enKeys).toEqual(arKeys);
  });

  it('contains all required shell and app keys', () => {
    const requiredKeys = [
      'appName',
      'learn',
      'play',
      'practice',
      'readWithMe',
      'teacher',
      'settings',
      'language',
    ];

    for (const key of requiredKeys) {
      expect(en).toHaveProperty(key);
      expect(ar).toHaveProperty(key);
    }
  });
});

describe('language initialization and persistence', () => {
  const originalNavigator = window.navigator;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
    document.documentElement.dir = '';
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('uses saved language choice from localStorage if valid', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'ar');
    expect(getInitialLanguage()).toBe('ar');

    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    expect(getInitialLanguage()).toBe('en');
  });

  it('falls back to browser language if saved language is absent', () => {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);

    Object.defineProperty(window, 'navigator', {
      value: { ...originalNavigator, language: 'ar-EG' },
      configurable: true,
    });
    expect(getInitialLanguage()).toBe('ar');

    Object.defineProperty(window, 'navigator', {
      value: { ...originalNavigator, language: 'en-US' },
      configurable: true,
    });
    expect(getInitialLanguage()).toBe('en');

    Object.defineProperty(window, 'navigator', {
      value: { ...originalNavigator, language: 'fr-FR' },
      configurable: true,
    });
    expect(getInitialLanguage()).toBe('en');
  });

  it('setDocumentLanguage sets lang and dir attributes correctly', () => {
    setDocumentLanguage('ar');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');

    setDocumentLanguage('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('changeLanguage updates i18n, documentElement, and localStorage', async () => {
    await changeLanguage('ar');
    expect(i18n.language).toBe('ar');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ar');

    await changeLanguage('en');
    expect(i18n.language).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });
});
