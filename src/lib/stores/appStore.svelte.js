import { browser } from '$app/environment';
import { page } from '$app/stores';
import { derived } from 'svelte/store';
import { CLINICS, ROLES, WORKSHOP_IDENTIFIER_SYSTEM } from '$constants';
import { fhirClient } from '$services/fhir-client.js';

/**
 * Parse URL parameters for workshop state
 * @returns {Object} Parsed URL params
 */
export function parseUrlParams() {
	if (!browser) return {};
	
	const url = new URL(window.location.href);
	return {
		workshopCode: url.searchParams.get('w') || '',
		userName: url.searchParams.get('u') || '',
		clinicId: url.searchParams.get('c') || '',
		roleId: url.searchParams.get('r') || '',
		view: url.searchParams.get('v') || 'clinical' // 'clinical' or 'developer'
	};
}

/**
 * Update URL parameters
 * @param {Object} params - Parameters to update
 */
export function updateUrlParams(params) {
	if (!browser) return;
	
	const url = new URL(window.location.href);
	
	Object.entries(params).forEach(([key, value]) => {
		if (value) {
			url.searchParams.set(key, value);
		} else {
			url.searchParams.delete(key);
		}
	});
	
	window.history.replaceState({}, '', url);
}

/**
 * Create the main app store using Svelte 5 runes
 */
export function createAppStore() {
	// Parse initial URL params
	const initialParams = parseUrlParams();
	
	// Reactive state
	let workshopCode = $state(initialParams.workshopCode);
	let userName = $state(initialParams.userName);
	let clinicId = $state(initialParams.clinicId);
	let roleId = $state(initialParams.roleId);
	let view = $state(initialParams.view);
	
	// UI state
	let isLoading = $state(false);
	let error = $state(null);
	let notifications = $state([]);
	let groupFilterEnabled = $state(true); // Default: show only group data
	
	// Participant record (Practitioner resource)
	let practitionerId = $state(null);
	
	// Derived values
	const clinic = $derived(CLINICS.find(c => c.id === clinicId) || null);
	const role = $derived(ROLES.find(r => r.id === roleId) || null);
	const isConfigured = $derived(workshopCode && userName && clinicId);
	
	/**
	 * Set workshop code and update URL
	 */
	function setWorkshopCode(code) {
		workshopCode = code;
		updateUrlParams({ w: code });
	}
	
	/**
	 * Set user name and update URL
	 */
	function setUserName(name) {
		userName = name;
		updateUrlParams({ u: name });
	}
	
	/**
	 * Set clinic and update URL
	 */
	function setClinic(id) {
		clinicId = id;
		updateUrlParams({ c: id });
	}
	
	/**
	 * Set role and update URL
	 */
	function setRole(id) {
		roleId = id;
		updateUrlParams({ r: id });
	}
	
	/**
	 * Toggle between clinical and developer view
	 */
	function toggleView() {
		view = view === 'clinical' ? 'developer' : 'clinical';
		updateUrlParams({ v: view });
	}
	
	/**
	 * Toggle group filter
	 */
	function toggleGroupFilter() {
		groupFilterEnabled = !groupFilterEnabled;
	}
	
	/**
	 * Add notification
	 */
	function addNotification(notification) {
		const id = Date.now();
		notifications = [{ id, ...notification }, ...notifications].slice(0, 5);
		
		// Auto-remove after 5 seconds
		setTimeout(() => {
			notifications = notifications.filter(n => n.id !== id);
		}, 5000);
	}
	
	/**
	 * Register participant as Practitioner in SHR
	 * Uses name as unique identifier to avoid duplicates
	 */
	async function registerParticipant() {
		if (!workshopCode || !userName) return;
		
		isLoading = true;
		error = null;
		
		try {
			// Use the user's name as the unique identifier
			// Search for existing practitioner by name (case-insensitive)
			console.log(`[Practitioner] Searching for existing practitioner with name: "${userName}"`);
			
			const searchResult = await fhirClient.search('Practitioner', {
				name: userName,
				_count: '10'
			});
			
			// Filter to exact name match (FHIR search is partial match by default)
			const existingPractitioners = searchResult.entry?.filter(entry => {
				const practitioner = entry.resource;
				const practitionerName = practitioner.name?.[0]?.given?.[0] || '';
				// Case-insensitive exact match
				return practitionerName.toLowerCase() === userName.toLowerCase();
			}) || [];
			
			const existingCount = existingPractitioners.length;
			console.log(`[Practitioner] Search found ${existingCount} existing practitioner(s) with exact name match`);
			
			if (existingCount > 0 && existingPractitioners[0]?.resource?.id) {
				// Existing practitioner found - reuse it
				practitionerId = existingPractitioners[0].resource.id;
				console.log(`[Practitioner] Reusing existing practitioner: ${practitionerId}`);
				
				addNotification({
					type: 'info',
					message: `Welcome back, ${userName}!`,
					duration: 3000
				});
			} else {
				// No existing practitioner found - create new one
				console.log(`[Practitioner] No existing practitioner found with name "${userName}", creating new one...`);
				
				const practitioner = {
					resourceType: 'Practitioner',
					// Use name as the identifier - name serves as unique ID
					identifier: [{
						system: WORKSHOP_IDENTIFIER_SYSTEM,
						value: userName  // Use the name itself as the identifier value
					}],
					name: [{
						given: [userName]
					}],
					qualification: roleId ? [{
						code: {
							text: roleId
						}
					}] : []
				};
				
				const result = await fhirClient.create(practitioner, workshopCode);
				practitionerId = result.data.id;
				
				console.log(`[Practitioner] Created new practitioner: ${practitionerId}`);
				
				addNotification({
					type: 'success',
					message: `Welcome, ${userName}! You're now registered.`,
					duration: 3000
				});
			}
		} catch (err) {
			console.error('[Practitioner] Error during registration:', err);
			error = err.message;
			addNotification({
				type: 'error',
				message: `Error registering: ${err.message}`,
				duration: 5000
			});
		} finally {
			isLoading = false;
		}
	}
	
	/**
	 * Update participant role in SHR
	 */
	async function updateRole(newRoleId) {
		if (!practitionerId) return;
		
		try {
			const practitioner = await fhirClient.read('Practitioner', practitionerId);
			practitioner.qualification = [{
				code: {
					text: newRoleId
				}
			}];
			
			// Update via PUT (if supported) or recreate
			// For now, just update local state
			setRole(newRoleId);
		} catch (err) {
			console.error('Error updating role:', err);
		}
	}
	
	/**
	 * Build URL with workshop parameters preserved
	 * @param {string} path - Target path
	 * @param {Object} extraParams - Additional query parameters
	 * @returns {string} URL with workshop context
	 */
	function buildUrl(path, extraParams = {}) {
		const params = new URLSearchParams();
		
		// Always preserve workshop context
		if (workshopCode) params.set('w', workshopCode);
		if (userName) params.set('u', userName);
		if (clinicId) params.set('c', clinicId);
		if (roleId) params.set('r', roleId);
		
		// Add any extra parameters
		Object.entries(extraParams).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				params.set(key, String(value));
			}
		});
		
		const queryString = params.toString();
		return queryString ? `${path}?${queryString}` : path;
	}
	
	return {
		// State
		get workshopCode() { return workshopCode; },
		get userName() { return userName; },
		get clinicId() { return clinicId; },
		get roleId() { return roleId; },
		get view() { return view; },
		get isLoading() { return isLoading; },
		get error() { return error; },
		get notifications() { return notifications; },
		get groupFilterEnabled() { return groupFilterEnabled; },
		get practitionerId() { return practitionerId; },
		
		// Derived
		get clinic() { return clinic; },
		get role() { return role; },
		get isConfigured() { return isConfigured; },
		
		// Actions
		setWorkshopCode,
		setUserName,
		setClinic,
		setRole,
		toggleView,
		toggleGroupFilter,
		addNotification,
		registerParticipant,
		updateRole,
		buildUrl
	};
}

// Create and export singleton
export const appStore = createAppStore();

/**
 * Standalone helper to build URL with workshop context
 * Uses the appStore singleton
 */
export function buildWorkshopUrl(path, extraParams = {}) {
	return appStore.buildUrl(path, extraParams);
}
