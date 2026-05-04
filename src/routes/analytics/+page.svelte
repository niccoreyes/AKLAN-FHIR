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
		const url = browser ? new URL(window.location.href) : null;
		const hasUrlConfig = url && (url.searchParams.get('w') || url.searchParams.get('u') || url.searchParams.get('c'));
		
		setTimeout(() => {
			if (!appStore.isConfigured && !hasUrlConfig) {
				window.location.replace('/');
			}
		}, 100);
		
		loadAnalyticsData();
	});

	const clinic = $derived(CLINICS.find(c => c.id === appStore.clinicId));
	const caps = $derived(CLINIC_CAPABILITIES[appStore.clinicId] || {});
	const urlTab = $derived($page.url.searchParams.get('tab') || '');

	// Tabs for analytics
	const tabs = [
		{ id: 'diseases', label: 'Disease Statistics', icon: '📊' },
		{ id: 'medications', label: 'Medication Trends', icon: '💊' },
		{ id: 'facilities', label: 'Facility Comparison', icon: '🏥' }
	];

	const computedActiveTab = $derived(tabs.find(t => t.id === urlTab)?.id || 'diseases');
	let activeTab = $state('diseases');

	// Initialize activeTab
	$effect(() => {
		if (activeTab !== computedActiveTab) {
			activeTab = computedActiveTab;
		}
	});

	// Analytics data state
	let conditionStats = $state([]);
	let medicationStats = $state([]);
	let facilityStats = $state({});
	let loading = $state(false);
	let error = $state(null);
	let lastUpdated = $state(null);

	async function loadAnalyticsData() {
		if (!appStore.isConfigured) return;
		loading = true;
		error = null;
		const tag = appStore.workshopCode;

		try {
			// Fetch all resource types in parallel
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
				fhirClient.search('Encounter', { _tag: tag, _count: '1000', _summary: 'count' }),
				fhirClient.search('ServiceRequest', { _tag: tag, _count: '1000', _summary: 'count' }),
				fhirClient.search('DiagnosticReport', { _tag: tag, _count: '1000', _summary: 'count' })
			]);

			// Aggregate conditions
			conditionStats = aggregateConditions(conditionsBundle.entry || []);

			// Aggregate medications
			medicationStats = aggregateMedications(
				medRequestsBundle.entry || [],
				medDispensesBundle.entry || []
			);

			// Facility overview stats
			facilityStats = {
				patients: patientsBundle.total || 0,
				encounters: encountersBundle.total || 0,
				labOrders: serviceRequestsBundle.total || 0,
				labReports: diagnosticReportsBundle.total || 0,
				prescriptions: medRequestsBundle.total || 0,
				dispenses: medDispensesBundle.total || 0,
				conditions: conditionsBundle.total || 0
			};

			lastUpdated = new Date();

			appStore.addNotification({
				type: 'success',
				message: `Analytics loaded: ${conditionStats.length} conditions, ${medicationStats.length} medications`,
				duration: 2000
			});

		} catch (e) {
			error = e.message;
			console.error('Analytics load error:', e);
			appStore.addNotification({
				type: 'error',
				message: 'Failed to load analytics data',
				duration: 4000
			});
		}
		loading = false;
	}

	function aggregateConditions(entries) {
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
			.sort((a, b) => b.count - a.count);
	}

	function aggregateMedications(medRequestEntries, medDispenseEntries) {
		const medMap = {};

		// Process MedicationRequests (prescriptions)
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
					totalQuantityPrescribed: 0,
					totalQuantityDispensed: 0,
					patients: new Set(),
					statusCounts: {}
				};
			}

			medMap[code].prescribedCount++;
			medMap[code].patients.add(mr.subject?.reference);

			// Track status
			const status = mr.status || 'unknown';
			medMap[code].statusCounts[status] = (medMap[code].statusCounts[status] || 0) + 1;

			// Extract quantity from dispenseRequest
			const qty = mr.dispenseRequest?.quantity?.value;
			if (qty) {
				medMap[code].totalQuantityPrescribed += parseFloat(qty);
			}
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

			const qty = md.quantity?.value;
			if (qty) {
				medMap[code].totalQuantityDispensed += parseFloat(qty);
			}
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
			.sort((a, b) => b.prescribedCount - a.prescribedCount);
	}

	function getSystemBadgeColor(system) {
		if (system?.includes('icd') || system?.includes('ICD')) return '#DC2626'; // Red for ICD-10
		if (system?.includes('snomed') || system?.includes('SNOMED')) return '#2563EB'; // Blue for SNOMED
		return '#6B7280'; // Gray for others
	}

	function getSystemShortName(system) {
		if (!system) return 'Unknown';
		if (system.includes('icd') || system.includes('ICD')) return 'ICD-10';
		if (system.includes('snomed') || system.includes('SNOMED')) return 'SNOMED';
		return 'Other';
	}

	function getAdherenceColor(rate) {
		if (rate >= 80) return '#22C55E'; // Green
		if (rate >= 50) return '#F59E0B'; // Yellow
		return '#EF4444'; // Red
	}

	function switchTab(tabId) {
		activeTab = tabId;
		const url = new URL(window.location.href);
		url.searchParams.set('tab', tabId);
		window.history.replaceState({}, '', url);
	}

	function formatNumber(num) {
		return num?.toLocaleString() || '0';
	}
</script>

{#if appStore.isConfigured}
	<div class="analytics-page" style="--clinic-color: {clinic?.color || '#2563EB'}">
		<header class="analytics-header">
			<div class="header-main">
				<a href={appStore.buildUrl('/dashboard')} class="back-btn">←</a>
				<h1>📊 Population Analytics</h1>
				<LogsToggle />
			</div>
			<p class="header-sub">
				Workshop: <strong>{appStore.workshopCode}</strong>
				{#if lastUpdated}
					<span class="last-updated">Updated: {lastUpdated.toLocaleTimeString()}</span>
				{/if}
			</p>
		</header>

		<main class="analytics-content">
			<!-- Tabs -->
			<div class="tabs">
				{#each tabs as tab}
					<button
						class="tab-btn {activeTab === tab.id ? 'active' : ''}"
						onclick={() => switchTab(tab.id)}
					>
						<span class="tab-icon">{tab.icon}</span>
						{tab.label}
					</button>
				{/each}
			</div>

			{#if loading}
				<div class="loading-state">
					<div class="spinner"></div>
					<p>Loading population health data...</p>
				</div>
			{:else if error}
				<div class="error-state">
					<p>⚠️ Error loading analytics: {error}</p>
					<button class="retry-btn" onclick={loadAnalyticsData}>Retry</button>
				</div>
			{:else}
				<!-- Overview Stats Cards -->
				<div class="overview-stats">
					<div class="stat-card">
						<div class="stat-icon">👥</div>
						<div class="stat-value">{formatNumber(facilityStats.patients)}</div>
						<div class="stat-label">Total Patients</div>
					</div>
					<div class="stat-card">
						<div class="stat-icon">📋</div>
						<div class="stat-value">{formatNumber(facilityStats.encounters)}</div>
						<div class="stat-label">Encounters</div>
					</div>
					<div class="stat-card">
						<div class="stat-icon">🏥</div>
						<div class="stat-value">{formatNumber(facilityStats.conditions)}</div>
						<div class="stat-label">Conditions</div>
					</div>
					<div class="stat-card">
						<div class="stat-icon">💊</div>
						<div class="stat-value">{formatNumber(facilityStats.prescriptions)}</div>
						<div class="stat-label">Prescriptions</div>
					</div>
					<div class="stat-card">
						<div class="stat-icon">🧪</div>
						<div class="stat-value">{formatNumber(facilityStats.labOrders)}</div>
						<div class="stat-label">Lab Orders</div>
					</div>
					<div class="stat-card">
						<div class="stat-icon">✅</div>
						<div class="stat-value">{formatNumber(facilityStats.dispenses)}</div>
						<div class="stat-label">Dispensed</div>
					</div>
				</div>

				{#if activeTab === 'diseases'}
					<!-- Disease Statistics -->
					<section class="analytics-section">
						<h2>📊 Disease Statistics</h2>
						<p class="section-desc">
							Top conditions across all facilities • 
							<strong>{conditionStats.length}</strong> unique diagnoses
						</p>

						{#if conditionStats.length === 0}
							<div class="empty-state">
								<p>No condition data available for this workshop group.</p>
							</div>
						{:else}
							<div class="data-table-container">
								<table class="data-table">
									<thead>
										<tr>
											<th>Rank</th>
											<th>Diagnosis</th>
											<th>Code</th>
											<th>Total Cases</th>
											<th>Active</th>
											<th>Resolved</th>
											<th>Unique Patients</th>
										</tr>
									</thead>
									<tbody>
										{#each conditionStats.slice(0, 50) as condition, index}
											<tr class={index < 3 ? 'top-rank rank-' + (index + 1) : ''}>
												<td class="rank-cell">
													{#if index < 3}
														<span class="rank-badge">#{index + 1}</span>
													{:else}
														{index + 1}
													{/if}
												</td>
												<td class="name-cell">
													<div class="condition-name">{condition.display}</div>
												</td>
												<td class="code-cell">
													<span 
														class="code-badge"
														style="background: {getSystemBadgeColor(condition.system)}"
													>
														{condition.code}
														<span class="system-label">{getSystemShortName(condition.system)}</span>
													</span>
												</td>
												<td class="count-cell">{condition.count}</td>
												<td class="count-cell active">{condition.activeCount}</td>
												<td class="count-cell resolved">{condition.resolvedCount}</td>
												<td class="count-cell">{condition.patientCount}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</section>
				{/if}

				{#if activeTab === 'medications'}
					<!-- Medication Trends -->
					<section class="analytics-section">
						<h2>💊 Medication Trends</h2>
						<p class="section-desc">
							Prescribing patterns and dispensing rates • 
							<strong>{medicationStats.length}</strong> unique medications
						</p>

						{#if medicationStats.length === 0}
							<div class="empty-state">
								<p>No medication data available for this workshop group.</p>
							</div>
						{:else}
							<div class="data-table-container">
								<table class="data-table">
									<thead>
										<tr>
											<th>Rank</th>
											<th>Medication</th>
											<th>Prescribed</th>
											<th>Dispensed</th>
											<th>Adherence</th>
											<th>Qty Prescribed</th>
											<th>Qty Dispensed</th>
										</tr>
									</thead>
									<tbody>
										{#each medicationStats.slice(0, 50) as med, index}
											<tr class={index < 3 ? 'top-rank rank-' + (index + 1) : ''}>
												<td class="rank-cell">
													{#if index < 3}
														<span class="rank-badge">#{index + 1}</span>
													{:else}
														{index + 1}
													{/if}
												</td>
												<td class="name-cell">
													<div class="med-name">{med.display}</div>
													{#if med.code !== med.display && med.code !== 'unknown'}
														<div class="med-code">{med.code}</div>
													{/if}
												</td>
												<td class="count-cell prescribed">{med.prescribedCount}</td>
												<td class="count-cell dispensed">{med.dispensedCount}</td>
												<td class="adherence-cell">
													<div class="adherence-bar">
														<div 
															class="adherence-fill"
															style="width: {med.adherenceRate}%; background: {getAdherenceColor(med.adherenceRate)}"
														></div>
														<span class="adherence-text">{med.adherenceRate}%</span>
													</div>
												</td>
												<td class="qty-cell">{med.totalQuantityPrescribed.toFixed(1)}</td>
												<td class="qty-cell">{med.totalQuantityDispensed.toFixed(1)}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</section>
				{/if}

				{#if activeTab === 'facilities'}
					<!-- Facility Comparison -->
					<section class="analytics-section">
						<h2>🏥 Facility Overview</h2>
						<p class="section-desc">Activity summary across all facilities in this workshop group</p>

						<div class="facility-grid">
							<!-- This would need facility-specific data - showing workshop-wide for now -->
							<div class="facility-card">
								<div class="facility-header">
									<span class="facility-icon">📊</span>
									<h3>Workshop Overview</h3>
								</div>
								<div class="facility-stats">
									<div class="fac-stat">
										<span class="fac-label">Total Patients</span>
										<span class="fac-value">{formatNumber(facilityStats.patients)}</span>
									</div>
									<div class="fac-stat">
										<span class="fac-label">Total Encounters</span>
										<span class="fac-value">{formatNumber(facilityStats.encounters)}</span>
									</div>
									<div class="fac-stat">
										<span class="fac-label">Conditions</span>
										<span class="fac-value">{formatNumber(facilityStats.conditions)}</span>
									</div>
									<div class="fac-stat">
										<span class="fac-label">Lab Orders</span>
										<span class="fac-value">{formatNumber(facilityStats.labOrders)}</span>
									</div>
									<div class="fac-stat">
										<span class="fac-label">Prescriptions</span>
										<span class="fac-value">{formatNumber(facilityStats.prescriptions)}</span>
									</div>
									<div class="fac-stat">
										<span class="fac-label">Dispensed</span>
										<span class="fac-value">{formatNumber(facilityStats.dispenses)}</span>
									</div>
								</div>
							</div>
						</div>

						<div class="insights-section">
							<h3>📈 Key Insights</h3>
							<div class="insights-grid">
								<div class="insight-card">
									<div class="insight-label">Dispense Rate</div>
									<div class="insight-value" style="color: {facilityStats.prescriptions > 0 ? getAdherenceColor(Math.round((facilityStats.dispenses / facilityStats.prescriptions) * 100)) : '#6B7280'}">
										{facilityStats.prescriptions > 0 ? Math.round((facilityStats.dispenses / facilityStats.prescriptions) * 100) : 0}%
									</div>
									<div class="insight-desc">of prescriptions dispensed</div>
								</div>
								<div class="insight-card">
									<div class="insight-label">Lab Completion</div>
									<div class="insight-value" style="color: {facilityStats.labOrders > 0 ? getAdherenceColor(Math.round((facilityStats.labReports / facilityStats.labOrders) * 100)) : '#6B7280'}">
										{facilityStats.labOrders > 0 ? Math.round((facilityStats.labReports / facilityStats.labOrders) * 100) : 0}%
									</div>
									<div class="insight-desc">of lab orders reported</div>
								</div>
								<div class="insight-card">
									<div class="insight-label">Avg Conditions/Patient</div>
									<div class="insight-value">
										{facilityStats.patients > 0 ? (facilityStats.conditions / facilityStats.patients).toFixed(2) : 0}
									</div>
									<div class="insight-desc">conditions per patient</div>
								</div>
							</div>
						</div>
					</section>
				{/if}
			{/if}
		</main>

		<!-- Bottom Navigation -->
		<nav class="bottom-nav">
			<a href={appStore.buildUrl('/dashboard')} class="nav-item">
				<span class="nav-icon">🏠</span>
				<span class="nav-label">Home</span>
			</a>
			<a href={appStore.buildUrl('/analytics')} class="nav-item active">
				<span class="nav-icon">📊</span>
				<span class="nav-label">Analytics</span>
			</a>
			<a href={appStore.buildUrl('/inbox')} class="nav-item">
				<span class="nav-icon">📥</span>
				<span class="nav-label">Work Queue</span>
			</a>
		</nav>
	</div>
{:else}
	<div class="loading">Redirecting...</div>
{/if}

<style>
	.analytics-page {
		min-height: 100vh;
		background: #f8fafc;
		padding-bottom: 80px;
	}

	.analytics-header {
		background: linear-gradient(135deg, var(--clinic-color, #2563EB) 0%, color-mix(in srgb, var(--clinic-color, #2563EB) 80%, black) 100%);
		color: white;
		padding: 1.5rem 1rem;
		position: sticky;
		top: 0;
		z-index: 10;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.header-main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.back-btn {
		color: white;
		text-decoration: none;
		font-size: 1.5rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
		transition: background 0.2s;
	}

	.back-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.analytics-header h1 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		flex: 1;
	}

	.header-sub {
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
		opacity: 0.9;
		text-align: center;
		max-width: 1200px;
		margin-left: auto;
		margin-right: auto;
	}

	.last-updated {
		margin-left: 1rem;
		opacity: 0.8;
	}

	.analytics-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 2px solid #e2e8f0;
		border-radius: 0.75rem;
		background: white;
		color: #64748b;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.2s;
	}

	.tab-btn:hover {
		border-color: var(--clinic-color, #2563EB);
		color: var(--clinic-color, #2563EB);
	}

	.tab-btn.active {
		background: var(--clinic-color, #2563EB);
		border-color: var(--clinic-color, #2563EB);
		color: white;
	}

	.tab-icon {
		font-size: 1.25rem;
	}

	/* Loading & Error States */
	.loading-state, .error-state, .empty-state {
		text-align: center;
		padding: 3rem 1rem;
		background: white;
		border-radius: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #e2e8f0;
		border-top-color: var(--clinic-color, #2563EB);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.retry-btn {
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background: var(--clinic-color, #2563EB);
		color: white;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		font-weight: 500;
	}

	/* Overview Stats */
	.overview-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: white;
		padding: 1.25rem;
		border-radius: 1rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		text-align: center;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.stat-icon {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.stat-value {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--clinic-color, #2563EB);
	}

	.stat-label {
		font-size: 0.75rem;
		color: #64748b;
		margin-top: 0.25rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	/* Analytics Sections */
	.analytics-section {
		background: white;
		border-radius: 1rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 1.5rem;
	}

	.analytics-section h2 {
		margin: 0 0 0.25rem;
		font-size: 1.25rem;
		color: #1e293b;
	}

	.section-desc {
		margin: 0 0 1.5rem;
		color: #64748b;
		font-size: 0.875rem;
	}

	/* Data Table */
	.data-table-container {
		overflow-x: auto;
		border-radius: 0.75rem;
		border: 1px solid #e2e8f0;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.data-table th {
		background: #f8fafc;
		padding: 0.75rem;
		text-align: left;
		font-weight: 600;
		color: #475569;
		border-bottom: 2px solid #e2e8f0;
		white-space: nowrap;
	}

	.data-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #e2e8f0;
		vertical-align: middle;
	}

	.data-table tbody tr:hover {
		background: #f8fafc;
	}

	.data-table tbody tr:last-child td {
		border-bottom: none;
	}

	/* Table Cell Styles */
	.rank-cell {
		font-weight: 600;
		color: #64748b;
		width: 60px;
	}

	.rank-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		font-weight: 700;
		font-size: 0.75rem;
	}

	.rank-1 .rank-badge {
		background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
		color: white;
	}

	.rank-2 .rank-badge {
		background: linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%);
		color: white;
	}

	.rank-3 .rank-badge {
		background: linear-gradient(135deg, #CD7F32 0%, #B87333 100%);
		color: white;
	}

	.name-cell {
		min-width: 200px;
	}

	.condition-name, .med-name {
		font-weight: 500;
		color: #1e293b;
	}

	.med-code {
		font-size: 0.75rem;
		color: #64748b;
		margin-top: 0.25rem;
	}

	.code-cell {
		width: 120px;
	}

	.code-badge {
		display: inline-flex;
		flex-direction: column;
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		color: white;
		font-weight: 600;
		font-size: 0.75rem;
		line-height: 1.2;
	}

	.system-label {
		font-size: 0.625rem;
		opacity: 0.9;
		font-weight: 400;
	}

	.count-cell {
		text-align: center;
		font-weight: 600;
		width: 80px;
	}

	.count-cell.active {
		color: #22C55E;
	}

	.count-cell.resolved {
		color: #6B7280;
	}

	.count-cell.prescribed {
		color: #3B82F6;
	}

	.count-cell.dispensed {
		color: #10B981;
	}

	.adherence-cell {
		width: 120px;
	}

	.adherence-bar {
		position: relative;
		height: 24px;
		background: #e2e8f0;
		border-radius: 12px;
		overflow: hidden;
	}

	.adherence-fill {
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		border-radius: 12px;
		transition: width 0.3s ease;
	}

	.adherence-text {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		font-size: 0.75rem;
		font-weight: 600;
		color: #1e293b;
		z-index: 1;
	}

	.qty-cell {
		text-align: right;
		font-family: monospace;
		font-size: 0.875rem;
		width: 100px;
	}

	/* Facility Section */
	.facility-grid {
		display: grid;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.facility-card {
		background: #f8fafc;
		border-radius: 1rem;
		padding: 1.5rem;
		border: 2px solid #e2e8f0;
	}

	.facility-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.facility-icon {
		font-size: 1.5rem;
	}

	.facility-header h3 {
		margin: 0;
		font-size: 1.125rem;
		color: #1e293b;
	}

	.facility-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem;
	}

	.fac-stat {
		display: flex;
		flex-direction: column;
	}

	.fac-label {
		font-size: 0.75rem;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.fac-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--clinic-color, #2563EB);
	}

	/* Insights */
	.insights-section {
		margin-top: 1.5rem;
	}

	.insights-section h3 {
		margin: 0 0 1rem;
		font-size: 1rem;
		color: #475569;
	}

	.insights-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.insight-card {
		background: #f8fafc;
		padding: 1.25rem;
		border-radius: 0.75rem;
		border: 1px solid #e2e8f0;
	}

	.insight-label {
		font-size: 0.75rem;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 0.5rem;
	}

	.insight-value {
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
	}

	.insight-desc {
		font-size: 0.75rem;
		color: #64748b;
	}

	/* Bottom Navigation */
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: white;
		display: flex;
		justify-content: space-around;
		padding: 0.5rem 0;
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
		z-index: 100;
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem 1rem;
		color: #64748b;
		text-decoration: none;
		transition: color 0.2s;
	}

	.nav-item:hover {
		color: var(--clinic-color, #2563EB);
	}

	.nav-item.active {
		color: var(--clinic-color, #2563EB);
	}

	.nav-icon {
		font-size: 1.25rem;
		margin-bottom: 0.25rem;
	}

	.nav-label {
		font-size: 0.625rem;
		font-weight: 500;
	}

	/* Loading Page */
	.loading {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.125rem;
		color: #64748b;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.analytics-header h1 {
			font-size: 1.125rem;
		}

		.overview-stats {
			grid-template-columns: repeat(2, 1fr);
		}

		.data-table {
			font-size: 0.75rem;
		}

		.data-table th,
		.data-table td {
			padding: 0.5rem;
		}

		.name-cell {
			min-width: 150px;
		}

		.facility-stats {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 480px) {
		.overview-stats {
			grid-template-columns: repeat(3, 1fr);
		}

		.stat-card {
			padding: 0.75rem;
		}

		.stat-value {
			font-size: 1.25rem;
		}

		.stat-label {
			font-size: 0.625rem;
		}
	}
</style>