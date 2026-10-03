<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, CLINIC_CAPABILITIES, WORKSHOP_TAG_SYSTEM } from '$constants';
	import { fhirClient } from '$services/fhir-client.js';
	import { deriveUnit } from '$lib/utils/medication-helpers.js';
	import LogsToggle from '$components/LogsToggle.svelte';

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
			const caps = CLINIC_CAPABILITIES[appStore.clinicId];
			if (!caps?.canCreate?.includes('MedicationRequest')) {
				window.location.replace('/dashboard');
			}
		}, 100);
		
		// Load patient and encounter from URL if provided
		if (urlPatientId) {
			loadPatientFromUrl(urlPatientId);
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
	
	// Encounter
	let encounterId = $state('');
	let encounterName = $state('');
	let patientEncounters = $state([]);
	let showEncounterSelector = $state(false);

	// Medication
	let selectedMedication = $state(null); // {code, display, system, strength, form}
	let medSearchQuery = $state('');
	let medSearchResults = $state([]);
	let isSearchingMeds = $state(false);
	let showDropdown = $state(false);

	// Dosage fields (populated from selection or manual)
	let medName = $state('');
	let strength = $state('');
	let form = $state('');
	let unit = $state('');
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

	// Extract form from display name as a preview fallback only.
	// The actual form is populated from the CodeSystem dosageForm property.
	function extractForm(display) {
		const forms = ['tablet', 'capsule', 'syrup', 'suspension', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'solution', 'powder', 'gel', 'spray', 'patch'];
		const lower = display.toLowerCase();
		for (const f of forms) {
			if (lower.includes(f)) return f;
		}
		return '';
	}

	// Smart truncation that preserves both start and end of long names
	function smartTruncate(text, maxLength = 30) {
		if (!text || text.length <= maxLength) return text;
		const startLen = Math.floor(maxLength * 0.6); // 60% from start
		const endLen = Math.floor(maxLength * 0.4); // 40% from end (minimum 3 chars)
		return text.slice(0, startLen) + '....' + text.slice(-Math.max(endLen, 3));
	}

	// Parse medication display name into components for preview chip
	function parseMedicationDisplay(display) {
		// Extract brand name (content in parentheses)
		const brandMatch = display.match(/\(([^)]+)\)/);
		const brandName = brandMatch ? brandMatch[1] : '';
		
		// Extract generic name (remove brand)
		let genericName = display;
		if (brandMatch) {
			genericName = genericName.replace(brandMatch[0], '');
		}
		// Clean up: remove extra spaces and common conjunctions
		genericName = genericName.replace(/\s+/g, ' ').trim();
		genericName = genericName.replace(/\s+(As|And|Plus|With)\s+$/i, '');
		
		return { genericName, brandName };
	}

	// Format medication preview for dropdown: Generic (Brand) Strength
	function formatMedicationPreview(med, maxGenericLen = 28, maxBrandLen = 18) {
		// Use the pre-extracted strength from search results, or parse from display as fallback
		const strength = med.strength || extractStrength(med.display) || '';
		const { genericName, brandName } = parseMedicationDisplay(med.display);
		const truncatedGeneric = smartTruncate(genericName, maxGenericLen);
		const truncatedBrand = brandName ? smartTruncate(brandName, maxBrandLen) : '';
		
		return {
			generic: truncatedGeneric,
			brand: truncatedBrand,
			strength,
			code: med.code
		};
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
			// Process results and lookup strength from CodeSystem
			const meds = (data.expansion?.contains || []);
			medSearchResults = await Promise.all(
				meds.map(async (med) => {
					// Extract strength from display as fallback
					let strength = extractStrength(med.display);
					
					// Lookup dosageStrength from CodeSystem
					try {
						const lookup = await fhirClient.lookupCodeProperties(PH_FDA_SYSTEM, med.code);
						if (lookup.success) {
							const ds = lookup.properties.get('dosageStrength');
							if (ds && ds !== 'NA' && !ds.toLowerCase().includes('see reverse') && !ds.toLowerCase().includes('formulation')) {
								strength = ds;
							}
							// Also get form from lookup
							const df = lookup.properties.get('dosageForm');
							if (df && df !== 'NA') {
								med.dosageForm = df;
							}
						}
					} catch (e) {
						// Silently fail lookup, use extracted strength
					}
					
					return {
						...med,
						strength,
						form: med.dosageForm || extractForm(med.display),
						nameOnly: med.display.replace(/\s*\d+\s*(?:mg|g|ml|mcg).*/i, '').trim()
					};
				})
			);
		} catch (e) {
			console.error('Medication search error:', e);
			medSearchResults = [];
		}
		isSearchingMeds = false;
	}

	// When user selects from dropdown
	async function selectMedication(med) {
		selectedMedication = med;
		medSearchQuery = med.display;
		medName = med.nameOnly || med.display;
		medSearchResults = [];
		showDropdown = false;
		useFreeText = false;

		// Fetch CodeSystem properties (dosageStrength, dosageForm) from terminology server
		let lookedUpStrength = '';
		let lookedUpForm = '';
		try {
			const lookup = await fhirClient.lookupCodeProperties(PH_FDA_SYSTEM, med.code);
			if (lookup.success) {
				const ds = lookup.properties.get('dosageStrength');
				const df = lookup.properties.get('dosageForm');

				// Use dosageStrength if it is a real strength value (not "NA" or instructions)
				if (ds && ds !== 'NA' && !ds.toLowerCase().includes('see reverse') && !ds.toLowerCase().includes('formulation')) {
					lookedUpStrength = ds;
				}

				// Use dosageForm directly as provided by the CodeSystem (raw valueString)
				if (df && df !== 'NA') {
					lookedUpForm = df;
				}
			}
		} catch (e) {
			console.warn('Failed to lookup medication properties:', e);
		}

		// Fallback to regex extraction from display name if lookup didn't yield useful values
		strength = lookedUpStrength || med.strength || '';
		form = lookedUpForm || med.form || '';
		unit = deriveUnit(form);

		// Auto-build dosage text
		dosageText = `${strength ? strength + ' ' : ''}${form}`.trim();
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
		form = '';
		unit = '';
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
			const queries = [query];
			// Some FHIR servers treat a multi-word name as an exact phrase. Retry
			// individual words so names like "Hey Juan" (stored as given/family)
			// remain discoverable when the phrase itself has no match.
			if (query.trim().split(/\s+/).length > 1) {
				queries.push(...query.trim().split(/\s+/));
			}
			const bundles = await Promise.all(queries.map(name => fhirClient.search('Patient', {
				name,
				_tag: `${WORKSHOP_TAG_SYSTEM}|${appStore.workshopCode}`,
				_count: '10'
			})));
			const resources = new Map();
			for (const bundle of bundles) {
				for (const entry of bundle.entry || []) {
					resources.set(entry.resource.id, entry.resource);
				}
			}
			patientSearchResults = [...resources.values()].slice(0, 10).map(patient => ({
				id: patient.id,
				name: patient.name?.[0]?.text || `${patient.name?.[0]?.family}, ${patient.name?.[0]?.given?.join(' ')}`,
				gender: patient.gender,
				birthDate: patient.birthDate
			}));
		} catch (e) {
			console.error('Patient search error:', e);
			patientSearchResults = [];
		}
		isSearchingPatients = false;
	}

	async function selectPatient(p) {
		patientId = p.id;
		patientName = p.name;
		patientSearchQuery = p.name;
		patientSearchResults = [];
		showPatientDropdown = false;
		// A newly selected patient must load their encounters too (the URL-prefill
		// path already does this). Reset any previous patient's encounter first.
		encounterId = '';
		encounterName = '';
		patientEncounters = [];
		showEncounterSelector = false;
		await loadPatientEncounters(p.id);
	}

	function clearPatient() {
		patientId = '';
		patientName = '';
		patientSearchQuery = '';
		patientSearchResults = [];
		showPatientDropdown = false;
		// Also clear encounter when patient is cleared
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
				_count: '100',
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
		// ENFORCE: Encounter is required for encounter-first architecture
		if (!encounterId) {
			error = 'An encounter is required. Please link this prescription to a visit, or create a new encounter.';
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
					text: `${dosageText || fullMedText} — ${frequency} time${frequency !== '1' ? 's' : ''} every ${period} ${periodUnit}`,
					route: { text: route },
					timing: {
						repeat: {
							frequency: parseInt(frequency),
							period: parseInt(period),
							periodUnit
						}
					}
				}],
				encounter: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
				dispenseRequest: {
					quantity: { value: parseInt(quantity), unit: unit || deriveUnit(form) || '' }
				},
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
			<LogsToggle />
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

				<!-- Encounter Selector (when patient is selected) -->
				{#if patientId}
					<div class="field-group encounter-selector">
						<label>
							Encounter (Required)
							{#if encounterId}
								<span class="linked-badge">🔗 Linked</span>
							{:else}
								<span class="required-badge">⚠️ Required</span>
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
								class="btn-select-encounter {patientEncounters.length === 0 ? 'btn-create-encounter' : ''}"
								onclick={() => showEncounterSelector = !showEncounterSelector}
							>
								{#if patientEncounters.length > 0}
									🔗 Link to Encounter
								{:else}
									⚠️ Create Encounter First
								{/if}
							</button>
							
							{#if showEncounterSelector}
								<div class="encounter-dropdown">
									{#if patientEncounters.length > 0}
										<div class="dropdown-header">Select an encounter</div>
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
										<div class="dropdown-divider"></div>
									{/if}
									<button 
										type="button" 
										class="encounter-option create-new"
										onclick={() => {
											const params = new URLSearchParams();
											params.set('patient', patientId);
											params.set('returnTo', window.location.pathname + window.location.search);
											if (appStore.workshopCode) params.set('w', appStore.workshopCode);
											if (appStore.userName) params.set('u', appStore.userName);
											if (appStore.clinicId) params.set('c', appStore.clinicId);
											window.location.href = '/encounter?' + params.toString();
										}}
									>
										<span class="create-icon">➕</span>
										<span class="create-text">Create New Encounter</span>
									</button>
								</div>
							{/if}
						{/if}
					</div>
				{/if}

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
											{@const preview = formatMedicationPreview(med)}
											<button type="button" class="search-result med-result" onclick={() => selectMedication(med)}>
												<div class="med-preview">
													<span class="med-generic" title={med.display}>{preview.generic}</span>
													{#if preview.brand}
														<span class="med-brand">({preview.brand})</span>
													{/if}
													{#if preview.strength}
														<span class="med-strength-chip">{preview.strength}</span>
													{/if}
												</div>
												<span class="med-code">{preview.code}</span>
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
								<input
									type="text"
									bind:value={form}
									list="form-suggestions"
									placeholder="e.g. Tablet, Capsule, Powder for Suspension..."
								/>
								<datalist id="form-suggestions">
									<option value="Tablet" />
									<option value="Capsule" />
									<option value="Syrup" />
									<option value="Suspension" />
									<option value="Powder for Suspension" />
									<option value="Solution for Injection" />
									<option value="Cream" />
									<option value="Ointment" />
									<option value="Gel" />
									<option value="Drops" />
									<option value="Inhaler" />
									<option value="Patch" />
									<option value="Spray" />
									<option value="Powder" />
								</datalist>
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
							<input type="text" bind:value={unit} placeholder={deriveUnit(form) || 'e.g. tablet, ml, g...'} />
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
		flex: 1;
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

	/* Preview chip layout for medication dropdown */
	.med-preview {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1;
		min-width: 0;
		margin-right: 8px;
	}

	.med-generic {
		font-weight: 600;
		color: #1E293B;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 180px;
	}

	.med-brand {
		font-size: 12px;
		color: #475569;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 120px;
	}

	.med-strength-chip {
		font-size: 11px;
		font-weight: 700;
		color: #047857;
		background: #D1FAE5;
		border: 1px solid #6EE7B7;
		padding: 3px 10px;
		border-radius: 12px;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.med-code {
		font-size: 11px;
		color: #6B7280;
		background: #F1F5F9;
		padding: 2px 8px;
		border-radius: 4px;
		white-space: nowrap;
		flex-shrink: 0;
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
	}

	.required-badge {
		font-size: 11px;
		padding: 2px 8px;
		background: #FEE2E2;
		color: #DC2626;
		border-radius: 12px;
		font-weight: 600;
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

	.btn-select-encounter.btn-create-encounter {
		border-color: #FCA5A5;
		background: #FEF2F2;
		color: #DC2626;
	}

	.btn-select-encounter.btn-create-encounter:hover {
		border-color: #DC2626;
		background: #FECACA;
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

	.encounter-dropdown {
		margin-top: 8px;
		background: white;
		border: 1px solid #E5E7EB;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		max-height: 200px;
		overflow-y: auto;
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

	.encounter-option.create-new {
		background: #F0FDF4;
		border-top: 2px dashed #86EFAC;
	}

	.encounter-option.create-new:hover {
		background: #DCFCE7;
	}

	.create-icon {
		font-size: 16px;
	}

	.create-text {
		font-weight: 600;
		color: #166534;
	}

	.dropdown-divider {
		height: 1px;
		background: #E5E7EB;
		margin: 4px 0;
	}

	.enc-type {
		font-weight: 500;
		color: #1E293B;
		font-size: 13px;
	}

	.enc-date {
		font-size: 12px;
		color: #6B7280;
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
