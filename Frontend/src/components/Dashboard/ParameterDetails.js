// IMPORTANT: For Laguna de Bay water quality monitoring
// According to LLDA (Laguna Lake Development Authority), Class C is the optimal 
// classification for water quality parameters in Laguna de Bay.
// This means Class C parameters should be considered as the target/goal level.

export const parameterDescriptions = {
  TDS: 'Total Dissolved Solids - measures dissolved substances in water affecting taste and usability',
  ORP: 'Oxidation-Reduction Potential - indicates water\'s ability to break down contaminants and organic matter',
  pH: 'pH Level - measures acidity/alkalinity; critical for aquatic life survival in Laguna de Bay',
  DO: 'Dissolved Oxygen - essential for fish and aquatic life; key indicator of ecosystem health',
  Temperature: 'Water Temperature - affects aquatic life metabolism and oxygen solubility in the lake',
  Turbidity: 'Turbidity measures the cloudiness of water caused by suspended particles; affects light penetration and aquatic plant growth.',
  Conductivity: 'Water Conductivity - indicates dissolved ions and overall water quality',
  Ammonia: 'Ammonia Level - toxic to fish at high levels; indicates organic pollution sources',
  Nitrate: 'Nitrate Level - can cause algal blooms and eutrophication if elevated',
  Phosphate: 'Phosphate Level - primary cause of algal blooms and lake eutrophication',
  'Total Dissolved Solids': 'Total Dissolved Solids (TDS) indicate the concentration of dissolved substances in water, affecting its suitability for various uses.',
  ORP: 'Oxidation-Reduction Potential (ORP) measures the ability of water to break down contaminants and indicates overall water quality.'
};

export const parameterUnits = {
  TDS: 'mg/L',
  ORP: 'mV',
  pH: '',
  DO: 'mg/L',
  Temperature: '°C',
  Turbidity: 'NTU', // Nephelometric Turbidity Units
  Conductivity: 'µS/cm',
  Ammonia: 'mg/L',
  Nitrate: 'mg/L',
  Phosphate: 'mg/L',
  'Total Dissolved Solids': 'mg/L', // Milligrams per liter
  ORP: 'mV' // Millivolts
};