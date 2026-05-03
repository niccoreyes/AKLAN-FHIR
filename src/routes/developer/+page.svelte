<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { fhirClient } from '$services/fhir-client.js';
	import { FHIR_CONFIG } from '$constants';
	import AppHeader from '$components/AppHeader.svelte';

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

<svelte:head>
	<title>Technical Dashboard | OpenHIE Mock EHR</title>
</svelte:head>

<div class="developer-page">
	<AppHeader active="developer" />

	<div class="content-area">
		<div class="page-title">
			<h2>🔧 Developer Mode</h2>
			<p>Test FHIR API calls directly against the public FHIR server</p>
		</div>

		<div class="panels-container">
			<!-- Request Builder -->
			<div class="panel">
				<h3>Request Builder</h3>
				
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
						<button class="format-btn" onclick={() => requestBody = prettifyJSON(requestBody)}>
							Format JSON
						</button>
					</div>
				{/if}

				<!-- Sample Requests -->
				<div class="samples">
					<span class="samples-label">Quick Samples:</span>
					<button class="sample-btn" onclick={() => loadSample('searchPatient')}>Search Patient</button>
					<button class="sample-btn" onclick={() => loadSample('createPatient')}>Create Patient</button>
					<button class="sample-btn" onclick={() => loadSample('terminologyLookup')}>Terminology Lookup</button>
				</div>

				<!-- Send Button -->
				<button 
					class="send-btn"
					onclick={executeRequest}
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
				<div class="panel">
					<h3>Response</h3>
					<div class="response-meta">
						<span class="status-badge status-{Math.floor(response.status / 100)}xx">
							{response.status} {response.statusText}
						</span>
						<span class="duration">⏱️ {response.duration}ms</span>
						<span class="timestamp">{new Date(response.timestamp).toLocaleTimeString()}</span>
					</div>
					
					<pre class="json-display">{JSON.stringify(response.data, null, 2)}</pre>
				</div>
			{/if}

			<!-- History -->
			{#if history.length > 0}
				<div class="panel">
					<h3>Recent Requests</h3>
					<div class="history-list">
						{#each history as item}
							<div class="history-item">
								<span class="history-method">{item.method}</span>
								<span class="history-url">{item.url}</span>
								<span class="history-status status-{Math.floor(item.status / 100)}xx">{item.status}</span>
								<span class="history-duration">{item.duration}ms</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.developer-page {
		min-height: 100vh;
		background: #F8FAFC;
	}

	.content-area {
		padding: 24px;
		max-width: 1000px;
		margin: 0 auto;
	}

	.page-title {
		margin-bottom: 24px;
	}

	.page-title h2 {
		margin: 0 0 4px 0;
		font-size: 20px;
		color: #1E293B;
	}

	.page-title p {
		margin: 0;
		font-size: 14px;
		color: #64748B;
	}

	.panels-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.panel {
		background: white;
		border: 1px solid #E2E8F0;
		border-radius: 12px;
		padding: 20px;
	}

	.panel h3 {
		margin: 0 0 16px 0;
		font-size: 14px;
		font-weight: 600;
		color: #475569;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.form-row {
		display: flex;
		gap: 10px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}

	.method-select {
		padding: 10px 16px;
		background: #F8FAFC;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		color: #1E293B;
		font-family: monospace;
		font-size: 14px;
		font-weight: 600;
	}

	.resource-select {
		padding: 10px 16px;
		background: white;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		color: #1E293B;
		flex: 1;
		font-size: 14px;
	}

	.id-input,
	.full-width-input {
		padding: 10px 16px;
		background: white;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		color: #1E293B;
		font-family: monospace;
		font-size: 14px;
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
		font-size: 13px;
		font-weight: 500;
		color: #475569;
	}

	.json-input {
		width: 100%;
		padding: 12px;
		background: #F8FAFC;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		color: #1E293B;
		font-family: monospace;
		font-size: 13px;
		resize: vertical;
	}

	.format-btn {
		margin-top: 8px;
		padding: 6px 12px;
		background: #F1F5F9;
		border: 1px solid #E2E8F0;
		border-radius: 6px;
		color: #475569;
		font-size: 12px;
		cursor: pointer;
		font-weight: 500;
	}

	.format-btn:hover {
		background: #E2E8F0;
	}

	.samples {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: 16px;
	}

	.samples-label {
		font-size: 13px;
		color: #64748B;
		font-weight: 500;
	}

	.sample-btn {
		padding: 6px 12px;
		background: #F8FAFC;
		border: 1px solid #E2E8F0;
		border-radius: 6px;
		color: #475569;
		font-size: 12px;
		cursor: pointer;
		font-weight: 500;
	}

	.sample-btn:hover {
		background: #EFF6FF;
		border-color: #2563EB;
		color: #2563EB;
	}

	.send-btn {
		width: 100%;
		padding: 14px 24px;
		background: #2563EB;
		border: none;
		border-radius: 8px;
		color: white;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
	}

	.send-btn:hover:not(:disabled) {
		background: #1D4ED8;
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
		background: #FEF2F2;
		border: 1px solid #FECACA;
		border-radius: 8px;
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
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 700;
	}

	.status-2xx {
		background: #DCFCE7;
		color: #166534;
	}

	.status-4xx {
		background: #FEF2F2;
		color: #DC2626;
	}

	.status-5xx {
		background: #FEF2F2;
		color: #991B1B;
	}

	.duration,
	.timestamp {
		font-size: 12px;
		color: #94A3B8;
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
		font-family: monospace;
		white-space: pre-wrap;
		word-break: break-all;
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.history-item {
		display: flex;
		gap: 10px;
		align-items: center;
		padding: 10px;
		background: #F8FAFC;
		border-radius: 8px;
		font-size: 13px;
		font-family: monospace;
	}

	.history-method {
		color: #2563EB;
		font-weight: 700;
		min-width: 50px;
	}

	.history-url {
		flex: 1;
		color: #1E293B;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.history-status {
		font-weight: 700;
	}

	.history-duration {
		color: #94A3B8;
		font-size: 11px;
	}
</style>
