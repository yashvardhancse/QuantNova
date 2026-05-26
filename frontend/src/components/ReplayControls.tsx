import { ChangeEvent } from 'react';

interface ReplayControlsProps {
  isPlaying: boolean;
  togglePlay: () => void;
  pause: () => void;
  reset: () => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  totalLength: number;
}

export function ReplayControls({
  isPlaying,
  togglePlay,
  reset,
  playbackSpeed,
  setPlaybackSpeed,
  currentIndex,
  setCurrentIndex,
  totalLength,
}: ReplayControlsProps) {
  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrentIndex(Number(e.target.value));
  };

  const handleSpeedChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPlaybackSpeed(Number(e.target.value));
  };

  return (
    <section className="terminal-panel controls-panel replay-controls">
      <div className="panel-heading">
        <span className="eyebrow">Replay Engine</span>
        <h2>Timeline Controls</h2>
      </div>

      <div className="button-row">
        <button className="run-button" onClick={togglePlay}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button className="ghost-button" onClick={reset}>
          Reset
        </button>
      </div>

      <label className="field" style={{ marginTop: '16px' }}>
        <span>
          Timeline ({currentIndex + 1} / {totalLength})
        </span>
        <input
          type="range"
          min="0"
          max={totalLength > 0 ? totalLength - 1 : 0}
          value={currentIndex}
          onChange={handleSliderChange}
          disabled={totalLength === 0}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </label>

      <label className="field">
        <span>Playback Speed</span>
        <select value={playbackSpeed} onChange={handleSpeedChange}>
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={5}>5x</option>
          <option value={10}>10x</option>
        </select>
      </label>
    </section>
  );
}
