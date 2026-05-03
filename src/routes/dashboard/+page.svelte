<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, ROLES, CLINIC_CAPABILITIES } from '$constants';
	import { fhirClient } from '$services/fhir-client.js';

	// Redirect if not configured
	onMount(() => {
		if (browser && !appStore.isConfigured) {
			window.location.replace('/');
		}
		loadInboxCounts();
	});

	const clinic = $derived(CLINICS.find(c => c.id === appStore.clinicId));
	const role = $derived(ROLES.find(r => r.id === appStore.roleId));
	const caps = $derived(CLINIC_CAPABILITIES[appStore.clinicId] || {});

	let inboxCounts = $state({});
	let loadingInbox = $state(false);

	async function loadInboxCounts() {
		if (!appStore.isConfigured) return;
		loadingInbox = true;
		const counts = {};
		const tag = appStore.workshopCode;

		try {
			// Load counts based on what this clinic can VIEW
			if (caps.canView?.includes('ServiceRequest')) {
				const sr = await fhirClient.search('ServiceRequest', { _tag: tag, _summary: 'count' });
				counts.serviceRequest = sr.total || 0;
			}
			if (caps.canView?.includes('MedicationRequest')) {
				const mr = await fhirClient.search('MedicationRequest', { _tag: tag, _summary: 'count' });
				counts.medicationRequest = mr.total || 0;
			}
			if (caps.canView?.includes('DiagnosticReport')) {
				const dr = await fhirClient.search('DiagnosticReport', { _tag: tag, _summary: 'count' });
				counts.diagnosticReport = dr.total || 0;
			}
			if (caps.canView?.includes('Patient')) {
				const p = await fhirClient.search('Patient', { _tag: tag, _summary: 'count' });
				counts.patient = p.total || 0;
			}
			if (caps.canView?.includes('Encounter')) {
				const e = await fhirClient.search('Encounter', { _tag: tag, _summary: 'count' });
				counts.encounter = e.total || 0;
			}
		} catch (e) {
			console.error('Inbox load error:', e);
		}
		inboxCounts = counts;
		loadingInbox = false;
	}

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
		inbox: { icon: '📥', label: 'Work Queue', desc: 'Orders & requests from other clinics', href: '/inbox', requires: 'inbox' }
	};

	const visibleActions = $derived(
		caps.primaryActions
			?.map(key => ALL_ACTIONS[key])
			.filter(Boolean) || []
	);
</script>

{#if appStore.isConfigured}
	<div class="dashboard" style="--clinic-color: {clinic?.color || '#2563EB'}">
		<!-- Header -->
		<header class="dashboard-header">
			<div class="clinic-badge" style="background: {clinic?.color}20; color: {clinic?.color}; border-color: {clinic?.color}">
				<span class="clinic-icon">{clinic?.icon}</span>
				<span class="clinic-name">{clinic?.shortName}</span>
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
					{@const hrefWithReturn = action.href + (action.href.includes('?') ? '&' : '?') + 'returnTo=' + encodeURIComponent('/dashboard')}
					<a href={hrefWithReturn} class="action-card">
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
					{/if}
				</div>
			</div>

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
			<a href="/dashboard" class="nav-item active">
				<span class="nav-icon">🏠</span>
				<span class="nav-label">Home</span>
			</a>
			<a href="/patient/search" class="nav-item">
				<span class="nav-icon">👤</span>
				<span class="nav-label">Patients</span>
			</a>
			<a href="/inbox" class="nav-item">
				<span class="nav-icon">📥</span>
				<span class="nav-label">Inbox</span>
				{#if inboxCounts.serviceRequest || inboxCounts.medicationRequest}
					<span class="nav-badge">●</span>
				{/if}
			</a>
			<a href="/developer" class="nav-item">
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

	.clinic-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 20px;
		border: 2px solid;
		font-size: 14px;
		font-weight: 600;
	}

	.clinic-icon {
		font-size: 16px;
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
