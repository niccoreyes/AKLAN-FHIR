<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, CLINIC_CAPABILITIES } from '$constants';
	import { fhirClient } from '$services/fhir-client.js';
	import { goto } from '$app/navigation';

	// Get return URL from query params
	const returnTo = $derived($page.url.searchParams.get('returnTo') || '/dashboard');
	const urlPatientId = $derived($page.url.searchParams.get('patient') || '');
	const urlEncounterId = $derived($page.url.searchParams.get('encounter') || '');

	onMount(() => {
		// Check URL params directly for immediate config check
		const url = browser ? new URL(window.location.href) : null;
		const hasUrlConfig = url && (url.searchParams.get('w') || url.searchParams.get('u') || url.searchParams.get('c'));
		
		// Give store time to initialize, then check
		setTimeout(() => {
			if (!appStore.isConfigured && !hasUrlConfig) {
				window.location.replace('/');
				return;
			}
			// Check clinic can create ServiceRequest
			const caps = CLINIC_CAPABILITIES[appStore.clinicId];
			if (!caps?.canCreate?.includes('ServiceRequest')) {
				window.location.replace('/dashboard');
			}
		}, 100);
		
		// Load patient and encounter from URL if provided
		if (urlPatientId) {
			loadPatientFromUrl(urlPatientId);
		}
	});

	const clinic = $derived(CLINICS.find(c => c.id === appStore.clinicId));

	let patientId = $state('');
	let patientName = $state('');
	let orderType = $state('');
	let orderCode = $state('');
	let category = $state('');
	let priority = $state('routine');
	let note = $state('');
	let isSubmitting = $state(false);
	let error = $state(null);
	let success = $state(false);
	
	// Encounter
	let encounterId = $state('');
	let encounterName = $state('');
	let patientEncounters = $state([]);
	let showEncounterSelector = $state(false);

	const orderTypes = [
		{ code: '24331-1', display: 'Complete Blood Count (CBC)', category: 'laboratory' },
		{ code: '24323-8', display: 'Blood Glucose (Fasting)', category: 'laboratory' },
		{ code: '24325-3', display: 'Lipid Panel', category: 'laboratory' },
		{ code: '24330-3', display: 'Liver Function Test', category: 'laboratory' },
		{ code: '24357-6', display: 'Urinalysis', category: 'laboratory' },
		{ code: '24313-9', display: 'Chest X-Ray', category: 'imaging' },
		{ code: 'referral', display: 'Referral to Specialist', category: 'referral' }
	];

	async function submitOrder() {
		if (!patientId || !orderType) {
			error = 'Patient and order type are required';
			return;
		}
		if (!appStore.practitionerId) {
			// Trigger auto-registration if not registered
			error = 'Connecting to FHIR server...';
			await appStore.registerParticipant();
			if (!appStore.practitionerId) {
				error = 'Failed to register practitioner. Please refresh the page.';
				return;
			}
		}
		isSubmitting = true;
		error = null;

		try {
			const selected = orderTypes.find(o => o.code === orderType);
			const resource = {
				resourceType: 'ServiceRequest',
				status: 'active',
				intent: 'order',
				priority,
				subject: { reference: `Patient/${patientId}`, display: patientName },
				requester: { reference: `Practitioner/${appStore.practitionerId}`, display: appStore.userName },
				authoredOn: new Date().toISOString(),
				encounter: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
				performerType: selected?.category === 'referral' 
					? { text: 'Specialist' }
					: { coding: [{ system: 'http://snomed.info/sct', code: '261183007', display: 'Laboratory' }] },
				code: selected?.code !== 'referral' 
					? { coding: [{ system: 'http://loinc.org', code: selected.code, display: selected.display }], text: selected.display }
					: { text: 'Referral to Specialist' },
				category: [{ coding: [{ system: 'http://snomed.info/sct', code: selected?.category === 'imaging' ? '363679005' : '108252007', display: selected?.category }] }],
				note: note ? [{ text: note }] : undefined
			};

			await fhirClient.create(resource, appStore.workshopCode);
			success = true;
			setTimeout(() => {
				// Preserve workshop parameters when redirecting
				const params = new URLSearchParams();
				if (appStore.workshopCode) params.set('w', appStore.workshopCode);
				if (appStore.userName) params.set('u', appStore.userName);
				if (appStore.clinicId) params.set('c', appStore.clinicId);
				if (appStore.roleId) params.set('r', appStore.roleId);
				const redirectUrl = returnTo + (returnTo.includes('?') ? '&' : '?') + params.toString();
				window.location.replace(redirectUrl);
			}, 1500);
		} catch (e) {
			error = e.message;
		}
		isSubmitting = false;
	}

	async function searchPatient(name) {
		if (!name || name.length < 2) return;
		try {
			const result = await fhirClient.search('Patient', {
				name,
				_tag: appStore.workshopCode,
				_count: '5'
			});
			return result.entry?.map(e => ({
				id: e.resource.id,
				name: e.resource.name?.[0]?.text || `${e.resource.name?.[0]?.family}, ${e.resource.name?.[0]?.given?.join(' ')}`
			})) || [];
		} catch (e) {
			return [];
		}
	}

	let patientSearchResults = $state([]);
	let patientSearchQuery = $state('');

	async function onPatientSearch() {
		patientSearchResults = await searchPatient(patientSearchQuery);
	}

	function selectPatient(p) {
		patientId = p.id;
		patientName = p.name;
		patientSearchQuery = p.name;
		patientSearchResults = [];
		// Load encounters for this patient
		loadPatientEncounters(p.id);
	}
	
	function clearPatient() {
		patientId = '';
		patientName = '';
		patientSearchQuery = '';
		patientSearchResults = [];
		encounterId = '';
		encounterName = '';
		patientEncounters = [];
	}
	
	// Load patient and encounters from URL params
	async function loadPatientFromUrl(pid) {
		try {
			const patient = await fhirClient.read('Patient', pid);
			if (patient) {
				patientId = pid;
				patientName = patient.name?.[0]?.text || `${patient.name?.[0]?.family}, ${patient.name?.[0]?.given?.join(' ')}`;
				patientSearchQuery = patientName;
				
				// Load patient's encounters
				await loadPatientEncounters(pid);
				
				// If encounter ID is in URL, select it
				if (urlEncounterId) {
					const enc = patientEncounters.find(e => e.id === urlEncounterId);
					if (enc) {
						selectEncounter(enc);
					}
				}
			}
		} catch (e) {
			console.error('Failed to load patient from URL:', e);
		}
	}
	
	// Load patient's encounters
	async function loadPatientEncounters(pid) {
		try {
			const result = await fhirClient.search('Encounter', {
				patient: `Patient/${pid}`,
				_tag: appStore.workshopCode,
				_count: '20',
				_sort: '-date'
			});
			patientEncounters = result.entry?.map(e => ({
				id: e.resource.id,
				type: e.resource.type?.[0]?.text || e.resource.type?.[0]?.coding?.[0]?.display || 'Visit',
				date: e.resource.period?.start,
				status: e.resource.status
			})) || [];
		} catch (e) {
			console.error('Failed to load encounters:', e);
			patientEncounters = [];
		}
	}
	
	function selectEncounter(enc) {
		encounterId = enc.id;
		encounterName = `${enc.type} - ${new Date(enc.date).toLocaleDateString()}`;
		showEncounterSelector = false;
	}
	
	function clearEncounter() {
		encounterId = '';
		encounterName = '';
	}
</script>

{#if appStore.isConfigured}
	<div class="sr-page" style="--clinic-color: {clinic?.color || '#2563EB'}">
		<header class="page-header">
			<a href="/dashboard" class="back-btn">←</a>
			<h1>🧪 Order Labs / Referral</h1>
		</header>

		<main class="page-content">
			{#if success}
				<div class="success-box">
					✅ Order submitted successfully!
					<p>Redirecting to work queue...</p>
				</div>
			{:else}
				<form onsubmit={(e) => { e.preventDefault(); submitOrder(); }}>
					<!-- Patient Search -->
					<div class="field-group">
						<label>Patient</label>
						<input 
							type="text" 
							placeholder="Search patient by name..."
							bind:value={patientSearchQuery}
							oninput={onPatientSearch}
						/>
						{#if patientSearchResults.length > 0}
							<div class="search-dropdown">
								{#each patientSearchResults as p}
									<button type="button" class="search-result" onclick={() => selectPatient(p)}>
										{p.name}
									</button>
								{/each}
							</div>
						{/if}
						{#if patientId}
							<p class="selected-patient">Selected: {patientName}</p>
						{/if}
					</div>

					<!-- Encounter Selector (when patient is selected) -->
					{#if patientId}
						<div class="field-group encounter-selector">
							<label>
								Encounter (Optional)
								{#if encounterId}
									<span class="linked-badge">🔗 Linked</span>
								{/if}
							</label>
							
							{#if encounterId}
								<div class="selected-encounter">
									<span class="encounter-name">{encounterName}</span>
									<button type="button" class="clear-btn" onclick={clearEncounter}>×</button>
								</div>
							{:else}
								<button 
									type="button" 
									class="btn-select-encounter"
									onclick={() => showEncounterSelector = !showEncounterSelector}
								>
									{patientEncounters.length > 0 ? '🔗 Link to Encounter' : 'No encounters available'}
								</button>
								
								{#if showEncounterSelector && patientEncounters.length > 0}
									<div class="encounter-dropdown">
										<div class="dropdown-header">Select an encounter to link</div>
										{#each patientEncounters as enc}
											<button 
												type="button" 
												class="encounter-option"
												onclick={() => selectEncounter(enc)}
											>
												<span class="enc-type">{enc.type}</span>
												<span class="enc-date">{new Date(enc.date).toLocaleDateString()}</span>
												<span class="enc-status">{enc.status}</span>
											</button>
										{/each}
									</div>
								{/if}
							{/if}
						</div>
					{/if}

					<!-- Order Type -->
					<div class="field-group">
						<label>Order Type</label>
						<select bind:value={orderType} required>
							<option value="">Select test or referral...</option>
							{#each orderTypes as ot}
								<option value={ot.code}>{ot.display}</option>
							{/each}
						</select>
					</div>

					<!-- Category -->
					<div class="field-group">
						<label>Category</label>
						<select bind:value={category}>
							<option value="">Select category...</option>
							<option value="laboratory">Laboratory</option>
							<option value="imaging">Imaging</option>
							<option value="referral">Referral</option>
						</select>
					</div>

					<!-- Priority -->
					<div class="field-group">
						<label>Priority</label>
						<div class="priority-options">
							<label class="priority-label">
								<input type="radio" bind:group={priority} value="routine" />
								<span class="priority-badge routine">Routine</span>
							</label>
							<label class="priority-label">
								<input type="radio" bind:group={priority} value="urgent" />
								<span class="priority-badge urgent">Urgent</span>
							</label>
							<label class="priority-label">
								<input type="radio" bind:group={priority} value="stat" />
								<span class="priority-badge stat">STAT</span>
							</label>
						</div>
					</div>

					<!-- Note -->
					<div class="field-group">
						<label>Clinical Notes</label>
						<textarea bind:value={note} rows="3" placeholder="Add notes for the receiving facility..."></textarea>
					</div>

					{#if error}
						<div class="error-box">{error}</div>
					{/if}

					<button type="submit" class="submit-btn" disabled={isSubmitting}>
						{isSubmitting ? 'Submitting...' : '🧪 Submit Order'}
					</button>
				</form>
			{/if}
		</main>
	</div>
{:else}
	<div class="loading">Redirecting...</div>
{/if}

<style>
	.sr-page {
		min-height: 100vh;
		background: #F9FAFB;
	}

	.page-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background: white;
		border-bottom: 1px solid #E5E7EB;
	}

	.back-btn {
		font-size: 20px;
		text-decoration: none;
		color: #374151;
	}

	.page-header h1 {
		margin: 0;
		font-size: 18px;
		font-weight: 700;
		color: #111827;
	}

	.page-content {
		padding: 20px 16px 80px;
		max-width: 600px;
		margin: 0 auto;
	}

	.field-group {
		margin-bottom: 20px;
	}

	.field-group label {
		display: block;
		font-size: 13px;
		font-weight: 600;
		color: #374151;
		margin-bottom: 6px;
	}

	.field-group input,
	.field-group select,
	.field-group textarea {
		width: 100%;
		padding: 12px;
		border: 1px solid #E5E7EB;
		border-radius: 8px;
		font-size: 14px;
		background: white;
	}

	.field-group input:focus,
	.field-group select:focus,
	.field-group textarea:focus {
		outline: none;
		border-color: var(--clinic-color);
	}

	.search-dropdown {
		border: 1px solid #E5E7EB;
		border-radius: 8px;
		margin-top: 4px;
		overflow: hidden;
		background: white;
	}

	.search-result {
		width: 100%;
		padding: 10px 12px;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		font-size: 14px;
		border-bottom: 1px solid #F3F4F6;
	}

	.search-result:hover {
		background: #F9FAFB;
	}

	.selected-patient {
		margin: 6px 0 0 0;
		font-size: 13px;
		color: var(--clinic-color);
		font-weight: 600;
	}

	.priority-options {
		display: flex;
		gap: 12px;
	}

	.priority-label {
		display: flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
	}

	.priority-label input {
		width: auto;
	}

	.priority-badge {
		padding: 6px 14px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
	}

	.priority-badge.routine {
		background: #F3F4F6;
		color: #4B5563;
	}

	.priority-badge.urgent {
		background: #FEF3C7;
		color: #B45309;
	}

	.priority-badge.stat {
		background: #FEE2E2;
		color: #B91C1C;
	}

	.submit-btn {
		width: 100%;
		padding: 14px;
		background: var(--clinic-color);
		color: white;
		border: none;
		border-radius: 10px;
		font-size: 15px;
		font-weight: 700;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error-box {
		padding: 12px;
		background: #FEE2E2;
		color: #B91C1C;
		border-radius: 8px;
		font-size: 13px;
		margin-bottom: 16px;
	}

	.success-box {
		padding: 24px;
		background: #F0FDF4;
		color: #15803D;
		border-radius: 12px;
		text-align: center;
		font-weight: 600;
		font-size: 16px;
	}

	.success-box p {
		margin: 8px 0 0 0;
		font-size: 13px;
		font-weight: 400;
		color: #22C55E;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		font-size: 16px;
		color: #6B7280;
	}

	/* Encounter Selector Styles */
	.encounter-selector {
		background: #FAFAFA;
		padding: 12px;
		border-radius: 8px;
		border: 1px solid #E5E7EB;
	}

	.linked-badge {
		font-size: 11px;
		padding: 2px 8px;
		background: #DBEAFE;
		color: #1D4ED8;
		border-radius: 12px;
		font-weight: 600;
		margin-left: 8px;
	}

	.btn-select-encounter {
		width: 100%;
		padding: 10px 12px;
		background: white;
		border: 2px dashed #CBD5E1;
		border-radius: 8px;
		color: #64748B;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-select-encounter:hover {
		border-color: #3B82F6;
		color: #3B82F6;
		background: #EFF6FF;
	}

	.selected-encounter {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px;
		background: #DBEAFE;
		border-radius: 8px;
		border: 1px solid #93C5FD;
	}

	.encounter-name {
		font-weight: 600;
		color: #1E40AF;
		font-size: 14px;
	}

	.clear-btn {
		background: none;
		border: none;
		font-size: 18px;
		color: #64748B;
		cursor: pointer;
		padding: 0 4px;
		line-height: 1;
	}

	.clear-btn:hover {
		color: #EF4444;
	}

	.encounter-dropdown {
		margin-top: 8px;
		background: white;
		border: 1px solid #E5E7EB;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		max-height: 200px;
		overflow-y: auto;
	}

	.dropdown-header {
		padding: 8px 12px;
		font-size: 12px;
		font-weight: 600;
		color: #6B7280;
		background: #F9FAFB;
		border-bottom: 1px solid #E5E7EB;
	}

	.encounter-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px;
		border: none;
		background: none;
		cursor: pointer;
		width: 100%;
		text-align: left;
		transition: background 0.2s;
		border-bottom: 1px solid #F3F4F6;
	}

	.encounter-option:hover {
		background: #F3F4F6;
	}

	.encounter-option:last-child {
		border-bottom: none;
	}

	.enc-type {
		font-weight: 500;
		color: #1E293B;
		font-size: 13px;
	}

	.enc-date {
		font-size: 12px;
		color: #6B7280;
		margin-left: auto;
		margin-right: 12px;
	}

	.enc-status {
		font-size: 11px;
		padding: 2px 6px;
		background: #F3F4F6;
		color: #6B7280;
		border-radius: 4px;
		text-transform: capitalize;
	}
</style>
