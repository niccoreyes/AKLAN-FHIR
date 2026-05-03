<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { fhirClient } from '$services/fhir-client.js';
	import { APP_NAME, CLINICS } from '$constants';
	import { appStore } from '$stores/appStore.svelte.js';
	import EncounterCard from '$components/EncounterCard.svelte';
	import ObservationCard from '$components/ObservationCard.svelte';

	let patient = $state(null);
	let resources = $state([]);
	let isLoading = $state(true);
	let error = $state('');

	// Get clinic color for theming
	let clinicColor = $derived(CLINICS.find(c => c.id === appStore.clinicId)?.color || '#2563EB');

	// Get patient ID from URL params
	let patientId = $derived($page.params.id);

	// Delete state
	let deletingId = $state(null);
	let deletingType = $state('');
	let deleteError = $state('');

	async function deleteResource(resourceType, resourceId) {
		if (!confirm(`Are you sure you want to delete this ${resourceType.toLowerCase()}?`)) {
			return;
		}

		deletingId = resourceId;
		deletingType = resourceType;
		deleteError = '';

		try {
			await fhirClient.delete(resourceType, resourceId);
			// Refresh the data
			await loadPatientData();
		} catch (e) {
			deleteError = e.message || `Failed to delete ${resourceType.toLowerCase()}`;
			alert(`Error deleting ${resourceType.toLowerCase()}: ` + deleteError);
		} finally {
			deletingId = null;
			deletingType = '';
		}
	}

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
    <button onclick={loadPatientData} class="retry-btn">Retry</button>
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
				<!-- NEW: Patient-Level Quick Actions -->
				<div class="patient-quick-actions">
					<a href="/encounter?patient={patient.id}&returnTo=/patient/{patient.id}" class="quick-action-btn new-encounter">
						➕ New Encounter
					</a>
					<a href="/vitals?patient={patient.id}&returnTo=/patient/{patient.id}" class="quick-action-btn vitals">
						🩺 Record Vitals
					</a>
					<a href="/medication-request?patient={patient.id}&returnTo=/patient/{patient.id}" class="quick-action-btn prescribe">
						💊 Prescribe
					</a>
					<a href="/service-request?patient={patient.id}&returnTo=/patient/{patient.id}" class="quick-action-btn labs">
						🧪 Order Labs
					</a>
				</div>

				<div class="patient-actions-secondary">
					<a href="/patient/edit?id={patient.id}" class="btn-edit-patient">✏️ Edit Patient</a>
					<button 
						type="button" 
						class="btn-delete-patient"
						onclick={() => deleteResource('Patient', patient.id)}
						disabled={deletingId === patient.id && deletingType === 'Patient'}
					>
						{deletingId === patient.id && deletingType === 'Patient' ? '⏳' : '🗑️'} Delete
					</button>
				</div>
			</div>
		</div>

		<!-- Extract resources by type for timeline -->
		{@const encounters = resources.filter(r => r.resourceType === 'Encounter').sort((a, b) => new Date(b.period?.start || 0) - new Date(a.period?.start || 0))}
		{@const observations = resources.filter(r => r.resourceType === 'Observation')}
		{@const medications = resources.filter(r => r.resourceType === 'MedicationRequest')}
		{@const serviceRequests = resources.filter(r => r.resourceType === 'ServiceRequest')}
		{@const diagnosticReports = resources.filter(r => r.resourceType === 'DiagnosticReport')}
		
		<!-- Timeline View: Encounters with linked resources -->
		<div class="patient-timeline">
			<h3 class="timeline-header">📋 Patient Timeline</h3>
			
			{#if encounters.length > 0}
				<div class="encounters-timeline">
					{#each encounters as encounter}
						{@const encounterObservations = observations.filter(obs => obs.encounter?.reference === `Encounter/${encounter.id}`)}
						{@const encounterMedications = medications.filter(med => med.encounter?.reference === `Encounter/${encounter.id}`)}
						{@const encounterServiceRequests = serviceRequests.filter(sr => sr.encounter?.reference === `Encounter/${encounter.id}`)}
						{@const encounterReports = diagnosticReports.filter(rep => rep.encounter?.reference === `Encounter/${encounter.id}`)}
						
						<EncounterCard 
							{encounter}
							observations={encounterObservations}
							medications={encounterMedications}
							serviceRequests={encounterServiceRequests}
							diagnosticReports={encounterReports}
							patientId={patient.id}
							clinicColor={clinicColor}
						/>
					{/each}
				</div>
			{:else}
				<!-- No Encounters - Show option to create one -->
				<div class="no-encounters">
					<p>No visits recorded for this patient.</p>
					<a href="/encounter?patient={patient.id}&returnTo=/patient/{patient.id}" class="btn-primary">
						➕ Record First Visit
					</a>
				</div>
			{/if}
			
			<!-- Unlinked Observations Section -->
			{#if observations.filter(obs => !obs.encounter?.reference).length > 0}
				{@const unlinkedObservations = observations.filter(obs => !obs.encounter?.reference)}
				<div class="unlinked-resources">
					<h4 class="unlinked-header">📊 Standalone Observations ({unlinkedObservations.length})</h4>
					<p class="unlinked-hint">These observations are not linked to any specific encounter</p>
					<div class="unlinked-list">
						{#each unlinkedObservations as obs}
							<ObservationCard observation={obs} />
						{/each}
					</div>
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

	/* NEW: Patient Quick Actions */
	.patient-quick-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin: 16px 0;
		padding: 16px;
		background: #F8FAFC;
		border-radius: 10px;
		border: 1px solid #E2E8F0;
	}

	.quick-action-btn {
		padding: 10px 16px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.quick-action-btn.new-encounter {
		background: #DBEAFE;
		color: #1D4ED8;
	}

	.quick-action-btn.new-encounter:hover {
		background: #BFDBFE;
	}

	.quick-action-btn.vitals {
		background: #DCFCE7;
		color: #166534;
	}

	.quick-action-btn.vitals:hover {
		background: #BBF7D0;
	}

	.quick-action-btn.prescribe {
		background: #FCE7F3;
		color: #BE185D;
	}

	.quick-action-btn.prescribe:hover {
		background: #FBCFE8;
	}

	.quick-action-btn.labs {
		background: #F3E8FF;
		color: #7C3AED;
	}

	.quick-action-btn.labs:hover {
		background: #E9D5FF;
	}

	.patient-actions-secondary {
		display: flex;
		gap: 12px;
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid #E2E8F0;
	}

	/* NEW: Patient Timeline */
	.patient-timeline {
		padding: 20px;
		max-width: 800px;
		margin: 0 auto;
	}

	.timeline-header {
		font-size: 18px;
		font-weight: 700;
		color: #1F2937;
		margin-bottom: 20px;
		padding-bottom: 12px;
		border-bottom: 2px solid #E5E7EB;
	}

	.encounters-timeline {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.no-encounters {
		text-align: center;
		padding: 40px;
		background: #F9FAFB;
		border: 2px dashed #D1D5DB;
		border-radius: 12px;
	}

	.no-encounters p {
		color: #6B7280;
		margin-bottom: 16px;
		font-size: 15px;
	}

	.btn-primary {
		display: inline-block;
		padding: 12px 24px;
		background: #2563EB;
		color: white;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
		transition: background 0.2s;
	}

	.btn-primary:hover {
		background: #1D4ED8;
	}

	/* NEW: Unlinked Resources Section */
	.unlinked-resources {
		margin-top: 32px;
		padding-top: 24px;
		border-top: 2px dashed #E5E7EB;
	}

	.unlinked-header {
		font-size: 16px;
		font-weight: 600;
		color: #4B5563;
		margin-bottom: 8px;
	}

	.unlinked-hint {
		font-size: 13px;
		color: #9CA3AF;
		margin-bottom: 16px;
	}

	.unlinked-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
</style>
