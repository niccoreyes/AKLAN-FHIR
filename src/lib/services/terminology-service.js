import { FHIR_CONFIG } from '$constants';

/**
 * Terminology Service - Fetches codes dynamically from tx.fhirlab.net
 * Gracefully falls back to hardcoded values when server codes are unavailable.
 */
export class TerminologyService {
	constructor() {
		this.baseUrl = FHIR_CONFIG.txBaseUrl;
		this.cache = new Map();
		this.cacheTTL = 300000; // 5 minutes
	}

	/**
	 * Lookup a code to get display name and properties.
	 * Silently falls back to the code itself as display if lookup fails.
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
				// Server does not have this code system or code — silently fail
				const fallback = {
					system,
					code,
					display: code,
					valid: false
				};
				this.setCache(cacheKey, fallback);
				return fallback;
			}

			const result = await response.json();
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

			const lookupResult = { system, code, display, properties, valid: true };
			this.setCache(cacheKey, lookupResult);
			return lookupResult;
		} catch (error) {
			// Network or unexpected error — silently fallback
			const fallback = { system, code, display: code, valid: false };
			this.setCache(cacheKey, fallback);
			return fallback;
		}
	}

	/**
	 * Search for codes by name/display using ValueSet $expand.
	 * Silently returns empty array on failure.
	 */
	async searchCodes(vsUrl, query) {
		const cacheKey = `search:${vsUrl}:${query}`;
		const cached = this.getFromCache(cacheKey);
		if (cached) return cached;

		try {
			const url = `${this.baseUrl}/ValueSet/$expand?url=${encodeURIComponent(vsUrl)}&filter=${encodeURIComponent(query)}&count=20`;
			const response = await fetch(url, {
				headers: { 'Accept': 'application/fhir+json' }
			});

			if (!response.ok) {
				this.setCache(cacheKey, []);
				return [];
			}

			const result = await response.json();
			const codes = [];
			if (result.expansion && result.expansion.contains) {
				for (const item of result.expansion.contains) {
					codes.push({
						system: item.system || vsUrl,
						code: item.code,
						display: item.display,
						description: item.definition || item.display
					});
				}
			}

			this.setCache(cacheKey, codes);
			return codes;
		} catch (error) {
			this.setCache(cacheKey, []);
			return [];
		}
	}

	/**
	 * Get vital signs LOINC codes.
	 * These are well-known LOINC codes that tx.fhirlab.net supports.
	 */
	async getVitalSignCodes() {
		const vitalSignCodes = [
			{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' },
			{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' },
			{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' },
			{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' },
			{ system: 'http://loinc.org', code: '9279-1', display: 'Respiratory rate' },
			{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' },
			{ system: 'http://loinc.org', code: '2708-6', display: 'Oxygen saturation' },
			{ system: 'http://loinc.org', code: '29463-7', display: 'Body weight' },
			{ system: 'http://loinc.org', code: '8302-2', display: 'Body height' },
			{ system: 'http://loinc.org', code: '39156-5', display: 'BMI' }
		];

		// Enrich with server display names (LOINC is available on tx.fhirlab.net)
		const enriched = [];
		for (const vital of vitalSignCodes) {
			const details = await this.lookupCode(vital.system, vital.code);
			enriched.push({
				...vital,
				fullDisplay: details.valid ? details.display : vital.display,
				valid: details.valid
			});
		}
		return enriched;
	}

	/**
	 * Get common condition codes using SNOMED CT (available on tx.fhirlab.net).
	 * ICD-10 is NOT available on this server so it is excluded.
	 */
	async getCommonConditionCodes() {
		const conditionCodes = [
			{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertensive disorder' },
			{ system: 'http://snomed.info/sct', code: '44054006', display: 'Diabetes mellitus type 2' },
			{ system: 'http://snomed.info/sct', code: '195967001', display: 'Asthma' },
			{ system: 'http://snomed.info/sct', code: '59621000', display: 'Hypertension' },
			{ system: 'http://snomed.info/sct', code: '53741008', display: 'Coronary artery disease' },
			{ system: 'http://snomed.info/sct', code: '13645005', display: 'Chronic obstructive lung disease' }
		];

		const enriched = [];
		for (const condition of conditionCodes) {
			const details = await this.lookupCode(condition.system, condition.code);
			enriched.push({
				...condition,
				fullDisplay: details.valid ? details.display : condition.display,
				valid: details.valid
			});
		}
		return enriched;
	}

	/**
	 * Get common medication codes using SNOMED CT pharmaceutical product ValueSet.
	 * RxNorm is NOT available on tx.fhirlab.net; SNOMED medications ARE.
	 */
	async getCommonMedicationCodes() {
		const drugNames = ['Amlodipine', 'Metformin', 'Losartan', 'Hydrochlorothiazide', 'Aspirin', 'Atorvastatin', 'Paracetamol', 'Ibuprofen'];
		const snomedPharmaceuticalVS = 'http://snomed.info/sct?fhir_vs=isa/373873005';
		const results = [];

		for (const name of drugNames) {
			const codes = await this.searchCodes(snomedPharmaceuticalVS, name);
			if (codes.length > 0) {
				results.push({
					system: codes[0].system,
					code: codes[0].code,
					display: codes[0].display,
					valid: true
				});
			}
		}

		return results;
	}

	/**
	 * Validate if a code exists in a code system.
	 */
	async validateCode(system, code) {
		const result = await this.lookupCode(system, code);
		return result.valid;
	}

	/* Cache helpers */
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
		this.cache.set(key, { data, timestamp: Date.now() });
	}

	clearCache() {
		this.cache.clear();
	}
}

// Export singleton
export const terminologyService = new TerminologyService();
