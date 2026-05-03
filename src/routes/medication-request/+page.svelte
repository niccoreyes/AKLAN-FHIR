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
		if (!caps?.canCreate?.includes('MedicationRequest')) {
			window.location.replace('/dashboard');
		}
	});

	const clinic = $derived(CLINICS.find(c => c.id === appStore.clinicId));

	// Patient
	let patientId = $state('');
	let patientName = $state('');
	let patientSearchResults = $state([]);
	let patientSearchQuery = $state('');
	let isSearchingPatients = $state(false);
	let showPatientDropdown = $state(false);

	// Medication
	let selectedMedication = $state(null); // {code, display, system, strength, form}
	let medSearchQuery = $state('');
	let medSearchResults = $state([]);
	let isSearchingMeds = $state(false);
	let showDropdown = $state(false);

	// Dosage fields (populated from selection or manual)
	let medName = $state('');
	let strength = $state('');
	let form = $state('tablet');
	let dosageText = $state('');
	let route = $state('oral');
	let frequency = $state('1');
	let period = $state('1');
	let periodUnit = $state('d');
	let quantity = $state('30');
	let note = $state('');

	let isSubmitting = $state(false);
	let error = $state(null);
	let success = $state(false);
	let useFreeText = $state(false);

	const PH_FDA_SYSTEM = 'https://thomasreyes.vercel.app/ph-fda';
	const PH_FDA_VALUESET = 'https://tx.fhirlab.net/fhir/ValueSet/TestPHFDACPRVS';

	// Extract strength from display name
	function extractStrength(display) {
		// Match patterns like "500", "500mg", "500 mg", "10mg/5ml"
		const strengthMatch = display.match(/(\d+\s*(?:mg|g|ml|mcg|iu|unit)?(?:\/?\d*\s*(?:mg|g|ml|mcg)?)?)/i);
		return strengthMatch ? strengthMatch[0] : '';
	}

	// Extract form from display name
	function extractForm(display) {
		const forms = ['tablet', 'capsule', 'syrup', 'suspension', 'injection', 'cream', 'ointment', 'drops', 'inhaler'];
		const lower = display.toLowerCase();
		for (const f of forms) {
			if (lower.includes(f)) return f;
		}
		return 'tablet';
	}

	// Search Philippine FDA medications
	async function searchMedications(query) {
		if (!query || query.length < 2) {
			medSearchResults = [];
			showDropdown = false;
			return;
		}
		isSearchingMeds = true;
		showDropdown = true;
		try {
			const response = await fetch(
				`${PH_FDA_VALUESET}/$expand?filter=${encodeURIComponent(query)}&count=15`,
				{ headers: { 'Accept': 'application/fhir+json' } }
			);
			if (!response.ok) throw new Error('Search failed');
			const data = await response.json();
			// Process results to extract strength
			medSearchResults = (data.expansion?.contains || []).map(med => ({
				...med,
				strength: extractStrength(med.display),
				form: extractForm(med.display),
				nameOnly: med.display.replace(/\s*\d+\s*(?:mg|g|ml|mcg).*/i, '').trim()
			}));
		} catch (e) {
			console.error('Medication search error:', e);
			medSearchResults = [];
		}
		isSearchingMeds = false;
	}

	// When user selects from dropdown
	function selectMedication(med) {
		selectedMedication = med;
		medSearchQuery = med.display;
		medName = med.nameOnly || med.display;
		strength = med.strength || '';
		form = med.form || 'tablet';
		// Auto-build dosage text
		dosageText = `${strength ? strength + ' ' : ''}${form}`;
		medSearchResults = [];
		showDropdown = false;
		useFreeText = false;
	}

	// Switch to free text mode
	function enableFreeText() {
		useFreeText = true;
		selectedMedication = null;
		medName = medSearchQuery;
		medSearchResults = [];
		showDropdown = false;
	}

	// Clear all medication fields
	function clearMedication() {
		selectedMedication = null;
		medSearchQuery = '';
		medName = '';
		strength = '';
		form = 'tablet';
		dosageText = '';
		useFreeText = false;
		medSearchResults = [];
		showDropdown = false;
	}

	// Patient search with loading state
	async function searchPatients(query) {
		if (!query || query.length < 2) {
			patientSearchResults = [];
			showPatientDropdown = false;
			return;
		}
		isSearchingPatients = true;
		showPatientDropdown = true;
		try {
			const result = await fhirClient.search('Patient', {
				name: query,
				_tag: appStore.workshopCode,
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
		showPatientDropdown = false;
	}

	function clearPatient() {
		patientId = '';
		patientName = '';
		patientSearchQuery = '';
		patientSearchResults = [];
		showPatientDropdown = false;
	}

	// Debounce searches
	let patientSearchTimeout;
	function onPatientSearchInput() {
		clearTimeout(patientSearchTimeout);
		if (patientSearchQuery.length < 2) {
			patientSearchResults = [];
			showPatientDropdown = false;
			return;
		}
		patientSearchTimeout = setTimeout(() => searchPatients(patientSearchQuery), 200);
	}

	let searchTimeout;
	function onMedSearch() {
		clearTimeout(searchTimeout);
		if (medSearchQuery.length < 2) {
			medSearchResults = [];
			showDropdown = false;
			return;
		}
		searchTimeout = setTimeout(() => searchMedications(medSearchQuery), 200);
	}

	async function submitRx() {
		if (!patientId) {
			error = 'Patient is required';
			return;
		}
		if (!medName && !medSearchQuery) {
			error = 'Medication name is required';
			return;
		}
		isSubmitting = true;
		error = null;

		try {
			// Build display text
			const fullMedText = `${medName || medSearchQuery}${strength ? ' ' + strength : ''} ${form}`.trim();
			
			// Build medicationCodeableConcept
			let medConcept;
			if (selectedMedication && !useFreeText) {
				// Use proper PH FDA coding
				medConcept = {
					coding: [{
						system: selectedMedication.system || PH_FDA_SYSTEM,
						code: selectedMedication.code,
						display: selectedMedication.display
					}],
					text: fullMedText
				};
			} else {
				// Free text entry
				medConcept = { text: fullMedText };
			}

			const resource = {
				resourceType: 'MedicationRequest',
				status: 'active',
				intent: 'order',
				subject: { reference: `Patient/${patientId}`, display: patientName },
				requester: { reference: `Practitioner/${appStore.practitionerId}`, display: appStore.userName },
				authoredOn: new Date().toISOString(),
				medicationCodeableConcept: medConcept,
				dosageInstruction: [{
					text: `${dosageText || medText} — ${frequency} time${frequency !== '1' ? 's' : ''} every ${period} ${periodUnit}`,
					route: { text: route },
					timing: {
						repeat: {
							frequency: parseInt(frequency),
							period: parseInt(period),
							periodUnit
						}
					}
				}],
				dispenseRequest: {
					quantity: { value: parseInt(quantity), unit: form === 'syrup' || form === 'suspension' ? 'ml' : 'tablet' }
				},
				note: note ? [{ text: note }] : undefined
			};

			await fhirClient.create(resource, appStore.workshopCode);
			success = true;
			setTimeout(() => {
				window.location.replace(returnTo);
			}, 1500);
		} catch (e) {
			error = e.message;
		}
		isSubmitting = false;
	}

	// Click outside to close dropdown
	function handleClickOutside(event) {
		if (!event.target.closest('.med-search-container')) {
			showDropdown = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

{#if appStore.isConfigured}
	<div class="rx-page" style="--clinic-color: {clinic?.color || '#2563EB'}">
		<header class="page-header">
			<a href="/dashboard" class="back-btn">←</a>
			<h1>💊 Prescribe Medication</h1>
		</header>

		<main class="page-content">
			{#if success}
				<div class="success-box">
					✅ Prescription submitted!
					<p>Pharmacy will be notified...</p>
				</div>
			{:else}
				<form onsubmit={(e) => { e.preventDefault(); submitRx(); }}>
					<!-- Patient Search -->
					<div class="field-group patient-search-container">
						<label>
							Patient
							{#if patientId}
								<span class="selected-badge">✓ Selected</span>
							{/if}
						</label>
						<div class="search-input-wrapper">
							<input 
								type="text" 
								placeholder="Search patients in your group..."
								bind:value={patientSearchQuery}
								oninput={onPatientSearchInput}
								onfocus={() => { if (patientSearchResults.length > 0) showPatientDropdown = true; }}
								disabled={!!patientId}
							/>
							{#if patientId}
								<button type="button" class="clear-btn" onclick={clearPatient}>×</button>
							{/if}
						</div>
						
						{#if isSearchingPatients}
							<div class="search-hint">🔍 Searching group patients...</div>
						{/if}
						
						{#if showPatientDropdown && patientSearchResults.length > 0}
							<div class="search-dropdown patient-dropdown">
								<div class="dropdown-header">🏷️ From Workshop: {appStore.workshopCode}</div>
								{#each patientSearchResults as p}
									<button type="button" class="search-result patient-result" onclick={() => selectPatient(p)}>
										<div class="patient-info">
											<span class="patient-name">{p.name}</span>
											<span class="patient-meta">{p.gender || ''} {p.birthDate ? '• Born: ' + p.birthDate : ''}</span>
										</div>
										<span class="patient-id">ID: {p.id.slice(-6)}</span>
									</button>
								{/each}
							</div>
						{/if}
						
						{#if patientSearchQuery.length >= 2 && !isSearchingPatients && patientSearchResults.length === 0 && !patientId}
							<div class="no-results-box">
								<p>No patients found in your group matching "{patientSearchQuery}"</p>
								<a href="/patient/new" class="create-patient-link">+ Register new patient</a>
							</div>
						{/if}
						
						{#if patientId}
							<p class="selected-patient-info">{patientName} (ID: {patientId.slice(-8)})</p>
						{/if}
					</div>

					<!-- Medication Search with Dropdown -->
					<div class="field-group med-search-container">
						<label>
							Medication Name
							{#if selectedMedication && !useFreeText}
								<span class="fda-badge">FDA {selectedMedication.code}</span>
							{/if}
							{#if useFreeText}
								<span class="free-badge">Free Text</span>
							{/if}
						</label>
						<div class="search-input-wrapper">
							<input 
								type="text" 
								placeholder="Type to search PH FDA registered medications..."
								bind:value={medSearchQuery}
								oninput={onMedSearch}
								onfocus={() => { if (medSearchResults.length > 0) showDropdown = true; }}
							/>
							{#if medSearchQuery}
								<button type="button" class="clear-btn" onclick={clearMedication}>×</button>
							{/if}
						</div>
						
						{#if isSearchingMeds}
							<div class="search-hint">🔍 Searching Philippine FDA database...</div>
						{/if}
						
						{#if showDropdown && medSearchResults.length > 0}
							<div class="search-dropdown med-dropdown">
								<div class="dropdown-header">🇵🇭 Select from PH FDA Registry</div>
								{#each medSearchResults as med}
									<button type="button" class="search-result med-result" onclick={() => selectMedication(med)}>
										<div class="med-info">
											<span class="med-name">{med.nameOnly || med.display}</span>
											{#if med.strength}
												<span class="med-strength">{med.strength} • {med.form}</span>
											{/if}
										</div>
										<span class="med-code">{med.code}</span>
									</button>
								{/each}
								<button type="button" class="free-text-option" onclick={enableFreeText}>
									💡 Use "{medSearchQuery}" as free text (no FDA code)
								</button>
							</div>
						{/if}
						
						{#if medSearchQuery.length >= 2 && !isSearchingMeds && medSearchResults.length === 0 && !selectedMedication}
							<div class="no-results-box">
								<p>No exact FDA match for "{medSearchQuery}"</p>
								<button type="button" class="use-text-btn" onclick={enableFreeText}>
									Use as free text prescription →
								</button>
							</div>
						{/if}
					</div>

					<!-- Editable Medication Details (Auto-populated or Manual) -->
					<div class="med-details-box">
						<div class="box-header">
							<span>Medication Details</span>
							{#if selectedMedication}
								<span class="auto-badge">Auto-filled from FDA</span>
							{/if}
						</div>
						
						<div class="detail-row">
							<div class="field-group flex-2">
								<label>Name</label>
								<input type="text" bind:value={medName} placeholder="Medication name" />
							</div>
							<div class="field-group flex-1">
								<label>Strength</label>
								<input type="text" bind:value={strength} placeholder="e.g. 500mg" />
							</div>
						</div>

						<div class="detail-row">
							<div class="field-group flex-1">
								<label>Form</label>
								<select bind:value={form}>
									<option value="tablet">Tablet</option>
									<option value="capsule">Capsule</option>
									<option value="syrup">Syrup</option>
									<option value="suspension">Suspension</option>
									<option value="injection">Injection</option>
									<option value="cream">Cream</option>
									<option value="ointment">Ointment</option>
									<option value="drops">Drops</option>
									<option value="inhaler">Inhaler</option>
								</select>
							</div>
							<div class="field-group flex-2">
								<label>Full Dosage Description</label>
								<input type="text" bind:value={dosageText} placeholder="e.g. 500mg tablet" />
							</div>
						</div>
					</div>

					<!-- Administration -->
					<div class="section-title">Administration Instructions</div>

					<div class="field-row">
						<div class="field-group third">
							<label>Route</label>
							<select bind:value={route}>
								<option value="oral">Oral</option>
								<option value="IV">IV</option>
								<option value="IM">IM</option>
								<option value="Subcutaneous">Subcutaneous</option>
								<option value="Topical">Topical</option>
							</select>
						</div>
						<div class="field-group third">
							<label>Quantity</label>
							<input type="number" bind:value={quantity} min="1" />
						</div>
						<div class="field-group third">
							<label>Unit</label>
							<input type="text" value={form === 'syrup' || form === 'suspension' ? 'ml' : 'tablets'} readonly class="readonly" />
						</div>
					</div>

					<div class="field-row">
						<div class="field-group third">
							<label>Times</label>
							<input type="number" bind:value={frequency} min="1" />
						</div>
						<div class="field-group third">
							<label>Every</label>
							<input type="number" bind:value={period} min="1" />
						</div>
						<div class="field-group third">
							<label>Period</label>
							<select bind:value={periodUnit}>
								<option value="h">Hour</option>
								<option value="d">Day</option>
								<option value="wk">Week</option>
								<option value="mo">Month</option>
							</select>
						</div>
					</div>

					<!-- Note -->
					<div class="field-group">
						<label>Clinical Notes</label>
						<textarea bind:value={note} rows="2" placeholder="Special instructions for pharmacy..."></textarea>
					</div>

					{#if error}
						<div class="error-box">{error}</div>
					{/if}

					<button type="submit" class="submit-btn" disabled={isSubmitting}>
						{isSubmitting ? 'Submitting...' : '💊 Submit Prescription'}
					</button>
				</form>
			{/if}
		</main>
	</div>
{:else}
	<div class="loading">Redirecting...</div>
{/if}

<style>
	.rx-page {
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

	.field-group input.readonly {
		background: #F3F4F6;
		color: #6B7280;
	}

	.fda-badge {
		font-size: 11px;
		padding: 2px 8px;
		background: #F0FDF4;
		color: #15803D;
		border-radius: 12px;
		font-weight: 600;
	}

	.free-badge {
		font-size: 11px;
		padding: 2px 8px;
		background: #FEF3C7;
		color: #B45309;
		border-radius: 12px;
		font-weight: 600;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-input-wrapper input {
		flex: 1;
	}

	.clear-btn {
		position: absolute;
		right: 8px;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: none;
		background: #FEE2E2;
		color: #B91C1C;
		font-size: 18px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
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
		max-height: 280px;
		overflow-y: auto;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
	}

	.dropdown-header {
		padding: 8px 12px;
		background: linear-gradient(135deg, #F0FDF4 0%, #F1F5F9 100%);
		font-size: 11px;
		font-weight: 700;
		color: #15803D;
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
		align-items: center;
	}

	.search-result:hover {
		background: #F9FAFB;
	}

	.med-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.med-name {
		font-weight: 600;
		color: #1E293B;
	}

	.med-strength {
		font-size: 12px;
		color: #6B7280;
	}

	.med-code {
		font-size: 11px;
		color: #6B7280;
		background: #F1F5F9;
		padding: 2px 8px;
		border-radius: 4px;
	}

	.free-text-option {
		width: 100%;
		padding: 12px;
		border: none;
		background: #FFFBEB;
		text-align: left;
		cursor: pointer;
		font-size: 13px;
		color: #B45309;
		font-style: italic;
	}

	.free-text-option:hover {
		background: #FEF3C7;
	}

	.no-results-box {
		padding: 16px;
		background: #FEF3C7;
		border-radius: 8px;
		margin-top: 8px;
	}

	.no-results-box p {
		margin: 0 0 8px 0;
		font-size: 13px;
		color: #92400E;
	}

	.use-text-btn {
		padding: 8px 16px;
		background: white;
		border: 1px solid #F59E0B;
		border-radius: 6px;
		color: #B45309;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}

	.selected-indicator {
		margin: 6px 0 0 0;
		font-size: 13px;
		color: var(--clinic-color);
		font-weight: 600;
	}

	/* Medication Details Box */
	.med-details-box {
		background: #F8FAFC;
		border: 2px solid #E2E8F0;
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 20px;
	}

	.box-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		font-size: 13px;
		font-weight: 700;
		color: #374151;
	}

	.auto-badge {
		font-size: 10px;
		padding: 3px 8px;
		background: #DBEAFE;
		color: #1D4ED8;
		border-radius: 20px;
		font-weight: 600;
	}

	.detail-row {
		display: flex;
		gap: 12px;
		margin-bottom: 12px;
	}

	.detail-row:last-child {
		margin-bottom: 0;
	}

	.flex-1 { flex: 1; }
	.flex-2 { flex: 2; }

	.section-title {
		font-size: 14px;
		font-weight: 700;
		color: #374151;
		margin: 24px 0 12px 0;
		padding-bottom: 8px;
		border-bottom: 1px solid #E5E7EB;
	}

	.field-row {
		display: flex;
		gap: 12px;
	}

	.field-group.third {
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
		margin-top: 8px;
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

	/* Patient Search Specific Styles */
	.selected-badge {
		font-size: 11px;
		padding: 2px 8px;
		background: #F0FDF4;
		color: #15803D;
		border-radius: 12px;
		font-weight: 600;
	}

	.patient-dropdown .dropdown-header {
		background: linear-gradient(135deg, #DBEAFE 0%, #F1F5F9 100%);
		color: #1D4ED8;
	}

	.patient-result {
		align-items: flex-start;
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
		text-transform: capitalize;
	}

	.patient-id {
		font-size: 10px;
		color: #94A3B8;
		background: #F1F5F9;
		padding: 2px 6px;
		border-radius: 4px;
		white-space: nowrap;
	}

	.create-patient-link {
		display: inline-block;
		margin-top: 8px;
		padding: 6px 12px;
		background: var(--clinic-color);
		color: white;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		text-decoration: none;
	}

	.selected-patient-info {
		margin: 8px 0 0 0;
		font-size: 13px;
		color: #15803D;
		font-weight: 600;
		background: #F0FDF4;
		padding: 8px 12px;
		border-radius: 8px;
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
