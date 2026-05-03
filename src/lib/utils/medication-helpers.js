/**
 * Derive a dispense unit from medication form/dosageForm text.
 * Returns '' when no known keyword is found (caller should let user fill).
 */
const UNIT_PATTERNS = [
	{ keywords: ['syrup', 'suspension', 'solution', 'drops', 'elixir', 'emulsion'], unit: 'ml' },
	{ keywords: ['injection', 'ampoule', 'vial', 'infusion'], unit: 'ml' },
	{ keywords: ['cream', 'ointment', 'gel', 'lotion'], unit: 'g' },
	{ keywords: ['spray', 'aerosol'], unit: 'spray' },
	{ keywords: ['powder'], unit: 'sachet' },
	{ keywords: ['patch'], unit: 'patch' },
	{ keywords: ['inhaler', 'nebulizer', 'puffer'], unit: 'puff' },
	{ keywords: ['tablet', 'tab.', 'tabs', 'caplet'], unit: 'tablet' },
	{ keywords: ['capsule', 'cap.', 'caps'], unit: 'capsule' },
	{ keywords: ['lozenge', 'troche'], unit: 'lozenge' },
];

export function deriveUnit(text) {
	if (!text) return '';
	const lower = text.toLowerCase();
	for (const { keywords, unit } of UNIT_PATTERNS) {
		if (keywords.some(k => lower.includes(k))) return unit;
	}
	return '';
}
