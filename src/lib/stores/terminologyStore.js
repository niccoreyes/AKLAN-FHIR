import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { terminologyService } from '$services/terminology-service.js';

// ValueSet URLs
export const LAB_TEST_CODES_VALUESET_URL = 'http://aklan-fhir.app/ValueSet/lab-test-codes';
export const LAB_UNITS_VALUESET_URL = 'http://aklan-fhir.app/ValueSet/lab-units';

// Default lab test component mappings (fallback if server unavailable)
// These are validated LOINC codes from tx.fhirlab.net
export const DEFAULT_LAB_PANELS = {
	cbc: { code: '58410-2', display: 'Complete Blood Count' },
	lipid: { code: '24331-1', display: 'Lipid Panel' },
	liver: { code: '24325-3', display: 'Liver Function' },
	urinalysis: { code: '24357-6', display: 'Urinalysis' }
};

export const DEFAULT_LAB_COMPONENTS = {
	'58410-2': [
		{ code: '6690-2', display: 'WBC', fullDisplay: 'Leukocytes [#/volume] in Blood', unit: '10*9/L' },
		{ code: '789-8', display: 'RBC', fullDisplay: 'Erythrocytes [#/volume] in Blood', unit: '10*12/L' },
		{ code: '718-7', display: 'Hemoglobin', fullDisplay: 'Hemoglobin [Mass/volume] in Blood', unit: 'g/dL' },
		{ code: '4544-3', display: 'Hematocrit', fullDisplay: 'Hematocrit [Volume Fraction] of Blood', unit: '%' },
		{ code: '777-3', display: 'Platelets', fullDisplay: 'Platelets [#/volume] in Blood', unit: '10*9/L' },
		{ code: '787-2', display: 'MCV', fullDisplay: 'MCV [Entitic volume]', unit: 'fL' },
		{ code: '785-6', display: 'MCH', fullDisplay: 'MCH [Entitic mass]', unit: 'pg' }
	],
	'24331-1': [
		{ code: '2093-3', display: 'Total Cholesterol', fullDisplay: 'Cholesterol [Mass/volume] in Serum or Plasma', unit: 'mg/dL' },
		{ code: '13457-7', display: 'LDL Cholesterol', fullDisplay: 'Cholesterol in LDL [Mass/volume]', unit: 'mg/dL' },
		{ code: '2085-9', display: 'HDL Cholesterol', fullDisplay: 'Cholesterol in HDL [Mass/volume]', unit: 'mg/dL' },
		{ code: '2571-8', display: 'Triglycerides', fullDisplay: 'Triglyceride [Mass/volume] in Serum or Plasma', unit: 'mg/dL' }
	],
	'24325-3': [
		{ code: '1742-6', display: 'ALT', fullDisplay: 'Alanine aminotransferase [Enzymatic activity/volume]', unit: 'U/L' },
		{ code: '1920-8', display: 'AST', fullDisplay: 'Aspartate aminotransferase [Enzymatic activity/volume]', unit: 'U/L' },
		{ code: '6768-6', display: 'Alkaline Phosphatase', fullDisplay: 'Alkaline phosphatase [Enzymatic activity/volume]', unit: 'U/L' },
		{ code: '1975-2', display: 'Bilirubin Total', fullDisplay: 'Bilirubin.total [Mass/volume] in Serum or Plasma', unit: 'mg/dL' }
	],
	'24357-6': [
		{ code: '5769-0', display: 'Color', fullDisplay: 'Color of Urine', unit: '' },
		{ code: '5770-8', display: 'Clarity', fullDisplay: 'Clarity of Urine', unit: '' },
		{ code: '5792-2', display: 'pH', fullDisplay: 'pH of Urine', unit: '' },
		{ code: '5802-9', display: 'Specific Gravity', fullDisplay: 'Specific gravity of Urine', unit: '' },
		{ code: '5811-0', display: 'Glucose', fullDisplay: 'Glucose [Mass/volume] in Urine', unit: 'mg/dL' },
		{ code: '5794-8', display: 'Protein', fullDisplay: 'Protein [Mass/volume] in Urine', unit: 'mg/dL' }
	]
};

export const DEFAULT_UCUM_UNITS = [
	{ code: '10*9/L', display: '10*9/L (billion/L)' },
	{ code: '10*12/L', display: '10*12/L (trillion/L)' },
	{ code: 'g/dL', display: 'g/dL' },
	{ code: 'mg/dL', display: 'mg/dL' },
	{ code: 'U/L', display: 'U/L' },
	{ code: '%', display: '%' },
	{ code: 'fL', display: 'fL' },
	{ code: 'pg', display: 'pg' },
	{ code: 'mmol/L', display: 'mmol/L' },
	{ code: 'IU/L', display: 'IU/L' }
];

// Store for lab test codes
function createLabTestCodesStore() {
	const { subscribe, set, update } = writable({
		concepts: [],
		loading: false,
		error: null,
		lastFetched: null
	});

	return {
		subscribe,
		fetch: async () => {
			update(state => ({ ...state, loading: true, error: null }));
			
			try {
				const concepts = await terminologyService.expandValueSet(LAB_TEST_CODES_VALUESET_URL);
				
				// Organize concepts by panel
				const panels = {};
				const panelCodes = {
					[DEFAULT_LAB_PANELS.cbc.code]: DEFAULT_LAB_PANELS.cbc.code,
					[DEFAULT_LAB_PANELS.lipid.code]: DEFAULT_LAB_PANELS.lipid.code,
					[DEFAULT_LAB_PANELS.liver.code]: DEFAULT_LAB_PANELS.liver.code,
					[DEFAULT_LAB_PANELS.urinalysis.code]: DEFAULT_LAB_PANELS.urinalysis.code
				};

				// Use default mappings as fallback for structure
				for (const [panelCode, components] of Object.entries(DEFAULT_LAB_COMPONENTS)) {
					panels[panelCode] = components.map(comp => {
						const serverConcept = concepts.find(c => c.code === comp.code);
						return {
							...comp,
							display: serverConcept?.display || comp.display
						};
					});
				}

				update(state => ({
					...state,
					concepts,
					panels,
					loading: false,
					lastFetched: Date.now()
				}));
			} catch (err) {
				console.error('Failed to fetch lab test codes:', err);
				// Fall back to defaults
				update(state => ({
					...state,
					concepts: Object.values(DEFAULT_LAB_COMPONENTS).flat(),
					panels: DEFAULT_LAB_COMPONENTS,
					loading: false,
					error: null // Don't show error, use defaults
				}));
			}
		},
		refresh: async () => {
			terminologyService.clearCache();
			await this.fetch();
		}
	};
}

// Store for UCUM units
function createLabUnitsStore() {
	const { subscribe, set, update } = writable({
		units: [],
		loading: false,
		error: null,
		lastFetched: null
	});

	return {
		subscribe,
		fetch: async () => {
			update(state => ({ ...state, loading: true, error: null }));
			
			try {
				const concepts = await terminologyService.expandValueSet(LAB_UNITS_VALUESET_URL);
				
				const units = concepts.map(concept => ({
					code: concept.code,
					display: concept.display || concept.code
				}));

				update(state => ({
					...state,
					units: units.length > 0 ? units : DEFAULT_UCUM_UNITS,
					loading: false,
					lastFetched: Date.now()
				}));
			} catch (err) {
				console.error('Failed to fetch lab units:', err);
				// Fall back to defaults
				update(state => ({
					...state,
					units: DEFAULT_UCUM_UNITS,
					loading: false,
					error: null
				}));
			}
		},
		refresh: async () => {
			terminologyService.clearCache();
			await this.fetch();
		}
	};
}

// Create stores
export const labTestCodesStore = createLabTestCodesStore();
export const labUnitsStore = createLabUnitsStore();

// Helper function to get default unit for a LOINC code
export function getDefaultUnitForLoincCode(loincCode, panels) {
	for (const panelComponents of Object.values(panels || DEFAULT_LAB_COMPONENTS)) {
		const component = panelComponents.find(c => c.code === loincCode);
		if (component && component.unit) {
			return component.unit;
		}
	}
	return '';
}

// Initialize stores on app start (only in browser)
if (browser) {
	// Fetch data immediately
	labTestCodesStore.fetch();
	labUnitsStore.fetch();
}
