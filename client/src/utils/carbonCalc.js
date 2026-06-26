export const calculateCarbonSaved = (category, quantity, unit = 'kg', customFactor = null) => {
  if (customFactor !== null && customFactor !== undefined && customFactor !== '') {
    return Math.round(Number(customFactor) * Number(quantity));
  }

  const CARBON_FACTORS = {
    'Metal Scrap': 1800, 'Plastics': 600, 'Paper & Cardboard': 700,
    'Glass': 300, 'Organic Waste': 250, 'Textiles': 400,
    'Chemical Waste': 150, 'Electronic Waste': 1000,
    'Wood & Timber': 400, 'Rubber': 200, 'Concrete & Construction': 100,
    'Other': 200,
  };
  const factor = CARBON_FACTORS[category] || CARBON_FACTORS['Other'];
    
  let tonnes = quantity || 0;
  switch (unit) {
    case 'kg': tonnes = quantity / 1000; break;
    case 'litres': tonnes = quantity / 1000; break;
    case 'units': tonnes = quantity * 0.01; break;
    case 'cubic metres': tonnes = quantity * 0.8; break;
    case 'tonnes': tonnes = quantity; break;
    default: tonnes = quantity / 1000;
  }
  return Math.round(factor * tonnes);
};
