<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { fhirClient } from '$services/fhir-client.js';
	import { APP_NAME } from '$constants';

	let patient = $state(null);
	let resources = $state([]);
	let isLoading = $state(true);
	let error = $state('');

	// Get patient ID from URL params
	let patientId = $derived($page.params.id);

	// Helper functions
	function getPatientName(p) {
		const name = p?.name?.[0];
		if (!name) return 'Unknown';
		return `${name.given?.join(' ') || ''} ${name.family || ''}`.trim();
	}

	function getAge(birthDate) {
		if (!birthDate) return '';
		const birth = new Date(birthDate);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const m = today.getMonth() - birth.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
		return age;
	}

	function getResourceTypeIcon(type) {
		const icons = {
			Encounter: '📋',
			Observation: '🩺',
			Condition: '🏥',
			MedicationRequest: '💊',
			ServiceRequest: '📄',
			DiagnosticReport: '📊',
			Patient: '👤'
		};
		return icons[type] || '📄';
	}

	function formatDate(dateStr) {
		if (!dateStr) return 'Unknown';
		return new Date(dateStr).toLocaleDateString('en-PH', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getResourceTitle(resource) {
		switch (resource.resourceType) {
			case 'Encounter':
				return resource.type?.[0]?.text || resource.type?.[0]?.coding?.[0]?.display || 'Visit';
			case 'Observation':
				return resource.code?.text || resource.code?.coding?.[0]?.display || 'Observation';
			case 'Condition':
				return resource.code?.text || resource.code?.coding?.[0]?.display || 'Condition';
			case 'MedicationRequest':
				return resource.medicationCodeableConcept?.text || resource.medicationCodeableConcept?.coding?.[0]?.display || 'Medication';
			case 'ServiceRequest':
				return resource.code?.text || resource.code?.coding?.[0]?.display || 'Service Request';
			case 'DiagnosticReport':
				return resource.code?.text || resource.code?.coding?.[0]?.display || 'Report';
			default:
				return resource.resourceType;
		}
	}

	function getResourceDetails(resource) {
		switch (resource.resourceType) {
			case 'Observation': {
				if (resource.component) {
					return resource.component.map(c => `${c.valueQuantity?.value} ${c.valueQuantity?.unit}`).join(' / ');
				}
				if (resource.valueQuantity) {
					return `${resource.valueQuantity.value} ${resource.valueQuantity.unit}`;
				}
				if (resource.valueString) return resource.valueString;
				if (resource.valueCodeableConcept) return resource.valueCodeableConcept?.text;
				return '';
			}
			case 'Encounter':
				return resource.status;
			case 'Condition':
				return resource.clinicalStatus?.coding?.[0]?.code || '';
			case 'MedicationRequest':
				return resource.status;
			default:
				return '';
		}
	}

	// Fetch patient and all related resources
	async function loadPatientData() {
		isLoading = true;
		error = '';
		
		try {
			// Fetch patient
			patient = await fhirClient.read('Patient', patientId);

			// Fetch all related resources
			const [encounters, observations, conditions, medications, services, reports] = await Promise.all([
				fhirClient.search('Encounter', { patient: `Patient/${patientId}`, _count: '50', _sort: '-date' }).catch(() => ({ entry: [] })),
				fhirClient.search('Observation', { patient: `Patient/${patientId}`, _count: '50', _sort: '-date' }).catch(() => ({ entry: [] })),
				fhirClient.search('Condition', { patient: `Patient/${patientId}`, _count: '50' }).catch(() => ({ entry: [] })),
				fhirClient.search('MedicationRequest', { patient: `Patient/${patientId}`, _count: '50', _sort: '-authoredon' }).catch(() => ({ entry: [] })),
				fhirClient.search('ServiceRequest', { patient: `Patient/${patientId}`, _count: '50' }).catch(() => ({ entry: [] })),
				fhirClient.search('DiagnosticReport', { patient: `Patient/${patientId}`, _count: '50', _sort: '-date' }).catch(() => ({ entry: [] }))
			]);

			// Combine all resources into timeline
			const allResources = [
				...(encounters.entry || []).map(e => ({ ...e.resource, sortDate: e.resource.period?.start || e.resource.meta?.lastUpdated })),
				...(observations.entry || []).map(e => ({ ...e.resource, sortDate: e.resource.effectiveDateTime || e.resource.issued || e.resource.meta?.lastUpdated })),
				...(conditions.entry || []).map(e => ({ ...e.resource, sortDate: e.resource.onsetDateTime || e.resource.recordedDate || e.resource.meta?.lastUpdated })),
				...(medications.entry || []).map(e => ({ ...e.resource, sortDate: e.resource.authoredOn || e.resource.meta?.lastUpdated })),
				...(services.entry || []).map(e => ({ ...e.resource, sortDate: e.resource.authoredOn || e.resource.meta?.lastUpdated })),
				...(reports.entry || []).map(e => ({ ...e.resource, sortDate: e.resource.issued || e.resource.effectiveDateTime || e.resource.meta?.lastUpdated }))
			];

			// Sort by date descending
			resources = allResources.sort((a, b) => {
				const dateA = new Date(a.sortDate || 0);
				const dateB = new Date(b.sortDate || 0);
				return dateB - dateA;
			});
		} catch (e) {
			error = e.message;
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		if (browser && patientId) {
			loadPatientData();
		}
	});
</script>

<svelte:head>
	<title>{patient ? getPatientName(patient) : 'Patient'} | {APP_NAME}</title>
</svelte:head>

<div class="patient-detail">
	<!-- Header -->
	<header class="top-bar">
		<div class="logo">
			<a href="/patient/search" class="back-link">← Back to Patients</a>
			<h1>{APP_NAME}</h1>
		</div>
	</header>

	{#if isLoading}
		<div class="loading-state">
			<div class="skeleton-header"></div>
			<div class="skeleton-timeline">
				<div class="skeleton-item"></div>
				<div class="skeleton-item"></div>
				<div class="skeleton-item"></div>
			</div>
		</div>
	{:else if error}
		<div class="error-state">
			⚠️ {error}
			<button on:click={loadPatientData} class="retry-btn">Retry</button>
		</div>
	{:else if patient}
		<!-- Patient Header -->
		<div class="patient-header">
			<div class="patient-avatar-large">
				{patient.gender === 'male' ? '👨' : patient.gender === 'female' ? '👩' : '👤'}
			</div>
			<div class="patient-info">
				<h2>{getPatientName(patient)}</h2>
				<div class="patient-meta">
					<span class="meta-item">
						<span class="meta-label">Age</span>
						<span class="meta-value">{getAge(patient.birthDate)} years</span>
					</span>
					<span class="meta-item">
						<span class="meta-label">Gender</span>
						<span class="meta-value">{patient.gender}</span>
					</span>
					<span class="meta-item">
						<span class="meta-label">DOB</span>
						<span class="meta-value">{patient.birthDate}</span>
					</span>
					{#if patient.identifier?.find(id => id.system?.includes('philhealth'))}
						<span class="meta-item">
							<span class="meta-label">PH ID</span>
							<span class="meta-value ph-id">{patient.identifier.find(id => id.system?.includes('philhealth')).value}</span>
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Observations Section -->
		{@const observations = resources.filter(r => r.resourceType === 'Observation')}
		{#if observations.length > 0}
			<div class="observations-section">
				<h3>🩺 Vital Signs & Observations ({observations.length})</h3>
				<div class="observations-grid">
					{#each observations as obs}
						<div class="observation-card">
							<div class="observation-header">
								<span class="observation-type">{obs.code?.text || 'Observation'}</span>
								<span class="observation-date">{formatDate(obs.effectiveDateTime || obs.issued)}</span>
							</div>
							<div class="observation-value">
								{#if obs.component}
									<!-- Blood pressure or other component observations -->
									<div class="component-values">
										{#each obs.component as comp}
											<div class="component">
												<span class="comp-name">{comp.code?.text || comp.code?.coding?.[0]?.display || 'Value'}</span>
												<span class="comp-value">{comp.valueQuantity?.value} {comp.valueQuantity?.unit}</span>
											</div>
										{/each}
									</div>
								{:else if obs.valueQuantity}
									<span class="value-large">{obs.valueQuantity.value}</span>
									<span class="unit">{obs.valueQuantity.unit}</span>
								{:else if obs.valueString}
									<span class="value-string">{obs.valueString}</span>
								{:else if obs.valueCodeableConcept}
									<span class="value-string">{obs.valueCodeableConcept.text || obs.valueCodeableConcept.coding?.[0]?.display}</span>
								{:else if obs.valueBoolean !== undefined}
									<span class="value-string">{obs.valueBoolean ? 'Yes' : 'No'}</span>
								{:else if obs.valueInteger !== undefined}
									<span class="value-large">{obs.valueInteger}</span>
								{/if}
							</div>
							{#if obs.note?.[0]?.text}
								<div class="observation-note">{obs.note[0].text}</div>
							{/if}
							{#if obs.code?.coding?.[0]?.code}
								<div class="code-label">
									{obs.code?.coding?.[0]?.system?.includes('loinc') ? 'LOINC' : 'Code'}: {obs.code?.coding?.[0]?.code}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Timeline -->
		<div class="timeline-container">
			<h3>📋 Patient Timeline ({resources.length} records)</h3>
			
			{#if resources.length === 0}
				<div class="empty-timeline">
					<p>No clinical records found for this patient.</p>
				</div>
			{:else}
				<div class="timeline">
					{#each resources as resource}
						<div class="timeline-item">
							<div class="timeline-icon">{getResourceTypeIcon(resource.resourceType)}</div>
							<div class="timeline-content">
								<div class="timeline-header">
									<span class="resource-type">{resource.resourceType}</span>
									<span class="timeline-date">{formatDate(resource.sortDate)}</span>
								</div>
								<div class="timeline-title">{getResourceTitle(resource)}</div>
								{#if getResourceDetails(resource)}
									<div class="timeline-details">{getResourceDetails(resource)}</div>
								{/if}
								{#if resource.code?.coding?.[0]?.code}
									<div class="code-label">
										{resource.code?.coding?.[0]?.system?.includes('snomed') ? 'SNOMED' : resource.code?.coding?.[0]?.system?.includes('loinc') ? 'LOINC' : 'Code'}: {resource.code?.coding?.[0]?.code}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Raw FHIR Toggle -->
		<div class="section-card raw-fhir">
			<details>
				<summary>📄 View Raw Patient FHIR JSON</summary>
				<pre class="json-display">{JSON.stringify(patient, null, 2)}</pre>
			</details>
		</div>
	{/if}
</div>

<style>
	.patient-detail {
		min-height: 100vh;
		background: #F8FAFC;
	}

	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 24px;
		background: white;
		border-bottom: 1px solid #E2E8F0;
		flex-wrap: wrap;
		gap: 8px;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.back-link {
		color: #2563EB;
		text-decoration: none;
		font-size: 14px;
		font-weight: 500;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.logo h1 {
		margin: 0;
		font-size: 16px;
		color: #64748B;
		font-weight: 500;
	}

	/* Loading */
	.loading-state {
		padding: 24px;
	}

	.skeleton-header {
		height: 120px;
		background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 12px;
		margin-bottom: 24px;
	}

	.skeleton-timeline {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.skeleton-item {
		height: 80px;
		background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
		border-radius: 10px;
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	/* Error */
	.error-state {
		padding: 24px;
		background: #FEF2F2;
		border: 1px solid #FECACA;
		border-radius: 12px;
		color: #DC2626;
		margin: 24px;
	}

	.retry-btn {
		margin-top: 12px;
		padding: 10px 20px;
		background: #DC2626;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
	}

	/* Patient Header */
	.patient-header {
		display: flex;
		gap: 20px;
		padding: 24px;
		background: white;
		border-bottom: 1px solid #E2E8F0;
		flex-wrap: wrap;
	}

	.patient-avatar-large {
		font-size: 56px;
		width: 88px;
		height: 88px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #F1F5F9;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.patient-info h2 {
		margin: 0 0 12px 0;
		font-size: 24px;
		color: #1E293B;
	}

	.patient-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.meta-label {
		font-size: 12px;
		color: #64748B;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.meta-value {
		font-size: 15px;
		font-weight: 600;
		color: #1E293B;
	}

	.ph-id {
		font-family: monospace;
		background: #F1F5F9;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 13px;
	}

	/* Timeline */
	.timeline-container {
		padding: 24px;
		max-width: 900px;
		margin: 0 auto;
	}

	.timeline-container h3 {
		margin: 0 0 20px 0;
		font-size: 18px;
		color: #1E293B;
	}

	.empty-timeline {
		text-align: center;
		padding: 40px;
		color: #64748B;
		background: white;
		border-radius: 12px;
		border: 1px solid #E2E8F0;
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 0;
		position: relative;
	}

	.timeline::before {
		content: '';
		position: absolute;
		left: 24px;
		top: 0;
		bottom: 0;
		width: 2px;
		background: #E2E8F0;
	}

	.timeline-item {
		display: flex;
		gap: 16px;
		padding: 16px 0;
		position: relative;
	}

	.timeline-icon {
		width: 48px;
		height: 48px;
		background: white;
		border: 2px solid #E2E8F0;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		flex-shrink: 0;
		z-index: 1;
	}

	.timeline-content {
		flex: 1;
		background: white;
		border: 1px solid #E2E8F0;
		border-radius: 10px;
		padding: 16px;
	}

	.timeline-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
		flex-wrap: wrap;
		gap: 8px;
	}

	.resource-type {
		font-size: 11px;
		font-weight: 600;
		color: #64748B;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: #F1F5F9;
		padding: 2px 8px;
		border-radius: 4px;
	}

	.timeline-date {
		font-size: 12px;
		color: #94A3B8;
	}

	.timeline-title {
		font-size: 15px;
		font-weight: 600;
		color: #1E293B;
		margin-bottom: 4px;
	}

	.timeline-details {
		font-size: 14px;
		color: #475569;
		margin-bottom: 4px;
	}

	.code-label {
		font-size: 11px;
		color: #94A3B8;
		font-family: monospace;
	}

	/* Raw FHIR */
	.raw-fhir {
		padding: 24px;
		max-width: 900px;
		margin: 0 auto 24px;
	}

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

	/* Observations Section */
	.observations-section {
		background: white;
		border-radius: 12px;
		border: 1px solid #E2E8F0;
		padding: 24px;
		margin-bottom: 24px;
	}

	.observations-section h3 {
		font-size: 18px;
		font-weight: 600;
		color: #1E293B;
		margin: 0 0 20px 0;
		padding-bottom: 12px;
		border-bottom: 1px solid #E2E8F0;
	}

	.observations-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 16px;
	}

	@media (max-width: 640px) {
		.observations-grid {
			grid-template-columns: 1fr;
		}
	}

	.observation-card {
		background: #F8FAFC;
		border: 1px solid #E2E8F0;
		border-radius: 10px;
		padding: 16px;
		transition: all 0.2s;
	}

	.observation-card:hover {
		border-color: #CBD5E1;
		background: #F1F5F9;
	}

	.observation-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
		flex-wrap: wrap;
		gap: 8px;
	}

	.observation-type {
		font-size: 14px;
		font-weight: 600;
		color: #1E293B;
	}

	.observation-date {
		font-size: 12px;
		color: #94A3B8;
		white-space: nowrap;
	}

	.observation-value {
		margin-bottom: 8px;
	}

	.value-large {
		font-size: 32px;
		font-weight: 700;
		color: #2563EB;
	}

	.unit {
		font-size: 14px;
		color: #64748B;
		margin-left: 4px;
	}

	.value-string {
		font-size: 18px;
		font-weight: 600;
		color: #374151;
	}

	.component-values {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.component {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: white;
		border-radius: 6px;
	}

	.comp-name {
		font-size: 13px;
		color: #64748B;
	}

	.comp-value {
		font-size: 16px;
		font-weight: 600;
		color: #1E293B;
	}

	.observation-note {
		font-size: 13px;
		color: #64748B;
		font-style: italic;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px dashed #E2E8F0;
	}

	.code-label {
		font-size: 11px;
		color: #94A3B8;
		font-family: monospace;
		margin-top: 8px;
	}
</style>
