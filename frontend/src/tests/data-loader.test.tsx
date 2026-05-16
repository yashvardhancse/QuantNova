import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataLoader } from '../components/DataLoader';
import { TradingPair } from '../utils/types';

const pairs: TradingPair[] = [
  { symbol: 'BTCUSDT', base_asset: 'BTC', quote_asset: 'USDT' },
  { symbol: 'ETHUSDT', base_asset: 'ETH', quote_asset: 'USDT' },
  { symbol: 'BNBUSDT', base_asset: 'BNB', quote_asset: 'USDT' },
];

describe('DataLoader pair selector', () => {
  it('renders the pair input showing the current selectedPair', () => {
    render(
      <DataLoader
        onUpload={vi.fn()}
        onResetSample={vi.fn()}
        status="Ready"
        error={null}
        pairs={pairs}
        selectedPair="BTCUSDT"
        onPairChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Binance pair')).toBeInTheDocument();
    expect(screen.getByDisplayValue('BTCUSDT')).toBeInTheDocument();
  });

  it('calls onPairChange when the user types a new symbol', async () => {
    const user = userEvent.setup();
    const onPairChange = vi.fn();

    render(
      <DataLoader
        onUpload={vi.fn()}
        onResetSample={vi.fn()}
        status="Ready"
        error={null}
        pairs={pairs}
        selectedPair=""
        onPairChange={onPairChange}
      />,
    );

    await user.type(screen.getByLabelText('Binance pair'), 'ETH');

    expect(onPairChange).toHaveBeenCalled();
  });

  it('renders datalist options for all popular pairs', () => {
    render(
      <DataLoader
        onUpload={vi.fn()}
        onResetSample={vi.fn()}
        status="Ready"
        error={null}
        pairs={pairs}
        selectedPair=""
        onPairChange={vi.fn()}
      />,
    );

    pairs.forEach((pair) => {
      expect(document.querySelector(`option[value="${pair.symbol}"]`)).toBeInTheDocument();
    });
  });

  it('renders with empty pairs list without crashing', () => {
    render(
      <DataLoader
        onUpload={vi.fn()}
        onResetSample={vi.fn()}
        status="Ready"
        error={null}
        pairs={[]}
        selectedPair="BTCUSDT"
        onPairChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Binance pair')).toBeInTheDocument();
  });
});
