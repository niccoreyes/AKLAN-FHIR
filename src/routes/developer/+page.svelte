<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { appStore } from '$stores/appStore.svelte.js';
	import { terminologyStore } from '$stores/terminologyStore.svelte.js';
	import { fhirClient } from '$services/fhir-client.js';
	import { FHIR_CONFIG } from '$constants';

	// Redirect if not configured
	onMount(() => {
		if (browser && !appStore.isConfigured) {
			goto('/');
		}
	});

	// Form state
	let method = $state('GET');
	let resourceType = $state('Patient');
	let resourceId = $state('');
	let searchParams = $state('name=test');
	let requestBody = $state('');
	let response = $state(null);
	let isLoading = $state(false);
	let error = $state('');
	let history = $state([]);

	// Prettify JSON
	function prettifyJSON(json) {
		try {
			return JSON.stringify(JSON.parse(json), null, 2);
		} catch (e) {
			return json;
		}
	}

	// Execute request
	async function executeRequest() {
		isLoading = true;
		error = '';
		response = null;

		const startTime = performance.now();
		
		try {
			let url = `${FHIR_CONFIG.shrBaseUrl}/${resourceType}`;
			if (resourceId) {
				url += `/${resourceId}`;
			} else if (method === 'GET' && searchParams) {
				url += `?${searchParams}`;
			}

			const options = {
				method,
				headers: {
					'Accept': 'application/fhir+json'
				}
			};

			if ((method === 'POST' || method === 'PUT') && requestBody) {
				options.headers['Content-Type'] = 'application/fhir+json';
				options.body = requestBody;
			}

			const res = await fetch(url, options);
			const duration = Math.round(performance.now() - startTime);
			
			let data;
			const contentType = res.headers.get('content-type');
			if (contentType && contentType.includes('json')) {
				data = await res.json();
			} else {
				data = await res.text();
			}

			response = {
				status: res.status,
				statusText: res.statusText,
				headers: Object.fromEntries(res.headers.entries()),
				data,
				duration,
				timestamp: new Date().toISOString()
			};

			// Add to history
			history = [{
				method,
				url: url.replace(FHIR_CONFIG.shrBaseUrl, ''),
				status: res.status,
				duration,
				timestamp: response.timestamp
			}, ...history].slice(0, 10);

		} catch (err) {
			error = err.message;
		} finally {
			isLoading = false;
		}
	}

	// Load a sample request
	function loadSample(type) {
		if (type === 'searchPatient') {
			method = 'GET';
			resourceType = 'Patient';
			resourceId = '';
			searchParams = 'name=Santos';
			requestBody = '';
		} else if (type === 'createPatient') {
			method = 'POST';
			resourceType = 'Patient';
			resourceId = '';
			searchParams = '';
			requestBody = JSON.stringify({
				resourceType: 'Patient',
				name: [{ family: 'Santos', given: ['Maria'] }],
				gender: 'female',
				birthDate: '1980-03-15'
			}, null, 2);
		} else if (type === 'terminologyLookup') {
			method = 'GET';
			resourceType = 'CodeSystem';
			resourceId = '';
			searchParams = '$lookup?system=http://loinc.org&code=85354-9';
			requestBody = '';
		}
	}
</script>

{#if appStore.isConfigured}
	<div class="developer-page">
		<header class="dev-header">
			<h1>🔧 Developer Mode</h1>
			<p>Test FHIR API calls directly</p>
			<button class="back-button" on:click={() => appStore.toggleView()}>
				← Back to Clinical View
			</button>
		</header>

		<div class="dev-content">
			<!-- Request Builder -->
			<div class="request-panel">
				<h2>Request Builder</h2>
				
				<!-- Method & Resource -->
				<div class="form-row">
					<select bind:value={method} class="method-select">
						<option value="GET">GET</option>
						<option value="POST">POST</option>
						<option value="PUT">PUT</option>
						<option value="DELETE">DELETE</option>
					</select>
					
					<select bind:value={resourceType} class="resource-select">
						<option value="Patient">Patient</option>
						<option value="Encounter">Encounter</option>
						<option value="Observation">Observation</option>
						<option value="Condition">Condition</option>
						<option value="MedicationRequest">MedicationRequest</option>
						<option value="Practitioner">Practitioner</option>
						<option value="CodeSystem">CodeSystem</option>
						<option value="ValueSet">ValueSet</option>
					</select>
					
					<input
						type="text"
						bind:value={resourceId}
						placeholder="ID (optional)"
						class="id-input"
					/>
				</div>

				<!-- Search Params (for GET) -->
				{#if method === 'GET' && !resourceId}
					<div class="form-group">
						<label>Query Parameters</label>
						<input
							type="text"
							bind:value={searchParams}
							placeholder="name=Santos&_count=10"
							class="full-width-input"
						/>
					</div>
				{/if}

				<!-- Request Body (for POST/PUT) -->
				{#if method === 'POST' || method === 'PUT'}
					<div class="form-group">
						<label>Request Body (JSON)</label>
						<textarea
							bind:value={requestBody}
							placeholder="Enter FHIR JSON here..."
							class="json-input"
							rows="10"
						></textarea>
						<button class="format-btn" on:click={() => requestBody = prettifyJSON(requestBody)}>
							Format JSON
						</button>
					</div>
				{/if}

				<!-- Sample Requests -->
				<div class="samples">
					<label>Quick Samples:</label>
					<button class="sample-btn" on:click={() => loadSample('searchPatient')}>
						Search Patient
					</button>
					<button class="sample-btn" on:click={() => loadSample('createPatient')}>
						Create Patient
					</button>
					<button class="sample-btn" on:click={() => loadSample('terminologyLookup')}>
						Terminology Lookup
					</button>
				</div>

				<!-- Send Button -->
				<button 
					class="send-btn"
					on:click={executeRequest}
					disabled={isLoading}
				>
					{#if isLoading}
						<span class="spinner">⟳</span> Sending...
					{:else}
						Send Request
					{/if}
				</button>

				{#if error}
					<div class="error-message">
						❌ {error}
					</div>
				{/if}
			</div>

			<!-- Response Panel -->
			{#if response}
				<div class="response-panel">
					<h2>Response</h2>
					<div class="response-meta">
						<span class="status-badge status-{Math.floor(response.status / 100)}xx">
							{response.status} {response.statusText}
						</span>
						<span class="duration">⏱️ {response.duration}ms</span>
						<span class="timestamp">{new Date(response.timestamp).toLocaleTimeString()}</span>
					</div>
					
					<pre class="response-body">{JSON.stringify(response.data, null, 2)}</pre>
				</div>
			{/if}

			<!-- History -->
			{#if history.length > 0}
				<div class="history-panel">
					<h2>Recent Requests</h2>
					{#each history as item}
						<div class="history-item">
							<span class="history-method">{item.method}</span>
							<span class="history-url">{item.url}</span>
							<span class="history-status status-{Math.floor(item.status / 100)}xx">
								{item.status}
							</span>
							<span class="history-duration">{item.duration}ms</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="loading">
		<p>Redirecting to setup...</p>
	</div>
{/if}

<style>
	.developer-page {
		min-height: 100vh;
		background: #1F2937;
		color: #F9FAFB;
	}

	.dev-header {
		padding: 16px;
		background: #111827;
		border-bottom: 1px solid #374151;
	}

	.dev-header h1 {
		margin: 0 0 4px 0;
		font-size: 20px;
	}

	.dev-header p {
		margin: 0;
		font-size: 14px;
		color: #9CA3AF;
	}

	.back-button {
		margin-top: 12px;
		padding: 8px 16px;
		background: #374151;
		border: none;
		border-radius: 6px;
		color: white;
		cursor: pointer;
		font-size: 14px;
	}

	.dev-content {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.request-panel,
	.response-panel,
	.history-panel {
		background: #111827;
		border-radius: 8px;
		padding: 16px;
	}

	.request-panel h2,
	.response-panel h2,
	.history-panel h2 {
		margin: 0 0 16px 0;
		font-size: 16px;
	}

	.form-row {
		display: flex;
		gap: 8px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}

	.method-select {
		padding: 10px 16px;
		background: #374151;
		border: 1px solid #4B5563;
		border-radius: 6px;
		color: white;
		font-family: monospace;
	}

	.resource-select {
		padding: 10px 16px;
		background: #374151;
		border: 1px solid #4B5563;
		border-radius: 6px;
		color: white;
		flex: 1;
	}

	.id-input,
	.full-width-input {
		padding: 10px 16px;
		background: #374151;
		border: 1px solid #4B5563;
		border-radius: 6px;
		color: white;
		font-family: monospace;
	}

	.id-input {
		width: 150px;
	}

	.full-width-input {
		width: 100%;
	}

	.form-group {
		margin-bottom: 16px;
	}

	.form-group label {
		display: block;
		margin-bottom: 6px;
		font-size: 14px;
		color: #9CA3AF;
	}

	.json-input {
		width: 100%;
		padding: 12px;
		background: #1F2937;
		border: 1px solid #4B5563;
		border-radius: 6px;
		color: #E5E7EB;
		font-family: monospace;
		font-size: 13px;
		resize: vertical;
	}

	.format-btn {
		margin-top: 8px;
		padding: 6px 12px;
		background: #4B5563;
		border: none;
		border-radius: 4px;
		color: white;
		font-size: 12px;
		cursor: pointer;
	}

	.samples {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 16px;
	}

	.samples label {
		font-size: 14px;
		color: #9CA3AF;
	}

	.sample-btn {
		padding: 6px 12px;
		background: #374151;
		border: 1px solid #4B5563;
		border-radius: 4px;
		color: white;
		font-size: 12px;
		cursor: pointer;
	}

	.sample-btn:hover {
		background: #4B5563;
	}

	.send-btn {
		width: 100%;
		padding: 14px 24px;
		background: #059669;
		border: none;
		border-radius: 6px;
		color: white;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.send-btn:hover:not(:disabled) {
		background: #047857;
	}

	.send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.error-message {
		margin-top: 12px;
		padding: 12px;
		background: #FEE2E2;
		border: 1px solid #FECACA;
		border-radius: 6px;
		color: #DC2626;
		font-size: 14px;
	}

	.response-meta {
		display: flex;
		gap: 12px;
		align-items: center;
		margin-bottom: 12px;
		flex-wrap: wrap;
	}

	.status-badge {
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 600;
	}

	.status-2xx {
		background: #D1FAE5;
		color: #047857;
	}

	.status-4xx {
		background: #FEE2E2;
		color: #DC2626;
	}

	.status-5xx {
		background: #FEE2E2;
		color: #B91C1C;
	}

	.duration,
	.timestamp {
		font-size: 12px;
		color: #9CA3AF;
	}

	.response-body {
		background: #1F2937;
		border: 1px solid #374151;
		border-radius: 6px;
		padding: 12px;
		font-family: monospace;
		font-size: 12px;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-all;
		color: #E5E7EB;
		max-height: 400px;
		overflow-y: auto;
	}

	.history-item {
		display: flex;
		gap: 8px;
		align-items: center;
		padding: 8px;
		background: #1F2937;
		border-radius: 4px;
		margin-bottom: 4px;
		font-size: 13px;
		font-family: monospace;
	}

	.history-method {
		color: #10B981;
		font-weight: 600;
		min-width: 50px;
	}

	.history-url {
		flex: 1;
		color: #E5E7EB;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.history-status {
		font-weight: 600;
	}

	.history-duration {
		color: #9CA3AF;
		font-size: 11px;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		background: #1F2937;
		color: #9CA3AF;
	}
</style>
