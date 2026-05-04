<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, CLINIC_CAPABILITIES } from '$constants';
	import { fhirClient } from '$services/fhir-client.js';
	import LogsToggle from '$components/LogsToggle.svelte';

	// Redirect if not configured
	onMount(() => {
		// Check URL params directly for immediate config check
		const url = browser ? new URL(window.location.href) : null;
		const hasUrlConfig = url && (url.searchParams.get('w') || url.searchParams.get('u') || url.searchParams.get('c'));
		
		// Give store time to initialize, then check
		setTimeout(() => {
			if (!appStore.isConfigured && !hasUrlConfig) {
				window.location.replace('/');
			}
		}, 100);
		
		loadData();
	});

	const clinic = $derived(CLINICS.find(c => c.id === appStore.clinicId));
	const caps = $derived(CLINIC_CAPABILITIES[appStore.clinicId] || {});
	const urlTab = $derived($page.url.searchParams.get('tab') || '');

	// Clinic-specific default tabs
	const clinicDefaultTab = $derived(
		appStore.clinicId === 'kalibo-lab' ? 'orders' :
		appStore.clinicId === 'aklan-pharmacy' ? 'rx' :
		// RHU and Hospitals default to encounters
		caps.canView?.includes('Encounter') ? 'encounters' :
		'orders'
	);

	const tabs = $derived([
		...(caps.canView?.includes('Encounter') ? [{ id: 'encounters', label: 'Active Visits', icon: '📋' }] : []),
		...(caps.canView?.includes('ServiceRequest') ? [{ id: 'orders', label: 'Lab Orders', icon: '🧪' }] : []),
		...(caps.canView?.includes('MedicationRequest') ? [{ id: 'rx', label: 'Prescriptions', icon: '💊' }] : []),
		...(caps.canView?.includes('DiagnosticReport') ? [{ id: 'reports', label: 'Lab Reports', icon: '📄' }] : [])
	]);

	const computedActiveTab = $derived(tabs.find(t => t.id === (urlTab || clinicDefaultTab))?.id || tabs[0]?.id || 'orders');
	let activeTab = $state('orders');

	// Show completed toggles per tab
	let showCompletedEncounters = $state(false);
	let showCompletedOrders = $state(false);
	let showCompletedRx = $state(false);

	// Initialize activeTab on first load and when clinic changes
	$effect(() => {
		// Always sync with computed default when tabs change or on initial load
		if (tabs.length > 0) {
			const targetTab = computedActiveTab;
			if (activeTab !== targetTab) {
				activeTab = targetTab;
			}
		}
	});

	let encounters = $state([]);
	let serviceRequests = $state([]);
	let medicationRequests = $state([]);
	let diagnosticReports = $state([]);
	let loading = $state(false);
	let error = $state(null);
	let updatingStatus = $state(''); // Track which encounter is being updated

	async function loadData() {
		if (!appStore.isConfigured) return;
		loading = true;
		const tag = appStore.workshopCode;

		try {
			if (caps.canView?.includes('Encounter')) {
				const enc = await fhirClient.search('Encounter', { _tag: tag, _sort: '-_lastUpdated', _count: '50' });
				encounters = enc.entry?.map(e => e.resource) || [];
			}
			if (caps.canView?.includes('ServiceRequest')) {
				const sr = await fhirClient.search('ServiceRequest', { _tag: tag, _sort: '-_lastUpdated', _count: '20' });
				serviceRequests = sr.entry?.map(e => e.resource) || [];
			}
			if (caps.canView?.includes('MedicationRequest')) {
				const mr = await fhirClient.search('MedicationRequest', { _tag: tag, _sort: '-_lastUpdated', _count: '20' });
				medicationRequests = mr.entry?.map(e => e.resource) || [];
			}
			if (caps.canView?.includes('DiagnosticReport')) {
				const dr = await fhirClient.search('DiagnosticReport', { _tag: tag, _sort: '-_lastUpdated', _count: '20' });
				diagnosticReports = dr.entry?.map(e => e.resource) || [];
			}
		} catch (e) {
			error = e.message;
			console.error('Inbox load error:', e);
		}
		loading = false;
	}

	function getPatientName(resource) {
		const subject = resource.subject?.display || resource.subject?.reference || 'Unknown';
		return subject.replace('Patient/', '');
	}

	function getRequester(resource) {
		const req = resource.requester?.display || resource.requester?.reference || '';
		return req.replace('Practitioner/', '');
	}

	function getStatusColor(status) {
		const colors = {
			draft: '#94A3B8',
			active: '#22C55E',
			onhold: '#F59E0B',
			revoked: '#EF4444',
			completed: '#2563EB',
			'entered-inerror': '#EF4444',
			unknown: '#94A3B8',
			// Encounter statuses
			planned: '#94A3B8',
			arrived: '#3B82F6',
			triaged: '#F59E0B',
			'in-progress': '#22C55E',
			finished: '#2563EB',
			cancelled: '#EF4444',
			'entered-in-error': '#EF4444'
		};
		return colors[status?.toLowerCase()] || '#94A3B8';
	}

	function formatDate(dateStr) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	// Filter functions for "Show Completed" toggle
	const activeEncounters = $derived(() => {
		if (showCompletedEncounters) return encounters;
		const completedStatuses = ['finished', 'cancelled', 'entered-in-error'];
		return encounters.filter(e => !completedStatuses.includes(e.status?.toLowerCase()));
	});

	const activeServiceRequests = $derived(() => {
		if (showCompletedOrders) return serviceRequests;
		const completedStatuses = ['completed', 'revoked', 'entered-in-error'];
		return serviceRequests.filter(sr => !completedStatuses.includes(sr.status?.toLowerCase()));
	});

	const activeMedicationRequests = $derived(() => {
		if (showCompletedRx) return medicationRequests;
		const completedStatuses = ['completed', 'stopped', 'cancelled', 'entered-in-error'];
		return medicationRequests.filter(mr => !completedStatuses.includes(mr.status?.toLowerCase()));
	});

	// Quick status update for encounters
	async function updateEncounterStatus(encounter, newStatus) {
		updatingStatus = encounter.id;
		try {
			const updated = { ...encounter, status: newStatus };
			const result = await fhirClient.update('Encounter', encounter.id, updated);
			if (result.success) {
				// Update local state
				encounters = encounters.map(e => e.id === encounter.id ? result.data : e);
				appStore.addNotification({
					type: 'success',
					message: `Status updated to ${newStatus}`,
					duration: 1500
				});
			}
		} catch (e) {
			console.error('Status update error:', e);
			appStore.addNotification({
				type: 'error',
				message: 'Failed to update status',
				duration: 3000
			});
		}
		updatingStatus = '';
	}

	// Get quick actions based on current status
	function getQuickActions(encounter) {
		const status = encounter.status?.toLowerCase();
		const actions = [];
		
		switch (status) {
			case 'planned':
				actions.push({ label: 'Check In', status: 'arrived', color: '#10B981' });
				break;
			case 'arrived':
			case 'triaged':
				actions.push({ label: 'Start Visit', status: 'in-progress', color: '#3B82F6' });
				break;
			case 'in-progress':
				actions.push({ label: 'Complete', status: 'finished', color: '#059669' });
				actions.push({ label: 'Cancel', status: 'cancelled', color: '#DC2626' });
				break;
		}
		
		return actions;
	}

	// Get patient ID from encounter reference
	function getPatientIdFromEncounter(encounter) {
		const ref = encounter.subject?.reference || '';
		return ref.replace('Patient/', '');
	}

	// Get encounter type display
	function getEncounterTypeDisplay(encounter) {
		const type = encounter.type?.[0]?.text || encounter.type?.[0]?.coding?.[0]?.display;
		if (type) return type;
		
		const classCode = encounter.class?.code || encounter.class?.display;
		const classMap = {
			'ambulatory': 'Ambulatory',
			'emergency': 'Emergency',
			'home': 'Home',
			'inpatient': 'Inpatient',
			'outpatient': 'Outpatient',
			'virtual': 'Virtual'
		};
		return classMap[classCode] || classCode || 'Visit';
	}
</script>

{#if appStore.isConfigured}
	<div class="inbox-page" style="--clinic-color: {clinic?.color || '#2563EB'}">
		<header class="inbox-header">
			<div class="header-main">
				<a href={appStore.buildUrl('/dashboard')} class="back-btn">←</a>
				<h1>📥 Work Queue</h1>
				<LogsToggle />
			</div>
			<p class="header-sub">Cross-clinic requests visible to {clinic?.shortName}</p>
		</header>

		<!-- Tabs -->
		{#if tabs.length > 1}
			<div class="tabs">
				{#each tabs as tab}
					<button 
						class="tab"
						class:active={activeTab === tab.id}
						onclick={() => activeTab = tab.id}
					>
						<span>{tab.icon}</span>
						{tab.label}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Content -->
		<main class="inbox-content">
			{#if loading}
				<div class="loading-state">Loading...</div>
			{:else if error}
				<div class="error-state">Error: {error}</div>
			{:else if activeTab === 'encounters'}
				<div class="tab-header">
					<label class="toggle-completed">
						<input type="checkbox" bind:checked={showCompletedEncounters} />
						<span>Show completed/cancelled</span>
					</label>
				</div>
				<div class="resource-list">
					{#if activeEncounters().length === 0}
						<div class="empty-state">
							<span>📋</span>
							<p>No active visits</p>
							{#if caps.canCreate?.includes('Encounter')}
														<a href={appStore.buildUrl('/encounter')} class="create-link">Create a visit →</a>
							{/if}
						</div>
					{:else}
						{#each activeEncounters() as encounter}
							<div class="resource-card">
								<div class="card-header">
									<span class="card-type" style="background: #EFF6FF; color: #1D4ED8">📋 Visit</span>
									<span class="card-status" style="color: {getStatusColor(encounter.status)}">{encounter.status}</span>
								</div>
								<div class="card-body">
									<strong class="card-title">{getEncounterTypeDisplay(encounter)}</strong>
									<p class="card-patient">👤 {encounter.subject?.display || getPatientIdFromEncounter(encounter)}</p>
									<p class="card-date">{formatDate(encounter.period?.start)}</p>
								</div>
								<div class="card-actions-row">
									{#if getQuickActions(encounter).length > 0}
										<div class="quick-actions">
											{#each getQuickActions(encounter) as action}
												<button 
													class="quick-action-btn"
													style="background: {action.color}"
													disabled={updatingStatus === encounter.id}
													onclick={() => updateEncounterStatus(encounter, action.status)}
												>
													{updatingStatus === encounter.id ? '...' : action.label}
												</button>
											{/each}
										</div>
									{/if}
											<a 
												href={appStore.buildUrl(`/patient/${getPatientIdFromEncounter(encounter)}`)}
												class="continue-btn"
											>
												Continue Visit →
											</a>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{:else if activeTab === 'orders'}
				<div class="tab-header">
					<label class="toggle-completed">
						<input type="checkbox" bind:checked={showCompletedOrders} />
						<span>Show completed</span>
					</label>
				</div>
				<div class="resource-list">
					{#if activeServiceRequests().length === 0}
						<div class="empty-state">
							<span>🧪</span>
							<p>No active lab orders</p>
							{#if caps.canCreate?.includes('ServiceRequest')}
														<a href={appStore.buildUrl('/service-request')} class="create-link">Create an order →</a>
							{/if}
						</div>
					{:else}
						{#each activeServiceRequests() as sr}
							<div class="resource-card">
								<div class="card-header">
									<span class="card-type" style="background: #F0FDF4; color: #15803D">🧪 Order</span>
									<span class="card-status" style="color: {getStatusColor(sr.status)}">{sr.status}</span>
								</div>
								<div class="card-body">
									<strong class="card-title">{sr.code?.text || sr.code?.coding?.[0]?.display || 'Lab Order'}</strong>
									<p class="card-patient">👤 {getPatientName(sr)}</p>
									<p class="card-meta">Requested by: {getRequester(sr)}</p>
									<p class="card-date">{formatDate(sr.authoredOn)}</p>
								</div>
								{#if sr.note?.[0]?.text}
									<div class="card-note">📝 {sr.note[0].text}</div>
								{/if}
								{#if caps.canCreate?.includes('DiagnosticReport')}
								<a href={appStore.buildUrl(`/diagnostic-report?order=${sr.id}&patient=${sr.subject?.reference?.split('/')[1]}&returnTo=${encodeURIComponent('/inbox?tab=orders')}`)} class="card-action">
									📄 Report Results →
								</a>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			{:else if activeTab === 'rx'}
				<div class="tab-header">
					<label class="toggle-completed">
						<input type="checkbox" bind:checked={showCompletedRx} />
						<span>Show completed/stopped</span>
					</label>
				</div>
				<div class="resource-list">
					{#if activeMedicationRequests().length === 0}
						<div class="empty-state">
							<span>💊</span>
							<p>No active prescriptions</p>
							{#if caps.canCreate?.includes('MedicationRequest')}
														<a href={appStore.buildUrl('/medication-request')} class="create-link">Create prescription →</a>
							{/if}
						</div>
					{:else}
						{#each activeMedicationRequests() as mr}
							<div class="resource-card">
								<div class="card-header">
									<span class="card-type" style="background: #EFF6FF; color: #1D4ED8">💊 Rx</span>
									<span class="card-status" style="color: {getStatusColor(mr.status)}">{mr.status}</span>
								</div>
								<div class="card-body">
									<strong class="card-title">{mr.medicationCodeableConcept?.text || mr.medicationCodeableConcept?.coding?.[0]?.display || 'Medication'}</strong>
									<p class="card-patient">👤 {getPatientName(mr)}</p>
									<p class="card-meta">Prescribed by: {getRequester(mr)}</p>
									{#if mr.dosageInstruction?.[0]?.text}
										<p class="card-dose">📋 {mr.dosageInstruction[0].text}</p>
									{/if}
									<p class="card-date">{formatDate(mr.authoredOn)}</p>
								</div>
								{#if caps.canCreate?.includes('MedicationDispense')}
								<a href={appStore.buildUrl(`/dispense?rx=${mr.id}&patient=${mr.subject?.reference?.split('/')[1]}&returnTo=${encodeURIComponent('/inbox?tab=rx')}`)} class="card-action">
									💊 Dispense →
								</a>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			{:else if activeTab === 'reports'}
				<div class="resource-list">
					{#if diagnosticReports.length === 0}
						<div class="empty-state">
							<span>📄</span>
							<p>No lab reports yet</p>
								{#if caps.canCreate?.includes('DiagnosticReport')}
									<a href={appStore.buildUrl(`/diagnostic-report?returnTo=${encodeURIComponent('/inbox?tab=reports')}`)} class="create-link">Create report →</a>
								{/if}
						</div>
					{:else}
						{#each diagnosticReports as dr}
							<div class="resource-card">
								<div class="card-header">
									<span class="card-type" style="background: #FFFBEB; color: #B45309">📄 Report</span>
									<span class="card-status" style="color: {getStatusColor(dr.status)}">{dr.status}</span>
								</div>
								<div class="card-body">
									<strong class="card-title">{dr.code?.text || dr.code?.coding?.[0]?.display || 'Lab Report'}</strong>
									<p class="card-patient">👤 {getPatientName(dr)}</p>
									<p class="card-date">{formatDate(dr.effectiveDateTime || dr.issued)}</p>
								</div>
								{#if dr.result?.length > 0}
									<div class="card-results">
										{#each dr.result as ref}
											<span class="result-chip">{ref.display || ref.reference}</span>
										{/each}
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</main>

		<!-- Bottom Navigation -->
		<nav class="bottom-nav">
			<a href={appStore.buildUrl('/dashboard')} class="nav-item">
				<span class="nav-icon">🏠</span>
				<span class="nav-label">Home</span>
			</a>
			<a href={appStore.buildUrl('/patient/search')} class="nav-item">
				<span class="nav-icon">👤</span>
				<span class="nav-label">Patients</span>
			</a>
			<a href={appStore.buildUrl('/inbox')} class="nav-item active">
				<span class="nav-icon">📥</span>
				<span class="nav-label">Inbox</span>
			</a>
			<a href={appStore.buildUrl('/developer')} class="nav-item">
				<span class="nav-icon">🔧</span>
				<span class="nav-label">Developer</span>
			</a>
		</nav>
	</div>
{:else}
	<div class="loading">Redirecting...</div>
{/if}

<style>
	.inbox-page {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: #F9FAFB;
	}

	.inbox-header {
		padding: 16px;
		background: white;
		border-bottom: 1px solid #E5E7EB;
	}

	.header-main {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 4px;
	}

	.back-btn {
		font-size: 20px;
		text-decoration: none;
		color: #374151;
		padding: 4px;
	}

	.inbox-header h1 {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		color: #111827;
		flex: 1;
	}

	.header-sub {
		margin: 0;
		font-size: 13px;
		color: #6B7280;
		padding-left: 36px;
	}

	.tabs {
		display: flex;
		gap: 4px;
		padding: 12px 16px;
		background: white;
		border-bottom: 1px solid #E5E7EB;
		overflow-x: auto;
	}

	.tab {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: 8px;
		border: 1px solid #E5E7EB;
		background: white;
		font-size: 13px;
		font-weight: 500;
		color: #6B7280;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.2s;
	}

	.tab.active {
		background: var(--clinic-color);
		color: white;
		border-color: var(--clinic-color);
	}

	.inbox-content {
		flex: 1;
		padding: 16px;
		padding-bottom: 100px;
	}

	.loading-state, .error-state, .empty-state {
		text-align: center;
		padding: 48px 16px;
		color: #6B7280;
	}

	.empty-state span {
		font-size: 48px;
		display: block;
		margin-bottom: 12px;
	}

	.empty-state p {
		margin: 0 0 12px 0;
		font-size: 16px;
	}

	.create-link {
		color: var(--clinic-color);
		font-weight: 600;
		text-decoration: none;
		font-size: 14px;
	}

	.resource-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.resource-card {
		background: white;
		border: 1px solid #E5E7EB;
		border-radius: 12px;
		padding: 16px;
		transition: all 0.2s;
	}

	.resource-card:hover {
		border-color: var(--clinic-color);
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.card-type {
		padding: 3px 10px;
		border-radius: 20px;
		font-size: 11px;
		font-weight: 700;
	}

	.card-status {
		font-size: 12px;
		font-weight: 600;
		text-transform: capitalize;
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.card-title {
		font-size: 15px;
		color: #111827;
	}

	.card-patient, .card-meta, .card-dose, .card-date {
		font-size: 13px;
		color: #6B7280;
		margin: 0;
	}

	.card-note {
		margin-top: 10px;
		padding: 8px 12px;
		background: #FEF3C7;
		border-radius: 8px;
		font-size: 13px;
		color: #92400E;
	}

	.card-action {
		display: block;
		margin-top: 12px;
		padding: 10px;
		background: var(--clinic-color);
		color: white;
		border-radius: 8px;
		text-align: center;
		text-decoration: none;
		font-weight: 600;
		font-size: 13px;
	}

	.card-results {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 10px;
	}

	.result-chip {
		padding: 4px 10px;
		background: #F3F4F6;
		border-radius: 20px;
		font-size: 12px;
		color: #4B5563;
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

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		font-size: 16px;
		color: #6B7280;
	}

	/* Tab header with toggle */
	.tab-header {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 12px;
	}

	.toggle-completed {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: #4B5563;
		cursor: pointer;
		padding: 8px 12px;
		background: white;
		border-radius: 8px;
		border: 1px solid #E5E7EB;
	}

	.toggle-completed input[type="checkbox"] {
		width: 16px;
		height: 16px;
		cursor: pointer;
		accent-color: var(--clinic-color);
	}

	/* Encounter card actions */
	.card-actions-row {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 12px;
	}

	.quick-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.quick-action-btn {
		flex: 1;
		min-width: 80px;
		padding: 8px 12px;
		border: none;
		border-radius: 8px;
		color: white;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.quick-action-btn:hover:not(:disabled) {
		filter: brightness(1.1);
		transform: translateY(-1px);
	}

	.quick-action-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.continue-btn {
		display: block;
		padding: 10px;
		background: white;
		color: var(--clinic-color);
		border: 2px solid var(--clinic-color);
		border-radius: 8px;
		text-align: center;
		text-decoration: none;
		font-weight: 600;
		font-size: 13px;
		transition: all 0.2s;
	}

	.continue-btn:hover {
		background: var(--clinic-color);
		color: white;
	}
</style>
