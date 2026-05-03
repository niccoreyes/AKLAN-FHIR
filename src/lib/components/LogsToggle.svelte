<script>
	import { fhirLogger } from '$stores/fhirLogger.js';

	// Props for customization
	let { class: className = '' } = $props();

	// Logs toggle state from store
	let isLogsEnabled = $state(false);
	
	$effect(() => {
		const unsubscribe = fhirLogger.subscribe(state => {
			isLogsEnabled = state.isEnabled;
		});
		return unsubscribe;
	});

	function toggleLogs() {
		fhirLogger.toggle();
	}
</script>

<button 
	class="logs-toggle {className}" 
	class:active={isLogsEnabled} 
	onclick={toggleLogs} 
	title="Toggle FHIR API logging"
>
	<span class="logs-toggle-icon">📡</span>
	<span class="logs-toggle-label">Logs</span>
	<span class="logs-toggle-indicator" class:on={isLogsEnabled}></span>
</button>

<style>
	.logs-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border: 1px solid #CBD5E1;
		border-radius: 20px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 12px;
	}

	.logs-toggle:hover {
		background: #F8FAFC;
		border-color: #94A3B8;
	}

	.logs-toggle.active {
		background: #EFF6FF;
		border-color: #3B82F6;
	}

	.logs-toggle-icon {
		font-size: 14px;
	}

	.logs-toggle-label {
		font-weight: 500;
		color: #64748B;
	}

	.logs-toggle.active .logs-toggle-label {
		color: #2563EB;
	}

	.logs-toggle-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #CBD5E1;
		transition: background 0.2s;
	}

	.logs-toggle-indicator.on {
		background: #10B981;
		box-shadow: 0 0 6px #10B981;
	}

	@media (max-width: 768px) {
		.logs-toggle-label {
			display: none;
		}
	}
</style>
