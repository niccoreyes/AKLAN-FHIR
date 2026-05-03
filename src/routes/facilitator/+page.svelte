<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { fhirClient } from '$services/fhir-client.js';
	import { WORKSHOP_TAG_SYSTEM } from '$constants';
	import AppHeader from '$components/AppHeader.svelte';

	let workshopTag = $state('');
	let resourceCounts = $state({});
	let participants = $state([]);
	let isLoading = $state(false);
	let isDeleting = $state(false);
	let deleteResult = $state(null);
	let serverStatus = $state('checking');
	let error = $state('');

	const resourceTypes = ['Patient', 'Encounter', 'Observation', 'Condition', 'MedicationRequest', 'ServiceRequest', 'DiagnosticReport', 'Practitioner', 'Organization'];

	async function checkServer() {
		try {
			await fhirClient.getCapabilities();
			serverStatus = 'connected';
		} catch (e) {
			serverStatus = 'error';
		}
	}

	async function loadWorkshopData() {
		if (!workshopTag) return;
		
		isLoading = true;
		error = '';
		deleteResult = null;
		
		try {
			// Fetch resource counts
			const counts = {};
			for (const type of resourceTypes) {
				try {
					const result = await fhirClient.search(type, { _tag: `${WORKSHOP_TAG_SYSTEM}|${workshopTag}`, _summary: 'count' });
					counts[type] = result.total || 0;
				} catch (e) {
					counts[type] = 0;
				}
			}
			resourceCounts = counts;

			// Fetch participants (Practitioners with this workshop tag)
			try {
				const result = await fhirClient.search('Practitioner', { _tag: `${WORKSHOP_TAG_SYSTEM}|${workshopTag}`, _count: '50' });
				participants = result.entry?.map(e => e.resource) || [];
			} catch (e) {
				participants = [];
			}
		} catch (e) {
			error = e.message;
		} finally {
			isLoading = false;
		}
	}

	async function deleteWorkshopData() {
		if (!workshopTag) return;
		
		const confirmed = confirm(
			`⚠️ WARNING\n\nThis will DELETE ALL resources tagged with workshop "${workshopTag}".\n\n` +
			`This action cannot be undone.\n\nAre you sure?`
		);
		
		if (!confirmed) return;
		
		isDeleting = true;
		deleteResult = null;
		
		try {
			const result = await fhirClient.deleteWorkshopResources(workshopTag);
			deleteResult = result;
			// Reload counts
			await loadWorkshopData();
		} catch (e) {
			deleteResult = { deleted: 0, errors: 1, error: e.message };
		} finally {
			isDeleting = false;
		}
	}

	function getTotalResources() {
		return Object.values(resourceCounts).reduce((sum, count) => sum + count, 0);
	}

	function getParticipantName(practitioner) {
		const name = practitioner.name?.[0];
		if (!name) return 'Unknown';
		return `${name.given?.join(' ') || ''} ${name.family || ''}`.trim();
	}

	onMount(() => {
		if (browser) {
			checkServer();
			// Check URL for workshop param
			const params = new URLSearchParams(window.location.search);
			const w = params.get('w');
			if (w) {
				workshopTag = w;
				loadWorkshopData();
			}
		}
	});
</script>

<svelte:head>
	<title>Facilitator Dashboard | OpenHIE Mock EHR</title>
</svelte:head>

<div class="facilitator-page">
	<AppHeader active="facilitator" />

	<div class="content">
		<!-- Workshop Input -->
		<div class="workshop-input-card">
			<h2>🔍 Workshop Monitor</h2>
			<div class="input-group">
				<input
					type="text"
					bind:value={workshopTag}
					placeholder="Enter workshop tag (e.g., AK26-A)"
					class="workshop-input"
					on:keydown={(e) => e.key === 'Enter' && loadWorkshopData()}
				/>
				<button class="load-btn" on:click={loadWorkshopData} disabled={isLoading || !workshopTag}>
					{#if isLoading}
						⟳ Loading...
					{:else}
						📊 Load Data
					{/if}
				</button>
			</div>
			
			<div class="workshop-hints">
				<span>Quick select:</span>
				{#each ['AK26-A', 'AK26-B', 'AK26-C', 'AK26-D', 'AK26-E'] as tag}
					<button class="tag-chip" on:click={() => { workshopTag = tag; loadWorkshopData(); }}>
						{tag}
					</button>
				{/each}
			</div>
		</div>

		{#if error}
			<div class="error-banner">
				⚠️ {error}
			</div>
		{/if}

		{#if workshopTag && !isLoading}
			<!-- Stats Overview -->
			<div class="stats-grid">
				<div class="stat-card total">
					<div class="stat-value">{getTotalResources()}</div>
					<div class="stat-label">Total Resources</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{resourceCounts.Patient || 0}</div>
					<div class="stat-label">Patients</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{resourceCounts.Encounter || 0}</div>
					<div class="stat-label">Encounters</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{resourceCounts.Observation || 0}</div>
					<div class="stat-label">Observations</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{resourceCounts.Condition || 0}</div>
					<div class="stat-label">Conditions</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{resourceCounts.MedicationRequest || 0}</div>
					<div class="stat-label">Medications</div>
				</div>
				<div class="stat-card">
					<div class="stat-value">{resourceCounts.Practitioner || 0}</div>
					<div class="stat-label">Participants</div>
				</div>
			</div>

			<!-- Resource Breakdown -->
			<div class="section-card">
				<h3>📊 Resource Breakdown</h3>
				<div class="resource-table">
					{#each Object.entries(resourceCounts) as [type, count]}
						<div class="resource-row">
							<span class="resource-name">{type}</span>
							<div class="resource-bar-container">
								<div class="resource-bar" style="width: {getTotalResources() > 0 ? (count / getTotalResources() * 100) : 0}%"></div>
							</div>
							<span class="resource-count">{count}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Participants -->
			{#if participants.length > 0}
				<div class="section-card">
					<h3>👥 Participants ({participants.length})</h3>
					<div class="participants-list">
						{#each participants as participant}
							<div class="participant-row">
								<div class="participant-avatar">
									{getParticipantName(participant).charAt(0).toUpperCase()}
								</div>
								<div class="participant-info">
									<strong>{getParticipantName(participant)}</strong>
									<span class="participant-id">ID: {participant.id}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Danger Zone -->
			<div class="section-card danger-zone">
				<h3>⚠️ Danger Zone</h3>
				<p>Delete all resources tagged with <strong>{workshopTag}</strong>. This action cannot be undone.</p>
				
				<button 
					class="delete-btn"
					on:click={deleteWorkshopData}
					disabled={isDeleting}
				>
					{#if isDeleting}
						⟳ Deleting...
					{:else}
						🗑️ Delete All Workshop Data
					{/if}
				</button>

				{#if deleteResult}
					<div class="delete-result {deleteResult.errors > 0 ? 'has-errors' : 'success'}">
						<div>✅ Deleted: {deleteResult.deleted} resources</div>
						{#if deleteResult.errors > 0}
							<div>❌ Errors: {deleteResult.errors}</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.facilitator-page {
		min-height: 100vh;
		background: #F8FAFC;
	}

	.content {
		padding: 24px;
		max-width: 1000px;
		margin: 0 auto;
	}

	/* Workshop Input */
	.workshop-input-card {
		background: white;
		border-radius: 12px;
		border: 1px solid #E2E8F0;
		padding: 24px;
		margin-bottom: 24px;
	}

	.workshop-input-card h2 {
		margin: 0 0 16px 0;
		font-size: 18px;
		color: #1E293B;
	}

	.input-group {
		display: flex;
		gap: 12px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}

	.workshop-input {
		flex: 1;
		min-width: 200px;
		padding: 12px 16px;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		font-size: 16px;
		background: white;
	}

	.load-btn {
		padding: 12px 24px;
		background: #2563EB;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.load-btn:hover:not(:disabled) {
		background: #1D4ED8;
	}

	.load-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.workshop-hints {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		font-size: 14px;
		color: #64748B;
	}

	.tag-chip {
		padding: 6px 12px;
		background: #F1F5F9;
		border: 1px solid #E2E8F0;
		border-radius: 20px;
		font-size: 13px;
		color: #475569;
		cursor: pointer;
		font-weight: 500;
	}

	.tag-chip:hover {
		background: #E2E8F0;
	}

	/* Error */
	.error-banner {
		padding: 16px;
		background: #FEF2F2;
		border: 1px solid #FECACA;
		border-radius: 8px;
		color: #DC2626;
		margin-bottom: 24px;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 16px;
		margin-bottom: 24px;
	}

	.stat-card {
		background: white;
		border-radius: 12px;
		border: 1px solid #E2E8F0;
		padding: 20px;
		text-align: center;
	}

	.stat-card.total {
		background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
		color: white;
		border: none;
	}

	.stat-value {
		font-size: 28px;
		font-weight: 700;
		margin-bottom: 4px;
	}

	.stat-label {
		font-size: 13px;
		color: #64748B;
	}

	.stat-card.total .stat-label {
		color: rgba(255, 255, 255, 0.8);
	}

	/* Section Card */
	.section-card {
		background: white;
		border-radius: 12px;
		border: 1px solid #E2E8F0;
		padding: 24px;
		margin-bottom: 24px;
	}

	.section-card h3 {
		margin: 0 0 16px 0;
		font-size: 16px;
		font-weight: 600;
		color: #1E293B;
	}

	/* Resource Table */
	.resource-table {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.resource-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.resource-name {
		width: 150px;
		font-size: 14px;
		font-weight: 500;
		color: #475569;
		flex-shrink: 0;
	}

	.resource-bar-container {
		flex: 1;
		height: 8px;
		background: #F1F5F9;
		border-radius: 4px;
		overflow: hidden;
	}

	.resource-bar {
		height: 100%;
		background: #2563EB;
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.resource-count {
		width: 40px;
		text-align: right;
		font-size: 14px;
		font-weight: 600;
		color: #1E293B;
		flex-shrink: 0;
	}

	/* Participants */
	.participants-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.participant-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: #F8FAFC;
		border-radius: 8px;
	}

	.participant-avatar {
		width: 36px;
		height: 36px;
		background: #DBEAFE;
		color: #2563EB;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 14px;
		flex-shrink: 0;
	}

	.participant-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.participant-info strong {
		font-size: 14px;
		color: #1E293B;
	}

	.participant-id {
		font-size: 12px;
		color: #94A3B8;
		font-family: monospace;
	}

	/* Danger Zone */
	.danger-zone {
		border-color: #FECACA;
		background: #FEF2F2;
	}

	.danger-zone h3 {
		color: #DC2626;
	}

	.danger-zone p {
		font-size: 14px;
		color: #7F1D1D;
		margin: 0 0 16px 0;
	}

	.delete-btn {
		padding: 12px 24px;
		background: #DC2626;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
	}

	.delete-btn:hover:not(:disabled) {
		background: #B91C1C;
	}

	.delete-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.delete-result {
		margin-top: 16px;
		padding: 12px;
		border-radius: 8px;
		font-size: 14px;
	}

	.delete-result.success {
		background: #DCFCE7;
		color: #166534;
	}

	.delete-result.has-errors {
		background: #FEE2E2;
		color: #991B1B;
	}
</style>
