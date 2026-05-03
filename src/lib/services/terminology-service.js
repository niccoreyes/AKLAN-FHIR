import { FHIR_CONFIG } from '$constants';

/**
 * Terminology Service - Fetches codes dynamically from tx.fhirlab.net
 */
export class TerminologyService {
	constructor() {
		this.baseUrl = FHIR_CONFIG.txBaseUrl;
		this.cache = new Map();
		this.cacheTTL = 300000; // 5 minutes
	}

	/**
	 * Lookup a code to get display name and properties
	 * @param {string} system - Code system URL
	 * @param {string} code - Code to lookup
	 * @returns {Promise<Object>} Code details
	 */
	async lookupCode(system, code) {
		const cacheKey = `lookup:${system}:${code}`;
		const cached = this.getFromCache(cacheKey);
		if (cached) return cached;

		try {
			const url = `${this.baseUrl}/CodeSystem/$lookup?system=${encodeURIComponent(system)}&code=${encodeURIComponent(code)}`;
			const response = await fetch(url, {
				headers: { 'Accept': 'application/fhir+json' }
			});

			if (!response.ok) {
				throw new Error(`Terminology lookup failed: ${response.status}`);
			}

			const result = await response.json();
			
			// Parse Parameters resource to extract display name
			let display = code;
			let properties = {};
			
			if (result.parameter) {
				for (const param of result.parameter) {
					if (param.name === 'display' && param.valueString) {
						display = param.valueString;
					}
					if (param.name === 'property' && param.part) {
						const propName = param.part.find(p => p.name === 'code')?.valueCode;
						const propValue = param.part.find(p => p.name === 'value')?.valueString;
						if (propName && propValue) {
							properties[propName] = propValue;
						}
					}
				}
			}

			const lookupResult = {
				system,
				code,
				display,
				properties,
				valid: true
			};

			this.setCache(cacheKey, lookupResult);
			return lookupResult;
		} catch (error) {
			console.error('Terminology lookup error:', error);
			return {
				system,
				code,
				display: code,
				valid: false,
				error: error.message
			};
		}
	}

	/**
	 * Search for codes by name/display
	 * @param {string} system - Code system URL
	 * @param {string} query - Search term
	 * @returns {Promise<Array>} Matching codes
	 */
	async searchCodes(system, query) {
		const cacheKey = `search:${system}:${query}`;
		const cached = this.getFromCache(cacheKey);
		if (cached) return cached;

		try {
			// Use ValueSet $expand for searching
			const url = `${this.baseUrl}/ValueSet/$expand?url=${encodeURIComponent(system)}&filter=${encodeURIComponent(query)}&count=20`;
			const response = await fetch(url, {
				headers: { 'Accept': 'application/fhir+json' }
			});

			if (!response.ok) {
				throw new Error(`Terminology search failed: ${response.status}`);
			}

			const result = await response.json();
			
			const codes = [];
			if (result.expansion && result.expansion.contains) {
				for (const item of result.expansion.contains) {
					codes.push({
						system: item.system || system,
						code: item.code,
						display: item.display,
						description: item.definition || item.display
					});
				}
			}

			this.setCache(cacheKey, codes);
			return codes;
		} catch (error) {
			console.error('Terminology search error:', error);
			return [];
		}
	}

	/**
	 * Get vital signs LOINC codes dynamically
	 * These are commonly used vitals in clinical practice
	 */
	async getVitalSignCodes() {
		const vitalSignCodes = [
			{ code: '85354-9', display: 'Blood pressure panel' },
			{ code: '8480-6', display: 'Systolic blood pressure' },
			{ code: '8462-4', display: 'Diastolic blood pressure' },
			{ code: '8867-4', display: 'Heart rate' },
			{ code: '9279-1', display: 'Respiratory rate' },
			{ code: '8310-5', display: 'Body temperature' },
			{ code: '2708-6', display: 'Oxygen saturation' },
			{ code: '29463-7', display: 'Body weight' },
			{ code: '8302-2', display: 'Body height' },
			{ code: '39156-5', display: 'BMI' }
		];

		// Enrich with full details from terminology server
		const enriched = [];
		for (const vital of vitalSignCodes) {
			const details = await this.lookupCode('http://loinc.org', vital.code);
			enriched.push({
				...vital,
				fullDisplay: details.display,
				valid: details.valid
			});
		}

		return enriched;
	}

	/**
	 * Get common condition codes (SNOMED + ICD-10)
	 */
	async getCommonConditionCodes() {
		const conditionCodes = [
			// SNOMED
			{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertensive disorder' },
			{ system: 'http://snomed.info/sct', code: '44054006', display: 'Diabetes mellitus type 2' },
			{ system: 'http://snomed.info/sct', code: '195967001', display: 'Asthma' },
			{ system: 'http://snomed.info/sct', code: '59621000', display: 'Hypertension' },
			// ICD-10
			{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'I10', display: 'Essential hypertension' },
			{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'E11', display: 'Type 2 diabetes' },
			{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'J45', display: 'Asthma' }
		];

		const enriched = [];
		for (const condition of conditionCodes) {
			const details = await this.lookupCode(condition.system, condition.code);
			enriched.push({
				...condition,
				fullDisplay: details.display,
				valid: details.valid
			});
		}

		return enriched;
	}

	/**
	 * Get common medication RxNorm codes
	 */
	async getCommonMedicationCodes() {
		const medicationCodes = [
			{ code: '1790983', display: 'Amlodipine 5mg' },
			{ code: '197361', display: 'Metformin 500mg' },
			{ code: '197380', display: 'Metformin 850mg' },
			{ code: '691497', display: 'Losartan 50mg' },
			{ code: '316049', display: 'Hydrochlorothiazide 25mg' },
			{ code: '312615', display: 'Aspirin 81mg' },
			{ code: '1790533', display: 'Atorvastatin 20mg' }
		];

		const enriched = [];
		for (const med of medicationCodes) {
			const details = await this.lookupCode('http://www.nlm.nih.gov/research/umls/rxnorm', med.code);
			enriched.push({
				...med,
				fullDisplay: details.display,
				valid: details.valid
			});
		}

		return enriched;
	}

	/**
	 * Validate if a code exists in a code system
	 */
	async validateCode(system, code) {
		const result = await this.lookupCode(system, code);
		return result.valid;
	}

	/**
	 * Cache helpers
	 */
	getFromCache(key) {
		const item = this.cache.get(key);
		if (!item) return null;
		if (Date.now() - item.timestamp > this.cacheTTL) {
			this.cache.delete(key);
			return null;
		}
		return item.data;
	}

	setCache(key, data) {
		this.cache.set(key, {
			data,
			timestamp: Date.now()
		});
	}

	/**
	 * Clear cache
	 */
	clearCache() {
		this.cache.clear();
	}
}

// Export singleton
export const terminologyService = new TerminologyService();
