<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, CLINIC_CAPABILITIES } from '$constants';
	import { fhirClient } from '$services/fhir-client.js';

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

	let patientId = $state('');
	let patientName = $state('');
	let medication = $state('');
	let dosage = $state('');
	let route = $state('oral');
	let frequency = $state('1');
	let period = $state('1');
	let periodUnit = $state('d');
	let quantity = $state('30');
	let note = $state('');
	let isSubmitting = $state(false);
	let error = $state(null);
	let success = $state(false);

	const commonMeds = [
		'Amlodipine 5mg',
		'Metformin 500mg',
		'Losartan 50mg',
		'Paracetamol 500mg',
		'Amoxicillin 500mg',
		'Cefuroxime 500mg',
		'Metoprolol 50mg',
		'Simvastatin 20mg',
		'Omeprazole 20mg',
		'Salbutamol 2mg'
	];

	async function submitRx() {
		if (!patientId || !medication) {
			error = 'Patient and medication are required';
			return;
		}
		isSubmitting = true;
		error = null;

		try {
			const resource = {
				resourceType: 'MedicationRequest',
				status: 'active',
				intent: 'order',
				subject: { reference: `Patient/${patientId}`, display: patientName },
				requester: { reference: `Practitioner/${appStore.practitionerId}`, display: appStore.userName },
				authoredOn: new Date().toISOString(),
				medicationCodeableConcept: { text: medication },
				dosageInstruction: [{
					text: `${dosage || 'Take as directed'} ${route}`,
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
					quantity: { value: parseInt(quantity), unit: 'tablet' }
				},
				note: note ? [{ text: note }] : undefined
			};

			await fhirClient.create(resource, appStore.workshopCode);
			success = true;
			setTimeout(() => {
				window.location.replace('/inbox?tab=rx');
			}, 1500);
		} catch (e) {
			error = e.message;
		}
		isSubmitting = false;
	}

	let patientSearchResults = $state([]);
	let patientSearchQuery = $state('');

	async function onPatientSearch() {
		if (!patientSearchQuery || patientSearchQuery.length < 2) {
			patientSearchResults = [];
			return;
		}
		try {
			const result = await fhirClient.search('Patient', {
				name: patientSearchQuery,
				_tag: appStore.workshopCode,
				_count: '5'
			});
			patientSearchResults = result.entry?.map(e => ({
				id: e.resource.id,
				name: e.resource.name?.[0]?.text || `${e.resource.name?.[0]?.family}, ${e.resource.name?.[0]?.given?.join(' ')}`
			})) || [];
		} catch (e) {
			patientSearchResults = [];
		}
	}

	function selectPatient(p) {
		patientId = p.id;
		patientName = p.name;
		patientSearchQuery = p.name;
		patientSearchResults = [];
	}
</script>

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
					<p>Redirecting to work queue...</p>
				</div>
			{:else}
				<form onsubmit={(e) => { e.preventDefault(); submitRx(); }}>
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

					<!-- Medication -->
					<div class="field-group">
						<label>Medication</label>
						<input type="text" bind:value={medication} list="meds" placeholder="e.g. Amlodipine 5mg" required />
						<datalist id="meds">
							{#each commonMeds as m}
								<option value={m} />
							{/each}
						</datalist>
					</div>

					<!-- Dosage -->
					<div class="field-group">
						<label>Dosage Instructions</label>
						<textarea bind:value={dosage} rows="2" placeholder="e.g. Take 1 tablet by mouth"></textarea>
					</div>

					<!-- Route & Frequency -->
					<div class="field-row">
						<div class="field-group half">
							<label>Route</label>
							<select bind:value={route}>
								<option value="oral">Oral</option>
								<option value="IV">IV</option>
								<option value="IM">IM</option>
								<option value="Subcutaneous">Subcutaneous</option>
								<option value="Topical">Topical</option>
							</select>
						</div>
						<div class="field-group half">
							<label>Quantity</label>
							<input type="number" bind:value={quantity} min="1" />
						</div>
					</div>

					<!-- Frequency -->
					<div class="field-row">
						<div class="field-group third">
							<label>Freq</label>
							<input type="number" bind:value={frequency} min="1" />
						</div>
						<div class="field-group third">
							<label>Every</label>
							<input type="number" bind:value={period} min="1" />
						</div>
						<div class="field-group third">
							<label>Unit</label>
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
						<label>Notes</label>
						<textarea bind:value={note} rows="2" placeholder="Special instructions..."></textarea>
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

	.field-row {
		display: flex;
		gap: 12px;
	}

	.field-group.half {
		flex: 1;
	}

	.field-group.third {
		flex: 1;
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
</style>
