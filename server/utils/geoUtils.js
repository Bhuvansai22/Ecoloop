/**
 * Geospatial Utility
 * Haversine formula for distance calculation
 * (No Maps API billing on the server side)
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 */
function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Calculate distance between two lat/lng points using Haversine formula
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in kilometres
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Build a MongoDB $geoWithin query for radius search
 * @param {number} lat       - Center latitude
 * @param {number} lng       - Center longitude
 * @param {number} radiusKm  - Radius in km
 * @returns MongoDB geospatial query object
 */
function buildGeoNearQuery(lat, lng, radiusKm) {
  return {
    $geoWithin: {
      $centerSphere: [[lng, lat], radiusKm / 6371], // Mongoose uses radians
    },
  };
}

module.exports = { haversineDistance, buildGeoNearQuery };
