import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { terminologyService } from '$services/terminology-service.js';

// Store for code display cache
const codeDisplayCache = writable(new Map());

// Store for pending lookups (to avoid duplicate requests)
const pendingLookups = new Map();

/**
 * Get display name for a code from terminology server or cache
 * @param {string} code - The code to look up
 * @param {string} system - The code system URL
 * @param {string} defaultDisplay - Fallback display if lookup fails
 * @returns {Promise<string>} The display name
 */
export async function getCodeDisplay(code, system, defaultDisplay = null) {
	if (!code) return '';
	
	const cacheKey = `${system}|${code}`;
	
	// Check cache first
	let cached;
	const unsubscribe = codeDisplayCache.subscribe(cache => {
		cached = cache.get(cacheKey);
	});
	unsubscribe();
	
	if (cached) {
		return cached;
	}
	
	// Check if lookup is already pending
	if (pendingLookups.has(cacheKey)) {
		return pendingLookups.get(cacheKey);
	}
	
	// Perform lookup
	const lookupPromise = (async () => {
		try {
			const result = await terminologyService.lookupCode(code, system);
			const display = result.display || defaultDisplay || code;
			
			// Update cache
			codeDisplayCache.update(cache => {
				cache.set(cacheKey, display);
				return cache;
			});
			
			return display;
		} catch (e) {
			console.warn(`[CodeDisplay] Failed to lookup ${code} from ${system}:`, e);
			return defaultDisplay || code;
		} finally {
			pendingLookups.delete(cacheKey);
		}
	})();
	
	pendingLookups.set(cacheKey, lookupPromise);
	return lookupPromise;
}

/**
 * Get display for a LOINC code
 * @param {string} code - LOINC code
 * @returns {Promise<string>} Display name
 */
export function getLoincDisplay(code) {
	return getCodeDisplay(code, 'http://loinc.org', code);
}

/**
 * Get display for a SNOMED CT code
 * @param {string} code - SNOMED code
 * @returns {Promise<string>} Display name
 */
export function getSnomedDisplay(code) {
	return getCodeDisplay(code, 'http://snomed.info/sct', code);
}

/**
 * Get display for an ICD-10 code
 * @param {string} code - ICD-10 code
 * @returns {Promise<string>} Display name
 */
export function getIcd10Display(code) {
	return getCodeDisplay(code, 'http://hl7.org/fhir/sid/icd-10', code);
}

/**
 * Get display for a RxNorm code
 * @param {string} code - RxNorm code
 * @returns {Promise<string>} Display name
 */
export function getRxnormDisplay(code) {
	return getCodeDisplay(code, 'http://www.nlm.nih.gov/research/umls/rxnorm', code);
}

/**
 * Svelte action to automatically fetch and display code
 * Usage: <span use:codeDisplay={{ code: '2339-0', system: 'http://loinc.org' }}>{code}</span>
 */
export function codeDisplay(node, params) {
	let currentParams = params;
	
	async function updateDisplay() {
		if (!currentParams?.code) return;
		
		const display = await getCodeDisplay(
			currentParams.code, 
			currentParams.system, 
			currentParams.defaultDisplay
		);
		
		// Only update if the display is different from code (to avoid flicker)
		if (display && display !== currentParams.code) {
			node.textContent = display;
		}
	}
	
	updateDisplay();
	
	return {
		update(newParams) {
			currentParams = newParams;
			updateDisplay();
		}
	};
}

/**
 * Preload multiple codes at once
 * @param {Array<{code: string, system: string}>} codes - Array of codes to preload
 */
export async function preloadCodeDisplays(codes) {
	await Promise.all(
		codes.map(({ code, system }) => getCodeDisplay(code, system))
	);
}

// Export the cache store for reactive access
export { codeDisplayCache };
