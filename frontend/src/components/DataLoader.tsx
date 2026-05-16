import { useRef, useState } from 'react';
import { TradingPair } from '../utils/types'; // CHANGED: import TradingPair for the pair selector props

interface DataLoaderProps {
  onUpload: (file: File) => Promise<void>;
  onResetSample: () => Promise<void>;
  status: string;
  error: string | null;
  // CHANGED: new props for the Binance pair selector
  pairs: TradingPair[];
  selectedPair: string;
  onPairChange: (symbol: string) => void;
}

export function DataLoader({
  onUpload,
  onResetSample,
  status,
  error,
  pairs,
  selectedPair,
  onPairChange,
}: DataLoaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  async function handleResetSample() {
    setIsUploading(true);
    try {
      await onResetSample();
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="terminal-panel data-panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Data</p>
          <h2>OHLCV loader</h2>
        </div>
      </div>

      {/* CHANGED: Binance pair selector with datalist autocomplete for popular pairs */}
      <label className="field" htmlFor="binance-pair-input">
        <span>Binance pair</span>
        <input
          id="binance-pair-input"
          type="text"
          list="binance-pairs-list"
          value={selectedPair}
          onChange={(event) => onPairChange(event.target.value.toUpperCase())}
          placeholder="e.g. BTCUSDT"
          aria-label="Binance pair"
        />
        <datalist id="binance-pairs-list">
          {pairs.map((pair) => (
            <option key={pair.symbol} value={pair.symbol} />
          ))}
        </datalist>
      </label>

      <p className="muted">
        Upload CSV/XLSX with date/time, open, high, low, close, and volume columns, or reset to the
        included sample.
      </p>
      <div className="button-row">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={handleResetSample}
          disabled={isUploading}
        >
          Reset sample
        </button>
      </div>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        aria-label="Upload OHLCV file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFileChange}
      />
      <p className={error ? 'status-text error-text' : 'status-text'}>{error ?? status}</p>
    </section>
  );
}
