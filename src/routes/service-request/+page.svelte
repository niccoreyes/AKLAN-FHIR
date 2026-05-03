<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, CLINIC_CAPABILITIES } from '$constants';
	import { fhirClient } from '$services/fhir-client.js';
	import { goto } from '$app/navigation';

	onMount(() => {
		if (browser && !appStore.isConfigured) {
			window.location.replace('/');
			return;
		}
		// Check clinic can create ServiceRequest
		const caps = CLINIC_CAPABILITIES[appStore.clinicId];
		if (!caps?.canCreate?.includes('ServiceRequest')) {
			window.location.replace('/dashboard');
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
				window.location.replace('/inbox?tab=orders');
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
</style>
