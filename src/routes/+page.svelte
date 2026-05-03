<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { fhirClient } from '$services/fhir-client.js';
	import { FHIR_CONFIG, WORKSHON_TAG_SYSTEM } from '$constants';
	import AppHeader from '$components/AppHeader.svelte';

	// State
	let patients = $state([]);
	let selectedPatient = $state(null);
	let selectedPatientResources = $state({});
	let resourceCounts = $state({});
	let isLoading = $state(true);
	let serverStatus = $state('checking');
	let workshopTag = $state('');
	let showOnlyTagged = $state(true);
	let searchQuery = $state('');
	let error = $state('');

	const resourceTypes = ['Patient', 'Encounter', 'Observation', 'Condition', 'MedicationRequest', 'ServiceRequest', 'DiagnosticReport', 'Practitioner', 'Organization'];

	// Check server status
	async function checkServer() {
		try {
			await fhirClient.getCapabilities();
			serverStatus = 'connected';
		} catch (e) {
			serverStatus = 'error';
		}
	}

	// Fetch resource counts
	async function fetchResourceCounts() {
		const counts = {};
		for (const type of resourceTypes) {
			try {
				const params = showOnlyTagged && workshopTag ? { _tag: `${WORKSHON_TAG_SYSTEM}|${workshopTag}`, _summary: 'count' } : { _summary: 'count' };
				const result = await fhirClient.search(type, params);
				counts[type] = result.total || 0;
			} catch (e) {
				counts[type] = 0;
			}
		}
		resourceCounts = counts;
	}

	// Fetch patients
	async function fetchPatients() {
		isLoading = true;
		error = '';
		
		try {
			const params = {
				_sort: '-_lastUpdated',
				_count: '50'
			};
			
			if (showOnlyTagged && workshopTag) {
				params._tag = `${WORKSHON_TAG_SYSTEM}|${workshopTag}`;
			}
			
			if (searchQuery) {
				params.name = searchQuery;
			}
			
			const result = await fhirClient.search('Patient', params);
			patients = result.entry?.map(e => e.resource) || [];
		} catch (e) {
			error = e.message;
			patients = [];
		} finally {
			isLoading = false;
		}
	}

	// Select patient and fetch their resources
	async function selectPatient(patient) {
		selectedPatient = patient;
		selectedPatientResources = {};
		
		try {
			const patientId = patient.id;
			
			// Fetch related resources in parallel
			const [encounters, observations, conditions, medications] = await Promise.all([
				fhirClient.search('Encounter', { patient: `Patient/${patientId}`, _count: '10' }).catch(() => ({ entry: [] })),
				fhirClient.search('Observation', { patient: `Patient/${patientId}`, _count: '10', _sort: '-date' }).catch(() => ({ entry: [] })),
				fhirClient.search('Condition', { patient: `Patient/${patientId}`, _count: '10' }).catch(() => ({ entry: [] })),
				fhirClient.search('MedicationRequest', { patient: `Patient/${patientId}`, _count: '10', status: 'active' }).catch(() => ({ entry: [] }))
			]);
			
			selectedPatientResources = {
				encounters: encounters.entry?.map(e => e.resource) || [],
				observations: observations.entry?.map(e => e.resource) || [],
				conditions: conditions.entry?.map(e => e.resource) || [],
				medications: medications.entry?.map(e => e.resource) || []
			};
		} catch (e) {
			console.error('Error fetching patient resources:', e);
		}
	}

	// Get patient age
	function getAge(birthDate) {
		if (!birthDate) return '';
		const birth = new Date(birthDate);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const m = today.getMonth() - birth.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
		return age;
	}

	// Get patient display name
	function getPatientName(patient) {
		const name = patient.name?.[0];
		if (!name) return 'Unknown';
		const given = name.given?.join(' ') || '';
		const family = name.family || '';
		return `${given} ${family}`.trim();
	}

	// Get PH ID
	function getPHID(patient) {
		return patient.identifier?.find(id => id.system?.includes('philhealth'))?.value || '';
	}

	// Get creator from meta
	function getCreator(patient) {
		return patient.meta?.source || 'Unknown';
	}

	// Get workshop tag
	function getWorkshopTag(patient) {
		return patient.meta?.tag?.find(t => t.system === WORKSHON_TAG_SYSTEM)?.code || '';
	}

	// Get FHIR Resource ID
	function getFhirId(patient) {
		return patient.id || 'N/A';
	}

	// Get EHR system source
	function getEhrSource(patient) {
		return patient.meta?.source || '';
	}

	// Get last updated timestamp
	function getLastUpdated(patient) {
		const lastUpdated = patient.meta?.lastUpdated;
		if (!lastUpdated) return '';
		return new Date(lastUpdated).toLocaleDateString('en-PH', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Get all identifiers display
	function getIdentifiersDisplay(patient) {
		const ids = [];
		if (patient.identifier) {
			for (const id of patient.identifier) {
				const system = id.system ? id.system.split('/').pop() : 'unknown';
				if (id.value) {
					ids.push(`${system}: ${id.value}`);
				}
			}
		}
		return ids;
	}

	// Load on mount only
	onMount(async () => {
		if (browser) {
			await checkServer();
			await Promise.all([fetchPatients(), fetchResourceCounts()]);
		}
	});
</script>

<div class="ips-viewer">
	<AppHeader active="clinical" />

	<!-- Main Content -->
	<div class="content-area">
		<!-- Filters -->
		<div class="filters-bar">
			<input 
				type="text" 
				bind:value={searchQuery}
				placeholder="🔍 Search patients by name..."
				class="search-input"
				on:keydown={(e) => e.key === 'Enter' && fetchPatients()}
			/>
			<div class="filter-group">
				<input 
					type="text" 
					bind:value={workshopTag}
					placeholder="Workshop tag (e.g., AK26-A)"
					class="tag-input"
				/>
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={showOnlyTagged} />
					Show only tagged data
				</label>
			</div>
			<button class="refresh-btn" on:click={fetchPatients}>🔄 Refresh</button>
		</div>

		<!-- Two Panel Layout -->
		<div class="panels-container">
			<!-- Patient List Panel -->
			<div class="patient-list-panel">
				<h2>Patients ({patients.length})</h2>
				
				{#if isLoading}
					<div class="loading-state">
						<div class="skeleton-row" style="height: 60px;"></div>
						<div class="skeleton-row" style="height: 60px;"></div>
						<div class="skeleton-row" style="height: 60px;"></div>
					</div>
				{:else if error}
					<div class="error-state">
						⚠️ {error}
					</div>
				{:else if patients.length === 0}
					<div class="empty-state">
						<p>👤 No patients found</p>
						<span>Join a workshop to create patient data!</span>
					</div>
				{:else}
					<div class="patient-list">
						{#each patients as patient}
							<a 
								href="/patient/{patient.id}"
								class="patient-row"
								class:selected={selectedPatient?.id === patient.id}
								on:click={(e) => { e.preventDefault(); selectPatient(patient); }}
							>
								<div class="patient-avatar">
									{patient.gender === 'male' ? '👨' : patient.gender === 'female' ? '👩' : '👤'}
								</div>
								<div class="patient-info">
									<strong>{getPatientName(patient)}</strong>
									<div class="patient-meta">
										<span class="ph-id">{getPHID(patient)}</span>
										<span>{getAge(patient.birthDate)}y • {patient.gender}</span>
									</div>
									<div class="fhir-details">
										<span class="fhir-id">FHIR ID: {getFhirId(patient)}</span>
										{#if getEhrSource(patient)}
											<span class="ehr-source">Source: {getEhrSource(patient)}</span>
										{/if}
									</div>
									{#if getLastUpdated(patient)}
										<div class="last-updated">
											🕒 {getLastUpdated(patient)}
										</div>
									{/if}
									{#if getWorkshopTag(patient)}
										<span class="workshop-tag">🏷️ {getWorkshopTag(patient)}</span>
									{/if}
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Patient Summary Panel -->
			<div class="summary-panel">
				{#if !selectedPatient}
					<div class="empty-summary">
						<div class="empty-icon">📋</div>
						<h3>Patient Summary</h3>
						<p>Select a patient from the list to view their International Patient Summary</p>
						<div class="empty-hint">
							💡 The summary includes conditions, vital signs, medications, and encounters
						</div>
					</div>
				{:else}
					<div class="patient-header">
						<div class="patient-avatar-large">
							{selectedPatient.gender === 'male' ? '👨' : selectedPatient.gender === 'female' ? '👩' : '👤'}
						</div>
						<div class="patient-details">
							<h2>{getPatientName(selectedPatient)}</h2>
							<div class="detail-row">
								<span class="detail-label">PH ID:</span>
								<span class="detail-value">{getPHID(selectedPatient) || 'N/A'}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">DOB:</span>
								<span class="detail-value">{selectedPatient.birthDate} ({getAge(selectedPatient.birthDate)} years)</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Gender:</span>
								<span class="detail-value">{selectedPatient.gender}</span>
							</div>
							{#if getWorkshopTag(selectedPatient)}
								<div class="detail-row">
									<span class="detail-label">Workshop:</span>
									<span class="workshop-badge">{getWorkshopTag(selectedPatient)}</span>
								</div>
							{/if}
						</div>
					</div>

					<!-- Conditions -->
					{#if selectedPatientResources.conditions?.length > 0}
						<div class="section-card">
							<h3>🏥 Conditions ({selectedPatientResources.conditions.length})</h3>
							<div class="conditions-list">
								{#each selectedPatientResources.conditions as condition}
									<div class="condition-item">
										<div class="condition-name">
											{condition.code?.text || condition.code?.coding?.[0]?.display || 'Unknown'}
										</div>
										<div class="condition-badges">
											<span class="badge badge-{condition.clinicalStatus?.coding?.[0]?.code || 'unknown'}">
												{condition.clinicalStatus?.coding?.[0]?.code || 'Unknown'}
											</span>
											{#if condition.verificationStatus?.coding?.[0]?.code}
												<span class="badge badge-{condition.verificationStatus?.coding?.[0]?.code}">
													{condition.verificationStatus?.coding?.[0]?.code}
												</span>
											{/if}
										</div>
										{#if condition.code?.coding?.[0]?.code}
											<div class="code-label">
												SNOMED: {condition.code?.coding?.[0]?.code}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Vital Signs -->
					{#if selectedPatientResources.observations?.length > 0}
						<div class="section-card">
							<h3>🩺 Vital Signs ({selectedPatientResources.observations.length})</h3>
							<div class="vitals-grid">
								{#each selectedPatientResources.observations.slice(0, 6) as obs}
									<div class="vital-card">
										<div class="vital-name">
											{obs.code?.text || obs.code?.coding?.[0]?.display || 'Observation'}
										</div>
										<div class="vital-value">
											{#if obs.component}
												{obs.component[0]?.valueQuantity?.value}/{obs.component[1]?.valueQuantity?.value} {obs.component[0]?.valueQuantity?.unit}
											{:else if obs.valueQuantity}
												{obs.valueQuantity.value} {obs.valueQuantity.unit}
											{:else if obs.valueString}
												{obs.valueString}
											{:else}
												N/A
											{/if}
										</div>
										{#if obs.code?.coding?.[0]?.code}
											<div class="code-label">
												LOINC: {obs.code?.coding?.[0]?.code}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Medications -->
					{#if selectedPatientResources.medications?.length > 0}
						<div class="section-card">
							<h3>💊 Medications ({selectedPatientResources.medications.length})</h3>
							<div class="medications-list">
								{#each selectedPatientResources.medications as med}
									<div class="medication-item">
										<div class="med-name">
											{med.medicationCodeableConcept?.text || med.medicationCodeableConcept?.coding?.[0]?.display || 'Unknown'}
										</div>
										<div class="med-meta">
											<span class="badge badge-{med.status}">{med.status}</span>
											{#if med.medicationCodeableConcept?.coding?.[0]?.code}
												<span class="code-label">RxNorm: {med.medicationCodeableConcept?.coding?.[0]?.code}</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Encounters -->
					{#if selectedPatientResources.encounters?.length > 0}
						<div class="section-card">
							<h3>📋 Encounters ({selectedPatientResources.encounters.length})</h3>
							<div class="encounters-timeline">
								{#each selectedPatientResources.encounters as encounter}
									<div class="encounter-item">
										<div class="encounter-date">
											{encounter.period?.start ? new Date(encounter.period.start).toLocaleDateString() : 'Unknown date'}
										</div>
										<div class="encounter-type">
											{encounter.type?.[0]?.text || encounter.type?.[0]?.coding?.[0]?.display || 'Visit'}
										</div>
										<div class="encounter-status">
											<span class="badge badge-{encounter.status}">{encounter.status}</span>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Raw FHIR Toggle -->
					<div class="section-card raw-fhir">
						<details>
							<summary>📄 View Raw FHIR JSON</summary>
							<pre class="json-display">{JSON.stringify(selectedPatient, null, 2)}</pre>
						</details>
					</div>
				{/if}
			</div>
		</div>

		<!-- Resource Counts -->
		<div class="resource-nav">
			<h3>Available FHIR R4 Resources</h3>
			<div class="resource-chips">
				{#each Object.entries(resourceCounts) as [type, count]}
					{#if count > 0}
						<span class="resource-chip">
							{type} ({count})
						</span>
					{/if}
				{/each}
			</div>
		</div>
	</div>

	<!-- Footer Actions -->
	<div class="footer-actions">
		<a href="/workshop" class="action-btn primary">
			<span>🎓</span>
			<div>
				<strong>Join Workshop</strong>
				<span>Participate in the activity</span>
			</div>
		</a>
		<a href="/developer" class="action-btn secondary">
			<span>🔧</span>
			<div>
				<strong>Developer Mode</strong>
				<span>Test FHIR APIs</span>
			</div>
		</a>
	</div>
</div>

<style>
	.ips-viewer {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: #F8FAFC;
	}

	/* Content Area */
	.content-area {
		flex: 1;
		padding: 24px;
		max-width: 1400px;
		margin: 0 auto;
		width: 100%;
	}

	/* Filters */
	.filters-bar {
		display: flex;
		gap: 12px;
		margin-bottom: 24px;
		flex-wrap: wrap;
		align-items: center;
	}

	.search-input {
		flex: 1;
		min-width: 200px;
		padding: 10px 16px;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		font-size: 14px;
		background: white;
	}

	.filter-group {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.tag-input {
		padding: 10px 16px;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		font-size: 14px;
		width: 180px;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: #475569;
		cursor: pointer;
	}

	.refresh-btn {
		padding: 10px 16px;
		background: white;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
	}

	.refresh-btn:hover {
		background: #F8FAFC;
	}

	/* Panels */
	.panels-container {
		display: grid;
		grid-template-columns: 380px 1fr;
		gap: 24px;
		margin-bottom: 24px;
	}

	@media (max-width: 1024px) {
		.panels-container {
			grid-template-columns: 1fr;
		}
	}

	/* Patient List */
	.patient-list-panel {
		background: white;
		border-radius: 12px;
		border: 1px solid #E2E8F0;
		padding: 20px;
	}

	.patient-list-panel h2 {
		margin: 0 0 16px 0;
		font-size: 16px;
		font-weight: 600;
		color: #1E293B;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.skeleton-row {
		background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 8px;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.error-state {
		padding: 16px;
		background: #FEF2F2;
		border: 1px solid #FECACA;
		border-radius: 8px;
		color: #DC2626;
		font-size: 14px;
	}

	.empty-state {
		text-align: center;
		padding: 40px 20px;
		color: #64748B;
	}

	.empty-state p {
		font-size: 18px;
		margin: 0 0 8px 0;
	}

	.empty-state span {
		font-size: 14px;
	}

	.patient-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.patient-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: #F8FAFC;
		border: 2px solid transparent;
		border-radius: 10px;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: all 0.2s;
	}

	.patient-row:hover {
		border-color: #CBD5E1;
		background: #F1F5F9;
	}

	.patient-row.selected {
		border-color: #2563EB;
		background: #EFF6FF;
	}

	.patient-avatar {
		font-size: 28px;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.patient-info {
		flex: 1;
		min-width: 0;
	}

	.patient-info strong {
		display: block;
		font-size: 14px;
		color: #1E293B;
		margin-bottom: 2px;
	}

	.patient-meta {
		display: flex;
		gap: 8px;
		font-size: 12px;
		color: #64748B;
	}

	.ph-id {
		font-family: monospace;
		background: #E2E8F0;
		padding: 1px 6px;
		border-radius: 4px;
	}

	.fhir-details {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 4px;
		font-size: 11px;
	}

	.fhir-id {
		font-family: monospace;
		background: #F1F5F9;
		color: #475569;
		padding: 1px 6px;
		border-radius: 4px;
	}

	.ehr-source {
		font-family: monospace;
		background: #FEF3C7;
		color: #92400E;
		padding: 1px 6px;
		border-radius: 4px;
	}

	.last-updated {
		font-size: 11px;
		color: #94A3B8;
		margin-top: 2px;
	}

	.workshop-tag {
		font-size: 11px;
		background: #DBEAFE;
		color: #2563EB;
		padding: 2px 8px;
		border-radius: 4px;
		margin-top: 4px;
		display: inline-block;
	}

	/* Summary Panel */
	.summary-panel {
		background: white;
		border-radius: 12px;
		border: 1px solid #E2E8F0;
		padding: 20px;
		min-height: 400px;
	}

	.empty-summary {
		text-align: center;
		padding: 60px 20px;
		color: #64748B;
	}

	.empty-icon {
		font-size: 48px;
		margin-bottom: 16px;
	}

	.empty-summary h3 {
		margin: 0 0 8px 0;
		font-size: 18px;
		color: #1E293B;
	}

	.empty-summary p {
		margin: 0 0 16px 0;
		font-size: 14px;
	}

	.empty-hint {
		font-size: 13px;
		color: #94A3B8;
	}

	/* Patient Header */
	.patient-header {
		display: flex;
		gap: 16px;
		margin-bottom: 24px;
		padding-bottom: 20px;
		border-bottom: 1px solid #E2E8F0;
	}

	.patient-avatar-large {
		font-size: 48px;
		width: 72px;
		height: 72px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #F1F5F9;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.patient-details {
		flex: 1;
	}

	.patient-details h2 {
		margin: 0 0 12px 0;
		font-size: 22px;
		color: #1E293B;
	}

	.detail-row {
		display: flex;
		gap: 8px;
		margin-bottom: 6px;
		font-size: 14px;
	}

	.detail-label {
		color: #64748B;
		min-width: 80px;
	}

	.detail-value {
		color: #1E293B;
		font-weight: 500;
	}

	.workshop-badge {
		background: #DBEAFE;
		color: #2563EB;
		padding: 2px 10px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 600;
	}

	/* Section Cards */
	.section-card {
		margin-bottom: 20px;
		padding: 16px;
		background: #F8FAFC;
		border-radius: 10px;
	}

	.section-card h3 {
		margin: 0 0 12px 0;
		font-size: 14px;
		font-weight: 600;
		color: #475569;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Conditions */
	.conditions-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.condition-item {
		padding: 12px;
		background: white;
		border-radius: 8px;
		border: 1px solid #E2E8F0;
	}

	.condition-name {
		font-weight: 600;
		color: #1E293B;
		margin-bottom: 6px;
	}

	.condition-badges {
		display: flex;
		gap: 6px;
		margin-bottom: 4px;
	}

	/* Vitals */
	.vitals-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 10px;
	}

	.vital-card {
		padding: 12px;
		background: white;
		border-radius: 8px;
		border: 1px solid #E2E8F0;
	}

	.vital-name {
		font-size: 12px;
		color: #64748B;
		margin-bottom: 4px;
	}

	.vital-value {
		font-size: 18px;
		font-weight: 700;
		color: #1E293B;
	}

	/* Medications */
	.medications-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.medication-item {
		padding: 10px;
		background: white;
		border-radius: 8px;
		border: 1px solid #E2E8F0;
	}

	.med-name {
		font-weight: 500;
		color: #1E293B;
		margin-bottom: 4px;
	}

	.med-meta {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	/* Encounters */
	.encounters-timeline {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.encounter-item {
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 10px;
		background: white;
		border-radius: 8px;
		border: 1px solid #E2E8F0;
	}

	.encounter-date {
		font-size: 12px;
		color: #64748B;
		min-width: 100px;
	}

	.encounter-type {
		flex: 1;
		font-weight: 500;
		color: #1E293B;
	}

	/* Badges */
	.badge {
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.badge-active {
		background: #DCFCE7;
		color: #166534;
	}

	.badge-confirmed {
		background: #DBEAFE;
		color: #1E40AF;
	}

	.badge-inactive {
		background: #F1F5F9;
		color: #64748B;
	}

	.badge-unknown {
		background: #F1F5F9;
		color: #64748B;
	}

	/* Code Labels */
	.code-label {
		font-size: 11px;
		color: #94A3B8;
		font-family: monospace;
	}

	/* Raw FHIR */
	.raw-fhir summary {
		cursor: pointer;
		font-weight: 600;
		color: #475569;
		padding: 8px 0;
	}

	.json-display {
		background: #1E293B;
		color: #E2E8F0;
		padding: 16px;
		border-radius: 8px;
		overflow-x: auto;
		font-size: 12px;
		max-height: 400px;
		overflow-y: auto;
	}

	/* Resource Nav */
	.resource-nav {
		background: white;
		border-radius: 12px;
		border: 1px solid #E2E8F0;
		padding: 20px;
		margin-bottom: 24px;
	}

	.resource-nav h3 {
		margin: 0 0 12px 0;
		font-size: 14px;
		font-weight: 600;
		color: #475569;
	}

	.resource-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.resource-chip {
		padding: 6px 12px;
		background: #F1F5F9;
		border-radius: 20px;
		font-size: 13px;
		color: #475569;
		font-weight: 500;
	}

	/* Footer Actions */
	.footer-actions {
		display: flex;
		gap: 16px;
		padding: 24px;
		background: white;
		border-top: 1px solid #E2E8F0;
		justify-content: center;
		flex-wrap: wrap;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 24px;
		border-radius: 12px;
		text-decoration: none;
		font-size: 14px;
		min-width: 200px;
		transition: all 0.2s;
	}

	.action-btn.primary {
		background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
		color: white;
		box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
	}

	.action-btn.primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
	}

	.action-btn.secondary {
		background: #F8FAFC;
		border: 2px solid #E2E8F0;
		color: #475569;
	}

	.action-btn.secondary:hover {
		background: #F1F5F9;
		border-color: #CBD5E1;
	}

	.action-btn span:first-child {
		font-size: 24px;
	}

	.action-btn strong {
		display: block;
		font-size: 15px;
		margin-bottom: 2px;
	}

	.action-btn span:last-child {
		font-size: 12px;
		opacity: 0.8;
	}
</style>
