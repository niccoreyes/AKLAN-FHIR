import { FHIR_CONFIG, WORKSHOP_TAG_SYSTEM } from '$constants';
import { fhirLogger } from '$stores/fhirLogger.js';

/**
 * FHIR Client for communicating with cdr.fhirlab.net
 */
export class FHIRClient {
	constructor() {
		this.baseUrl = FHIR_CONFIG.shrBaseUrl;
		this.txUrl = FHIR_CONFIG.txBaseUrl;
	}

	/**
	 * Log a transaction to the FHIR logger
	 */
	_logTransaction(method, url, requestBody, response, responseBody, error = null) {
		const txUrl = new URL(url);
		fhirLogger.logTransaction({
			method,
			url: txUrl.pathname + txUrl.search,
			fullUrl: url,
			requestBody,
			responseStatus: response?.status,
			responseBody,
			error: error?.message,
			duration: null,
			headers: {
				request: {
					'Content-Type': 'application/fhir+json',
					'Accept': 'application/fhir+json'
				},
				response: response ? {
					'Content-Type': response.headers.get('Content-Type'),
					'Location': response.headers.get('Location')
				} : null
			}
		});
	}

	/**
	 * Create a new resource
	 * @param {Object} resource - FHIR resource
	 * @param {string} workshopCode - Workshop code for tagging
	 * @returns {Promise<Object>} Created resource
	 */
	async create(resource, workshopCode) {
		// Add workshop tag
		if (workshopCode) {
			resource.meta = resource.meta || {};
			resource.meta.tag = resource.meta.tag || [];
			resource.meta.tag.push({
				system: WORKSHOP_TAG_SYSTEM,
				code: workshopCode
			});
		}

		const url = `${this.baseUrl}/${resource.resourceType}`;
		let response = null;
		let result = null;
		let error = null;
		
		try {
			response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/fhir+json',
					'Accept': 'application/fhir+json'
				},
				body: JSON.stringify(resource)
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`FHIR Error ${response.status}: ${errorText}`);
			}

			result = await response.json();
			
			// Log successful transaction
			this._logTransaction('POST', url, resource, response, result);
			
			return {
				success: true,
				data: result,
				location: response.headers.get('Location'),
				status: response.status
			};
		} catch (err) {
			error = err;
			console.error('FHIR Create Error:', err);
			// Log failed transaction
			this._logTransaction('POST', url, resource, response, result, err);
			throw err;
		}
	}

	/**
	 * Read a specific resource by ID
	 * @param {string} resourceType - FHIR resource type
	 * @param {string} id - Resource ID
	 * @returns {Promise<Object>} Resource
	 */
	async read(resourceType, id) {
		const url = `${this.baseUrl}/${resourceType}/${id}`;
		let response = null;
		let result = null;
		
		try {
			response = await fetch(url, {
				headers: {
					'Accept': 'application/fhir+json'
				}
			});

			if (!response.ok) {
				throw new Error(`FHIR Error ${response.status}`);
			}

			result = await response.json();
			this._logTransaction('GET', url, null, response, result);
			return result;
		} catch (error) {
			console.error('FHIR Read Error:', error);
			this._logTransaction('GET', url, null, response, result, error);
			throw error;
		}
	}

	/**
	 * Search for resources
	 * @param {string} resourceType - FHIR resource type
	 * @param {Object} params - Search parameters
	 * @param {string} workshopCode - Optional workshop code to filter
	 * @returns {Promise<Object>} Bundle of results
	 */
	async search(resourceType, params = {}, workshopCode = null) {
		const searchParams = new URLSearchParams();
		
		// Add workshop tag filter if provided
		if (workshopCode) {
			searchParams.append('_tag', `${WORKSHOP_TAG_SYSTEM}|${workshopCode}`);
		}
		
		// Add other params
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				searchParams.append(key, value);
			}
		});

		const queryString = searchParams.toString();
		const url = queryString 
			? `${this.baseUrl}/${resourceType}?${queryString}`
			: `${this.baseUrl}/${resourceType}`;
		
		let response = null;
		let result = null;
		
		try {
			response = await fetch(url, {
				headers: {
					'Accept': 'application/fhir+json'
				}
			});

			if (!response.ok) {
				throw new Error(`FHIR Error ${response.status}`);
			}

			result = await response.json();
			this._logTransaction('GET', url, null, response, result);
			return result;
		} catch (error) {
			console.error('FHIR Search Error:', error);
			this._logTransaction('GET', url, null, response, result, error);
			throw error;
		}
	}

	/**
	 * Search with pagination support
	 * @param {string} resourceType - FHIR resource type
	 * @param {Object} params - Search parameters
	 * @param {string} workshopCode - Optional workshop code to filter
	 * @returns {Promise<Object>} {resources, total, nextUrl, hasMore, bundle}
	 */
	async searchPaginated(resourceType, params = {}, workshopCode = null) {
		const bundle = await this.search(resourceType, params, workshopCode);
		
		const resources = bundle.entry?.map(e => e.resource) || [];
		const total = bundle.total || resources.length;
		const nextLink = bundle.link?.find(l => l.relation === 'next')?.url;
		const prevLink = bundle.link?.find(l => l.relation === 'previous')?.url;
		
		return {
			resources,
			total,
			nextUrl: nextLink,
			prevUrl: prevLink,
			hasMore: !!nextLink,
			bundle
		};
	}

	/**
	 * Fetch next page from pagination URL
	 * @param {string} nextUrl - The next page URL from bundle.link
	 * @returns {Promise<Object>} {resources, total, nextUrl, hasMore, bundle}
	 */
	async fetchNextPage(nextUrl) {
		let response = null;
		let bundle = null;
		
		try {
			response = await fetch(nextUrl, {
				headers: {
					'Accept': 'application/fhir+json'
				}
			});

			if (!response.ok) {
				throw new Error(`FHIR Error ${response.status}`);
			}

			bundle = await response.json();
			const resources = bundle.entry?.map(e => e.resource) || [];
			const total = bundle.total || resources.length;
			const nextLink = bundle.link?.find(l => l.relation === 'next')?.url;
			const prevLink = bundle.link?.find(l => l.relation === 'previous')?.url;
			
			this._logTransaction('GET', nextUrl, null, response, bundle);
			
			return {
				resources,
				total,
				nextUrl: nextLink,
				prevUrl: prevLink,
				hasMore: !!nextLink,
				bundle
			};
		} catch (error) {
			console.error('FHIR Pagination Error:', error);
			this._logTransaction('GET', nextUrl, null, response, bundle, error);
			throw error;
		}
	}

	/**
	 * Delete a resource
	 * @param {string} resourceType - FHIR resource type
	 * @param {string} id - Resource ID
	 * @returns {Promise<boolean>} Success
	 */
	async delete(resourceType, id) {
		const url = `${this.baseUrl}/${resourceType}/${id}`;
		let response = null;
		
		try {
			response = await fetch(url, {
				method: 'DELETE'
			});

			if (!response.ok && response.status !== 204) {
				throw new Error(`FHIR Error ${response.status}`);
			}

			this._logTransaction('DELETE', url, null, response, null);
			return true;
		} catch (error) {
			console.error('FHIR Delete Error:', error);
			this._logTransaction('DELETE', url, null, response, null, error);
			throw error;
		}
	}

	/**
	 * Update an existing resource
	 * @param {string} resourceType - FHIR resource type
	 * @param {string} id - Resource ID
	 * @param {Object} resource - Updated FHIR resource
	 * @returns {Promise<Object>} Update result
	 */
	async update(resourceType, id, resource) {
		const url = `${this.baseUrl}/${resourceType}/${id}`;
		let response = null;
		let result = null;
		
		try {
			response = await fetch(url, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/fhir+json',
					'Accept': 'application/fhir+json'
				},
				body: JSON.stringify(resource)
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`FHIR Error ${response.status}: ${errorText}`);
			}

			result = await response.json();
			this._logTransaction('PUT', url, resource, response, result);
			
			return {
				success: true,
				data: result,
				location: response.headers.get('Location'),
				status: response.status
			};
		} catch (error) {
			console.error('FHIR Update Error:', error);
			this._logTransaction('PUT', url, resource, response, result, error);
			throw error;
		}
	}

	/**
	 * Validate a code using the Terminology Server
	 * @param {string} system - Code system URL
	 * @param {string} code - Code to validate
	 * @returns {Promise<Object>} Validation result
	 */
	async validateCode(system, code) {
		const url = `${this.txUrl}/CodeSystem/\$lookup?system=${encodeURIComponent(system)}&code=${encodeURIComponent(code)}`;
		let response = null;
		let result = null;
		
		try {
			response = await fetch(url, {
				headers: {
					'Accept': 'application/fhir+json'
				}
			});

			if (!response.ok) {
				this._logTransaction('GET', url, null, response, null);
				return { valid: false, error: response.statusText };
			}

			result = await response.json();
			this._logTransaction('GET', url, null, response, result);
			return { valid: true, data: result };
		} catch (error) {
			console.error('Terminology Error:', error);
			this._logTransaction('GET', url, null, response, result, error);
			return { valid: false, error: error.message };
		}
	}

	/**
	 * Get server capabilities
	 * @returns {Promise<Object>} CapabilityStatement
	 */
	async getCapabilities() {
		const url = `${this.baseUrl}/metadata`;
		let response = null;
		let result = null;
		
		try {
			response = await fetch(url, {
				headers: {
					'Accept': 'application/fhir+json'
				}
			});

			if (!response.ok) {
				throw new Error(`FHIR Error ${response.status}`);
			}

			result = await response.json();
			this._logTransaction('GET', url, null, response, result);
			return result;
		} catch (error) {
			console.error('FHIR Capabilities Error:', error);
			this._logTransaction('GET', url, null, response, result, error);
			throw error;
		}
	}

	/**
	 * Delete all resources with a workshop tag (facilitator reset)
	 * @param {string} workshopCode - Workshop code
	 * @returns {Promise<{deleted: number, errors: number}>}
	 */
	async deleteWorkshopResources(workshopCode) {
		const resourceTypes = ['Patient', 'Encounter', 'Observation', 'Condition', 'MedicationRequest', 'ServiceRequest', 'DiagnosticReport', 'MedicationDispense', 'Practitioner'];
		let deleted = 0;
		let errors = 0;

		for (const resourceType of resourceTypes) {
			try {
				const bundle = await this.search(resourceType, {}, workshopCode);
				
				if (bundle.entry && bundle.entry.length > 0) {
					for (const entry of bundle.entry) {
						try {
							await this.delete(resourceType, entry.resource.id);
							deleted++;
						} catch (e) {
							errors++;
						}
					}
				}
			} catch (e) {
				console.error(`Error deleting ${resourceType}:`, e);
			}
		}

		return { deleted, errors };
	}
}

// Export singleton instance
export const fhirClient = new FHIRClient();
