import { useState, useEffect, useCallback, useRef } from 'react';

export function useReplayEngine(totalLength: number) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(totalLength > 0 ? totalLength - 1 : 0);

  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  useEffect(() => {
    setCurrentIndex(totalLength > 0 ? totalLength - 1 : 0);
    setIsPlaying(false);
  }, [totalLength]);

  const animate = useCallback(
    (time: number) => {
      if (lastTimeRef.current !== undefined) {
        const deltaTime = time - lastTimeRef.current;

        // Base speed: 10 candles per second (100ms per candle) at 1x
        const delayPerCandle = 100 / playbackSpeed;

        if (deltaTime >= delayPerCandle) {
          setCurrentIndex((prev) => {
            if (prev >= totalLength - 1) {
              setIsPlaying(false);
              return totalLength - 1;
            }
            return prev + 1;
          });
          lastTimeRef.current = time;
        }
      } else {
        lastTimeRef.current = time;
      }

      if (isPlaying) {
        requestRef.current = requestAnimationFrame(animate);
      }
    },
    [isPlaying, playbackSpeed, totalLength],
  );

  useEffect(() => {
    if (isPlaying) {
      if (currentIndex >= totalLength - 1) {
        setCurrentIndex(0);
      }
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = undefined;
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate, currentIndex, totalLength]);

  const togglePlay = () => setIsPlaying((p) => !p);
  const pause = () => setIsPlaying(false);
  const reset = () => {
    setIsPlaying(false);
    setCurrentIndex(totalLength > 0 ? totalLength - 1 : 0);
  };

  return {
    isPlaying,
    togglePlay,
    pause,
    reset,
    playbackSpeed,
    setPlaybackSpeed,
    currentIndex,
    setCurrentIndex,
  };
}
