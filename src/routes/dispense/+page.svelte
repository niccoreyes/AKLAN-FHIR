<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, CLINIC_CAPABILITIES } from '$constants';
	import { fhirClient } from '$services/fhir-client.js';

	// Get return URL from query params
	const returnTo = $derived($page.url.searchParams.get('returnTo') || '/dashboard');

	onMount(() => {
		if (browser && !appStore.isConfigured) {
			window.location.replace('/');
			return;
		}
		const caps = CLINIC_CAPABILITIES[appStore.clinicId];
		if (!caps?.canCreate?.includes('MedicationDispense')) {
			window.location.replace('/dashboard');
		}
		// Load prescription if provided via URL
		const rxId = $page.url.searchParams.get('rx');
		if (rxId) loadPrescription(rxId);
	});

	const clinic = $derived(CLINICS.find(c => c.id === appStore.clinicId));

	// Patient search (across entire SHR - no group filter)
	let patientId = $state('');
	let patientName = $state('');
	let patientSearchQuery = $state('');
	let patientSearchResults = $state([]);
	let isSearchingPatients = $state(false);

	// Prescriptions for selected patient
	let patientPrescriptions = $state([]);
	let selectedPrescription = $state(null);
	let loadingPrescriptions = $state(false);

	// Dispense form fields
	let prescriptionId = $state('');
	let medication = $state('');
	let quantity = $state('');
	let daysSupply = $state('');
	let note = $state('');
	let isSubmitting = $state(false);
	let error = $state(null);
	let success = $state(false);

	// Search patients across entire SHR (no group filter)
	async function searchPatients(query) {
		if (!query || query.length < 2) {
			patientSearchResults = [];
			return;
		}
		isSearchingPatients = true;
		try {
			// Note: No _tag filter - search entire SHR
			const result = await fhirClient.search('Patient', {
				name: query,
				_count: '10'
			});
			patientSearchResults = result.entry?.map(e => ({
				id: e.resource.id,
				name: e.resource.name?.[0]?.text || `${e.resource.name?.[0]?.family}, ${e.resource.name?.[0]?.given?.join(' ')}`,
				gender: e.resource.gender,
				birthDate: e.resource.birthDate
			})) || [];
		} catch (e) {
			console.error('Patient search error:', e);
			patientSearchResults = [];
		}
		isSearchingPatients = false;
	}

	function selectPatient(p) {
		patientId = p.id;
		patientName = p.name;
		patientSearchQuery = p.name;
		patientSearchResults = [];
		// Load prescriptions for this patient
		loadPatientPrescriptions(p.id);
	}

	async function loadPatientPrescriptions(pid) {
		loadingPrescriptions = true;
		patientPrescriptions = [];
		try {
			// Get active prescriptions for this patient (no group filter - HIE mode)
			const result = await fhirClient.search('MedicationRequest', {
				patient: `Patient/${pid}`,
				status: 'active',
				_count: '20'
			});
			patientPrescriptions = result.entry?.map(e => ({
				id: e.resource.id,
				medication: e.resource.medicationCodeableConcept?.text || 
					e.resource.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown',
				dosage: e.resource.dosageInstruction?.[0]?.text || '',
				quantity: e.resource.dispenseRequest?.quantity?.value || '',
				requester: e.resource.requester?.display || 'Unknown prescriber',
				date: e.resource.authoredOn
			})) || [];
		} catch (e) {
			console.error('Load prescriptions error:', e);
		}
		loadingPrescriptions = false;
	}

	function selectPrescription(rx) {
		selectedPrescription = rx;
		prescriptionId = rx.id;
		medication = rx.medication;
		quantity = rx.quantity || '';
	}

	function clearSelection() {
		selectedPrescription = null;
		prescriptionId = '';
		medication = '';
		quantity = '';
	}

	async function submitDispense() {
		if (!patientId || !medication) {
			error = 'Patient and medication are required';
			return;
		}
		isSubmitting = true;
		error = null;

		try {
			const resource = {
				resourceType: 'MedicationDispense',
				status: 'completed',
				medicationCodeableConcept: { text: medication },
				subject: { reference: `Patient/${patientId}`, display: patientName },
				performer: [{ actor: { reference: `Practitioner/${appStore.practitionerId}`, display: appStore.userName } }],
				authorizingPrescription: prescriptionId ? [{ reference: `MedicationRequest/${prescriptionId}` }] : undefined,
				quantity: quantity ? { value: parseInt(quantity), unit: 'tablet' } : undefined,
				daysSupply: daysSupply ? { value: parseInt(daysSupply), unit: 'days' } : undefined,
				whenHandedOver: new Date().toISOString(),
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

	// Debounce patient search
	let patientSearchTimeout;
	function onPatientSearch() {
		clearTimeout(patientSearchTimeout);
		if (patientSearchQuery.length < 2) {
			patientSearchResults = [];
			return;
		}
		patientSearchTimeout = setTimeout(() => searchPatients(patientSearchQuery), 300);
	}
</script>

{#if appStore.isConfigured}
	<div class="dispense-page" style="--clinic-color: {clinic?.color || '#2563EB'}">
		<header class="page-header">
			<a href={returnTo} class="back-btn">←</a>
			<h1>💊 Dispense Medication</h1>
		</header>

		<main class="page-content">
			{#if success}
				<div class="success-box">
					✅ Medication dispensed!
					<p>Recorded and visible to all clinics...</p>
				</div>
			{:else}
				<form onsubmit={(e) => { e.preventDefault(); submitDispense(); }}>
					<!-- Patient Search (HIE Mode - search all SHR) -->
					<div class="field-group">
						<label>
							Patient
							<span class="hie-badge">🌐 HIE Search - All SHR</span>
						</label>
						<input 
							type="text" 
							placeholder="Search patient across all clinics..."
							bind:value={patientSearchQuery}
							oninput={onPatientSearch}
							disabled={!!patientId}
						/>
						{#if isSearchingPatients}
							<div class="search-hint">🔍 Searching entire Shared Health Record...</div>
						{/if}
						{#if patientSearchResults.length > 0}
							<div class="search-dropdown">
								<div class="dropdown-header">🌐 Found in SHR</div>
								{#each patientSearchResults as p}
									<button type="button" class="search-result" onclick={() => selectPatient(p)}>
										<div class="patient-info">
											<span class="patient-name">{p.name}</span>
											<span class="patient-meta">{p.gender || ''} {p.birthDate ? '• Born: ' + p.birthDate : ''}</span>
										</div>
										<span class="patient-id">ID: {p.id.slice(-6)}</span>
									</button>
								{/each}
							</div>
						{/if}
						{#if patientId}
							<div class="selected-patient">
								<span>✓ {patientName}</span>
								<button type="button" class="change-btn" onclick={() => { patientId = ''; patientName = ''; patientPrescriptions = []; selectedPrescription = null; }}>Change</button>
							</div>
						{/if}
					</div>

					<!-- Prescriptions for Selected Patient -->
					{#if patientId && !loadingPrescriptions}
						<div class="prescriptions-section">
							<label>Active Prescriptions for This Patient</label>
							{#if patientPrescriptions.length === 0}
								<div class="no-prescriptions">
									<p>No active prescriptions found</p>
								</div>
							{:else}
								<div class="prescriptions-list">
									{#each patientPrescriptions as rx}
										<button 
											type="button" 
											class="prescription-card"
											class:selected={selectedPrescription?.id === rx.id}
											onclick={() => selectPrescription(rx)}
										>
											<div class="rx-header">
												<strong>{rx.medication}</strong>
												<span class="rx-date">{new Date(rx.date).toLocaleDateString()}</span>
											</div>
											<p class="rx-dosage">{rx.dosage}</p>
											<p class="rx-requester">Prescribed by: {rx.requester}</p>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					{#if loadingPrescriptions}
						<div class="loading-prescriptions">Loading prescriptions...</div>
					{/if}

					<!-- Manual Entry or Selected Prescription -->
					<div class="dispense-form">
						<div class="form-header">
							<label>{selectedPrescription ? 'Selected Prescription' : 'Manual Entry'}</label>
							{#if selectedPrescription}
								<button type="button" class="clear-selection" onclick={clearSelection}>Clear selection</button>
							{/if}
						</div>

						<div class="field-group">
							<label>Medication</label>
							<input type="text" bind:value={medication} placeholder="Medication name" readonly={!!selectedPrescription} />
						</div>

						<div class="field-row">
							<div class="field-group half">
								<label>Quantity Dispensed</label>
								<input type="number" bind:value={quantity} min="1" placeholder="e.g. 30" />
							</div>
							<div class="field-group half">
								<label>Days Supply</label>
								<input type="number" bind:value={daysSupply} min="1" placeholder="e.g. 30" />
							</div>
						</div>

						<div class="field-group">
							<label>Dispense Notes</label>
							<textarea bind:value={note} rows="2" placeholder="Batch number, instructions, etc..."></textarea>
						</div>
					</div>

					{#if error}
						<div class="error-box">{error}</div>
					{/if}

					<button type="submit" class="submit-btn" disabled={isSubmitting || !patientId || !medication}>
						{isSubmitting ? 'Recording...' : '💊 Record Dispense'}
					</button>
				</form>
			{/if}
		</main>
	</div>
{:else}
	<div class="loading">Redirecting...</div>
{/if}

<style>
	.dispense-page {
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
		margin-bottom: 16px;
	}

	.field-group label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 600;
		color: #374151;
		margin-bottom: 6px;
	}

	.hie-badge {
		font-size: 10px;
		padding: 2px 8px;
		background: #FEF3C7;
		color: #B45309;
		border-radius: 12px;
		font-weight: 600;
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

	.field-group input:read-only {
		background: #F3F4F6;
		color: #6B7280;
	}

	.search-hint {
		font-size: 12px;
		color: #6B7280;
		margin-top: 4px;
		font-style: italic;
	}

	.search-dropdown {
		border: 1px solid #E5E7EB;
		border-radius: 8px;
		margin-top: 4px;
		overflow: hidden;
		background: white;
		max-height: 250px;
		overflow-y: auto;
	}

	.dropdown-header {
		padding: 8px 12px;
		background: linear-gradient(135deg, #FEF3C7 0%, #F1F5F9 100%);
		font-size: 11px;
		font-weight: 700;
		color: #B45309;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid #E5E7EB;
	}

	.search-result {
		width: 100%;
		padding: 12px;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		font-size: 14px;
		border-bottom: 1px solid #F3F4F6;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.search-result:hover {
		background: #F9FAFB;
	}

	.patient-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.patient-name {
		font-weight: 600;
		color: #1E293B;
	}

	.patient-meta {
		font-size: 12px;
		color: #6B7280;
	}

	.patient-id {
		font-size: 10px;
		color: #94A3B8;
		background: #F1F5F9;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.selected-patient {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 12px;
		background: #F0FDF4;
		border-radius: 8px;
		font-size: 14px;
		color: #15803D;
		font-weight: 600;
	}

	.change-btn {
		padding: 4px 10px;
		border: 1px solid #22C55E;
		background: white;
		border-radius: 6px;
		font-size: 12px;
		color: #15803D;
		cursor: pointer;
	}

	.prescriptions-section {
		margin-bottom: 20px;
	}

	.prescriptions-section label {
		display: block;
		font-size: 13px;
		font-weight: 600;
		color: #374151;
		margin-bottom: 10px;
	}

	.no-prescriptions {
		padding: 16px;
		background: #F3F4F6;
		border-radius: 8px;
		text-align: center;
		color: #6B7280;
		font-size: 13px;
	}

	.prescriptions-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.prescription-card {
		width: 100%;
		padding: 14px;
		border: 2px solid #E5E7EB;
		border-radius: 10px;
		background: white;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s;
	}

	.prescription-card:hover {
		border-color: var(--clinic-color);
		box-shadow: 0 2px 8px rgba(0,0,0,0.05);
	}

	.prescription-card.selected {
		border-color: var(--clinic-color);
		background: color-mix(in srgb, var(--clinic-color) 5%, white);
	}

	.rx-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
	}

	.rx-header strong {
		color: #1E293B;
		font-size: 14px;
	}

	.rx-date {
		font-size: 11px;
		color: #6B7280;
	}

	.rx-dosage {
		font-size: 13px;
		color: #4B5563;
		margin: 4px 0;
	}

	.rx-requester {
		font-size: 12px;
		color: #6B7280;
		margin: 0;
	}

	.loading-prescriptions {
		text-align: center;
		padding: 20px;
		color: #6B7280;
		font-size: 13px;
	}

	.dispense-form {
		background: #F8FAFC;
		border: 2px solid #E2E8F0;
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 16px;
	}

	.form-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.form-header label {
		margin: 0;
	}

	.clear-selection {
		padding: 4px 10px;
		border: 1px solid #E5E7EB;
		background: white;
		border-radius: 6px;
		font-size: 12px;
		color: #6B7280;
		cursor: pointer;
	}

	.field-row {
		display: flex;
		gap: 12px;
	}

	.field-group.half {
		flex: 1;
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
		opacity: 0.5;
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
</style>
