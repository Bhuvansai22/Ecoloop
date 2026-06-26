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
function calculateCarbonSaved(category, quantity, unit = 'kg', customFactor = null) {
  if (customFactor !== null && customFactor !== undefined && customFactor !== '') {
    return Math.round(Number(customFactor) * Number(quantity));
  }

  const factor = CARBON_FACTORS[category] || CARBON_FACTORS['Other'];

  // Normalize to tonnes for the calculation
  let tonnes = quantity;
  switch (unit) {
    case 'kg':      tonnes = quantity / 1000; break;
    case 'litres':  tonnes = quantity / 1000; break; // ~1 L ≈ 1 kg for most liquids
    case 'units':   tonnes = quantity * 0.01;  break; // rough assumption: 10 kg/unit
    case 'cubic metres': tonnes = quantity * 0.8; break; // rough density
    case 'tonnes':  tonnes = quantity; break;
    default:        tonnes = quantity / 1000;
  }

  return Math.round(factor * tonnes);
}

/**
 * Get the carbon factor for a given category
 */
function getCarbonFactor(category) {
  return CARBON_FACTORS[category] || CARBON_FACTORS['Other'];
}

module.exports = { calculateCarbonSaved, getCarbonFactor, CARBON_FACTORS };
