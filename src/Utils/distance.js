const EARTH_RADIUS_METERS = 6371000;

// Straight-line fallback used only when the Directions API call fails
// (e.g. no API key configured yet) so the booking flow still works.
export function haversineDistanceMeters(a, b) {
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_METERS * c;
}

export function formatDistance(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

export function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
}

// Simulated captain tracking has no real GPS feed to interpolate — this
// picks a plausible starting point `distanceMeters` away from `origin` at a
// random bearing, so the captain marker starts somewhere nearby rather than
// right on top of the pickup pin.
export function offsetCoordinate(origin, distanceMeters, bearingDegrees) {
  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;
  const bearing = toRad(bearingDegrees);
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
  const lat1 = toRad(origin.latitude);
  const lon1 = toRad(origin.longitude);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {latitude: toDeg(lat2), longitude: toDeg(lon2)};
}

// Straight-line interpolation between two coordinates, t in [0, 1] — good
// enough for a simulated "captain approaching" marker over a short distance;
// no need for great-circle interpolation at this scale.
export function lerpCoordinate(from, to, t) {
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * t,
    longitude: from.longitude + (to.longitude - from.longitude) * t,
  };
}
