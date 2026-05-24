import { useMemo, useState } from "react"
import { X } from "lucide-react"

const INDICATORS = [
  "SMA",
  "EMA",
  "RSI",
  "MACD",
  "VWAP",
  "Bollinger Bands",
  "ATR",
  "Supertrend",
]

export default function IndicatorPanel() {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  const filteredIndicators = useMemo(() => {
    return INDICATORS.filter(
      indicator =>
        indicator.toLowerCase().includes(query.toLowerCase()) &&
        !selected.includes(indicator)
    )
  }, [query, selected])

  const handleSelect = (indicator: string) => {
    setSelected(prev => [...prev, indicator])
    setQuery("")
    setOpen(false)
  }

  const removeIndicator = (indicator: string) => {
    setSelected(prev => prev.filter(i => i !== indicator))
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
        <div className="mb-4 flex flex-wrap gap-2">
          {selected.map(indicator => (
            <div
              key={indicator}
              className="flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-300"
            >
              <span>{indicator}</span>

              <button
                onClick={() => removeIndicator(indicator)}
                className="transition hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={query}
            placeholder="Search indicators..."
            onFocus={() => setOpen(true)}
            onChange={e => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
          />

          {open && filteredIndicators.length > 0 && (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl">
              {filteredIndicators.map(indicator => (
                <button
                  key={indicator}
                  onClick={() => handleSelect(indicator)}
                  className="w-full px-4 py-3 text-left text-zinc-200 transition hover:bg-zinc-800"
                >
                  {indicator}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
