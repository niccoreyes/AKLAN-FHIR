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
	 * Lookup a code with all properties from the Terminology Server
	 * @param {string} system - Code system URL
	 * @param {string} code - Code to look up
	 * @returns {Promise<Object>} { success: boolean, properties: Map<string, string>, display?: string, error?: string }
	 */
	async lookupCodeProperties(system, code) {
		const url = `${this.txUrl}/CodeSystem/\$lookup?system=${encodeURIComponent(system)}&code=${encodeURIComponent(code)}&property=*`;
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
				return { success: false, error: response.statusText, properties: new Map() };
			}

			result = await response.json();
			this._logTransaction('GET', url, null, response, result);

			// Parse Parameters resource into a convenient properties map
			const properties = new Map();
			let display = null;
			
			if (result.parameter) {
				for (const param of result.parameter) {
					if (param.name === 'display' && param.valueString) {
						display = param.valueString;
					}
					if (param.name === 'property' && param.part) {
						const codePart = param.part.find(p => p.name === 'code');
						const valuePart = param.part.find(p => p.valueString !== undefined);
						if (codePart && valuePart) {
							properties.set(codePart.valueCode, valuePart.valueString);
						}
					}
				}
			}

			return { success: true, display, properties };
		} catch (error) {
			console.error('Terminology Lookup Error:', error);
			this._logTransaction('GET', url, null, response, result, error);
			return { success: false, error: error.message, properties: new Map() };
		}
	}

	/**
	 * Search PhilHealth ACR ICD-10 codes using ValueSet $expand
	 * Queries tx.fhirlab.net for diagnosis codes with text filtering
	 * 
	 * @param {string} filter - Search term (e.g., "diabetes", "hypertension")
	 * @param {number} count - Maximum results to return (default 10)
	 * @returns {Promise<Array>} Array of {system, code, display} objects
	 */
	async searchACRCodes(filter, count = 10) {
		const url = new URL(`${this.txUrl}/ValueSet/\$expand`);
		url.searchParams.set('url', 'http://www.philhealth.gov.ph/fhir/ValueSet/acr-icd-hierarchical');
		url.searchParams.set('filter', filter);
		url.searchParams.set('count', count.toString());
		
		console.log('[searchACRCodes] Request URL:', url.toString());
		
		let response = null;
		let result = null;
		
		try {
			response = await fetch(url.toString(), {
				headers: {
					'Accept': 'application/fhir+json'
				}
			});

			if (!response.ok) {
				console.error('[searchACRCodes] HTTP Error:', response.status, response.statusText);
				this._logTransaction('GET', url.toString(), null, response, null);
				return [];
			}

			result = await response.json();
			console.log('[searchACRCodes] Full Response:', JSON.stringify(result, null, 2));
			this._logTransaction('GET', url.toString(), null, response, result);

			// Extract codes from expansion.contains
			const expansion = result.expansion;
			console.log('[searchACRCodes] Expansion object:', expansion);
			console.log('[searchACRCodes] Contains array:', expansion?.contains);
			console.log('[searchACRCodes] Total:', expansion?.total);
			
			if (expansion && expansion.contains && Array.isArray(expansion.contains)) {
				const mapped = expansion.contains.map(item => ({
					system: item.system,
					code: item.code,
					display: item.display
				}));
				console.log('[searchACRCodes] Mapped results:', mapped);
				return mapped;
			}

			console.warn('[searchACRCodes] No contains array found in expansion');
			return [];
		} catch (error) {
			console.error('[searchACRCodes] Error:', error);
			this._logTransaction('GET', url.toString(), null, response, result, error);
			return [];
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
	 * Deletes in dependency order to avoid referential integrity errors
	 * @param {string} workshopCode - Workshop code
	 * @param {Array<string>} specificTypes - Optional: specific resource types to delete (if null, deletes all)
	 * @param {Function} onProgress - Optional: callback(deleted, errors, currentType, totalInType) for progress updates
	 * @returns {Promise<{deleted: number, errors: number, details: Object}>}
	 */
	async deleteWorkshopResources(workshopCode, specificTypes = null, onProgress = null) {
		// Deletion order: leaf resources first (those that reference others), 
		// then work backwards to root resources (those that are referenced)
		// This prevents referential integrity errors
		const deletionOrder = [
			'MedicationDispense',  // refs: MedicationRequest, Patient, Practitioner
			'DiagnosticReport',    // refs: ServiceRequest, Patient, Practitioner, Observation
			'MedicationRequest', // refs: Patient, Encounter, Practitioner
			'ServiceRequest',    // refs: Patient, Encounter, Practitioner
			'Observation',       // refs: Patient, Encounter
			'Condition',         // refs: Patient, Encounter
			'Encounter',         // refs: Patient, Practitioner
			'Patient',           // refs: (root - referenced by many)
			'Practitioner'       // refs: (root - referenced by many)
		];

		// Filter to specific types if requested, but maintain order
		const resourceTypes = specificTypes 
			? deletionOrder.filter(t => specificTypes.includes(t))
			: deletionOrder;

		let deleted = 0;
		let errors = 0;
		const details = {};

		for (const resourceType of resourceTypes) {
			let typeDeleted = 0;
			let typeErrors = 0;
			
			try {
				// Search without count limit to get all resources
				const bundle = await this.search(resourceType, { _count: '1000' }, workshopCode);
				const entries = bundle.entry || [];
				
				console.log(`[deleteWorkshopResources] Found ${entries.length} ${resourceType} resources for tag ${workshopCode}`);
				
				if (entries.length > 0) {
					for (const entry of entries) {
						try {
							await this.delete(resourceType, entry.resource.id);
							deleted++;
							typeDeleted++;
							
							if (onProgress) {
								onProgress(deleted, errors, resourceType, entries.length, typeDeleted);
							}
						} catch (e) {
							console.error(`[deleteWorkshopResources] Error deleting ${resourceType}/${entry.resource.id}:`, e.message);
							errors++;
							typeErrors++;
						}
					}
				}
			} catch (e) {
				console.error(`[deleteWorkshopResources] Error searching ${resourceType}:`, e);
				errors++;
				typeErrors++;
			}
			
			details[resourceType] = { deleted: typeDeleted, errors: typeErrors };
		}

		return { deleted, errors, details };
	}

	/**
	 * Discover all workshop tags in use on the server
	 * Scans key resource types and extracts unique tags
	 * @returns {Promise<Map<string, Object>>} Map of tag code -> { counts: {}, total: number }
	 */
	async discoverWorkshopTags() {
		// Resource types to scan for tags (lightweight approach: just get metadata)
		const resourceTypes = ['Patient', 'Encounter', 'Practitioner', 'Observation', 'MedicationRequest', 'ServiceRequest', 'DiagnosticReport', 'MedicationDispense', 'Condition'];
		const tagMap = new Map();
		
		for (const resourceType of resourceTypes) {
			try {
				// Search with _elements=meta to get just metadata (lightweight)
				const bundle = await this.search(resourceType, { _elements: 'meta', _count: '1000' });
				const entries = bundle.entry || [];
				
				for (const entry of entries) {
					const resource = entry.resource;
					const tags = resource.meta?.tag || [];
					
					for (const tag of tags) {
						// Only count workshop tags
						if (tag.system === WORKSHOP_TAG_SYSTEM && tag.code) {
							const tagCode = tag.code;
							
							if (!tagMap.has(tagCode)) {
								tagMap.set(tagCode, { 
									counts: {}, 
									total: 0,
									display: tag.display || tagCode
								});
							}
							
							const tagData = tagMap.get(tagCode);
							tagData.counts[resourceType] = (tagData.counts[resourceType] || 0) + 1;
							tagData.total++;
						}
					}
				}
			} catch (e) {
				console.error(`[discoverWorkshopTags] Error scanning ${resourceType}:`, e);
			}
		}
		
		return tagMap;
	}

	/**
	 * Delete resources of a specific type with a specific tag
	 * @param {string} resourceType - FHIR resource type
	 * @param {string} tag - Workshop tag code
	 * @returns {Promise<{deleted: number, errors: number}>}
	 */
	async deleteResourcesByTypeAndTag(resourceType, tag) {
		let deleted = 0;
		let errors = 0;
		
		try {
			const bundle = await this.search(resourceType, { _count: '1000' }, tag);
			const entries = bundle.entry || [];
			
			for (const entry of entries) {
				try {
					await this.delete(resourceType, entry.resource.id);
					deleted++;
				} catch (e) {
					console.error(`[deleteResourcesByTypeAndTag] Error deleting ${resourceType}/${entry.resource.id}:`, e.message);
					errors++;
				}
			}
		} catch (e) {
			console.error(`[deleteResourcesByTypeAndTag] Error searching ${resourceType}:`, e);
			errors++;
		}
		
		return { deleted, errors };
	}
}

// Export singleton instance
export const fhirClient = new FHIRClient();
