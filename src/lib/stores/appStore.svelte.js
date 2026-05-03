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
		notifications = [{ id, ...notification }, ...notifications].slice(0, 3);
		
		// Auto-remove after 2 seconds for welcome messages, 4 seconds for errors (unless persistent)
		if (!notification.persistent) {
			const duration = notification.duration || (notification.type === 'error' ? 4000 : 2000);
			setTimeout(() => {
				notifications = notifications.filter(n => n.id !== id);
			}, duration);
		}
	}
	
	/**
	 * Remove notification by ID
	 */
	function removeNotification(id) {
		notifications = notifications.filter(n => n.id !== id);
	}
	
	/**
	 * Clear all notifications
	 */
	function clearNotifications() {
		notifications = [];
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
				
				// Save registration state to sessionStorage
				saveRegistrationState();
				
				addNotification({
					type: 'info',
					message: `Welcome back!`,
					duration: 1500
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
				
				// Save registration state to sessionStorage
				saveRegistrationState();
				
				addNotification({
					type: 'success',
					message: `Registered!`,
					duration: 1500
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
	
	/**
	 * Load registration state from sessionStorage
	 * @returns {boolean} Whether registration was previously attempted
	 */
	function loadRegistrationState() {
		if (!browser) return false;
		try {
			return sessionStorage.getItem(`workshop_registration_${workshopCode}_${userName}`) === 'true';
		} catch (e) {
			return false;
		}
	}
	
	/**
	 * Save registration state to sessionStorage
	 */
	function saveRegistrationState() {
		if (!browser || !workshopCode || !userName) return;
		try {
			sessionStorage.setItem(`workshop_registration_${workshopCode}_${userName}`, 'true');
		} catch (e) {
			console.error('[AppStore] Failed to save registration state:', e);
		}
	}
	
	/**
	 * Clear registration state from sessionStorage
	 */
	function clearRegistrationState() {
		if (!browser || !workshopCode || !userName) return;
		try {
			sessionStorage.removeItem(`workshop_registration_${workshopCode}_${userName}`);
		} catch (e) {
			console.error('[AppStore] Failed to clear registration state:', e);
		}
	}
	
	/**
	 * Logout - clear all state and redirect to home
	 */
	function logout() {
		if (!browser) return;
		
		// Clear registration state
		clearRegistrationState();
		
		// Clear URL parameters
		const url = new URL(window.location.href);
		url.searchParams.delete('w');
		url.searchParams.delete('u');
		url.searchParams.delete('c');
		url.searchParams.delete('r');
		url.searchParams.delete('v');
		window.history.replaceState({}, '', url);
		
		// Reset store state
		workshopCode = '';
		userName = '';
		clinicId = '';
		roleId = '';
		view = 'clinical';
		practitionerId = null;
		notifications = [];
		error = null;
		
		// Navigate to home
		window.location.href = '/';
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
		removeNotification,
		clearNotifications,
		registerParticipant,
		updateRole,
		buildUrl,
		logout,
		loadRegistrationState,
		saveRegistrationState,
		clearRegistrationState
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
