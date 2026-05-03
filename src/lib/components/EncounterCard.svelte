<script>
	/**
	 * EncounterCard Component
	 * 
	 * Displays a FHIR Encounter with:
	 * - Header: Type, status, date, reason, location, provider
	 * - Expandable observations section
	 * - Action buttons for vitals, prescribe, order labs
	 * - Linked resources (medications, service requests, diagnostic reports)
	 * 
	 * Usage:
	 * <EncounterCard 
	 *   encounter={encounterResource}
	 *   observations={linkedObservations}
	 *   medications={linkedMedications}
	 *   serviceRequests={linkedServiceRequests}
	 *   diagnosticReports={linkedDiagnosticReports}
	 *   patientId="patient-id"
	 *   clinicColor="#2563EB"
	 * />
	 */
	import { appStore } from '$stores/appStore.svelte.js';
	import { fhirClient } from '$services/fhir-client.js';
	import CodeDisplay from './CodeDisplay.svelte';
	import ObservationCard from './ObservationCard.svelte';

	// Props
	let {
		encounter = null,
		observations = [],
		medications = [],
		serviceRequests = [],
		diagnosticReports = [],
		patientId = '',
		clinicColor = '#2563EB',
		onDelete = null // Callback after successful delete
	} = $props();
	
	// State
	let isExpanded = $state(false);
	
	// Derived values
	let encounterId = $derived(encounter?.id || '');
	let encounterType = $derived(encounter?.type?.[0]?.coding?.[0] || null);
	let encounterTypeCode = $derived(encounterType?.code || '');
	let encounterTypeSystem = $derived(encounterType?.system || 'http://snomed.info/sct');
	let encounterTypeFallback = $derived(encounter?.type?.[0]?.text || 'Visit');
	
	let reasonCode = $derived(encounter?.reasonCode?.[0] || null);
	let reasonCodeCoding = $derived(reasonCode?.coding?.[0] || null);
	
	let location = $derived(encounter?.location?.[0]?.location || null);
	let participant = $derived(encounter?.participant?.[0]?.individual || null);
	
	// Format date
	function formatDate(dateString) {
		if (!dateString) return '';
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		} catch (e) {
			return dateString;
		}
	}
	
	// Format duration
	function formatDuration(start, end) {
		if (!start) return '';
		if (!end) return 'In progress';
		
		try {
			const startDate = new Date(start);
			const endDate = new Date(end);
			const diffMs = endDate - startDate;
			const diffMins = Math.round(diffMs / 60000);
			
			if (diffMins < 60) {
				return `${diffMins} min`;
			} else {
				const hours = Math.floor(diffMins / 60);
				const mins = diffMins % 60;
				return `${hours}h ${mins}m`;
			}
		} catch (e) {
			return '';
		}
	}
	
	// Get status color
	function getStatusColor(status) {
		const colors = {
			'in-progress': '#3B82F6',
			'finished': '#10B981',
			'planned': '#F59E0B',
			'arrived': '#8B5CF6',
			'triaged': '#EC4899',
			'onleave': '#F97316',
			'cancelled': '#EF4444',
			'entered-in-error': '#6B7280',
			'unknown': '#9CA3AF'
		};
		return colors[status?.toLowerCase()] || colors['unknown'];
	}
	
	// Get status label
	function getStatusLabel(status) {
		const labels = {
			'in-progress': 'In Progress',
			'finished': 'Finished',
			'planned': 'Planned',
			'arrived': 'Arrived',
			'triaged': 'Triaged',
			'onleave': 'On Leave',
			'cancelled': 'Cancelled',
			'entered-in-error': 'Error',
			'unknown': 'Unknown'
		};
		return labels[status?.toLowerCase()] || status;
	}
	
	// Build URLs with workshop context preservation
	function buildUrl(basePath, params = {}) {
		const url = new URL(basePath, window.location.origin);
		
		// Add patient and encounter
		if (patientId) url.searchParams.set('patient', patientId);
		if (encounterId) url.searchParams.set('encounter', encounterId);
		
		// Add workshop context from appStore
		if (appStore.workshopCode) url.searchParams.set('w', appStore.workshopCode);
		if (appStore.userName) url.searchParams.set('u', appStore.userName);
		if (appStore.clinicId) url.searchParams.set('c', appStore.clinicId);
		if (appStore.roleId) url.searchParams.set('r', appStore.roleId);
		
		// Add return URL
		if (typeof window !== 'undefined') {
			url.searchParams.set('returnTo', window.location.pathname + window.location.search);
		}
		
		// Add any additional params
		Object.entries(params).forEach(([key, value]) => {
			if (value) url.searchParams.set(key, value);
		});
		
		return url.pathname + url.search;
	}
	
	// Toggle expand
	function toggleExpand() {
		isExpanded = !isExpanded;
	}
</script>

{#if encounter}
	<div class="encounter-card" style="--clinic-color: {clinicColor}">
		<!-- Header Section (Always Visible) -->
		<button class="encounter-header" onclick={toggleExpand} type="button">
			<div class="encounter-main-info">
				<div class="encounter-type-row">
					{#if encounterTypeCode && encounterTypeSystem}
						<CodeDisplay 
							code={encounterTypeCode} 
							system={encounterTypeSystem} 
							fallback={encounterTypeFallback}
							class="encounter-type-display"
						/>
					{:else}
						<span class="encounter-type-text">{encounterTypeFallback}</span>
					{/if}
					
					{#if encounter.status}
						<span 
							class="status-badge" 
							style="background-color: {getStatusColor(encounter.status)}20; color: {getStatusColor(encounter.status)}; border-color: {getStatusColor(encounter.status)}40"
						>
							{getStatusLabel(encounter.status)}
						</span>
					{/if}
				</div>
				
				<div class="encounter-date-row">
					<span class="date">{formatDate(encounter.period?.start)}</span>
					{#if encounter.period?.start}
						<span class="duration">({formatDuration(encounter.period.start, encounter.period.end)})</span>
					{/if}
				</div>
				
				<!-- Reason for Visit -->
				{#if reasonCode}
					<div class="encounter-reason">
						{#if reasonCodeCoding}
							<CodeDisplay 
								code={reasonCodeCoding.code} 
								system={reasonCodeCoding.system || 'http://snomed.info/sct'} 
								fallback={reasonCode.text}
							/>
						{:else}
							<span>{reasonCode.text || 'No reason specified'}</span>
						{/if}
					</div>
				{/if}
				
				<!-- Location & Provider -->
				<div class="encounter-context">
					{#if location}
						<span class="location">📍 {location.display || location.reference}</span>
					{/if}
					{#if participant}
						<span class="provider">👤 {participant.display || participant.reference}</span>
					{/if}
				</div>
			</div>
			
			<div class="expand-icon" class:expanded={isExpanded}>
				{isExpanded ? '▼' : '▶'}
			</div>
		</button>
		
		<!-- Expanded Content -->
		{#if isExpanded}
			<div class="encounter-expanded">
				<!-- Action Buttons -->
				<div class="encounter-actions">
					<a href={buildUrl('/vitals')} class="action-btn vitals">
						🩺 Record Vitals
					</a>
					<a href={buildUrl('/medication-request')} class="action-btn prescribe">
						💊 Prescribe
					</a>
					<a href={buildUrl('/service-request')} class="action-btn labs">
						🧪 Order Labs
					</a>
					<a href="/encounter/edit?id={encounterId}" class="action-btn edit">
						📝 Edit
					</a>
				</div>
				
				<!-- Observations Section -->
				{#if observations.length > 0}
					<div class="resources-section">
						<div class="section-header">
							<span class="section-icon">📊</span>
							<span class="section-title">Observations ({observations.length})</span>
						</div>
						<div class="observations-list">
							{#each observations as obs}
								<ObservationCard observation={obs} />
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Medications Section -->
				{#if medications.length > 0}
					<div class="resources-section">
						<div class="section-header">
							<span class="section-icon">💊</span>
							<span class="section-title">Medications ({medications.length})</span>
						</div>
						<div class="resource-list">
							{#each medications as med}
								<div class="resource-item">
									{med.medicationCodeableConcept?.text || med.medicationCodeableConcept?.coding?.[0]?.display || 'Prescription'}
								</div>
								{/each}
						</div>
					</div>
				{/if}
				
				<!-- Service Requests Section -->
				{#if serviceRequests.length > 0}
					<div class="resources-section">
						<div class="section-header">
							<span class="section-icon">🧪</span>
							<span class="section-title">Lab Orders ({serviceRequests.length})</span>
						</div>
						<div class="resource-list">
							{#each serviceRequests as req}
								<div class="resource-item">
									{req.code?.text || req.code?.coding?.[0]?.display || 'Lab Order'}
									<span class="resource-status">{req.status}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Diagnostic Reports Section -->
				{#if diagnosticReports.length > 0}
					<div class="resources-section">
						<div class="section-header">
							<span class="section-icon">📄</span>
							<span class="section-title">Lab Reports ({diagnosticReports.length})</span>
						</div>
						<div class="resource-list">
							{#each diagnosticReports as report}
								<div class="resource-item">
									{report.code?.text || report.code?.coding?.[0]?.display || 'Lab Report'}
								</div>
							{/each}
						</div>
					</div>
				{/if}
				
				<!-- Empty State -->
				{#if observations.length === 0 && medications.length === 0 && serviceRequests.length === 0 && diagnosticReports.length === 0}
					<div class="empty-encounter">
						<p>No observations or resources recorded for this encounter.</p>
						<p>Use the buttons above to add vitals, prescriptions, or lab orders.</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.encounter-card {
		background: white;
		border: 1px solid #E5E7EB;
		border-radius: 12px;
		overflow: hidden;
		margin-bottom: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	
	.encounter-header {
		width: 100%;
		padding: 16px;
		background: linear-gradient(135deg, color-mix(in srgb, var(--clinic-color) 8%, white) 0%, white 100%);
		border: none;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		text-align: left;
		transition: background 0.2s;
	}
	
	.encounter-header:hover {
		background: linear-gradient(135deg, color-mix(in srgb, var(--clinic-color) 12%, white) 0%, white 100%);
	}
	
	.encounter-main-info {
		flex: 1;
	}
	
	.encounter-type-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 6px;
		flex-wrap: wrap;
	}
	
	:global(.encounter-type-display) {
		font-size: 16px;
		font-weight: 700;
		color: #111827;
	}
	
	.encounter-type-text {
		font-size: 16px;
		font-weight: 700;
		color: #111827;
	}
	
	.status-badge {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 3px 8px;
		border-radius: 12px;
		border: 1px solid;
		white-space: nowrap;
	}
	
	.encounter-date-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: #6B7280;
		margin-bottom: 8px;
	}
	
	.date {
		font-weight: 500;
	}
	
	.duration {
		opacity: 0.8;
	}
	
	.encounter-reason {
		font-size: 14px;
		color: #374151;
		margin-bottom: 8px;
		font-weight: 500;
	}
	
	.encounter-context {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		font-size: 12px;
		color: #6B7280;
	}
	
	.location, .provider {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	
	.expand-icon {
		font-size: 14px;
		color: #9CA3AF;
		padding: 4px;
		transition: transform 0.2s;
	}
	
	.expand-icon.expanded {
		transform: rotate(0deg);
	}
	
	.encounter-expanded {
		padding: 16px;
		border-top: 1px solid #E5E7EB;
		background: #FAFAFA;
	}
	
	.encounter-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 20px;
	}
	
	.action-btn {
		padding: 8px 14px;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s;
		white-space: nowrap;
	}
	
	.action-btn.vitals {
		background: #DBEAFE;
		color: #1D4ED8;
	}
	
	.action-btn.vitals:hover {
		background: #BFDBFE;
	}
	
	.action-btn.prescribe {
		background: #FCE7F3;
		color: #BE185D;
	}
	
	.action-btn.prescribe:hover {
		background: #FBCFE8;
	}
	
	.action-btn.labs {
		background: #F3E8FF;
		color: #7C3AED;
	}
	
	.action-btn.labs:hover {
		background: #E9D5FF;
	}
	
	.action-btn.edit {
		background: #F3F4F6;
		color: #4B5563;
		margin-left: auto;
	}
	
	.action-btn.edit:hover {
		background: #E5E7EB;
	}
	
	.resources-section {
		margin-bottom: 20px;
	}
	
	.section-header {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 600;
		color: #374151;
		margin-bottom: 10px;
		padding-bottom: 8px;
		border-bottom: 1px solid #E5E7EB;
	}
	
	.section-icon {
		font-size: 14px;
	}
	
	.observations-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.resource-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	
	.resource-item {
		padding: 10px 12px;
		background: white;
		border: 1px solid #E5E7EB;
		border-radius: 6px;
		font-size: 13px;
		color: #374151;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.resource-status {
		font-size: 11px;
		padding: 2px 6px;
		background: #F3F4F6;
		border-radius: 4px;
		color: #6B7280;
		text-transform: capitalize;
	}
	
	.empty-encounter {
		text-align: center;
		padding: 24px;
		color: #6B7280;
	}
	
	.empty-encounter p {
		margin: 0 0 8px 0;
		font-size: 14px;
	}
	
	.empty-encounter p:last-child {
		font-size: 13px;
		color: #9CA3AF;
	}
</style>
