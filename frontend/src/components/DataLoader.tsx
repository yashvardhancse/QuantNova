import { useRef, useState } from 'react';

interface DataLoaderProps {
  onUpload: (file: File) => Promise<void>;
  onResetSample: () => Promise<void>;
  status: string;
  error: string | null;
}

export function DataLoader({ onUpload, onResetSample, status, error }: DataLoaderProps) {
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
      <p className="muted">
        Upload CSV/XLSX with date/time, open, high, low, close, and volume columns, or reset to the
        included sample.
      </p>
      <div className="button-row">
  <button 
    type="button" 
    className="btn-base btn-primary" // This makes the main action standout
    onClick={() => inputRef.current?.click()}
  >
    {isUploading ? 'Uploading...' : 'Upload File'}
  </button>
  
  <button
    type="button"
    className="btn-base btn-outline" // This makes the "Reset" a clear secondary action
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
