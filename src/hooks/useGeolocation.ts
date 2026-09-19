import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// useGeolocation — wraps the browser Geolocation API with React state.
//
// - On mount we call requestPosition() to prompt the user for GPS access.
// - If permission is denied or the position is unavailable we set an
//   error state so the UI can show a fallback + retry button (Feature #1).
// - The user can manually retry via the returned requestPosition() function.
// ---------------------------------------------------------------------------

export interface GeolocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

export interface GeolocationHook extends GeolocationState {
  requestPosition: () => void;
}

const INITIAL_STATE: GeolocationState = {
  lat: null,
  lng: null,
  accuracy: null,
  loading: true,
  error: null,
};

export function useGeolocation(autoRequest = true): GeolocationHook {
  const [state, setState] = useState<GeolocationState>(INITIAL_STATE);

  const requestPosition = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({
        ...INITIAL_STATE,
        loading: false,
        error: 'Geolocation is not supported by this browser.',
      });
      return;
    }

    setState({ ...INITIAL_STATE, loading: true, error: null });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          loading: false,
          error: null,
        });
      },
      (err) => {
        let message = 'Unable to get your location.';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Location permission denied. Enable location access to see nearby facilities.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Your position is unavailable. Try moving to an open area.';
        } else if (err.code === err.TIMEOUT) {
          message = 'Location request timed out. Try again.';
        }
        setState({ ...INITIAL_STATE, loading: false, error: message });
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  }, []);

  useEffect(() => {
    if (autoRequest) requestPosition();
  }, [autoRequest, requestPosition]);

  return { ...state, requestPosition };
}
