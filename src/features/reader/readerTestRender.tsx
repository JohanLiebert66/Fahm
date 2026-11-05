import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { FahmDatabase } from '../../storage/db';
import { ReaderPage } from './ReaderPage';
import type { AssetUrlProvider } from './readerData';
import { enPack, enText } from './readerTestFixtures';

export function renderReader(db: FahmDatabase, options: { packId?: string; textId?: string;
  windowSize?: number; assetProvider?: AssetUrlProvider } = {}) {
  const path = `/read/${options.packId ?? enPack.id}/${options.textId ?? enText.id}`;
  return render(<MemoryRouter initialEntries={[path]}>
    <Routes><Route path="/read/:packId/:textId" element={<ReaderPage db={db}
      windowSize={options.windowSize} assetProvider={options.assetProvider} />} /></Routes>
  </MemoryRouter>);
}
