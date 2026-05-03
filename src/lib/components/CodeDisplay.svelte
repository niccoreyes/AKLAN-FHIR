<script>
	/**
	 * CodeDisplay Component
	 * 
	 * Displays a FHIR code with its display name from the terminology server.
	 * Uses codeDisplayStore for caching and lookup.
	 * 
	 * Usage:
	 * <CodeDisplay code="8480-6" system="http://loinc.org" />
	 * <CodeDisplay code="38341003" system="http://snomed.info/sct" fallback="Hypertension" />
	 */
	import { onMount } from 'svelte';
	import { getCodeDisplay } from '$stores/codeDisplayStore.js';
	
	// Props
	let { 
		code = '',
		system = '',
		fallback = null,
		showCode = false,
		class: className = ''
	} = $props();
	
	// State
	let displayName = $state('');
	let isLoading = $state(false);
	let hasError = $state(false);
	
	// Load display name when code/system changes
	$effect(() => {
		if (code && system) {
			loadDisplay();
		} else {
			displayName = fallback || code || '';
		}
	});
	
	async function loadDisplay() {
		if (!code || !system) return;
		
		isLoading = true;
		hasError = false;
		
		try {
			const result = await getCodeDisplay(code, system, fallback);
			displayName = result || fallback || code;
		} catch (e) {
			console.error('CodeDisplay lookup error:', e);
			hasError = true;
			displayName = fallback || code;
		} finally {
			isLoading = false;
		}
	}
</script>

<span class="code-display {className}" class:loading={isLoading} class:error={hasError}>
	{#if isLoading}
		<span class="loading-indicator">...</span>
	{:else}
		<span class="display-name">{displayName}</span>
		{#if showCode && displayName !== code}
			<span class="code">({code})</span>
		{/if}
	{/if}
</span>

<style>
	.code-display {
		display: inline;
	}
	
	.loading-indicator {
		opacity: 0.5;
		font-style: italic;
	}
	
	.display-name {
		/* Default styling - can be overridden via class prop */
	}
	
	.code {
		opacity: 0.6;
		font-size: 0.85em;
		margin-left: 0.25em;
	}
	
	.error {
		color: #DC2626;
	}
</style>
