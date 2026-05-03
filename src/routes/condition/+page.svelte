<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { appStore } from '$stores/appStore.svelte.js';
	import { fhirClient } from '$services/fhir-client.js';
	import { ACR_ICD_CODE_SYSTEM } from '$constants';
	import AppHeader from '$components/AppHeader.svelte';

	// Get params from URL
	const patientId = $derived($page.url.searchParams.get('patient') || '');
	const encounterId = $derived($page.url.searchParams.get('encounter') || '');
	const returnTo = $derived($page.url.searchParams.get('returnTo') || `/patient/${patientId}`);

	// Form state
	let selectedConditions = $state([]);
	
	// UI state
	let isSubmitting = $state(false);
	let error = $state('');
	let success = $state(false);
	
	// Patient and encounter info
	let patient = $state(null);
	let encounter = $state(null);
	let isLoading = $state(true);

	// Condition search state
	let conditionSearchTerm = $state('');
	let conditionSearchResults = $state([]);
	let isSearchingConditions = $state(false);
	let showConditionDropdown = $state(false);
	let conditionSearchTimeout = null;

	onMount(async () => {
		if (browser && !appStore.isConfigured) {
			window.location.replace('/workshop');
			return;
		}
		
		if (!patientId || !encounterId) {
			error = 'Patient and encounter IDs are required';
			isLoading = false;
			return;
		}
		
		await loadData();
	});

	async function loadData() {
		isLoading = true;
		try {
			const [patientData, encounterData] = await Promise.all([
				fhirClient.read('Patient', patientId).catch(() => null),
				fhirClient.read('Encounter', encounterId).catch(() => null)
			]);
			
			patient = patientData;
			encounter = encounterData;
			
			if (!patient || !encounter) {
				error = 'Failed to load patient or encounter data';
			}
		} catch (e) {
			error = 'Error loading data: ' + e.message;
		} finally {
			isLoading = false;
		}
	}

	function getPatientName() {
		if (!patient) return 'Unknown';
		const name = patient.name?.[0];
		if (!name) return 'Unknown';
		const given = name.given?.join(' ') || '';
		const family = name.family || '';
		return `${given} ${family}`.trim();
	}

	function getEncounterDisplay() {
		if (!encounter) return 'Unknown Encounter';
		const date = encounter.period?.start 
			? new Date(encounter.period.start).toLocaleDateString('en-PH')
			: 'Unknown date';
		const type = encounter.type?.[0]?.text || 'Visit';
		return `${type} on ${date}`;
	}

	// Debounced condition search
	async function searchConditions() {
		if (!conditionSearchTerm.trim() || conditionSearchTerm.length < 2) {
			conditionSearchResults = [];
			showConditionDropdown = false;
			return;
		}

		// Show dropdown immediately with loading state
		showConditionDropdown = true;
		isSearchingConditions = true;
		
		try {
			console.log('[Condition Search] Searching for:', conditionSearchTerm);
			const results = await fhirClient.searchACRCodes(conditionSearchTerm, 10);
			console.log('[Condition Search] Results:', results);
			
			// Filter out already selected conditions
			const selectedCodes = new Set(selectedConditions.map(c => c.code));
			conditionSearchResults = results.filter(r => !selectedCodes.has(r.code));
			
			// Keep dropdown open even if empty (to show "no results" message)
			showConditionDropdown = true;
		} catch (e) {
			console.error('[Condition Search] Error:', e);
			conditionSearchResults = [];
			// Still show dropdown to display error state
			showConditionDropdown = true;
		} finally {
			isSearchingConditions = false;
		}
	}

	function handleConditionSearchInput(event) {
		conditionSearchTerm = event.target.value;
		
		// Clear existing timeout
		if (conditionSearchTimeout) {
			clearTimeout(conditionSearchTimeout);
		}
		
		// Debounce search
		conditionSearchTimeout = setTimeout(() => {
			searchConditions();
		}, 300);
	}

	function selectCondition(condition) {
		selectedConditions = [...selectedConditions, condition];
		conditionSearchTerm = '';
		conditionSearchResults = [];
		showConditionDropdown = false;
	}

	function removeCondition(index) {
		selectedConditions = selectedConditions.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		if (selectedConditions.length === 0) {
			error = 'Please select at least one diagnosis';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const conditionResources = selectedConditions.map(condition => ({
				resourceType: 'Condition',
				clinicalStatus: {
					coding: [{
						system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
						code: 'active'
					}]
				},
				verificationStatus: {
					coding: [{
						system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
						code: 'confirmed'
					}]
				},
				category: [{
					coding: [{
						system: 'http://terminology.hl7.org/CodeSystem/condition-category',
						code: 'encounter-diagnosis',
						display: 'Encounter Diagnosis'
					}]
				}],
				code: {
					coding: [{
						system: ACR_ICD_CODE_SYSTEM,
						code: condition.code,
						display: condition.display
					}],
					text: condition.display
				},
				subject: {
					reference: `Patient/${patientId}`
				},
				encounter: {
					reference: `Encounter/${encounterId}`
				}
			}));

			// Create all conditions
			const results = await Promise.all(
				conditionResources.map(resource => 
					fhirClient.create(resource, appStore.workshopCode)
				)
			);

			const successCount = results.filter(r => r.success).length;
			
			if (successCount === selectedConditions.length) {
				success = true;
				appStore.addNotification({
					type: 'success',
					message: `Added ${successCount} diagnosis(es)`,
					duration: 2000
				});
			} else {
				error = `Created ${successCount}/${selectedConditions.length} conditions`;
			}
		} catch (e) {
			error = e.message || 'Error creating conditions';
		} finally {
			isSubmitting = false;
		}
	}

	function goBack() {
		if (returnTo) {
			goto(returnTo);
		} else {
			goto(`/patient/${patientId}`);
		}
	}
</script>

<AppHeader active="clinical" />

<div class="page-container">
	<div class="page-header">
		<button class="back-link" onclick={goBack}>← Back</button>
		<h1>🏥 Add Diagnosis</h1>
		<p class="subtitle">Document diagnoses for this encounter</p>
	</div>

	{#if isLoading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading...</p>
		</div>
	{:else if error && !success}
		<div class="error-banner">
			⚠️ {error}
		</div>
	{/if}

	{#if success}
		<div class="success-banner">
			<div class="success-icon">✅</div>
			<div class="success-content">
				<h3>Diagnoses Added Successfully!</h3>
				<p>Added {selectedConditions.length} diagnosis(es) to encounter</p>
				<button class="btn-primary" onclick={goBack}>
					← Back to Patient
				</button>
			</div>
		</div>
	{:else}
		<div class="condition-form">
			<!-- Context Card -->
			<div class="context-card">
				<div class="context-item">
					<span class="context-label">Patient</span>
					<span class="context-value">{getPatientName()}</span>
				</div>
				<div class="context-item">
					<span class="context-label">Encounter</span>
					<span class="context-value">{getEncounterDisplay()}</span>
				</div>
			</div>

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<!-- Selected Conditions -->
				{#if selectedConditions.length > 0}
					<div class="selected-conditions">
						<h3>Selected Diagnoses</h3>
						<div class="condition-chips">
							{#each selectedConditions as condition, index}
								<div class="condition-chip">
									<span class="condition-code">{condition.code}</span>
									<span class="condition-display">{condition.display}</span>
									<button 
										type="button" 
										class="condition-remove"
										onclick={() => removeCondition(index)}
										title="Remove diagnosis"
									>
										×
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Condition Search -->
				<div class="search-section">
					<h3>Search Diagnoses</h3>
					<div class="search-container">
						<div class="search-wrapper">
							<input 
								type="text" 
								value={conditionSearchTerm}
								oninput={handleConditionSearchInput}
								placeholder="Type to search ACR ICD-10 codes (e.g., diabetes, hypertension)..."
								autocomplete="off"
								class="search-input"
							/>
							{#if isSearchingConditions}
								<span class="search-spinner"></span>
							{/if}
						</div>
						<p class="search-help">Search PhilHealth ACR ICD-10 codes. Select multiple diagnoses if needed.</p>
					</div>
					
					<!-- Search Results Dropdown -->
					{#if showConditionDropdown}
						<div class="results-dropdown">
							{#if isSearchingConditions}
								<div class="dropdown-loading">
									<span class="dropdown-spinner"></span>
									<span>Searching ACR ICD-10...</span>
								</div>
							{:else if conditionSearchResults.length === 0}
								<div class="dropdown-empty">
									<span class="empty-icon">🔍</span>
									<span>No matching diagnoses found</span>
								</div>
							{:else}
								{#each conditionSearchResults as result}
									<button 
										type="button"
										class="result-option"
										onclick={() => selectCondition(result)}
									>
										<span class="result-code">{result.code}</span>
										<span class="result-display">{result.display}</span>
									</button>
								{/each}
							{/if}
						</div>
					{/if}
				</div>

				<!-- Actions -->
				<div class="form-actions">
					<button type="button" class="btn-cancel" onclick={goBack}>
						Cancel
					</button>
					<button 
						type="submit" 
						class="btn-submit"
						disabled={isSubmitting || selectedConditions.length === 0}
					>
						{#if isSubmitting}
							<span class="spinner-small"></span>
							Saving...
						{:else}
							🏥 Add {selectedConditions.length > 0 ? selectedConditions.length : ''} Diagnosis{selectedConditions.length !== 1 ? 'es' : ''}
						{/if}
					</button>
				</div>
			</form>
		</div>
	{/if}
</div>

<style>
	.page-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 24px;
		padding-bottom: 100px;
	}

	.page-header {
		margin-bottom: 24px;
	}

	.back-link {
		display: inline-block;
		color: #64748B;
		text-decoration: none;
		font-size: 14px;
		margin-bottom: 12px;
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		font-family: inherit;
	}

	.back-link:hover {
		color: #2563EB;
	}

	h1 {
		font-size: 24px;
		font-weight: 700;
		color: #1E293B;
		margin: 0 0 8px 0;
	}

	.subtitle {
		color: #64748B;
		font-size: 14px;
		margin: 0;
	}

	.loading-state {
		text-align: center;
		padding: 48px;
		color: #64748B;
	}

	.spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #E2E8F0;
		border-top-color: #2563EB;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin: 0 auto 16px;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-banner {
		background: #FEF2F2;
		border: 1px solid #FECACA;
		color: #DC2626;
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 20px;
		font-size: 14px;
	}

	.success-banner {
		background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%);
		border: 2px solid #86EFAC;
		border-radius: 16px;
		padding: 32px;
		text-align: center;
	}

	.success-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.success-content h3 {
		font-size: 20px;
		color: #166534;
		margin: 0 0 12px 0;
	}

	.success-content p {
		color: #166534;
		margin: 0 0 16px 0;
	}

	.condition-form {
		background: white;
		border-radius: 16px;
		border: 1px solid #E2E8F0;
		padding: 24px;
	}

	.context-card {
		background: #F0FDF4;
		border: 1px solid #BBF7D0;
		border-radius: 10px;
		padding: 16px;
		margin-bottom: 24px;
	}

	.context-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid #BBF7D0;
	}

	.context-item:last-child {
		border-bottom: none;
	}

	.context-label {
		font-size: 12px;
		font-weight: 600;
		color: #166534;
		text-transform: uppercase;
	}

	.context-value {
		font-size: 14px;
		font-weight: 500;
		color: #1F2937;
	}

	.selected-conditions {
		margin-bottom: 24px;
	}

	.selected-conditions h3 {
		font-size: 14px;
		font-weight: 600;
		color: #475569;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 16px 0;
		padding-bottom: 8px;
		border-bottom: 1px solid #E2E8F0;
	}

	.condition-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.condition-chip {
		display: flex;
		align-items: center;
		gap: 8px;
		background: white;
		border: 1px solid #86EFAC;
		border-radius: 8px;
		padding: 10px 12px;
		font-size: 13px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.condition-code {
		font-family: monospace;
		font-weight: 700;
		color: #059669;
		background: #D1FAE5;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 12px;
	}

	.condition-display {
		color: #1F2937;
		font-weight: 500;
	}

	.condition-remove {
		background: none;
		border: none;
		color: #EF4444;
		font-size: 18px;
		cursor: pointer;
		padding: 0 2px;
		line-height: 1;
		transition: color 0.2s;
	}

	.condition-remove:hover {
		color: #DC2626;
	}

	.search-section {
		margin-bottom: 24px;
	}

	.search-section h3 {
		font-size: 14px;
		font-weight: 600;
		color: #475569;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 16px 0;
		padding-bottom: 8px;
		border-bottom: 1px solid #E2E8F0;
	}

	.search-container {
		position: relative;
	}

	.search-wrapper {
		position: relative;
	}

	.search-input {
		width: 100%;
		padding: 12px 40px 12px 12px;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		font-size: 14px;
		font-family: inherit;
	}

	.search-input:focus {
		outline: none;
		border-color: #059669;
		box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
	}

	.search-spinner {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		width: 16px;
		height: 16px;
		border: 2px solid #E2E8F0;
		border-top-color: #059669;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.search-help {
		font-size: 12px;
		color: #6B7280;
		margin: 8px 0 0 0;
		font-style: italic;
	}

	.results-dropdown {
		border: 2px solid #059669;
		border-radius: 8px;
		margin-top: 8px;
		background: white;
		max-height: 280px;
		overflow-y: auto;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.result-option {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 12px 16px;
		border: none;
		background: white;
		text-align: left;
		cursor: pointer;
		transition: background 0.15s;
		font-size: 13px;
	}

	.result-option:hover {
		background: #F0FDF4;
	}

	.result-code {
		font-family: monospace;
		font-weight: 600;
		color: #059669;
		background: #D1FAE5;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 12px;
		flex-shrink: 0;
	}

	.result-display {
		color: #374151;
		font-weight: 500;
	}

	.dropdown-loading {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 16px;
		color: #6B7280;
		font-size: 13px;
		font-style: italic;
	}

	.dropdown-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid #E2E8F0;
		border-top-color: #059669;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.dropdown-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 20px 16px;
		color: #6B7280;
		font-size: 13px;
	}

	.empty-icon {
		font-size: 20px;
		opacity: 0.6;
	}

	.form-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
		padding-top: 16px;
		border-top: 1px solid #E2E8F0;
	}

	.btn-cancel {
		padding: 12px 24px;
		color: #64748B;
		background: none;
		border: none;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		font-size: 14px;
	}

	.btn-cancel:hover {
		background: #F8FAFC;
	}

	.btn-submit {
		padding: 12px 24px;
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		font-size: 14px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.btn-submit:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);
	}

	.btn-submit:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.btn-primary {
		padding: 12px 24px;
		background: #2563EB;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		font-size: 14px;
		text-decoration: none;
		display: inline-block;
	}

	.btn-primary:hover {
		background: #1D4ED8;
	}
</style>
