import { useState, useCallback } from 'react';
import { MapMode } from '../components/maps/MapModeControl';

export const useMapMode = (initialMode: MapMode = 'idle') => {
  const [mode, setMode] = useState<MapMode>(initialMode);
  const [previousMode, setPreviousMode] = useState<MapMode>('idle');

  const changeMode = useCallback((newMode: MapMode) => {
    setPreviousMode(mode);
    setMode(newMode);
  }, [mode]);

  const resetMode = useCallback(() => {
    setMode('idle');
  }, []);

  const toggleMode = useCallback((targetMode: MapMode) => {
    if (mode === targetMode) {
      setMode('idle');
    } else {
      setPreviousMode(mode);
      setMode(targetMode);
    }
  }, [mode]);

  return {
    mode,
    previousMode,
    changeMode,
    resetMode,
    toggleMode,
    isIdle: mode === 'idle',
    isDrawing: mode === 'draw',
    isAnalyzing: mode === 'analyze',
    isGallery: mode === 'gallery'
  };
};
