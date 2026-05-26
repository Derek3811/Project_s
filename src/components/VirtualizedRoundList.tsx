import React from 'react';
import { Virtuoso } from 'react-virtuoso';

interface VirtualizedRoundListProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  estimatedItemSize?: number;
}

export default function VirtualizedRoundList({ items, renderItem, estimatedItemSize = 400 }: VirtualizedRoundListProps) {
  return (
    <div style={{ height: '800px', width: '100%' }}>
      <Virtuoso
        style={{ height: '100%', width: '100%' }}
        data={items}
        itemContent={(index, item) => (
          <div style={{ paddingBottom: '32px' }}>
            {renderItem(item, index)}
          </div>
        )}
        className="scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
      />
    </div>
  );
}
