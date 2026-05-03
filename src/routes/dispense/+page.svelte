<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, CLINIC_CAPABILITIES } from '$constants';
	import { fhirClient } from '$services/fhir-client.js';

	onMount(() => {
		if (browser && !appStore.isConfigured) {
			window.location.replace('/');
			return;
		}
		const caps = CLINIC_CAPABILITIES[appStore.clinicId];
		if (!caps?.canCreate?.includes('MedicationDispense')) {
			window.location.replace('/dashboard');
		}
		// Load prescription if provided
		const rxId = $page.url.searchParams.get('rx');
		if (rxId) loadPrescription(rxId);
	});

	const clinic = $derived(CLINICS.find(c => c.id === appStore.clinicId));

	let prescriptionId = $state('');
	let prescription = $state(null);
	let patientId = $state('');
	let patientName = $state('');
	let medication = $state('');
	let quantity = $state('');
	let daysSupply = $state('');
	let note = $state('');
	let isSubmitting = $state(false);
	let error = $state(null);
	let success = $state(false);

	async function loadPrescription(id) {
		try {
			const rx = await fhirClient.read('MedicationRequest', id);
			prescription = rx;
			prescriptionId = id;
			patientId = rx.subject?.reference?.split('/')[1];
			patientName = rx.subject?.display || '';
			medication = rx.medicationCodeableConcept?.text || rx.medicationCodeableConcept?.coding?.[0]?.display || '';
			quantity = rx.dispenseRequest?.quantity?.value || '';
		} catch (e) {
			console.error('Load prescription error:', e);
		}
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
				medicationCodeableConcept: prescription?.medicationCodeableConcept || { text: medication },
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
				window.location.replace('/inbox?tab=rx');
			}, 1500);
		} catch (e) {
			error = e.message;
		}
		isSubmitting = false;
	}
</script>

{#if appStore.isConfigured}
	<div class="dispense-page" style="--clinic-color: {clinic?.color || '#2563EB'}">
		<header class="page-header">
			<a href="/dashboard" class="back-btn">←</a>
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
					{#if prescription}
						<div class="rx-info">
							<h3>Prescription Details</h3>
							<p><strong>Medication:</strong> {medication}</p>
							<p><strong>Patient:</strong> {patientName}</p>
							<p><strong>Prescribed by:</strong> {prescription.requester?.display || ''}</p>
							{#if prescription.dosageInstruction?.[0]?.text}
								<p><strong>Instructions:</strong> {prescription.dosageInstruction[0].text}</p>
							{/if}
						</div>
					{/if}

					<!-- Manual Entry Fields (if no prescription linked) -->
					{#if !prescription}
						<div class="field-group">
							<label>Patient ID</label>
							<input type="text" bind:value={patientId} placeholder="Enter patient ID" />
						</div>

						<div class="field-group">
							<label>Medication</label>
							<input type="text" bind:value={medication} placeholder="e.g. Amlodipine 5mg" />
						</div>
					{/if}

					<!-- Dispense Details -->
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

					{#if error}
						<div class="error-box">{error}</div>
					{/if}

					<button type="submit" class="submit-btn" disabled={isSubmitting}>
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

	.rx-info {
		background: #EFF6FF;
		border: 1px solid #BFDBFE;
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 20px;
	}

	.rx-info h3 {
		margin: 0 0 12px 0;
		font-size: 15px;
		color: #1D4ED8;
	}

	.rx-info p {
		margin: 4px 0;
		font-size: 14px;
		color: #374151;
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
	.field-group textarea {
		width: 100%;
		padding: 12px;
		border: 1px solid #E5E7EB;
		border-radius: 8px;
		font-size: 14px;
		background: white;
	}

	.field-group input:focus,
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
