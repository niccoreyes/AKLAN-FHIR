<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { appStore } from '$stores/appStore.svelte.js';
	import { 
		labTestCodesStore, 
		labUnitsStore, 
		getDefaultUnitForLoincCode,
		DEFAULT_LAB_PANELS,
		DEFAULT_LAB_COMPONENTS,
		DEFAULT_UCUM_UNITS
	} from '$stores/terminologyStore.js';
	import { getLoincDisplay, preloadCodeDisplays } from '$stores/codeDisplayStore.js';
	import { CLINICS, CLINIC_CAPABILITIES, LOINC_CODES } from '$constants';
	import { fhirClient } from '$services/fhir-client.js';

	// Get return URL from query params
	const returnTo = $derived($page.url.searchParams.get('returnTo') || '/dashboard');

	onMount(async () => {
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
		if (orderId) {
			linkedOrderId = orderId;
			// Load and prefill from ServiceRequest
			await loadServiceRequestAndPrefill(orderId);
		}
		if (patient && !patientId) {
			patientId = patient;
			await loadPatient(patient);
			patientSearchQuery = patientName;
		}

		// Fetch terminology data if not already loaded
		if (browser) {
			await labTestCodesStore.fetch();
			await labUnitsStore.fetch();
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

	// Subscribe to terminology stores
	let labTestData = $state(DEFAULT_LAB_COMPONENTS);
	let ucumUnits = $state(DEFAULT_UCUM_UNITS);
	
	// Cache for LOINC code displays fetched from terminology server
	let loincDisplays = $state(new Map());
	
	// Function to get display for a LOINC code (from cache or default)
	function getLoincDisplaySync(code) {
		return loincDisplays.get(code) || code;
	}
	
	// Load LOINC displays from terminology server
	async function loadLoincDisplays() {
		const allCodes = Object.values(labTestData).flat().map(t => t.code);
		
		// Fetch displays in parallel
		const displays = await Promise.all(
			allCodes.map(async (code) => {
				const display = await getLoincDisplay(code);
				return { code, display };
			})
		);
		
		// Update cache
		const newMap = new Map();
		displays.forEach(({ code, display }) => {
			newMap.set(code, display);
		});
		loincDisplays = newMap;
	}

	$effect(() => {
		const unsubscribeCodes = labTestCodesStore.subscribe(state => {
			if (state.panels && Object.keys(state.panels).length > 0) {
				labTestData = state.panels;
				// Load displays when data changes
				if (browser) {
					loadLoincDisplays();
				}
			}
		});

		const unsubscribeUnits = labUnitsStore.subscribe(state => {
			if (state.units && state.units.length > 0) {
				ucumUnits = state.units;
			}
		});

		return () => {
			unsubscribeCodes();
			unsubscribeUnits();
		};
	});

	// Report types with corrected LOINC codes from tx.fhirlab.net
	const reportTypes = [
		{ code: LOINC_CODES.bloodPressurePanel, display: 'Blood Pressure', category: 'vitals' },
		{ code: LOINC_CODES.bloodGlucose, display: 'Blood Glucose', category: 'vitals' },
		{ code: DEFAULT_LAB_PANELS.cbc.code, display: 'Complete Blood Count', category: 'laboratory' },
		{ code: DEFAULT_LAB_PANELS.lipid.code, display: 'Lipid Panel', category: 'laboratory' },
		{ code: DEFAULT_LAB_PANELS.urinalysis.code, display: 'Urinalysis', category: 'laboratory' },
		{ code: DEFAULT_LAB_PANELS.liver.code, display: 'Liver Function', category: 'laboratory' },
		{ code: 'custom', display: 'Custom Report', category: 'custom' }
	];

	// Get available LOINC codes based on selected report type
	const availableLoincCodes = $derived(() => {
		if (!reportType || reportType === 'custom') {
			// Return all lab components for custom reports
			return Object.values(labTestData).flat();
		}
		
		// Check if it's a lab panel
		if (labTestData[reportType]) {
			return labTestData[reportType];
		}
		
		// For vitals or other single tests
		return [];
	});

	// Track which results are showing the custom unit input
	let customUnitIndices = $state(new Set());

	async function loadPatient(id) {
		try {
			const p = await fhirClient.read('Patient', id);
			patientName = p.name?.[0]?.text || `${p.name?.[0]?.family}, ${p.name?.[0]?.given?.join(' ')}`;
		} catch (e) {
			console.error('Load patient error:', e);
		}
	}
	
	// Load patient encounters for selection
	async function loadPatientEncounters(patientId) {
		try {
			const result = await fhirClient.search('Encounter', {
				patient: `Patient/${patientId}`,
				_tag: appStore.workshopCode,
				_count: '20',
				_sort: '-date'
			});
			patientEncounters = result.entry?.map(e => ({
				id: e.resource.id,
				type: e.resource.type?.[0]?.text || 
					  e.resource.type?.[0]?.coding?.[0]?.display || 
					  e.resource.type?.[0]?.coding?.[0]?.code || 
					  'Visit',
				date: e.resource.period?.start,
				status: e.resource.status
			})) || [];
		} catch (e) {
			console.error('Load encounters error:', e);
			patientEncounters = [];
		}
	}
	
	function selectEncounter(encounter) {
		selectedEncounterId = encounter.id;
		selectedEncounterName = `${encounter.type} - ${new Date(encounter.date).toLocaleDateString()}`;
		showEncounterSelector = false;
	}

	// Map LOINC codes to report types
	const loincToReportType = {
		// CBC
		'58410-2': DEFAULT_LAB_PANELS.cbc.code,
		'6690-2': DEFAULT_LAB_PANELS.cbc.code,
		'789-8': DEFAULT_LAB_PANELS.cbc.code,
		'718-7': DEFAULT_LAB_PANELS.cbc.code,
		'4544-3': DEFAULT_LAB_PANELS.cbc.code,
		'777-3': DEFAULT_LAB_PANELS.cbc.code,
		'787-2': DEFAULT_LAB_PANELS.cbc.code,
		'785-6': DEFAULT_LAB_PANELS.cbc.code,
		// Lipid
		'24331-1': DEFAULT_LAB_PANELS.lipid.code,
		'2093-3': DEFAULT_LAB_PANELS.lipid.code,
		'13457-7': DEFAULT_LAB_PANELS.lipid.code,
		'2085-9': DEFAULT_LAB_PANELS.lipid.code,
		'2571-8': DEFAULT_LAB_PANELS.lipid.code,
		// Liver
		'24325-3': DEFAULT_LAB_PANELS.liver.code,
		'1742-6': DEFAULT_LAB_PANELS.liver.code,
		'1920-8': DEFAULT_LAB_PANELS.liver.code,
		'6768-6': DEFAULT_LAB_PANELS.liver.code,
		'1975-2': DEFAULT_LAB_PANELS.liver.code,
		// Urinalysis
		'24357-6': DEFAULT_LAB_PANELS.urinalysis.code,
		'5769-0': DEFAULT_LAB_PANELS.urinalysis.code,
		'5770-8': DEFAULT_LAB_PANELS.urinalysis.code,
		'5792-2': DEFAULT_LAB_PANELS.urinalysis.code,
		'5802-9': DEFAULT_LAB_PANELS.urinalysis.code,
		'5811-0': DEFAULT_LAB_PANELS.urinalysis.code,
		'5794-8': DEFAULT_LAB_PANELS.urinalysis.code
	};

	// Load ServiceRequest and prefill form
	async function loadServiceRequestAndPrefill(orderId) {
		try {
			const order = await fhirClient.read('ServiceRequest', orderId);
			
			// Prefill patient if not already set
			if (!patientId && order.subject?.reference) {
				const patientRef = order.subject.reference;
				if (patientRef.startsWith('Patient/')) {
					patientId = patientRef.replace('Patient/', '');
					await loadPatient(patientId);
					patientSearchQuery = patientName;
				}
			}

			// Determine report type from order code
			let orderLoinc = null;
			if (order.code?.coding?.[0]?.code) {
				orderLoinc = order.code.coding[0].code;
			} else if (order.code?.coding?.[0]?.system === 'http://loinc.org') {
				orderLoinc = order.code.coding[0].code;
			}

			if (orderLoinc) {
				// Check if it's a panel code directly
				if (labTestData[orderLoinc]) {
					reportType = orderLoinc;
				} else if (loincToReportType[orderLoinc]) {
					// Map individual test to panel
					reportType = loincToReportType[orderLoinc];
				} else {
					// Try to find matching report type by display name
					const orderDisplay = order.code?.text || order.code?.coding?.[0]?.display || '';
					const matchedType = reportTypes.find(rt => 
						orderDisplay.toLowerCase().includes(rt.display.toLowerCase())
					);
					if (matchedType) {
						reportType = matchedType.code;
					}
				}

				// Prefill results with component tests for the selected panel
				if (reportType && labTestData[reportType]) {
					const components = labTestData[reportType];
					results = components.map(comp => ({
						loinc: comp.code,
						value: '',
						unit: comp.unit || ''
					}));
				}
			}

			console.log(`[DiagnosticReport] Prefilled from ServiceRequest ${orderId}:`, {
				patientId,
				reportType,
				results: results.length
			});
		} catch (e) {
			console.error('[DiagnosticReport] Failed to load ServiceRequest:', e);
		}
	}

	function addResult() {
		results = [...results, { loinc: '', value: '', unit: '' }];
	}

	function removeResult(idx) {
		results = results.filter((_, i) => i !== idx);
		// Remove from custom unit indices if present
		customUnitIndices.delete(idx);
		customUnitIndices = new Set(customUnitIndices);
	}

	// Auto-fill unit when LOINC code changes
	function onLoincChange(result, idx) {
		const defaultUnit = getDefaultUnitForLoincCode(result.loinc, labTestData);
		if (defaultUnit && !result.unit) {
			result.unit = defaultUnit;
			results = [...results]; // Trigger reactivity
		}
	}

	// Toggle between dropdown and custom unit input
	function toggleCustomUnit(idx) {
		if (customUnitIndices.has(idx)) {
			customUnitIndices.delete(idx);
		} else {
			customUnitIndices.add(idx);
		}
		customUnitIndices = new Set(customUnitIndices);
	}

	// Get observation category based on report type
	function getObservationCategory() {
		const rt = reportTypes.find(t => t.code === reportType);
		if (rt?.category === 'laboratory') {
			return [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }] }];
		}
		return [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }];
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
			// Create observations first
			const observationRefs = [];
			for (const r of results) {
				const obs = {
					resourceType: 'Observation',
					status: 'final',
					category: getObservationCategory(),
					code: { coding: [{ system: 'http://loinc.org', code: r.loinc }] },
					subject: { reference: `Patient/${patientId}` },
					// Link to encounter if selected
					encounter: selectedEncounterId ? { reference: `Encounter/${selectedEncounterId}` } : undefined,
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
			
			// Update the linked ServiceRequest status to "completed" if an order was linked
			if (linkedOrderId) {
				try {
					const existingOrder = await fhirClient.read('ServiceRequest', linkedOrderId);
					if (existingOrder) {
						existingOrder.status = 'completed';
						// Add a note about the report
						if (!existingOrder.note) existingOrder.note = [];
						existingOrder.note.push({
							text: `Results reported by ${appStore.userName} on ${new Date().toLocaleString()}`,
							time: new Date().toISOString()
						});
						await fhirClient.update('ServiceRequest', linkedOrderId, existingOrder);
						console.log(`[DiagnosticReport] Updated ServiceRequest ${linkedOrderId} to completed`);
					}
				} catch (updateError) {
					console.error('[DiagnosticReport] Failed to update order status:', updateError);
					// Don't fail the report creation if update fails
				}
			}
			
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
	
	// Encounter selection state
	let selectedEncounterId = $state('');
	let patientEncounters = $state([]);
	let showEncounterSelector = $state(false);
	let selectedEncounterName = $state('');

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
		// Reset encounter selection when patient changes
		selectedEncounterId = '';
		selectedEncounterName = '';
		patientEncounters = [];
		// Load encounters for this patient
		loadPatientEncounters(p.id);
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
						
						<!-- Encounter Selector -->
						<div class="encounter-section">
							<label class="encounter-label">Associated Visit (Optional)</label>
							{#if patientEncounters.length > 0}
								{#if !selectedEncounterId}
									<button 
										type="button" 
										class="select-encounter-btn"
										onclick={() => showEncounterSelector = true}
									>
										Select encounter to link results...
									</button>
								{:else}
									<div class="selected-encounter">
										<span class="encounter-name">{selectedEncounterName}</span>
										<button 
											type="button" 
											class="change-encounter-btn"
											onclick={() => showEncounterSelector = true}
										>
											Change
										</button>
									</div>
								{/if}
								
								{#if showEncounterSelector}
									<div class="encounter-dropdown">
										<div class="encounter-dropdown-header">
											Select a visit to associate with these lab results
										</div>
										{#each patientEncounters as enc}
											<button 
												type="button" 
												class="encounter-option"
												onclick={() => selectEncounter(enc)}
											>
												<div class="encounter-option-main">
													<span class="encounter-type">{enc.type}</span>
													<span class="encounter-date">{new Date(enc.date).toLocaleDateString()}</span>
												</div>
												<span class="encounter-status">{enc.status}</span>
											</button>
										{/each}
										<button 
											type="button" 
											class="skip-encounter-btn"
											onclick={() => showEncounterSelector = false}
										>
											Skip (no encounter)
										</button>
									</div>
								{/if}
							{:else}
								<p class="no-encounters">No recent visits found. Results will not be linked to an encounter.</p>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Linked Order -->
					{#if linkedOrderId}
						<div class="linked-order">
							<div class="linked-order-header">
								<span class="linked-order-icon">🔗</span>
								<span class="linked-order-title">Fulfilling Order</span>
							</div>
							<div class="linked-order-id">{linkedOrderId}</div>
							{#if reportType}
								<div class="linked-order-prefilled">✓ Form prefilled with ordered tests</div>
							{/if}
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
						<label>
							Results
							{#if reportType && reportType !== 'custom'}
								<span class="hint">Showing tests for selected panel</span>
							{:else if reportType === 'custom'}
								<span class="hint">Showing all available tests</span>
							{/if}
						</label>
						{#each results as result, i}
							<div class="result-row">
								<input 
									type="text" 
									placeholder="LOINC code"
									bind:value={result.loinc}
									list="loincs-{reportType || 'all'}"
									onchange={() => onLoincChange(result, i)}
									style="flex: 2"
								/>
								<input 
									type="text" 
									placeholder="Value"
									bind:value={result.value}
									style="flex: 1"
								/>
								<div class="unit-field" style="flex: 1.5">
									{#if customUnitIndices.has(i)}
										<!-- Custom unit input with datalist -->
										<input 
											type="text" 
											placeholder="Custom unit"
											bind:value={result.unit}
											list="ucum-units"
											class="unit-input"
										/>
									{:else}
										<!-- Dropdown with common units -->
										<select bind:value={result.unit} class="unit-select">
											<option value="">Select unit...</option>
											{#each ucumUnits as u}
												<option value={u.code}>{u.display}</option>
											{/each}
										</select>
									{/if}
									<button 
										type="button" 
										class="unit-toggle-btn"
										onclick={() => toggleCustomUnit(i)}
										title={customUnitIndices.has(i) ? "Use dropdown" : "Type custom unit"}
									>
										{customUnitIndices.has(i) ? '▼' : '✎'}
									</button>
								</div>
								{#if results.length > 1}
									<button type="button" class="remove-btn" onclick={() => removeResult(i)}>×</button>
								{/if}
							</div>
						{/each}
						<button type="button" class="add-btn" onclick={addResult}>+ Add Result</button>
					</div>

					<!-- Dynamic LOINC datalists based on report type -->
					{#if reportType && labTestData[reportType]}
						<!-- Panel-specific datalist -->
						<datalist id="loincs-{reportType}">
							{#each labTestData[reportType] as test}
								<option value={test.code}>{test.display} - {getLoincDisplaySync(test.code)}</option>
							{/each}
						</datalist>
					{:else}
						<!-- All lab tests datalist for custom reports -->
						<datalist id="loincs-all">
							{#each Object.values(labTestData).flat() as test}
								<option value={test.code}>{test.display} - {getLoincDisplaySync(test.code)}</option>
							{/each}
						</datalist>
					{/if}

					<!-- UCUM units datalist -->
					<datalist id="ucum-units">
						{#each ucumUnits as u}
							<option value={u.code}>{u.display}</option>
						{/each}
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
		padding: 12px;
		background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
		border: 1px solid #86EFAC;
		border-radius: 8px;
		margin-bottom: 16px;
	}

	.linked-order-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.linked-order-icon {
		font-size: 16px;
	}

	.linked-order-title {
		font-size: 13px;
		font-weight: 600;
		color: #166534;
	}

	.linked-order-id {
		font-size: 12px;
		color: #15803D;
		font-family: monospace;
		margin-left: 24px;
	}

	.linked-order-prefilled {
		font-size: 11px;
		color: #16A34A;
		margin-top: 6px;
		margin-left: 24px;
		font-weight: 500;
	}

	.results-section {
		margin-bottom: 16px;
	}

	.results-section label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 13px;
		font-weight: 600;
		color: #374151;
		margin-bottom: 8px;
	}

	.hint {
		font-size: 11px;
		font-weight: 400;
		color: #6B7280;
		background: #F3F4F6;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.result-row {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
		align-items: stretch;
	}

	.result-row input {
		padding: 10px;
		border: 1px solid #E5E7EB;
		border-radius: 6px;
		font-size: 13px;
	}

	.unit-field {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.unit-select {
		flex: 1;
		padding: 10px;
		border: 1px solid #E5E7EB;
		border-radius: 6px;
		font-size: 13px;
		background: white;
		cursor: pointer;
	}

	.unit-select:focus {
		outline: none;
		border-color: var(--clinic-color);
	}

	.unit-input {
		flex: 1;
	}

	.unit-toggle-btn {
		width: 28px;
		height: 28px;
		border-radius: 4px;
		border: 1px solid #E5E7EB;
		background: #F9FAFB;
		color: #6B7280;
		font-size: 12px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.unit-toggle-btn:hover {
		background: #F3F4F6;
		color: #374151;
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
		flex-shrink: 0;
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

	/* Encounter Selector Styles */
	.encounter-section {
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px dashed #E5E7EB;
	}

	.encounter-label {
		display: block;
		font-size: 12px;
		font-weight: 600;
		color: #6B7280;
		margin-bottom: 8px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.select-encounter-btn {
		width: 100%;
		padding: 10px 12px;
		background: #F3F4F6;
		border: 2px dashed #D1D5DB;
		border-radius: 8px;
		color: #6B7280;
		font-size: 13px;
		cursor: pointer;
		text-align: left;
		transition: all 0.2s;
	}

	.select-encounter-btn:hover {
		background: #E5E7EB;
		border-color: #9CA3AF;
		color: #374151;
	}

	.selected-encounter {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 12px;
		background: #F0FDF4;
		border: 1px solid #86EFAC;
		border-radius: 8px;
	}

	.encounter-name {
		font-size: 13px;
		font-weight: 500;
		color: #166534;
	}

	.change-encounter-btn {
		padding: 4px 10px;
		background: white;
		border: 1px solid #22C55E;
		border-radius: 4px;
		color: #16A34A;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.change-encounter-btn:hover {
		background: #DCFCE7;
	}

	.encounter-dropdown {
		margin-top: 8px;
		background: white;
		border: 1px solid #E5E7EB;
		border-radius: 8px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.encounter-dropdown-header {
		padding: 10px 12px;
		background: #F9FAFB;
		border-bottom: 1px solid #E5E7EB;
		font-size: 12px;
		color: #6B7280;
		font-weight: 500;
	}

	.encounter-option {
		width: 100%;
		padding: 12px;
		background: white;
		border: none;
		border-bottom: 1px solid #F3F4F6;
		cursor: pointer;
		text-align: left;
		transition: background 0.2s;
	}

	.encounter-option:hover {
		background: #F9FAFB;
	}

	.encounter-option:last-of-type {
		border-bottom: none;
	}

	.encounter-option-main {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
	}

	.encounter-type {
		font-weight: 500;
		color: #111827;
		font-size: 13px;
	}

	.encounter-date {
		font-size: 12px;
		color: #6B7280;
	}

	.encounter-status {
		display: inline-block;
		padding: 2px 6px;
		background: #E5E7EB;
		border-radius: 4px;
		font-size: 11px;
		color: #374151;
		text-transform: capitalize;
	}

	.skip-encounter-btn {
		width: 100%;
		padding: 10px 12px;
		background: white;
		border: none;
		border-top: 1px solid #E5E7EB;
		color: #9CA3AF;
		font-size: 12px;
		cursor: pointer;
		text-align: center;
	}

	.skip-encounter-btn:hover {
		background: #F9FAFB;
		color: #6B7280;
	}

	.no-encounters {
		font-size: 12px;
		color: #9CA3AF;
		font-style: italic;
		margin: 0;
	}
</style>
