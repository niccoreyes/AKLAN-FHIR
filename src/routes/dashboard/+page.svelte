<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, ROLES, CLINIC_CAPABILITIES, WORKSHOP_TAG_SYSTEM, VITAL_SIGNS_LOINC_CODES } from '$constants';
	import { fhirClient } from '$services/fhir-client.js';
	import DashboardPatientGrid from '$components/DashboardPatientGrid.svelte';

	// Get URL params directly for immediate check
	const urlParams = $derived(browser ? new URL(window.location.href).searchParams : null);
	const hasUrlConfig = $derived(urlParams && (urlParams.get('w') || urlParams.get('u') || urlParams.get('c')));
	
	// Check both store state and URL params
	const isReallyConfigured = $derived(appStore.isConfigured || hasUrlConfig);

	// Patient grid state
	let dashboardPatients = $state([]);
	let dashboardPatientsLoading = $state(false);
	let dashboardPatientsError = $state('');

	// Redirect if not configured (check both store and URL)
	onMount(() => {
		// Give a small delay for store to initialize from URL
		setTimeout(() => {
			if (browser && !appStore.isConfigured && !hasUrlConfig) {
				window.location.replace('/');
			}
		}, 100);
		loadInboxCounts();
		loadDashboardPatients();
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
		viewMeds: { icon: '💉', label: 'View Medications', desc: 'Check prescriptions & dispensed meds', href: '/patient/search', requires: 'MedicationRequest', viewAction: true }
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

		<!-- HIE Data Overview -->
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

		<!-- Patient Cards Grid -->
		<DashboardPatientGrid 
			patients={dashboardPatients} 
			isLoading={dashboardPatientsLoading}
			error={dashboardPatientsError}
			clinicColor={clinic?.color || '#2563EB'}
		/>

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
