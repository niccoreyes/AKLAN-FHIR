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
	const urlTab = $derived($page.url.searchParams.get('tab') || 'orders');

	const tabs = $derived([
		...(caps.canView?.includes('ServiceRequest') ? [{ id: 'orders', label: 'Lab Orders', icon: '🧪' }] : []),
		...(caps.canView?.includes('MedicationRequest') ? [{ id: 'rx', label: 'Prescriptions', icon: '💊' }] : []),
		...(caps.canView?.includes('DiagnosticReport') ? [{ id: 'reports', label: 'Lab Reports', icon: '📄' }] : [])
	]);

	const computedActiveTab = $derived(tabs.find(t => t.id === urlTab) ? urlTab : tabs[0]?.id || 'orders');
	let activeTab = $state(computedActiveTab);

	$effect(() => {
		const isValid = tabs.some(t => t.id === activeTab);
		if (!isValid) {
			activeTab = computedActiveTab;
		}
	});

	let serviceRequests = $state([]);
	let medicationRequests = $state([]);
	let diagnosticReports = $state([]);
	let loading = $state(false);
	let error = $state(null);

	async function loadData() {
		if (!appStore.isConfigured) return;
		loading = true;
		const tag = appStore.workshopCode;

		try {
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
			unknown: '#94A3B8'
		};
		return colors[status?.toLowerCase()] || '#94A3B8';
	}

	function formatDate(dateStr) {
		if (!dateStr) return '';
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}
</script>

{#if appStore.isConfigured}
	<div class="inbox-page" style="--clinic-color: {clinic?.color || '#2563EB'}">
		<header class="inbox-header">
			<div class="header-main">
				<a href="/dashboard" class="back-btn">←</a>
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
			{:else if activeTab === 'orders'}
				<div class="resource-list">
					{#if serviceRequests.length === 0}
						<div class="empty-state">
							<span>🧪</span>
							<p>No lab orders yet</p>
							{#if caps.canCreate?.includes('ServiceRequest')}
								<a href="/service-request" class="create-link">Create an order →</a>
							{/if}
						</div>
					{:else}
						{#each serviceRequests as sr}
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
								<a href="/diagnostic-report?order={sr.id}&patient={sr.subject?.reference?.split('/')[1]}&returnTo={encodeURIComponent('/inbox?tab=orders')}" class="card-action">
									📄 Report Results →
								</a>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			{:else if activeTab === 'rx'}
				<div class="resource-list">
					{#if medicationRequests.length === 0}
						<div class="empty-state">
							<span>💊</span>
							<p>No prescriptions yet</p>
							{#if caps.canCreate?.includes('MedicationRequest')}
								<a href="/medication-request" class="create-link">Create prescription →</a>
							{/if}
						</div>
					{:else}
						{#each medicationRequests as mr}
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
								<a href="/dispense?rx={mr.id}&patient={mr.subject?.reference?.split('/')[1]}&returnTo={encodeURIComponent('/inbox?tab=rx')}" class="card-action">
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
								<a href="/diagnostic-report?returnTo={encodeURIComponent('/inbox?tab=reports')}" class="create-link">Create report →</a>
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
			<a href="/dashboard" class="nav-item">
				<span class="nav-icon">🏠</span>
				<span class="nav-label">Home</span>
			</a>
			<a href="/patient/search" class="nav-item">
				<span class="nav-icon">👤</span>
				<span class="nav-label">Patients</span>
			</a>
			<a href="/inbox" class="nav-item active">
				<span class="nav-icon">📥</span>
				<span class="nav-label">Inbox</span>
			</a>
			<a href="/developer" class="nav-item">
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
</style>
