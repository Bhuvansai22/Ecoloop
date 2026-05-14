/**
 * Carbon Calculator Utility
 * Estimates CO₂ saved (in kg) by reusing a waste material
 * instead of disposing/producing it from virgin resources
 *
 * Source: Approximate values based on IPCC, EPA, and Ellen MacArthur Foundation data
 */

// kg CO₂ saved per tonne of material reused
const CARBON_FACTORS = {
  'Metal Scrap':            1800, // Steel/aluminium scrap recycling saves ~1.8 t CO2/tonne
  'Plastics':                600, // Mixed plastic recycling
  'Paper & Cardboard':       700, // Paper recycling
  'Glass':                   300, // Glass recycling
  'Organic Waste':           250, // Composting vs landfill
  'Textiles':                400, // Textile reuse
  'Chemical Waste':          150, // Safe disposal diversion (conservative)
  'Electronic Waste':       1000, // E-waste contains rare metals
  'Wood & Timber':           400, // Reuse instead of incineration
  'Rubber':                  200, // Ground rubber reuse
  'Concrete & Construction': 100, // Aggregate reuse
  'Other':                   200, // Default fallback
};

/**
 * Calculate carbon saved for a transaction
 * @param {string} category   - Material category
 * @param {number} quantity   - Quantity
 * @param {string} unit       - 'tonnes' | 'kg' | 'litres' | 'units' | 'cubic metres'
 * @returns {number}          - CO₂ saved in kg
 */
function calculateCarbonSaved(category, quantity, unit = 'tonnes') {
  const factor = CARBON_FACTORS[category] || CARBON_FACTORS['Other'];

  // Normalize to tonnes for the calculation
  let tonnes = quantity;
  switch (unit) {
    case 'kg':      tonnes = quantity / 1000; break;
    case 'litres':  tonnes = quantity / 1000; break; // ~1 L ≈ 1 kg for most liquids
    case 'units':   tonnes = quantity * 0.01;  break; // rough assumption: 10 kg/unit
    case 'cubic metres': tonnes = quantity * 0.8; break; // rough density
    default:        tonnes = quantity; // already tonnes
  }

  return Math.round(factor * tonnes);
}

/**
 * Get the carbon factor for a given category
 */
function getCarbonFactor(category) {
  return CARBON_FACTORS[category] || CARBON_FACTORS['Other'];
}

/**
 * Convert kg CO2 to human-readable equivalent
 * (e.g. equivalent trees planted, car km driven)
 */
function carbonEquivalents(kgCO2) {
  return {
    treesPlanted:     Math.round(kgCO2 / 22),       // 1 tree absorbs ~22 kg CO2/year
    carKmAvoided:     Math.round(kgCO2 / 0.17),     // avg petrol car: 0.17 kg CO2/km
    flightHours:      +(kgCO2 / 90).toFixed(1),     // short-haul flight: ~90 kg CO2/hr
    householdDays:    Math.round(kgCO2 / 12),        // avg household: ~12 kg CO2/day
  };
}

module.exports = { calculateCarbonSaved, getCarbonFactor, carbonEquivalents, CARBON_FACTORS };
