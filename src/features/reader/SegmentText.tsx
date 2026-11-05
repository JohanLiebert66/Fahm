import { Fragment } from 'react';
import type { Segment } from '../../core/pack/types';
import { linkTokens, type LinkedToken, type ReaderAnnotation } from '../../core/reader/linkTokens';
import type { Item } from '../../core/pack/types';

interface SegmentTextProps {
  segment: Segment;
  items: Item[];
  annotations: ReaderAnnotation[];
  selected?: { segmentId: string; start: number };
  onSelect: (token: LinkedToken) => void;
}

export function SegmentText({ segment, items, annotations, selected, onSelect }: SegmentTextProps) {
  const { tokens } = linkTokens(segment, items, annotations);
  return <div className="space-y-2">
    {segment.ref && <bdi dir="ltr" className="isolate inline-block text-sm text-slate-500">{segment.ref}</bdi>}
    <p data-segment-text className="whitespace-pre-wrap text-2xl leading-loose">
      {tokens.map((token, index) => <Fragment key={token.start}>
        {segment.text.slice(tokens[index - 1]?.end ?? 0, token.start)}
        {token.itemId ? <>
          {segment.text.slice(token.start, token.coreStart)}
          <button type="button" onClick={() => onSelect(token)}
            aria-pressed={selected?.segmentId === segment.id && selected.start === token.start}
            className="min-h-[48px] min-w-[48px] rounded-lg bg-indigo-100 text-indigo-900 underline decoration-indigo-300 underline-offset-4 aria-pressed:bg-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            {segment.text.slice(token.coreStart, token.coreEnd)}
          </button>
          {segment.text.slice(token.coreEnd, token.end)}
        </> : token.text}
      </Fragment>)}
      {segment.text.slice(tokens.at(-1)?.end ?? 0)}
    </p>
  </div>;
}
