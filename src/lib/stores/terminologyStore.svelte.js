import { writable } from 'svelte/store';
import { terminologyService } from '$services/terminology-service.js';

/**
 * Create a store for terminology codes
 * This fetches codes dynamically from tx.fhirlab.net
 */
export function createTerminologyStore() {
	const { subscribe, set, update } = writable({
		vitalSigns: [],
		conditions: [],
		medications: [],
		isLoading: false,
		error: null,
		loaded: false
	});

	/**
	 * Load all common terminology codes
	 */
	async function loadCodes() {
		update(state => ({ ...state, isLoading: true, error: null }));

		try {
			// Load in parallel
			const [vitalSigns, conditions, medications] = await Promise.all([
				terminologyService.getVitalSignCodes(),
				terminologyService.getCommonConditionCodes(),
				terminologyService.getCommonMedicationCodes()
			]);

			update(state => ({
				...state,
				vitalSigns,
				conditions,
				medications,
				isLoading: false,
				loaded: true
			}));
		} catch (error) {
			update(state => ({
				...state,
				isLoading: false,
				error: error.message
			}));
		}
	}

	/**
	 * Search for codes dynamically
	 */
	async function searchCodes(system, query) {
		return await terminologyService.searchCodes(system, query);
	}

	/**
	 * Lookup a specific code
	 */
	async function lookupCode(system, code) {
		return await terminologyService.lookupCode(system, code);
	}

	return {
		subscribe,
		loadCodes,
		searchCodes,
		lookupCode,
		refresh: loadCodes
	};
}

// Export singleton
export const terminologyStore = createTerminologyStore();
