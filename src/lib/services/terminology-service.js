import { FHIR_CONFIG } from '$constants';

/**
 * Service for interacting with the FHIR terminology server (tx.fhirlab.net)
 */
class TerminologyService {
	constructor() {
		this.baseUrl = FHIR_CONFIG.txBaseUrl;
		this.cache = new Map();
		this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
	}

	/**
	 * Make a request to the terminology server
	 */
	async request(endpoint, options = {}) {
		const url = `${this.baseUrl}${endpoint}`;
		const response = await fetch(url, {
			headers: {
				'Accept': 'application/fhir+json',
				'Content-Type': 'application/fhir+json',
				...options.headers
			},
			...options
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Terminology server error: ${response.status} - ${error}`);
		}

		return response.json();
	}

	/**
	 * Get cached data or fetch from server
	 */
	async getCachedOrFetch(key, fetchFn) {
		const cached = this.cache.get(key);
		if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
			return cached.data;
		}

		const data = await fetchFn();
		this.cache.set(key, { data, timestamp: Date.now() });
		return data;
	}

	/**
	 * Clear the cache
	 */
	clearCache() {
		this.cache.clear();
	}

	/**
	 * Expand a ValueSet to get all codes
	 * @param {string} valueSetUrl - The canonical URL of the ValueSet
	 * @returns {Promise<Array>} Array of concept objects with code and display
	 */
	async expandValueSet(valueSetUrl) {
		const cacheKey = `expand:${valueSetUrl}`;
		
		return this.getCachedOrFetch(cacheKey, async () => {
			try {
				// Try to expand the ValueSet
				const response = await this.request(`/ValueSet/$expand?url=${encodeURIComponent(valueSetUrl)}&_count=100`);
				
				if (response.expansion && response.expansion.contains) {
					return response.expansion.contains.map(concept => ({
						code: concept.code,
						display: concept.display,
						system: concept.system
					}));
				}
				return [];
			} catch (error) {
				console.warn(`Failed to expand ValueSet ${valueSetUrl}:`, error);
				// Fallback: try to get the ValueSet definition and extract concepts from compose
				return this.getValueSetConcepts(valueSetUrl);
			}
		});
	}

	/**
	 * Get concepts from a ValueSet definition (fallback when $expand fails)
	 * @param {string} valueSetUrl - The canonical URL of the ValueSet
	 * @returns {Promise<Array>} Array of concept objects
	 */
	async getValueSetConcepts(valueSetUrl) {
		const cacheKey = `concepts:${valueSetUrl}`;
		
		return this.getCachedOrFetch(cacheKey, async () => {
			try {
				const response = await this.request(`/ValueSet?url=${encodeURIComponent(valueSetUrl)}&_count=1`);
				
				if (response.entry && response.entry.length > 0) {
					const valueSet = response.entry[0].resource;
					const concepts = [];
					
					// Extract concepts from compose.include
					if (valueSet.compose && valueSet.compose.include) {
						for (const include of valueSet.compose.include) {
							if (include.concept) {
								for (const concept of include.concept) {
									concepts.push({
										code: concept.code,
										display: concept.display,
										system: include.system
									});
								}
							}
						}
					}
					
					return concepts;
				}
				return [];
			} catch (error) {
				console.error(`Failed to get ValueSet concepts for ${valueSetUrl}:`, error);
				return [];
			}
		});
	}

	/**
	 * Validate a code against a ValueSet
	 * @param {string} code - The code to validate
	 * @param {string} system - The code system
	 * @param {string} valueSetUrl - The ValueSet URL to validate against
	 * @returns {Promise<boolean>} Whether the code is valid
	 */
	async validateCode(code, system, valueSetUrl) {
		try {
			const response = await this.request(
				`/ValueSet/$validate-code?url=${encodeURIComponent(valueSetUrl)}&code=${encodeURIComponent(code)}&system=${encodeURIComponent(system)}`
			);
			
			if (response.parameter) {
				const resultParam = response.parameter.find(p => p.name === 'result');
				return resultParam?.valueBoolean === true;
			}
			return false;
		} catch (error) {
			console.warn(`Code validation failed for ${code}:`, error);
			return false;
		}
	}

	/**
	 * Look up a code to get its display name
	 * @param {string} code - The code to look up
	 * @param {string} system - The code system
	 * @returns {Promise<Object>} The code details including display
	 */
	async lookupCode(code, system) {
		const cacheKey = `lookup:${system}:${code}`;
		
		return this.getCachedOrFetch(cacheKey, async () => {
			try {
				const response = await this.request(
					`/CodeSystem/$lookup?system=${encodeURIComponent(system)}&code=${encodeURIComponent(code)}`
				);
				
				const result = { code, system };
				
				if (response.parameter) {
					const displayParam = response.parameter.find(p => p.name === 'display');
					if (displayParam) {
						result.display = displayParam.valueString;
					}
				}
				
				return result;
			} catch (error) {
				console.warn(`Code lookup failed for ${code}:`, error);
				return { code, system, display: code };
			}
		});
	}
}

// Export singleton instance
export const terminologyService = new TerminologyService();
