import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { LocationWithDetails } from '@/lib/types';

// ---------------------------------------------------------------------------
// MapView — Leaflet map showing nearby facilities (Feature #1).
//
// We use Leaflet directly (no react-leaflet wrapper) to keep the bundle
// small and the logic transparent.  The map is created once in a
// useEffect and updated when locations / user position change.
//
// Pins:
//   - Toilet   → teal pin with "T"
//   - Water ATM → seafoam pin with "W"
//   - Locked   → coral pin
//   - Maintenance → amber pin
// ---------------------------------------------------------------------------

interface MapViewProps {
  locations: LocationWithDetails[];
  userLat: number | null;
  userLng: number | null;
  onSelectLocation: (loc: LocationWithDetails) => void;
  /** A key that changes when we want to re-center on the user (e.g. button press). */
  recenterKey: number;
}

// Fix Leaflet's default marker icon path (we use custom pins instead,
// but this avoids console errors).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;

function createPinIcon(location: LocationWithDetails): L.DivIcon {
  let pinClass = 'cleanspot-pin';
  if (location.latestStatus && !location.statusExpired) {
    if (location.latestStatus.status === 'locked') pinClass += ' cleanspot-pin-locked';
    else if (location.latestStatus.status === 'maintenance') pinClass += ' cleanspot-pin-maintenance';
    else if (location.type === 'toilet') pinClass += ' cleanspot-pin-toilet';
    else pinClass += ' cleanspot-pin-water';
  } else {
    pinClass += location.type === 'toilet' ? ' cleanspot-pin-toilet' : ' cleanspot-pin-water';
  }

  const label = location.type === 'toilet' ? 'T' : 'W';

  return L.divIcon({
    className: '',
    html: `<div class="${pinClass}"><span class="cleanspot-pin-inner">${label}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

export function MapView({ locations, userLat, userLng, onSelectLocation, recenterKey }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // --- Create the map once ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default center: Kanniyakumari district (Nagercoil area).
    const map = L.map(containerRef.current, {
      center: [8.18, 77.43],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // --- Update location markers when locations change ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers.
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers.
    for (const loc of locations) {
      const marker = L.marker([loc.latitude, loc.longitude], { icon: createPinIcon(loc) });
      marker.bindPopup(
        `<strong>${loc.name}</strong><br/>${loc.type === 'toilet' ? 'Toilet' : 'Water ATM'}`,
      );
      marker.on('click', () => onSelectLocation(loc));
      marker.addTo(map);
      markersRef.current.push(marker);
    }
  }, [locations, onSelectLocation]);

  // --- Update / add user position marker ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLat !== null && userLng !== null) {
      const userIcon = L.divIcon({
        className: '',
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#028090;border:3px solid #fff;box-shadow:0 0 8px rgba(2,128,144,0.5);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup('You are here');
    }
  }, [userLat, userLng]);

  // --- Re-center on user when recenterKey changes ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || userLat === null || userLng === null) return;
    map.setView([userLat, userLng], 15, { animate: true });
  }, [recenterKey, userLat, userLng]);

  return <div ref={containerRef} className="h-full w-full" />;
}
