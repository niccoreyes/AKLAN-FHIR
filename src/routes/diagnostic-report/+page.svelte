<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, CLINIC_CAPABILITIES, LOINC_CODES } from '$constants';
	import { fhirClient } from '$services/fhir-client.js';

	// Get return URL from query params
	const returnTo = $derived($page.url.searchParams.get('returnTo') || '/dashboard');

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
			const caps = CLINIC_CAPABILITIES[appStore.clinicId];
			if (!caps?.canCreate?.includes('DiagnosticReport')) {
				window.location.replace('/dashboard');
			}
		}, 100);
		
		// Check for order param
		const orderId = $page.url.searchParams.get('order');
		const patient = $page.url.searchParams.get('patient');
		if (orderId) linkedOrderId = orderId;
		if (patient) {
			patientId = patient;
			loadPatient(patient);
		}
	});

	const clinic = $derived(CLINICS.find(c => c.id === appStore.clinicId));

	let patientId = $state('');
	let patientName = $state('');
	let linkedOrderId = $state('');
	let reportType = $state('');
	let results = $state([{ loinc: '', value: '', unit: '' }]);
	let conclusion = $state('');
	let isSubmitting = $state(false);
	let error = $state(null);
	let success = $state(false);

	const reportTypes = [
		{ code: LOINC_CODES.bloodPressurePanel, display: 'Blood Pressure' },
		{ code: LOINC_CODES.bloodGlucose, display: 'Blood Glucose' },
		{ code: '24331-1', display: 'Complete Blood Count' },
		{ code: '24325-3', display: 'Lipid Panel' },
		{ code: '24357-6', display: 'Urinalysis' },
		{ code: '24330-3', display: 'Liver Function' },
		{ code: 'custom', display: 'Custom Report' }
	];

	const commonUnits = {
		[LOINC_CODES.systolicBP]: 'mmHg',
		[LOINC_CODES.diastolicBP]: 'mmHg',
		[LOINC_CODES.bloodGlucose]: 'mg/dL',
		[LOINC_CODES.heartRate]: 'bpm',
		'8867-4': 'bpm',
		'9279-1': 'breaths/min',
		'8310-5': '°C',
		'2708-6': '%',
		'29463-7': 'kg',
		'8302-2': 'cm'
	};

	async function loadPatient(id) {
		try {
			const p = await fhirClient.read('Patient', id);
			patientName = p.name?.[0]?.text || `${p.name?.[0]?.family}, ${p.name?.[0]?.given?.join(' ')}`;
		} catch (e) {
			console.error('Load patient error:', e);
		}
	}

	function addResult() {
		results = [...results, { loinc: '', value: '', unit: '' }];
	}

	function removeResult(idx) {
		results = results.filter((_, i) => i !== idx);
	}

	async function submitReport() {
		if (!patientId || !reportType) {
			error = 'Patient and report type are required';
			return;
		}
		if (results.some(r => !r.loinc || !r.value)) {
			error = 'All results need LOINC code and value';
			return;
		}
		if (!appStore.practitionerId) {
			error = 'Practitioner not registered. Please wait for auto-registration to complete or refresh the page.';
			return;
		}
		isSubmitting = true;
		error = null;

		try {
			// Create observations first
			const observationRefs = [];
			for (const r of results) {
				const obs = {
					resourceType: 'Observation',
					status: 'final',
					category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }],
					code: { coding: [{ system: 'http://loinc.org', code: r.loinc }] },
					subject: { reference: `Patient/${patientId}` },
					performer: [{ reference: `Practitioner/${appStore.practitionerId}` }],
					effectiveDateTime: new Date().toISOString(),
					valueQuantity: {
						value: parseFloat(r.value),
						unit: r.unit,
						system: 'http://unitsofmeasure.org'
					}
				};
				const obsResult = await fhirClient.create(obs, appStore.workshopCode);
				observationRefs.push({ reference: `Observation/${obsResult.data.id}`, display: r.loinc });
			}

			// Create diagnostic report
			const selectedType = reportTypes.find(t => t.code === reportType);
			const report = {
				resourceType: 'DiagnosticReport',
				status: 'final',
				category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'LAB' }] }],
				code: reportType === 'custom' 
					? { text: 'Custom Laboratory Report' }
					: { coding: [{ system: 'http://loinc.org', code: selectedType.code, display: selectedType.display }] },
				subject: { reference: `Patient/${patientId}`, display: patientName },
				performer: [{ reference: `Practitioner/${appStore.practitionerId}`, display: appStore.userName }],
				effectiveDateTime: new Date().toISOString(),
				issued: new Date().toISOString(),
				result: observationRefs,
				conclusion: conclusion || undefined,
				basedOn: linkedOrderId ? [{ reference: `ServiceRequest/${linkedOrderId}` }] : undefined
			};

			await fhirClient.create(report, appStore.workshopCode);
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

	let patientSearchQuery = $state('');
	let patientSearchResults = $state([]);

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
	<div class="dr-page" style="--clinic-color: {clinic?.color || '#2563EB'}">
		<header class="page-header">
			<a href="/dashboard" class="back-btn">←</a>
			<h1>📄 Lab Report</h1>
		</header>

		<main class="page-content">
			{#if success}
				<div class="success-box">
					✅ Report submitted!
					<p>Results available to all clinics...</p>
				</div>
			{:else}
				<form onsubmit={(e) => { e.preventDefault(); submitReport(); }}>
					<!-- Patient -->
					<div class="field-group">
						<label>Patient</label>
						<input 
							type="text" 
							placeholder="Search patient..."
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

					<!-- Linked Order -->
					{#if linkedOrderId}
						<div class="linked-order">
							<span>🔗 Linked to Order: {linkedOrderId}</span>
						</div>
					{/if}

					<!-- Report Type -->
					<div class="field-group">
						<label>Report Type</label>
						<select bind:value={reportType} required>
							<option value="">Select test...</option>
							{#each reportTypes as rt}
								<option value={rt.code}>{rt.display}</option>
							{/each}
						</select>
					</div>

					<!-- Results -->
					<div class="results-section">
						<label>Results</label>
						{#each results as result, i}
							<div class="result-row">
								<input 
									type="text" 
									placeholder="LOINC code"
									bind:value={result.loinc}
									list="loincs"
									style="flex: 2"
								/>
								<input 
									type="text" 
									placeholder="Value"
									bind:value={result.value}
									style="flex: 1"
								/>
								<input 
									type="text" 
									placeholder="Unit"
									bind:value={result.unit}
									style="flex: 1"
								/>
								{#if results.length > 1}
									<button type="button" class="remove-btn" onclick={() => removeResult(i)}>×</button>
								{/if}
							</div>
						{/each}
						<button type="button" class="add-btn" onclick={addResult}>+ Add Result</button>
					</div>

					<datalist id="loincs">
						<option value={LOINC_CODES.systolicBP}>Systolic BP</option>
						<option value={LOINC_CODES.diastolicBP}>Diastolic BP</option>
						<option value={LOINC_CODES.heartRate}>Heart Rate</option>
						<option value={LOINC_CODES.bloodGlucose}>Blood Glucose</option>
						<option value={LOINC_CODES.bodyTemperature}>Temperature</option>
						<option value={LOINC_CODES.oxygenSaturation}>O2 Sat</option>
					</datalist>

					<!-- Conclusion -->
					<div class="field-group">
						<label>Conclusion / Interpretation</label>
						<textarea bind:value={conclusion} rows="2" placeholder="Overall interpretation..."></textarea>
					</div>

					{#if error}
						<div class="error-box">{error}</div>
					{/if}

					<button type="submit" class="submit-btn" disabled={isSubmitting}>
						{isSubmitting ? 'Submitting...' : '📄 Submit Report'}
					</button>
				</form>
			{/if}
		</main>
	</div>
{:else}
	<div class="loading">Redirecting...</div>
{/if}

<style>
	.dr-page {
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

	.linked-order {
		padding: 10px;
		background: #F0FDF4;
		border-radius: 8px;
		font-size: 13px;
		color: #15803D;
		margin-bottom: 16px;
	}

	.results-section {
		margin-bottom: 16px;
	}

	.results-section label {
		display: block;
		font-size: 13px;
		font-weight: 600;
		color: #374151;
		margin-bottom: 8px;
	}

	.result-row {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
		align-items: center;
	}

	.remove-btn {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		border: none;
		background: #FEE2E2;
		color: #B91C1C;
		font-size: 18px;
		cursor: pointer;
	}

	.add-btn {
		width: 100%;
		padding: 10px;
		border: 1px dashed #CBD5E1;
		background: #F8FAFC;
		border-radius: 8px;
		color: #64748B;
		font-size: 13px;
		cursor: pointer;
	}

	.add-btn:hover {
		border-color: var(--clinic-color);
		color: var(--clinic-color);
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
