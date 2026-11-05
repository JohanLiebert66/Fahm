/// <reference types="vite/client" />
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storageFailure, storageErrorKeys } from '../storage/tx';
import en from './en.json';
import ar from './ar.json';
import i18n, {
  getInitialLanguage,
  setDocumentLanguage,
  changeLanguage,
  LANGUAGE_STORAGE_KEY,
} from './index';

describe('i18n translations', () => {
  const leaves = (value: object, prefix = ''): string[] => Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof entry === 'string' ? [path] : leaves(entry as object, path);
  });

  it('has matching nonempty leaf translations, including import and every storage error/next step', () => {
    expect(leaves(en).sort()).toEqual(leaves(ar).sort());
    const required = ['title', 'zip', 'folder', 'busy', 'imported', 'failed', 'conflict', 'validation',
      'errors', 'warnings', 'copy', 'replace', 'replaceWarning', 'confirm', 'cancel', 'backup',
      'backupReady', 'exportFailed', 'cancelled', 'back',
      ...['items', 'texts', 'annotations', 'assets', 'unbound'].map(key => `counts.${key}`),
      ...['path', 'duplicate', 'archive', 'format', 'entries', 'total', 'image', 'audio', 'read',
        'json', 'binding', 'identity', 'conflict'].map(key => `error.${key}`),
      ...['quotaUnavailable', 'lowSpace', 'unbound'].map(key => `warning.${key}`)]
      .map(key => `packImport.${key}`);
    for (const code of Object.keys(storageErrorKeys) as (keyof typeof storageErrorKeys)[]) {
      const { error } = storageFailure(code);
      required.push(error.messageKey, error.nextStepKey);
    }
    for (const lng of ['en', 'ar']) for (const key of required) {
      expect(i18n.exists(key, { lng }), `${lng}: ${key}`).toBe(true);
      expect(i18n.t(key, { lng }).trim()).not.toBe('');
      expect(i18n.t(key, { lng })).not.toBe(key);
    }
  });
  it('covers every literal pack issue key emitted recursively by core and storage', () => {
    const sources = import.meta.glob<string>(['../core/**/*.ts', '../storage/**/*.ts', '!../**/*.test.ts'],
      { eager: true, query: '?raw', import: 'default' });
    const emitted = new Set(Object.values(sources).flatMap(source =>
      Array.from(source.matchAll(/['"](packImport\.(?:error|warning)\.[a-zA-Z]+)['"]/g), match => match[1]!)));
    expect(emitted.size).toBeGreaterThan(10);
    for (const dictionary of [en, ar]) for (const key of emitted) {
      expect(leaves(dictionary), key).toContain(key);
    }
  });

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
