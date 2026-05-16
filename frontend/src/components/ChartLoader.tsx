export default function ChartLoader() {
  return (
    <div
      className="chart-loader"
      aria-label="Loading chart workspace"
    >
      <div className="candles">
        <span className="candle candle-1"></span>
        <span className="candle candle-2"></span>
        <span className="candle candle-3"></span>
        <span className="candle candle-4"></span>
        <span className="candle candle-5"></span>
      </div>

      <p className="loader-text">Loading workspace...</p>
    </div>
  );
}