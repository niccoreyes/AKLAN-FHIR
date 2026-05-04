<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, ROLES, CLINIC_CAPABILITIES, WORKSHOP_TAG_SYSTEM, VITAL_SIGNS_LOINC_CODES } from '$constants';
	import { fhirClient } from '$services/fhir-client.js';
	import DashboardPatientGrid from '$components/DashboardPatientGrid.svelte';
	import LogsToggle from '$components/LogsToggle.svelte';

	// Get URL params directly for immediate check
	const urlParams = $derived(browser ? new URL(window.location.href).searchParams : null);
	const hasUrlConfig = $derived(urlParams && (urlParams.get('w') || urlParams.get('u') || urlParams.get('c')));
	
	// Check both store state and URL params
	const isReallyConfigured = $derived(appStore.isConfigured || hasUrlConfig);

	// Patient grid state
	let dashboardPatients = $state([]);
	let dashboardPatientsLoading = $state(false);
	let dashboardPatientsError = $state('');

	// LGU Health Office: Population analytics state (at-a-glance view)
	let lguAnalytics = $state({
		loading: false,
		conditionStats: [],
		medicationStats: [],
		encounterStats: { total: 0, finished: 0, inProgress: 0, other: 0, completionRate: 0 },
		facilityStats: {},
		lastUpdated: null
	});
	const isLGU = $derived(appStore.clinicId === 'lgu-health-office');

	// Redirect if not configured (check both store and URL)
	onMount(() => {
		// Give a small delay for store to initialize from URL
		setTimeout(() => {
			if (browser && !appStore.isConfigured && !hasUrlConfig) {
				window.location.replace('/');
			}
		}, 100);
		loadInboxCounts();
		if (isLGU) {
			loadLGUAnalytics();
		} else {
			loadDashboardPatients();
		}
	});

	const clinic = $derived(CLINICS.find(c => c.id === appStore.clinicId));
	const role = $derived(ROLES.find(r => r.id === appStore.roleId));
	const caps = $derived(CLINIC_CAPABILITIES[appStore.clinicId] || {});

	let inboxCounts = $state({});
	let loadingInbox = $state(false);
	let showClinicSwitcher = $state(false);

	// All possible actions with their requirements
	const ALL_ACTIONS = {
		register: { icon: '➕', label: 'Register Patient', desc: 'Add new person to SHR', href: '/patient/new', requires: 'Patient' },
		search: { icon: '🔍', label: 'Find Patient', desc: 'Search by name or ID', href: '/patient/search', requires: 'Patient' },
		encounter: { icon: '📋', label: 'Record Visit', desc: 'Document encounter', href: '/encounter', requires: 'Encounter' },
		vitals: { icon: '🩺', label: 'Record Vitals', desc: 'BP, HR, Temperature', href: '/vitals', requires: 'Observation' },
		order: { icon: '🧪', label: 'Order Labs', desc: 'Create lab orders / referrals', href: '/service-request', requires: 'ServiceRequest' },
		prescribe: { icon: '💊', label: 'Prescribe', desc: 'Create medication orders', href: '/medication-request', requires: 'MedicationRequest' },
		report: { icon: '📄', label: 'Lab Results', desc: 'Create diagnostic reports', href: '/diagnostic-report', requires: 'DiagnosticReport' },
		dispense: { icon: '💊', label: 'Dispense', desc: 'Dispense medications', href: '/dispense', requires: 'MedicationDispense' },
		inbox: { icon: '📥', label: 'Work Queue', desc: 'Orders & requests from other clinics', href: '/inbox', requires: 'inbox' },
		viewLabs: { icon: '🔬', label: 'View Lab Results', desc: 'Check patient lab reports', href: '/patient/search', requires: 'DiagnosticReport', viewAction: true },
		viewMeds: { icon: '💉', label: 'View Medications', desc: 'Check prescriptions & dispensed meds', href: '/patient/search', requires: 'MedicationRequest', viewAction: true },
		analytics: { icon: '📊', label: 'Population Analytics', desc: 'Disease statistics & medication trends', href: '/analytics', requires: 'analytics' }
	};

	const visibleActions = $derived(
		caps.primaryActions
			?.map(key => ALL_ACTIONS[key])
			.filter(Boolean) || []
	);

	async function loadInboxCounts() {
		if (!appStore.workshopCode || !appStore.isConfigured) return;
		loadingInbox = true;
		try {
			const results = await Promise.all([
				fhirClient.search('Patient', { _tag: appStore.workshopCode, _summary: 'count' }),
				fhirClient.search('Encounter', { _tag: appStore.workshopCode, _summary: 'count' }),
				fhirClient.search('ServiceRequest', { _tag: appStore.workshopCode, _summary: 'count' }),
				fhirClient.search('MedicationRequest', { _tag: appStore.workshopCode, _summary: 'count' }),
				fhirClient.search('DiagnosticReport', { _tag: appStore.workshopCode, _summary: 'count' }),
				fhirClient.search('MedicationDispense', { _tag: appStore.workshopCode, _summary: 'count' })
			]);
			inboxCounts = {
				patient: results[0].total || 0,
				encounter: results[1].total || 0,
				serviceRequest: results[2].total || 0,
				medicationRequest: results[3].total || 0,
				diagnosticReport: results[4].total || 0,
				medicationDispense: results[5].total || 0
			};
		} catch (e) {
			console.error('Failed to load inbox counts:', e);
		}
		loadingInbox = false;
	}

	function switchClinic(clinicId) {
		appStore.setClinic(clinicId);
		showClinicSwitcher = false;
		// Preserve all workshop parameters when switching clinics
		const params = new URLSearchParams();
		if (appStore.workshopCode) params.set('w', appStore.workshopCode);
		if (appStore.userName) params.set('u', appStore.userName);
		params.set('c', clinicId); // Set new clinic
		if (appStore.roleId) params.set('r', appStore.roleId);
		window.location.href = '/dashboard?' + params.toString();
	}

	// Extract latest vitals from observations
	function extractLatestVitals(observations) {
		const latest = {};
		const vitalCodes = new Set(VITAL_SIGNS_LOINC_CODES);
		for (const obs of observations) {
			const code = obs.code?.coding?.[0]?.code;
			if (code && vitalCodes.has(code) && !latest[code]) {
				latest[code] = obs;
			}
		}
		return latest;
	}

	// Load dashboard patients with batch fetching
	async function loadDashboardPatients() {
		if (!appStore.isConfigured) return;
		dashboardPatientsLoading = true;
		dashboardPatientsError = '';

		try {
			// 1. Fetch recent patients (limit 24 for dashboard performance)
			const tag = appStore.groupFilterEnabled && appStore.workshopCode
				? `${WORKSHOP_TAG_SYSTEM}|${appStore.workshopCode}`
				: undefined;

			const patientResult = await fhirClient.searchPaginated('Patient', {
				_count: '24',
				_sort: '-_lastUpdated',
				...(tag ? { _tag: tag } : {})
			});

			const patients = patientResult.resources;
			if (patients.length === 0) {
				dashboardPatients = [];
				return;
			}

			// 2. Build comma-separated patient references for batch queries
			const patientRefs = patients.map(p => `Patient/${p.id}`).join(',');

			// 3. Batch fetch encounters, conditions, and vital observations
			const [encountersBundle, conditionsBundle, observationsBundle] = await Promise.all([
				fhirClient.search('Encounter', { patient: patientRefs, _count: '100', _sort: '-date' })
					.catch(() => ({ entry: [] })),
				fhirClient.search('Condition', { patient: patientRefs, _count: '100' })
					.catch(() => ({ entry: [] })),
				fhirClient.search('Observation', {
					patient: patientRefs,
					_count: '100',
					_sort: '-date',
					category: 'vital-signs'
				}).catch(() => ({ entry: [] }))
			]);

			const encounters = (encountersBundle.entry || []).map(e => e.resource);
			const conditions = (conditionsBundle.entry || []).map(e => e.resource);
			const observations = (observationsBundle.entry || []).map(e => e.resource);

			// 4. Enrich patient objects with matched resources
			dashboardPatients = patients.map(patient => {
				const patientRef = `Patient/${patient.id}`;
				const patientEncounters = encounters
					.filter(e => e.subject?.reference === patientRef || e.patient?.reference === patientRef)
					.sort((a, b) => new Date(b.period?.start || 0) - new Date(a.period?.start || 0));
				
				const patientConditions = conditions
					.filter(c => c.subject?.reference === patientRef)
					.filter(c => c.clinicalStatus?.coding?.[0]?.code === 'active' || !c.clinicalStatus);

				const patientObservations = observations
					.filter(o => o.subject?.reference === patientRef)
					.sort((a, b) => new Date(b.effectiveDateTime || 0) - new Date(a.effectiveDateTime || 0));

				return {
					...patient,
					_latestEncounter: patientEncounters[0] || null,
					_conditions: patientConditions,
					_latestVitals: extractLatestVitals(patientObservations)
				};
			});

		} catch (e) {
			console.error('Failed to load dashboard patients:', e);
			dashboardPatientsError = e.message || 'Failed to load patients';
		} finally {
			dashboardPatientsLoading = false;
		}
	}

	// LGU Health Office: Load population analytics data
	async function loadLGUAnalytics() {
		if (!appStore.isConfigured || !appStore.workshopCode) return;
		
		lguAnalytics.loading = true;
		const tag = appStore.workshopCode;

		try {
			// Fetch all resource types in parallel (get full encounters for status counting)
			const [
				conditionsBundle,
				medRequestsBundle,
				medDispensesBundle,
				patientsBundle,
				encountersBundle,
				serviceRequestsBundle,
				diagnosticReportsBundle
			] = await Promise.all([
				fhirClient.search('Condition', { _tag: tag, _count: '1000' }),
				fhirClient.search('MedicationRequest', { _tag: tag, _count: '1000' }),
				fhirClient.search('MedicationDispense', { _tag: tag, _count: '1000' }),
				fhirClient.search('Patient', { _tag: tag, _count: '1000', _summary: 'count' }),
				fhirClient.search('Encounter', { _tag: tag, _count: '1000' }), // Get full resources for status
				fhirClient.search('ServiceRequest', { _tag: tag, _count: '1000', _summary: 'count' }),
				fhirClient.search('DiagnosticReport', { _tag: tag, _count: '1000', _summary: 'count' })
			]);

			// Aggregate conditions
			const conditionStats = aggregateLGUConditions(conditionsBundle.entry || []);

			// Aggregate medications
			const medicationStats = aggregateLGUMedications(
				medRequestsBundle.entry || [],
				medDispensesBundle.entry || []
			);

			// Count encounters by status
			const encounterStats = aggregateLGUEncounters(encountersBundle.entry || []);

			// Update analytics state
			lguAnalytics = {
				loading: false,
				conditionStats,
				medicationStats,
				encounterStats,
				facilityStats: {
					patients: patientsBundle.total || 0,
					encounters: encountersBundle.total || 0,
					labOrders: serviceRequestsBundle.total || 0,
					labReports: diagnosticReportsBundle.total || 0,
					prescriptions: medRequestsBundle.total || 0,
					dispenses: medDispensesBundle.total || 0,
					conditions: conditionsBundle.total || 0
				},
				lastUpdated: new Date()
			};

		} catch (e) {
			console.error('Failed to load LGU analytics:', e);
			lguAnalytics.loading = false;
		}
	}

	function aggregateLGUEncounters(entries) {
		let total = 0;
		let finished = 0;
		let inProgress = 0;
		let other = 0;

		for (const entry of entries) {
			const encounter = entry.resource;
			total++;
			
			const status = encounter.status?.toLowerCase();
			if (status === 'finished') {
				finished++;
			} else if (status === 'in-progress') {
				inProgress++;
			} else {
				other++;
			}
		}

		return {
			total,
			finished,
			inProgress,
			other,
			completionRate: total > 0 ? Math.round((finished / total) * 100) : 0
		};
	}

	function aggregateLGUConditions(entries) {
		const diseaseMap = {};

		for (const entry of entries) {
			const condition = entry.resource;
			const coding = condition.code?.coding?.[0];
			if (!coding) continue;

			const code = coding.code;
			const system = coding.system || 'unknown';
			const display = coding.display || 'Unknown Condition';
			const key = `${system}|${code}`;

			if (!diseaseMap[key]) {
				diseaseMap[key] = {
					code,
					system,
					display,
					count: 0,
					activeCount: 0,
					resolvedCount: 0,
					uniquePatients: new Set()
				};
			}

			diseaseMap[key].count++;
			diseaseMap[key].uniquePatients.add(condition.subject?.reference);

			const status = condition.clinicalStatus?.coding?.[0]?.code;
			if (status === 'active') {
				diseaseMap[key].activeCount++;
			} else if (status === 'resolved' || status === 'remission') {
				diseaseMap[key].resolvedCount++;
			}
		}

		return Object.values(diseaseMap)
			.map(d => ({
				...d,
				patientCount: d.uniquePatients.size,
				uniquePatients: undefined
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10); // Top 10 for LGU view
	}

	function aggregateLGUMedications(medRequestEntries, medDispenseEntries) {
		const medMap = {};

		// Process MedicationRequests
		for (const entry of medRequestEntries) {
			const mr = entry.resource;
			const med = mr.medicationCodeableConcept;
			if (!med) continue;

			const coding = med.coding?.[0];
			const code = coding?.code || med.text || 'unknown';
			const display = coding?.display || med.text || 'Unknown Medication';

			if (!medMap[code]) {
				medMap[code] = {
					code,
					display,
					prescribedCount: 0,
					dispensedCount: 0,
					patients: new Set(),
					statusCounts: {}
				};
			}

			medMap[code].prescribedCount++;
			medMap[code].patients.add(mr.subject?.reference);

			const status = mr.status || 'unknown';
			medMap[code].statusCounts[status] = (medMap[code].statusCounts[status] || 0) + 1;
		}

		// Process MedicationDispenses
		for (const entry of medDispenseEntries) {
			const md = entry.resource;
			const med = md.medicationCodeableConcept;
			if (!med) continue;

			const coding = med.coding?.[0];
			const code = coding?.code || med.text;

			if (!medMap[code]) continue;

			medMap[code].dispensedCount++;
		}

		return Object.values(medMap)
			.map(m => {
				const adherenceRate = m.prescribedCount > 0
					? Math.round((m.dispensedCount / m.prescribedCount) * 100)
					: 0;
				return {
					...m,
					patientCount: m.patients.size,
					patients: undefined,
					adherenceRate,
					pendingCount: m.statusCounts['active'] || 0
				};
			})
			.sort((a, b) => b.prescribedCount - a.prescribedCount)
			.slice(0, 10); // Top 10 for LGU view
	}

	function getSystemBadgeColor(system) {
		if (system?.includes('icd') || system?.includes('ICD')) return '#DC2626';
		if (system?.includes('snomed') || system?.includes('SNOMED')) return '#2563EB';
		return '#6B7280';
	}

	function getSystemShortName(system) {
		if (!system) return 'Unknown';
		if (system.includes('icd') || system.includes('ICD')) return 'ICD-10';
		if (system.includes('snomed') || system.includes('SNOMED')) return 'SNOMED';
		return 'Other';
	}

	function getAdherenceColor(rate) {
		if (rate >= 80) return '#22C55E';
		if (rate >= 50) return '#F59E0B';
		return '#EF4444';
	}
</script>

{#if appStore.isConfigured}
	<div class="dashboard" style="--clinic-color: {clinic?.color || '#2563EB'}">
		<!-- Header -->
		<header class="dashboard-header">
			<div class="clinic-badge-wrapper">
				<button 
					class="clinic-badge" 
					style="background: {clinic?.color}20; color: {clinic?.color}; border-color: {clinic?.color}"
					onclick={() => showClinicSwitcher = !showClinicSwitcher}
					title="Click to switch clinic"
				>
					<span class="clinic-icon">{clinic?.icon}</span>
					<span class="clinic-name">{clinic?.shortName}</span>
					<span class="switch-indicator">↻</span>
				</button>
				{#if showClinicSwitcher}
					<div class="clinic-dropdown">
						<div class="dropdown-header">🏥 Switch Clinic</div>
						{#each CLINICS as c}
							<button 
								class="clinic-option"
								class:active={c.id === appStore.clinicId}
								onclick={() => switchClinic(c.id)}
							>
								<span class="option-icon">{c.icon}</span>
								<div class="option-info">
									<strong>{c.shortName}</strong>
									<span>{CLINIC_CAPABILITIES[c.id]?.description || ''}</span>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
			<div class="user-info">
				<strong>{appStore.userName}</strong>
				{#if role}
					<span>{role.name}</span>
				{/if}
			</div>
			<button 
				class="view-toggle"
				onclick={() => appStore.toggleView()}
				title="Switch to Developer Mode"
			>
				{appStore.view === 'clinical' ? '👁️' : '🔧'}
			</button>
		<button 
			class="logout-btn"
			onclick={() => appStore.logout()}
			title="Logout"
		>
			🚪
		</button>
		<LogsToggle />
	</header>

		<!-- Main Content -->
		<main class="dashboard-content">
			<!-- Clinic Context Banner -->
			<div class="context-banner">
				<span class="context-icon">{clinic?.icon}</span>
				<div>
					<strong>{clinic?.name}</strong>
					<p>{caps.description}</p>
				</div>
			</div>

			<!-- Actions Section - Hidden for LGU Health Office (population view only) -->
			{#if !isLGU}
				<h1>What do you want to do?</h1>

				<!-- Primary Actions -->
				<div class="action-grid">
					{#each visibleActions as action}
						{@const hrefWithReturn = appStore.buildUrl(action.href, { returnTo: '/dashboard' })}
						<a href={hrefWithReturn} class="action-card" class:view-action={action.viewAction}>
							<span class="action-icon">{action.icon}</span>
							<div class="action-text">
								<strong>{action.label}</strong>
								<span>{action.desc}</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}

			<!-- HIE Data Overview - Hidden for LGU Health Office (redundant with Command Center) -->
			{#if !isLGU}
				<div class="hie-section">
					<h2>🔗 HIE Data Overview</h2>
					<p class="hie-hint">Data visible to <strong>{clinic?.shortName}</strong> across all clinics</p>
					<div class="hie-stats">
						{#if loadingInbox}
							<div class="stat-card loading">
								<span>Loading...</span>
							</div>
						{:else}
							{#if inboxCounts.patient !== undefined}
								<a href="/patient/search" class="stat-card">
									<span class="stat-number">{inboxCounts.patient}</span>
									<span class="stat-label">Patients</span>
								</a>
							{/if}
							{#if inboxCounts.encounter !== undefined}
								<a href="/patient/search" class="stat-card">
									<span class="stat-number">{inboxCounts.encounter}</span>
									<span class="stat-label">Encounters</span>
								</a>
							{/if}
							{#if inboxCounts.serviceRequest !== undefined}
								<a href="/inbox?tab=orders" class="stat-card">
									<span class="stat-number">{inboxCounts.serviceRequest}</span>
									<span class="stat-label">Lab Orders</span>
								</a>
							{/if}
							{#if inboxCounts.medicationRequest !== undefined}
								<a href="/inbox?tab=rx" class="stat-card">
									<span class="stat-number">{inboxCounts.medicationRequest}</span>
									<span class="stat-label">Prescriptions</span>
								</a>
							{/if}
							{#if inboxCounts.diagnosticReport !== undefined}
								<a href="/inbox?tab=reports" class="stat-card">
									<span class="stat-number">{inboxCounts.diagnosticReport}</span>
									<span class="stat-label">Lab Reports</span>
								</a>
							{/if}
							{#if inboxCounts.medicationDispense !== undefined}
								<a href="/inbox?tab=dispensed" class="stat-card">
									<span class="stat-number">{inboxCounts.medicationDispense}</span>
									<span class="stat-label">Dispensed</span>
								</a>
							{/if}
						{/if}
					</div>
				</div>
			{/if}

			<!-- LGU Health Office: At-a-Glance Population Dashboard -->
			{#if isLGU}
				<div class="lgu-command-center">
					<!-- Header with update time -->
					<div class="lgu-header">
						<h2>📊 Population Health Command Center</h2>
						<div class="lgu-meta">
							<span class="lgu-workshop">🎓 {appStore.workshopCode}</span>
							{#if lguAnalytics.lastUpdated}
								<span class="lgu-updated">🕐 {lguAnalytics.lastUpdated.toLocaleTimeString()}</span>
							{/if}
							{#if lguAnalytics.loading}
								<span class="lgu-loading">⟳ Loading...</span>
							{/if}
						</div>
					</div>

					<!-- Summary Stats Cards -->
					<div class="lgu-summary-stats">
						<div class="lgu-stat-card primary">
							<div class="lgu-stat-icon">👥</div>
							<div class="lgu-stat-value">{lguAnalytics.facilityStats.patients || 0}</div>
							<div class="lgu-stat-label">Patients</div>
						</div>
						<div class="lgu-stat-card">
							<div class="lgu-stat-icon">📋</div>
							<div class="lgu-stat-value">{lguAnalytics.facilityStats.encounters || 0}</div>
							<div class="lgu-stat-label">Encounters</div>
						</div>
						<div class="lgu-stat-card">
							<div class="lgu-stat-icon">🏥</div>
							<div class="lgu-stat-value">{lguAnalytics.facilityStats.conditions || 0}</div>
							<div class="lgu-stat-label">Conditions</div>
						</div>
						<div class="lgu-stat-card">
							<div class="lgu-stat-icon">💊</div>
							<div class="lgu-stat-value">{lguAnalytics.facilityStats.prescriptions || 0}</div>
							<div class="lgu-stat-label">Prescriptions</div>
						</div>
						<div class="lgu-stat-card">
							<div class="lgu-stat-icon">🧪</div>
							<div class="lgu-stat-value">{lguAnalytics.facilityStats.labOrders || 0}</div>
							<div class="lgu-stat-label">Lab Orders</div>
						</div>
						<div class="lgu-stat-card">
							<div class="lgu-stat-icon">✅</div>
							<div class="lgu-stat-value">{lguAnalytics.facilityStats.dispenses || 0}</div>
							<div class="lgu-stat-label">Dispensed</div>
						</div>
					</div>

					<!-- Key Performance Indicators -->
					{#if !lguAnalytics.loading}
						{@const rxTotal = lguAnalytics.facilityStats.prescriptions || 0}
						{@const dispTotal = lguAnalytics.facilityStats.dispenses || 0}
						{@const dispRate = rxTotal > 0 ? Math.round((dispTotal / rxTotal) * 100) : 0}
						{@const labTotal = lguAnalytics.facilityStats.labOrders || 0}
						{@const labComplete = lguAnalytics.facilityStats.labReports || 0}
						{@const labRate = labTotal > 0 ? Math.round((labComplete / labTotal) * 100) : 0}
						{@const encTotal = lguAnalytics.encounterStats?.total || 0}
						{@const encFinished = lguAnalytics.encounterStats?.finished || 0}
						{@const encRate = encTotal > 0 ? Math.round((encFinished / encTotal) * 100) : 0}
						{@const avgConditions = lguAnalytics.facilityStats.patients > 0 ? 
							(lguAnalytics.facilityStats.conditions / lguAnalytics.facilityStats.patients).toFixed(1) : 0}
						<div class="lgu-kpi-row">
							<div class="lgu-kpi-card">
								<div class="kpi-label">Encounters Completed</div>
								<div class="kpi-value" style="color: {getAdherenceColor(encRate)}">{encRate}%</div>
								<div class="kpi-bar">
									<div class="kpi-fill" style="width: {encRate}%; background: {getAdherenceColor(encRate)}"></div>
								</div>
								<div class="kpi-desc">{encFinished}/{encTotal} finished</div>
							</div>
							<div class="lgu-kpi-card">
								<div class="kpi-label">Dispense Rate</div>
								<div class="kpi-value" style="color: {getAdherenceColor(dispRate)}">{dispRate}%</div>
								<div class="kpi-bar">
									<div class="kpi-fill" style="width: {dispRate}%; background: {getAdherenceColor(dispRate)}"></div>
								</div>
								<div class="kpi-desc">{dispTotal}/{rxTotal} dispensed</div>
							</div>
							<div class="lgu-kpi-card">
								<div class="kpi-label">Lab Completion</div>
								<div class="kpi-value" style="color: {getAdherenceColor(labRate)}">{labRate}%</div>
								<div class="kpi-bar">
									<div class="kpi-fill" style="width: {labRate}%; background: {getAdherenceColor(labRate)}"></div>
								</div>
								<div class="kpi-desc">{labComplete}/{labTotal} reported</div>
							</div>
							<div class="lgu-kpi-card">
								<div class="kpi-label">Conditions / Patient</div>
								<div class="kpi-value">{avgConditions}</div>
								<div class="kpi-desc">average</div>
							</div>
						</div>
					{/if}

					<!-- Two Column Analytics -->
					<div class="lgu-analytics-grid">
						<!-- Top Diseases -->
						<div class="lgu-analytics-panel">
							<h3>📊 Top 5 Conditions</h3>
							{#if lguAnalytics.conditionStats.length === 0}
								<div class="lgu-empty">No condition data available</div>
							{:else}
								<div class="lgu-mini-table">
									{#each lguAnalytics.conditionStats.slice(0, 5) as condition, index}
										<div class="lgu-table-row">
											<div class="lgu-rank">{index + 1}</div>
											<div class="lgu-name" title="{condition.display}">
												{condition.display.length > 20 ? condition.display.slice(0, 20) + '...' : condition.display}
											</div>
											<div class="lgu-code-badge" style="background: {getSystemBadgeColor(condition.system)}">
												{condition.code}
											</div>
											<div class="lgu-count">{condition.count}</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Top Medications -->
						<div class="lgu-analytics-panel">
							<h3>💊 Top 5 Medications</h3>
							{#if lguAnalytics.medicationStats.length === 0}
								<div class="lgu-empty">No medication data available</div>
							{:else}
								<div class="lgu-mini-table">
									{#each lguAnalytics.medicationStats.slice(0, 5) as med, index}
										<div class="lgu-table-row">
											<div class="lgu-rank">{index + 1}</div>
											<div class="lgu-name" title="{med.display}">
												{med.display.length > 18 ? med.display.slice(0, 18) + '...' : med.display}
											</div>
											<div class="lgu-adherence">
												<div class="lgu-mini-bar">
													<div class="lgu-mini-fill" style="width: {med.adherenceRate}%; background: {getAdherenceColor(med.adherenceRate)}"></div>
												</div>
												<span class="lgu-adherence-text">{med.adherenceRate}%</span>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<!-- Facility Overview (Simplified - just capability icons) -->
					<div class="lgu-facilities-row">
						<h3>🏥 Facilities in Workshop</h3>
						<div class="lgu-facility-chips">
							{#each CLINICS.filter(c => c.id !== 'lgu-health-office') as facility}
								<div class="lgu-facility-chip" style="--facility-color: {facility.color}">
									<span class="chip-icon">{facility.icon}</span>
									<span class="chip-name">{facility.shortName}</span>
									<div class="chip-caps">
										{#each CLINIC_CAPABILITIES[facility.id]?.primaryActions?.slice(0, 3) || [] as action}
											<span class="chip-cap">{ALL_ACTIONS[action]?.icon || '•'}</span>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/if}

		<!-- Patient Cards Grid - Hidden for LGU Health Office (population view only) -->
		{#if !isLGU}
			<DashboardPatientGrid 
				patients={dashboardPatients}
				isLoading={dashboardPatientsLoading}
				error={dashboardPatientsError}
				clinicColor={clinic?.color || '#2563EB'}
				viewMode={appStore.view}
			/>
		{/if}

			<!-- Workshop Info -->
			<div class="workshop-info">
				<p>🎓 Workshop: <strong>{appStore.workshopCode}</strong></p>
				<p>🌐 Group Filter:
					<button 
						class="filter-toggle"
						onclick={() => appStore.toggleGroupFilter()}
					>
						{appStore.groupFilterEnabled ? '🏷️ Group Only' : '🌐 Full SHR'}
					</button>
				</p>
			</div>
		</main>

		<!-- Bottom Navigation -->
		<nav class="bottom-nav">
			<a href={appStore.buildUrl('/dashboard')} class="nav-item active">
				<span class="nav-icon">🏠</span>
				<span class="nav-label">Home</span>
			</a>
			<a href={appStore.buildUrl('/patient/search')} class="nav-item">
				<span class="nav-icon">👤</span>
				<span class="nav-label">Patients</span>
			</a>
			<a href={appStore.buildUrl('/inbox')} class="nav-item">
				<span class="nav-icon">📥</span>
				<span class="nav-label">Inbox</span>
				{#if inboxCounts.serviceRequest || inboxCounts.medicationRequest}
					<span class="nav-badge">●</span>
				{/if}
			</a>
			<a href={appStore.buildUrl('/developer')} class="nav-item">
				<span class="nav-icon">🔧</span>
				<span class="nav-label">Developer</span>
			</a>
		</nav>
	</div>
{:else}
	<div class="loading">
		<p>Redirecting to setup...</p>
	</div>
{/if}

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: #F9FAFB;
	}

	.dashboard-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		background: white;
		border-bottom: 1px solid #E5E7EB;
		gap: 12px;
	}

	.clinic-badge-wrapper {
		position: relative;
	}

	.clinic-badge {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		border-radius: 20px;
		border: 2px solid;
		font-size: 14px;
		font-weight: 600;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
	}

	.clinic-badge:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0,0,0,0.1);
	}

	.clinic-icon {
		font-size: 18px;
	}

	.switch-indicator {
		font-size: 13px;
		opacity: 0.7;
	}

	.clinic-dropdown {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		background: white;
		border: 1px solid #E2E8F0;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0,0,0,0.15);
		padding: 8px;
		min-width: 280px;
		z-index: 200;
	}

	.dropdown-header {
		padding: 8px 12px;
		font-size: 11px;
		font-weight: 700;
		color: #94A3B8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid #F1F5F9;
		margin-bottom: 4px;
	}

	.clinic-option {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border-radius: 8px;
		border: none;
		background: none;
		cursor: pointer;
		width: 100%;
		text-align: left;
		transition: all 0.2s;
	}

	.clinic-option:hover {
		background: #F8FAFC;
	}

	.clinic-option.active {
		background: #EFF6FF;
	}

	.option-icon {
		font-size: 20px;
	}

	.option-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.option-info strong {
		font-size: 13px;
		color: #1E293B;
	}

	.option-info span {
		font-size: 11px;
		color: #64748B;
		line-height: 1.3;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		flex: 1;
		min-width: 0;
	}

	.user-info strong {
		font-size: 14px;
		color: #111827;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.user-info span {
		font-size: 12px;
		color: #6B7280;
	}

	.view-toggle {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		border: 1px solid #E5E7EB;
		background: white;
		font-size: 18px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.logout-btn {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		border: 1px solid #FEE2E2;
		background: #FEF2F2;
		font-size: 18px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: 8px;
	}

	.logout-btn:hover {
		background: #FEE2E2;
		border-color: #FECACA;
	}

	.dashboard-content {
		flex: 1;
		padding: 24px 16px;
		padding-bottom: 100px;
	}

	.context-banner {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
		background: linear-gradient(135deg, color-mix(in srgb, var(--clinic-color) 8%, white) 0%, white 100%);
		border: 2px solid color-mix(in srgb, var(--clinic-color) 20%, #E5E7EB);
		border-radius: 12px;
		margin-bottom: 20px;
	}

	.context-icon {
		font-size: 28px;
	}

	.context-banner strong {
		display: block;
		font-size: 15px;
		color: #1E293B;
	}

	.context-banner p {
		margin: 2px 0 0 0;
		font-size: 12px;
		color: #64748B;
	}

	.dashboard-content h1 {
		font-size: 22px;
		font-weight: 700;
		color: #111827;
		margin: 0 0 20px 0;
	}

	.action-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
		margin-bottom: 32px;
	}

	@media (min-width: 640px) {
		.action-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.action-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 24px 16px;
		background: white;
		border: 2px solid #E5E7EB;
		border-radius: 16px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.action-card:hover {
		border-color: var(--clinic-color);
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.action-card.view-action {
		background: linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%);
		border-color: #BBF7D0;
	}

	.action-card.view-action:hover {
		border-color: #22C55E;
		background: linear-gradient(135deg, #DCFCE7 0%, #FFFFFF 100%);
	}

	.action-icon {
		font-size: 32px;
	}

	.action-text {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.action-text strong {
		font-size: 14px;
		color: #111827;
	}

	.action-text span {
		font-size: 12px;
		color: #6B7280;
		text-align: center;
	}

	/* HIE Section */
	.hie-section {
		margin-bottom: 24px;
	}

	.hie-section h2 {
		font-size: 16px;
		font-weight: 700;
		color: #1E293B;
		margin: 0 0 4px 0;
	}

	.hie-hint {
		font-size: 13px;
		color: #6B7280;
		margin: 0 0 12px 0;
	}

	.hie-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
	}

	@media (min-width: 640px) {
		.hie-stats {
			grid-template-columns: repeat(5, 1fr);
		}
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 14px 8px;
		background: white;
		border: 1px solid #E5E7EB;
		border-radius: 10px;
		text-decoration: none;
		transition: all 0.2s;
	}

	.stat-card:hover {
		border-color: var(--clinic-color);
		background: color-mix(in srgb, var(--clinic-color) 4%, white);
	}

	.stat-number {
		font-size: 22px;
		font-weight: 800;
		color: var(--clinic-color);
	}

	.stat-label {
		font-size: 11px;
		color: #6B7280;
		margin-top: 2px;
		text-align: center;
	}

	.stat-card.loading {
		grid-column: 1 / -1;
		color: #94A3B8;
		font-size: 13px;
	}

	/* LGU Health Office: Command Center - At-a-Glance Dashboard */
	.lgu-command-center {
		background: linear-gradient(135deg, #F0FDF4 0%, #ffffff 100%);
		border: 2px solid #059669;
		border-radius: 16px;
		padding: 20px;
		margin-bottom: 24px;
	}

	.lgu-header {
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 2px solid #D1FAE5;
	}

	.lgu-header h2 {
		font-size: 18px;
		font-weight: 700;
		color: #059669;
		margin: 0 0 8px 0;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.lgu-meta {
		display: flex;
		gap: 16px;
		font-size: 13px;
		color: #6B7280;
	}

	.lgu-workshop {
		font-weight: 600;
		color: #059669;
	}

	.lgu-updated {
		opacity: 0.8;
	}

	.lgu-loading {
		color: #059669;
		font-style: italic;
	}

	/* Summary Stats Row */
	.lgu-summary-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin-bottom: 16px;
	}

	@media (min-width: 640px) {
		.lgu-summary-stats {
			grid-template-columns: repeat(6, 1fr);
		}
	}

	.lgu-stat-card {
		background: white;
		border: 2px solid #D1FAE5;
		border-radius: 12px;
		padding: 12px 8px;
		text-align: center;
		transition: all 0.2s;
	}

	.lgu-stat-card:hover {
		border-color: #059669;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(5, 150, 105, 0.15);
	}

	.lgu-stat-card.primary {
		border-color: #059669;
		background: linear-gradient(135deg, #F0FDF4 0%, white 100%);
	}

	.lgu-stat-icon {
		font-size: 20px;
		margin-bottom: 4px;
	}

	.lgu-stat-value {
		font-size: 22px;
		font-weight: 800;
		color: #059669;
		line-height: 1.2;
	}

	.lgu-stat-label {
		font-size: 10px;
		color: #6B7280;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-top: 2px;
	}

	/* KPI Row */
	.lgu-kpi-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		margin-bottom: 20px;
	}

	.lgu-kpi-card {
		background: white;
		border-radius: 10px;
		padding: 12px;
		border: 1px solid #E5E7EB;
		text-align: center;
	}

	.kpi-label {
		font-size: 11px;
		color: #6B7280;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 4px;
	}

	.kpi-value {
		font-size: 24px;
		font-weight: 800;
		margin-bottom: 6px;
	}

	.kpi-bar {
		height: 6px;
		background: #E5E7EB;
		border-radius: 3px;
		overflow: hidden;
	}

	.kpi-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.kpi-desc {
		font-size: 11px;
		color: #9CA3AF;
		margin-top: 4px;
	}

	/* Two Column Analytics Grid */
	.lgu-analytics-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 16px;
		margin-bottom: 20px;
	}

	@media (min-width: 768px) {
		.lgu-analytics-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.lgu-analytics-panel {
		background: white;
		border-radius: 12px;
		padding: 16px;
		border: 1px solid #E5E7EB;
	}

	.lgu-analytics-panel h3 {
		font-size: 14px;
		font-weight: 700;
		color: #1E293B;
		margin: 0 0 12px 0;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.lgu-empty {
		padding: 20px;
		text-align: center;
		color: #9CA3AF;
		font-size: 13px;
	}

	/* Mini Table */
	.lgu-mini-table {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.lgu-table-row {
		display: grid;
		grid-template-columns: 24px 1fr 50px 32px;
		gap: 8px;
		align-items: center;
		padding: 8px;
		background: #F9FAFB;
		border-radius: 8px;
		font-size: 12px;
	}

	.lgu-rank {
		font-weight: 700;
		color: #059669;
		text-align: center;
	}

	.lgu-name {
		font-weight: 500;
		color: #1E293B;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.lgu-code-badge {
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 9px;
		font-weight: 600;
		color: white;
		text-align: center;
	}

	.lgu-count {
		font-weight: 700;
		color: #059669;
		text-align: right;
	}

	/* Adherence bar in mini table */
	.lgu-adherence {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.lgu-mini-bar {
		height: 4px;
		background: #E5E7EB;
		border-radius: 2px;
		overflow: hidden;
	}

	.lgu-mini-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 0.3s ease;
	}

	.lgu-adherence-text {
		font-size: 10px;
		font-weight: 600;
		color: #6B7280;
		text-align: right;
	}

	/* Facility Chips Row */
	.lgu-facilities-row {
		background: white;
		border-radius: 12px;
		padding: 16px;
		border: 1px solid #E5E7EB;
	}

	.lgu-facilities-row h3 {
		font-size: 14px;
		font-weight: 700;
		color: #1E293B;
		margin: 0 0 12px 0;
	}

	.lgu-facility-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.lgu-facility-chip {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		background: color-mix(in srgb, var(--facility-color) 8%, white);
		border: 2px solid color-mix(in srgb, var(--facility-color) 30%, #E5E7EB);
		border-radius: 20px;
		font-size: 12px;
		transition: all 0.2s;
	}

	.lgu-facility-chip:hover {
		border-color: var(--facility-color);
		background: color-mix(in srgb, var(--facility-color) 12%, white);
	}

	.chip-icon {
		font-size: 14px;
	}

	.chip-name {
		font-weight: 600;
		color: #1E293B;
	}

	.chip-caps {
		display: flex;
		gap: 2px;
		margin-left: 4px;
	}

	.chip-cap {
		font-size: 10px;
		opacity: 0.7;
	}

	.workshop-info {
		background: white;
		border-radius: 12px;
		padding: 16px;
		border: 1px solid #E5E7EB;
	}

	.workshop-info p {
		margin: 0 0 8px 0;
		font-size: 14px;
		color: #374151;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.filter-toggle {
		padding: 4px 8px;
		font-size: 12px;
		border: 1px solid #E5E7EB;
		border-radius: 6px;
		background: white;
		cursor: pointer;
		margin-left: auto;
	}

	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-around;
		padding: 12px 0 calc(12px + env(safe-area-inset-bottom));
		background: white;
		border-top: 1px solid #E5E7EB;
		z-index: 100;
	}

	.nav-item {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px 16px;
		color: #6B7280;
		text-decoration: none;
		font-size: 12px;
	}

	.nav-item.active {
		color: var(--clinic-color);
	}

	.nav-icon {
		font-size: 20px;
	}

	.nav-badge {
		position: absolute;
		top: 4px;
		right: 8px;
		font-size: 10px;
		color: #EF4444;
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
