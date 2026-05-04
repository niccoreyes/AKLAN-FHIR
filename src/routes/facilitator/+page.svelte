<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { fhirClient } from '$services/fhir-client.js';
	import { WORKSHOP_TAG_SYSTEM } from '$constants';
	import AppHeader from '$components/AppHeader.svelte';

	// Tab state
	let activeTab = $state('explorer'); // 'explorer' | 'single'
	
	// Tag Explorer state
	let discoveredTags = $state(new Map());
	let isDiscovering = $state(false);
	let selectedTags = $state(new Set());
	let batchDeleteResult = $state(null);
	let isBatchDeleting = $state(false);
	let customTagInput = $state('');
	
	// Preset workshop tags (always shown)
	const PRESET_TAGS = ['AK26-A', 'AK26-B', 'AK26-C', 'AK26-D', 'AK26-E'];
	
	// Single Tag View state
	let workshopTag = $state('');
	let resourceCounts = $state({});
	let participants = $state([]);
	let isLoading = $state(false);
	let isDeleting = $state(false);
	let deleteResult = $state(null);
	let deleteProgress = $state({ current: 0, total: 0, currentType: '' });
	let selectedTypesToDelete = $state([]);
	
	// Server status
	let serverStatus = $state('checking');
	let error = $state('');

	const resourceTypes = ['Patient', 'Encounter', 'Observation', 'Condition', 'MedicationRequest', 'ServiceRequest', 'DiagnosticReport', 'MedicationDispense', 'Practitioner'];
	const allResourceTypes = [...resourceTypes];
	
	// Deletion order for display (same as deletion order in client)
	const deletionOrderDisplay = [
		'MedicationDispense',
		'DiagnosticReport', 
		'MedicationRequest',
		'ServiceRequest',
		'Observation',
		'Condition',
		'Encounter',
		'Patient',
		'Practitioner'
	];

	async function checkServer() {
		try {
			await fhirClient.getCapabilities();
			serverStatus = 'connected';
		} catch (e) {
			serverStatus = 'error';
		}
	}

	// Tag Explorer functions
	async function discoverTags() {
		isDiscovering = true;
		error = '';
		batchDeleteResult = null;
		
		try {
			const tags = await fhirClient.discoverWorkshopTags();
			
			// Merge with preset tags (preset tags show even if 0 resources)
			for (const presetTag of PRESET_TAGS) {
				if (!tags.has(presetTag)) {
					tags.set(presetTag, {
						counts: {},
						total: 0,
						display: presetTag,
						isPreset: true
					});
				} else {
					// Mark existing tag as preset
					const tagData = tags.get(presetTag);
					tagData.isPreset = true;
				}
			}
			
			discoveredTags = tags;
			console.log(`[discoverTags] Found ${tags.size} unique tags`);
		} catch (e) {
			error = `Failed to discover tags: ${e.message}`;
			console.error('[discoverTags] Error:', e);
		} finally {
			isDiscovering = false;
		}
	}
	
	function addCustomTag() {
		const tag = customTagInput.trim().toUpperCase();
		if (!tag) return;
		
		// Add to discovered tags (will be fetched when discovered)
		if (!discoveredTags.has(tag)) {
			discoveredTags.set(tag, {
				counts: {},
				total: 0,
				display: tag,
				isCustom: true
			});
			discoveredTags = new Map(discoveredTags); // Trigger reactivity
		}
		
		// Select it and load its data
		selectedTags.add(tag);
		selectedTags = new Set(selectedTags);
		
		// Clear input
		customTagInput = '';
	}
	
	async function searchAndAddTag() {
		const tag = customTagInput.trim();
		if (!tag) return;
		
		isDiscovering = true;
		
		try {
			// Search for this specific tag across resource types
			const counts = {};
			let total = 0;
			
			for (const type of resourceTypes) {
				try {
					const result = await fhirClient.search(type, { _tag: `${WORKSHOP_TAG_SYSTEM}|${tag}`, _summary: 'count' });
					const count = result.total || 0;
					if (count > 0) {
						counts[type] = count;
						total += count;
					}
				} catch (e) {
					// Ignore errors for individual types
				}
			}
			
			// Add to discovered tags
			discoveredTags.set(tag, {
				counts,
				total,
				display: tag,
				isCustom: true
			});
			discoveredTags = new Map(discoveredTags);
			
			if (total === 0) {
				error = `No resources found for tag "${tag}"`;
			} else {
				error = '';
				// Select it
				selectedTags.add(tag);
				selectedTags = new Set(selectedTags);
			}
			
			customTagInput = '';
		} catch (e) {
			error = `Error searching for tag "${tag}": ${e.message}`;
		} finally {
			isDiscovering = false;
		}
	}

	function toggleTagSelection(tagCode) {
		if (selectedTags.has(tagCode)) {
			selectedTags.delete(tagCode);
		} else {
			selectedTags.add(tagCode);
		}
		selectedTags = new Set(selectedTags); // Trigger reactivity
	}

	function selectAllTags() {
		if (selectedTags.size === discoveredTags.size) {
			selectedTags = new Set();
		} else {
			selectedTags = new Set(discoveredTags.keys());
		}
	}

	async function deleteSelectedTags() {
		if (selectedTags.size === 0) return;
		
		const confirmed = confirm(
			`⚠️ WARNING\n\nThis will DELETE ALL resources for ${selectedTags.size} workshop(s):\n` +
			Array.from(selectedTags).join(', ') +
			`\n\nThis will delete resources in dependency order to avoid errors.\n` +
			`This action cannot be undone.\n\nAre you sure?`
		);
		
		if (!confirmed) return;
		
		isBatchDeleting = true;
		batchDeleteResult = null;
		
		const results = {
			tagsProcessed: 0,
			totalDeleted: 0,
			totalErrors: 0,
			details: {}
		};
		
		for (const tag of selectedTags) {
			try {
				const result = await fhirClient.deleteWorkshopResources(tag);
				results.details[tag] = result;
				results.totalDeleted += result.deleted;
				results.totalErrors += result.errors;
				results.tagsProcessed++;
			} catch (e) {
				results.details[tag] = { deleted: 0, errors: 1, error: e.message };
				results.totalErrors++;
			}
		}
		
		batchDeleteResult = results;
		isBatchDeleting = false;
		selectedTags = new Set(); // Clear selection
		await discoverTags(); // Refresh
	}

	function viewTagDetails(tag) {
		workshopTag = tag;
		activeTab = 'single';
		loadWorkshopData();
	}

	// Single Tag View functions
	async function loadWorkshopData() {
		if (!workshopTag) return;
		
		isLoading = true;
		error = '';
		deleteResult = null;
		deleteProgress = { current: 0, total: 0, currentType: '' };
		
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
			
			// Initialize selected types with non-zero counts
			selectedTypesToDelete = resourceTypes.filter(type => counts[type] > 0);
		} catch (e) {
			error = e.message;
		} finally {
			isLoading = false;
		}
	}

	async function deleteWorkshopData() {
		if (!workshopTag) return;
		if (selectedTypesToDelete.length === 0) {
			error = 'Please select at least one resource type to delete';
			return;
		}
		
		const confirmed = confirm(
			`⚠️ WARNING\n\nThis will DELETE ${selectedTypesToDelete.length} resource type(s) tagged with "${workshopTag}".\n` +
			`Resources will be deleted in dependency order to avoid integrity errors.\n\n` +
			`Selected types:\n${selectedTypesToDelete.join(', ')}\n\n` +
			`This action cannot be undone.\n\nAre you sure?`
		);
		
		if (!confirmed) return;
		
		isDeleting = true;
		deleteResult = null;
		deleteProgress = { current: 0, total: 0, currentType: '' };
		
		try {
			// Progress callback
			const onProgress = (deleted, errors, currentType, totalInType, typeDeleted) => {
				deleteProgress = {
					current: deleted,
					total: Object.values(resourceCounts).reduce((a, b) => a + b, 0),
					currentType,
					typeProgress: typeDeleted,
					typeTotal: totalInType
				};
			};
			
			const result = await fhirClient.deleteWorkshopResources(workshopTag, selectedTypesToDelete, onProgress);
			deleteResult = result;
			
			// Reload counts
			await loadWorkshopData();
		} catch (e) {
			deleteResult = { deleted: 0, errors: 1, error: e.message, details: {} };
		} finally {
			isDeleting = false;
			deleteProgress = { current: 0, total: 0, currentType: '' };
		}
	}

	async function deleteSingleResourceType(resourceType) {
		if (!workshopTag) return;
		
		const count = resourceCounts[resourceType] || 0;
		if (count === 0) {
			error = `No ${resourceType} resources to delete`;
			return;
		}
		
		const confirmed = confirm(
			`⚠️ WARNING\n\nThis will DELETE ALL ${count} ${resourceType} resource(s) tagged with "${workshopTag}".\n\n` +
			`This may fail if other resources reference these ${resourceType} resources.\n\n` +
			`This action cannot be undone.\n\nAre you sure?`
		);
		
		if (!confirmed) return;
		
		isDeleting = true;
		deleteResult = null;
		
		try {
			const result = await fhirClient.deleteResourcesByTypeAndTag(resourceType, workshopTag);
			deleteResult = {
				deleted: result.deleted,
				errors: result.errors,
				details: { [resourceType]: result }
			};
			await loadWorkshopData();
		} catch (e) {
			deleteResult = { deleted: 0, errors: 1, error: e.message, details: {} };
		} finally {
			isDeleting = false;
		}
	}

	function toggleResourceType(type) {
		if (selectedTypesToDelete.includes(type)) {
			selectedTypesToDelete = selectedTypesToDelete.filter(t => t !== type);
		} else {
			selectedTypesToDelete = [...selectedTypesToDelete, type];
		}
	}

	function selectAllResourceTypes() {
		if (selectedTypesToDelete.length === resourceTypes.length) {
			selectedTypesToDelete = [];
		} else {
			selectedTypesToDelete = [...resourceTypes];
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
				activeTab = 'single';
				loadWorkshopData();
			} else {
				// Auto-discover tags on load
				discoverTags();
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
		<!-- Server Status -->
		<div class="server-status-bar">
			<span class="status-indicator {serverStatus}">
				{serverStatus === 'connected' ? '🟢' : serverStatus === 'checking' ? '🟡' : '🔴'}
			</span>
			<span class="status-text">
				{serverStatus === 'connected' ? 'FHIR Server Connected' : serverStatus === 'checking' ? 'Checking server...' : 'Server Error'}
			</span>
			<span class="server-url">cdr.fhirlab.net</span>
		</div>

		<!-- Tabs -->
		<div class="tabs">
			<button 
				class="tab {activeTab === 'explorer' ? 'active' : ''}"
				on:click={() => activeTab = 'explorer'}
			>
				🏷️ Tag Explorer
			</button>
			<button 
				class="tab {activeTab === 'single' ? 'active' : ''}"
				on:click={() => activeTab = 'single'}
			>
				🔍 Single Tag View
			</button>
		</div>

		{#if error}
			<div class="error-banner">
				⚠️ {error}
				<button class="dismiss-btn" on:click={() => error = ''}>×</button>
			</div>
		{/if}

		<!-- Tag Explorer Tab -->
		{#if activeTab === 'explorer'}
			<div class="tab-content">
				<!-- Discovery Controls -->
				<div class="workshop-input-card">
					<h2>🏷️ Workshop Tag Explorer</h2>
					<p class="description">
						Discover and manage all workshop tags on the FHIR server. 
						Preset tags (AK26-A to AK26-E) are always shown. Add custom tags to search for specific workshop codes.
					</p>
					
					<!-- Custom Tag Input -->
					<div class="custom-tag-section">
						<div class="custom-tag-input-group">
							<input
								type="text"
								bind:value={customTagInput}
								placeholder="Enter custom tag (e.g., TEST-01, WORKSHOP-2024)"
								class="custom-tag-input"
								on:keydown={(e) => e.key === 'Enter' && searchAndAddTag()}
							/>
							<button 
								class="secondary-btn"
								on:click={searchAndAddTag}
								disabled={isDiscovering || !customTagInput.trim()}
							>
								🔍 Search & Add
							</button>
							<button 
								class="secondary-btn"
								on:click={addCustomTag}
								disabled={!customTagInput.trim()}
							>
								➕ Quick Add
							</button>
						</div>
						<p class="input-hint">
							Use "Search & Add" to verify the tag exists on the server. Use "Quick Add" to add without searching.
						</p>
					</div>
					
					<!-- Preset Tags -->
					<div class="preset-tags-section">
						<span class="section-label">Preset Tags:</span>
						<div class="preset-tags-list">
							{#each PRESET_TAGS as tag}
								<button 
									class="tag-chip preset {discoveredTags.has(tag) && discoveredTags.get(tag).total > 0 ? 'has-data' : ''}"
									on:click={() => {
										if (!discoveredTags.has(tag)) {
											discoveredTags.set(tag, { counts: {}, total: 0, display: tag, isPreset: true });
											discoveredTags = new Map(discoveredTags);
										}
										toggleTagSelection(tag);
									}}
								>
									{tag}
									{#if discoveredTags.has(tag) && discoveredTags.get(tag).total > 0}
										<span class="tag-count">({discoveredTags.get(tag).total})</span>
									{/if}
								</button>
							{/each}
						</div>
					</div>
					
					<div class="discovery-controls">
						<button 
							class="load-btn"
							on:click={discoverTags}
							disabled={isDiscovering}
						>
							{#if isDiscovering}
								⟳ Scanning server...
							{:else}
								🔍 Refresh All Tags
							{/if}
						</button>
						
						{#if discoveredTags.size > 0}
							<button 
								class="secondary-btn"
								on:click={selectAllTags}
							>
								{selectedTags.size === discoveredTags.size ? 'Deselect All' : 'Select All'}
							</button>
						{/if}
					</div>
				</div>

				{#if discoveredTags.size > 0}
					<!-- Batch Operations -->
					{#if selectedTags.size > 0}
						<div class="batch-operations">
							<div class="batch-info">
								<strong>{selectedTags.size}</strong> tag(s) selected
							</div>
							<button 
								class="delete-btn"
								on:click={deleteSelectedTags}
								disabled={isBatchDeleting}
							>
								{#if isBatchDeleting}
									⟳ Deleting...
								{:else}
									🗑️ Delete Selected Tags
								{/if}
							</button>
						</div>
					{/if}

					{#if batchDeleteResult}
						<div class="delete-result {batchDeleteResult.totalErrors > 0 ? 'has-errors' : 'success'}">
							<div>✅ Tags processed: {batchDeleteResult.tagsProcessed}</div>
							<div>✅ Total deleted: {batchDeleteResult.totalDeleted} resources</div>
							{#if batchDeleteResult.totalErrors > 0}
								<div>❌ Total errors: {batchDeleteResult.totalErrors}</div>
							{/if}
						</div>
					{/if}

					<!-- Tags Grid -->
					<div class="tags-grid">
						{#each [...discoveredTags.entries()].sort((a, b) => {
							// Sort: preset first (by order in PRESET_TAGS), then by total count
							const aIndex = PRESET_TAGS.indexOf(a[0]);
							const bIndex = PRESET_TAGS.indexOf(b[0]);
							if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
							if (aIndex !== -1) return -1;
							if (bIndex !== -1) return 1;
							return b[1].total - a[1].total;
						}) as [tagCode, tagData]}
							<div class="tag-card {selectedTags.has(tagCode) ? 'selected' : ''} {tagData.isPreset ? 'preset' : ''} {tagData.isCustom ? 'custom' : ''}">
								<div class="tag-header">
									<input 
										type="checkbox"
										checked={selectedTags.has(tagCode)}
										on:change={() => toggleTagSelection(tagCode)}
									/>
									<div class="tag-name-section">
										<span class="tag-name">{tagCode}</span>
										{#if tagData.isPreset}
											<span class="tag-badge preset">PRESET</span>
										{/if}
										{#if tagData.isCustom}
											<span class="tag-badge custom">CUSTOM</span>
										{/if}
									</div>
									<span class="tag-total {tagData.total === 0 ? 'zero' : ''}">
										{tagData.total > 0 ? `${tagData.total} resources` : 'No data'}
									</span>
								</div>
								
								{#if tagData.total > 0}
									<div class="tag-breakdown">
										{#each Object.entries(tagData.counts).sort((a, b) => b[1] - a[1]) as [type, count]}
											<div class="tag-resource-type">
												<span>{type}</span>
												<span class="count">{count}</span>
											</div>
										{/each}
									</div>
								{/if}
								
								<div class="tag-actions">
									{#if tagData.total > 0}
										<button 
											class="view-btn"
											on:click={() => viewTagDetails(tagCode)}
										>
											👁️ View
										</button>
									{:else}
										<span class="no-data-hint">Search this tag to load data</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else if !isDiscovering}
					<div class="empty-state">
						<p>No tags discovered yet. Click "Discover Tags" to scan the server.</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Single Tag View Tab -->
		{#if activeTab === 'single'}
			<div class="tab-content">
				<!-- Workshop Input -->
				<div class="workshop-input-card">
					<h2>🔍 Single Tag View</h2>
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

				{#if workshopTag && !isLoading}
					<!-- Stats Overview -->
					<div class="stats-grid">
						<div class="stat-card total">
							<div class="stat-value">{getTotalResources()}</div>
							<div class="stat-label">Total Resources</div>
						</div>
						{#each resourceTypes as type}
							{#if resourceCounts[type] > 0}
								<div class="stat-card">
									<div class="stat-value">{resourceCounts[type]}</div>
									<div class="stat-label">{type}</div>
								</div>
							{/if}
						{/each}
					</div>

					<!-- Granular Delete Controls -->
					<div class="section-card danger-zone">
						<h3>⚠️ Granular Delete</h3>
						<p>
							Select resource types to delete. Resources will be deleted in dependency order 
							(leaf resources first) to avoid integrity errors.
						</p>
						
						<div class="type-selector">
							<button 
								class="secondary-btn small"
								on:click={selectAllResourceTypes}
							>
								{selectedTypesToDelete.length === resourceTypes.length ? 'Deselect All' : 'Select All'}
							</button>
							<span class="selected-count">
								{selectedTypesToDelete.length} type(s) selected
							</span>
						</div>
						
						<div class="resource-types-grid">
							{#each deletionOrderDisplay as type}
								<label class="type-checkbox {resourceCounts[type] === 0 ? 'empty' : ''}">
									<input
										type="checkbox"
										checked={selectedTypesToDelete.includes(type)}
										on:change={() => toggleResourceType(type)}
										disabled={resourceCounts[type] === 0}
									/>
									<span class="type-name">{type}</span>
									<span class="type-count">{resourceCounts[type] || 0}</span>
									{#if resourceCounts[type] > 0}
										<button 
											class="delete-type-btn"
											on:click={() => deleteSingleResourceType(type)}
											disabled={isDeleting}
											title="Delete only this resource type (may fail due to references)"
										>
											🗑️
										</button>
									{/if}
								</label>
							{/each}
						</div>
						
						<button 
							class="delete-btn large"
							on:click={deleteWorkshopData}
							disabled={isDeleting || selectedTypesToDelete.length === 0}
						>
							{#if isDeleting}
								⟳ Deleting in dependency order...
							{:else}
								🗑️ Delete Selected Resource Types
							{/if}
						</button>

						{#if isDeleting && deleteProgress.current > 0}
							<div class="progress-bar">
								<div class="progress-fill" style="width: {(deleteProgress.current / deleteProgress.total * 100) || 0}%"></div>
							</div>
							<div class="progress-text">
								Deleted {deleteProgress.current} of {deleteProgress.total} resources
								{#if deleteProgress.currentType}
									(currently: {deleteProgress.currentType} - {deleteProgress.typeProgress}/{deleteProgress.typeTotal})
								{/if}
							</div>
						{/if}

						{#if deleteResult}
							<div class="delete-result {deleteResult.errors > 0 ? 'has-errors' : 'success'}">
								<div class="result-summary">
									✅ Deleted: {deleteResult.deleted} resources
									{#if deleteResult.errors > 0}
										<span class="error-count">❌ Errors: {deleteResult.errors}</span>
									{/if}
								</div>
								
								{#if deleteResult.details && Object.keys(deleteResult.details).length > 0}
									<div class="result-details">
										<h4>Details by Resource Type:</h4>
										{#each Object.entries(deleteResult.details) as [type, data]}
											<div class="detail-row">
												<span class="detail-type">{type}:</span>
												<span class="detail-count">{data.deleted} deleted</span>
												{#if data.errors > 0}
													<span class="detail-error">({data.errors} errors)</span>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
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
		max-width: 1200px;
		margin: 0 auto;
	}

	/* Server Status */
	.server-status-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: white;
		border-radius: 8px;
		border: 1px solid #E2E8F0;
		margin-bottom: 16px;
		font-size: 14px;
	}

	.status-indicator {
		font-size: 12px;
	}

	.status-indicator.connected {
		color: #10B981;
	}

	.status-indicator.error {
		color: #DC2626;
	}

	.status-text {
		color: #475569;
		font-weight: 500;
	}

	.server-url {
		margin-left: auto;
		color: #94A3B8;
		font-family: monospace;
		font-size: 13px;
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: 8px;
		margin-bottom: 24px;
	}

	.tab {
		padding: 12px 24px;
		background: white;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		color: #64748B;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab:hover {
		background: #F8FAFC;
		color: #475569;
	}

	.tab.active {
		background: #2563EB;
		color: white;
		border-color: #2563EB;
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
		margin: 0 0 8px 0;
		font-size: 18px;
		color: #1E293B;
	}

	.workshop-input-card .description {
		margin: 0 0 16px 0;
		font-size: 14px;
		color: #64748B;
		line-height: 1.5;
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

	/* Custom Tag Section */
	.custom-tag-section {
		background: #F8FAFC;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 16px;
	}

	.custom-tag-input-group {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
		flex-wrap: wrap;
	}

	.custom-tag-input {
		flex: 1;
		min-width: 200px;
		padding: 10px 14px;
		border: 1px solid #E2E8F0;
		border-radius: 6px;
		font-size: 14px;
		background: white;
	}

	.custom-tag-input:focus {
		outline: none;
		border-color: #2563EB;
	}

	.input-hint {
		margin: 0;
		font-size: 12px;
		color: #94A3B8;
	}

	/* Preset Tags Section */
	.preset-tags-section {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
		padding: 12px;
		background: #F0F9FF;
		border: 1px solid #BAE6FD;
		border-radius: 8px;
		flex-wrap: wrap;
	}

	.section-label {
		font-size: 13px;
		font-weight: 600;
		color: #0369A1;
		white-space: nowrap;
	}

	.preset-tags-list {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.tag-chip.preset {
		background: #DBEAFE;
		border-color: #93C5FD;
		color: #1E40AF;
		font-weight: 600;
	}

	.tag-chip.preset:hover {
		background: #BFDBFE;
	}

	.tag-chip.preset.has-data {
		background: #2563EB;
		color: white;
		border-color: #2563EB;
	}

	.tag-chip.preset.has-data:hover {
		background: #1D4ED8;
	}

	.tag-chip .tag-count {
		font-size: 11px;
		margin-left: 4px;
		opacity: 0.8;
	}

	.discovery-controls {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
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

	.secondary-btn {
		padding: 12px 24px;
		background: #F1F5F9;
		color: #475569;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.secondary-btn:hover {
		background: #E2E8F0;
	}

	.secondary-btn.small {
		padding: 6px 12px;
		font-size: 13px;
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
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.dismiss-btn {
		background: none;
		border: none;
		color: #DC2626;
		font-size: 20px;
		cursor: pointer;
		padding: 0;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Batch Operations */
	.batch-operations {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		background: #FEF3C7;
		border: 1px solid #FCD34D;
		border-radius: 8px;
		margin-bottom: 20px;
	}

	.batch-info {
		font-size: 14px;
		color: #92400E;
	}

	/* Tags Grid */
	.tags-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
	}

	.tag-card {
		background: white;
		border: 1px solid #E2E8F0;
		border-radius: 12px;
		padding: 16px;
		transition: all 0.2s;
	}

	.tag-card:hover {
		border-color: #CBD5E1;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
	}

	.tag-card.selected {
		border-color: #2563EB;
		background: #EFF6FF;
	}

	.tag-card.preset {
		border-color: #93C5FD;
		background: #F0F9FF;
	}

	.tag-card.custom {
		border-color: #86EFAC;
		background: #F0FDF4;
	}

	.tag-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
		padding-bottom: 12px;
		border-bottom: 1px solid #F1F5F9;
	}

	.tag-header input {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.tag-name-section {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		flex-wrap: wrap;
	}

	.tag-name {
		font-weight: 600;
		font-size: 16px;
		color: #1E293B;
	}

	.tag-badge {
		font-size: 10px;
		font-weight: 700;
		padding: 2px 6px;
		border-radius: 4px;
		white-space: nowrap;
	}

	.tag-badge.preset {
		background: #2563EB;
		color: white;
	}

	.tag-badge.custom {
		background: #16A34A;
		color: white;
	}

	.tag-total {
		font-size: 13px;
		color: #64748B;
		background: #F1F5F9;
		padding: 4px 8px;
		border-radius: 12px;
		white-space: nowrap;
	}

	.tag-total.zero {
		background: #E2E8F0;
		color: #94A3B8;
	}

	.tag-breakdown {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 12px;
	}

	.tag-resource-type {
		display: flex;
		justify-content: space-between;
		font-size: 13px;
		color: #475569;
	}

	.tag-resource-type .count {
		font-weight: 600;
		color: #1E293B;
	}

	.tag-actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.view-btn {
		flex: 1;
		padding: 8px 12px;
		background: #F1F5F9;
		border: 1px solid #E2E8F0;
		border-radius: 6px;
		font-size: 13px;
		color: #475569;
		cursor: pointer;
		text-align: center;
	}

	.view-btn:hover {
		background: #E2E8F0;
	}

	.no-data-hint {
		font-size: 12px;
		color: #94A3B8;
		font-style: italic;
		flex: 1;
		text-align: center;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 60px 20px;
		color: #64748B;
		background: white;
		border-radius: 12px;
		border: 1px solid #E2E8F0;
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
		line-height: 1.5;
	}

	/* Type Selector */
	.type-selector {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 16px;
	}

	.selected-count {
		font-size: 14px;
		color: #64748B;
	}

	/* Resource Types Grid */
	.resource-types-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 8px;
		margin-bottom: 20px;
	}

	.type-checkbox {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		background: white;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.2s;
	}

	.type-checkbox:hover {
		border-color: #CBD5E1;
	}

	.type-checkbox input {
		width: 16px;
		height: 16px;
		cursor: pointer;
	}

	.type-checkbox.empty {
		opacity: 0.5;
	}

	.type-name {
		flex: 1;
		color: #475569;
	}

	.type-count {
		font-size: 12px;
		color: #64748B;
		background: #F1F5F9;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.delete-type-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		font-size: 14px;
		opacity: 0.6;
		transition: opacity 0.2s;
	}

	.delete-type-btn:hover:not(:disabled) {
		opacity: 1;
	}

	.delete-type-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	/* Delete Buttons */
	.delete-btn {
		padding: 12px 24px;
		background: #DC2626;
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.delete-btn:hover:not(:disabled) {
		background: #B91C1C;
	}

	.delete-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.delete-btn.large {
		width: 100%;
		padding: 16px;
		font-size: 16px;
	}

	/* Progress Bar */
	.progress-bar {
		width: 100%;
		height: 8px;
		background: #FECACA;
		border-radius: 4px;
		overflow: hidden;
		margin: 16px 0 8px;
	}

	.progress-fill {
		height: 100%;
		background: #DC2626;
		transition: width 0.3s ease;
	}

	.progress-text {
		font-size: 13px;
		color: #7F1D1D;
		text-align: center;
	}

	/* Delete Result */
	.delete-result {
		margin-top: 16px;
		padding: 16px;
		border-radius: 8px;
		font-size: 14px;
		background: #DCFCE7;
		color: #166534;
	}

	.delete-result.has-errors {
		background: #FEE2E2;
		color: #991B1B;
	}

	.result-summary {
		font-weight: 600;
		margin-bottom: 12px;
	}

	.error-count {
		margin-left: 16px;
	}

	.result-details {
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		padding-top: 12px;
	}

	.result-details h4 {
		margin: 0 0 8px 0;
		font-size: 13px;
		color: #64748B;
	}

	.detail-row {
		display: flex;
		gap: 8px;
		font-size: 13px;
		margin-bottom: 4px;
	}

	.detail-type {
		font-weight: 500;
		min-width: 120px;
	}

	.detail-count {
		color: #166534;
	}

	.detail-error {
		color: #DC2626;
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
</style>