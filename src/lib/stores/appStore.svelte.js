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
	 */
	async function registerParticipant() {
		if (!workshopCode || !userName) return;
		
		isLoading = true;
		error = null;
		
		try {
			// Check if Practitioner already exists
			const identifier = `${workshopCode}|${userName}`;
			const searchResult = await fhirClient.search('Practitioner', {
				identifier: `${WORKSHOP_IDENTIFIER_SYSTEM}|${identifier}`
			});
			
			if (searchResult.entry && searchResult.entry.length > 0) {
				// Existing participant
				practitionerId = searchResult.entry[0].resource.id;
				addNotification({
					type: 'info',
					message: `Welcome back, ${userName}!`,
					duration: 3000
				});
			} else {
				// Create new Practitioner
				const practitioner = {
					resourceType: 'Practitioner',
					identifier: [{
						system: WORKSHOP_IDENTIFIER_SYSTEM,
						value: identifier
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
				
				addNotification({
					type: 'success',
					message: `Welcome, ${userName}! You're now registered.`,
					duration: 3000
				});
			}
		} catch (err) {
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
		updateRole
	};
}

// Create and export singleton
export const appStore = createAppStore();
