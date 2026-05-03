<script>
	/**
	 * ObservationCard Component
	 * 
	 * Displays a single FHIR Observation with:
	 * - Code display name from terminology server
	 * - Formatted value (Quantity, String, Components, etc.)
	 * - Date/time
	 * - Status
	 * - Notes
	 * 
	 * Usage:
	 * <ObservationCard observation={observationResource} />
	 */
	import CodeDisplay from './CodeDisplay.svelte';
	
	// Props
	let { 
		observation = null
	} = $props();
	
	// Derived values
	let code = $derived(observation?.code?.coding?.[0]?.code || observation?.code?.text || '');
	let system = $derived(observation?.code?.coding?.[0]?.system || '');
	let fallbackDisplay = $derived(observation?.code?.text || '');
	
	// Format the observation value based on type
	function formatValue(obs) {
		if (!obs) return '—';
		
		// Handle component observations (like Blood Pressure)
		if (obs.component && obs.component.length > 0) {
			return obs.component.map(comp => {
				const compCode = comp.code?.coding?.[0]?.code || comp.code?.text || 'Unknown';
				const compValue = comp.valueQuantity ? 
					`${comp.valueQuantity.value} ${comp.valueQuantity.unit || ''}`.trim() :
					comp.valueString || '—';
				return `${compCode}: ${compValue}`;
			}).join(' / ');
		}
		
		// Handle different value types
		if (obs.valueQuantity) {
			const qty = obs.valueQuantity;
			return `${qty.value} ${qty.unit || ''}`.trim();
		}
		
		if (obs.valueString) {
			return obs.valueString;
		}
		
		if (obs.valueBoolean !== undefined) {
			return obs.valueBoolean ? 'Yes' : 'No';
		}
		
		if (obs.valueInteger !== undefined) {
			return obs.valueInteger.toString();
		}
		
		if (obs.valueCodeableConcept) {
			const concept = obs.valueCodeableConcept;
			return concept.text || concept.coding?.[0]?.display || concept.coding?.[0]?.code || '—';
		}
		
		if (obs.valueDateTime) {
			return new Date(obs.valueDateTime).toLocaleString();
		}
		
		if (obs.valueTime) {
			return obs.valueTime;
		}
		
		// Data absent reason
		if (obs.dataAbsentReason) {
			return `Absent: ${obs.dataAbsentReason.text || obs.dataAbsentReason.coding?.[0]?.display || 'Unknown reason'}`;
		}
		
		return '—';
	}
	
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
	
	// Get status color
	function getStatusColor(status) {
		const colors = {
			'final': 'var(--color-success, #10B981)',
			'preliminary': 'var(--color-warning, #F59E0B)',
			'amended': 'var(--color-warning, #F59E0B)',
			'entered-in-error': 'var(--color-error, #EF4444)',
			'registered': 'var(--color-info, #3B82F6)',
			'unknown': 'var(--color-gray, #9CA3AF)'
		};
		return colors[status?.toLowerCase()] || colors['unknown'];
	}
	
	// Get category display
	function getCategory(obs) {
		if (!obs.category || obs.category.length === 0) return null;
		const cat = obs.category[0];
		return cat.text || cat.coding?.[0]?.display || cat.coding?.[0]?.code;
	}
</script>

{#if observation}
	<div class="observation-card">
		<!-- Header: Code and Status -->
		<div class="observation-header">
			<div class="observation-title">
				{#if code && system}
					<CodeDisplay {code} {system} fallback={fallbackDisplay} />
				{:else}
					<span class="code-fallback">{fallbackDisplay || 'Unknown Observation'}</span>
				{/if}
				{#if observation.status}
					<span 
						class="status-badge" 
						style="background-color: {getStatusColor(observation.status)}20; color: {getStatusColor(observation.status)}"
					>
						{observation.status}
					</span>
				{/if}
			</div>
			
			{#if observation.effectiveDateTime || observation.issued}
				<div class="observation-date">
					{formatDate(observation.effectiveDateTime || observation.issued)}
				</div>
			{/if}
		</div>
		
		<!-- Value -->
		<div class="observation-value">
			{formatValue(observation)}
		</div>
		
		<!-- Category (if available) -->
		{#if getCategory(observation)}
			<div class="observation-category">
				Category: {getCategory(observation)}
			</div>
		{/if}
		
		<!-- Notes (if available) -->
		{#if observation.note && observation.note.length > 0}
			<div class="observation-notes">
				<strong>Notes:</strong>
				{#each observation.note as note}
					<p>{note.text}</p>
				{/each}
			</div>
		{/if}
		
		<!-- Performer (if available) -->
		{#if observation.performer && observation.performer.length > 0}
			<div class="observation-performer">
				<strong>Recorded by:</strong> 
				{observation.performer.map(p => p.display || p.reference).join(', ')}
			</div>
		{/if}
	</div>
{/if}

<style>
	.observation-card {
		background: white;
		border: 1px solid #E5E7EB;
		border-radius: 8px;
		padding: 12px;
		margin-bottom: 8px;
	}
	
	.observation-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 8px;
		gap: 8px;
	}
	
	.observation-title {
		font-weight: 600;
		color: #111827;
		font-size: 14px;
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	
	.code-fallback {
		color: #6B7280;
		font-style: italic;
	}
	
	.status-badge {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 2px 6px;
		border-radius: 4px;
		white-space: nowrap;
	}
	
	.observation-date {
		font-size: 12px;
		color: #6B7280;
		white-space: nowrap;
	}
	
	.observation-value {
		font-size: 18px;
		font-weight: 700;
		color: #1F2937;
		margin: 8px 0;
	}
	
	.observation-category {
		font-size: 12px;
		color: #6B7280;
		font-style: italic;
		margin-bottom: 8px;
	}
	
	.observation-notes {
		font-size: 13px;
		color: #4B5563;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px dashed #E5E7EB;
	}
	
	.observation-notes p {
		margin: 4px 0 0 0;
		font-style: italic;
	}
	
	.observation-performer {
		font-size: 12px;
		color: #6B7280;
		margin-top: 8px;
	}
	
	.observation-performer strong {
		color: #374151;
	}
</style>
