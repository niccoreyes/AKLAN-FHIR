<script>
	import { fhirLogger, formatJson, formatTimestamp, getStatusColor, getMethodColor } from '$stores/fhirLogger.js';

	let selectedTransaction = $state(null);
	let activeTab = $state('request');

	// Subscribe to store
	let transactions = $state([]);
	let isEnabled = $state(false);
	
	$effect(() => {
		const unsubscribe = fhirLogger.subscribe(state => {
			transactions = state.transactions;
			isEnabled = state.isEnabled;
			selectedTransaction = state.selectedTransaction;
		});
		return unsubscribe;
	});

	function selectTransaction(id) {
		fhirLogger.selectTransaction(id);
	}

	function clearLogs() {
		fhirLogger.clear();
		activeTab = 'request';
	}

	function formatBody(body, compact = false) {
		if (!body) return '// No body';
		if (typeof body === 'string') return body;
		return formatJson(body, compact);
	}

	function getStatusText(status) {
		if (!status) return 'Pending';
		if (status >= 200 && status < 300) return 'Success';
		if (status >= 300 && status < 400) return 'Redirect';
		if (status >= 400) return 'Error';
		return 'Unknown';
	}

	function copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(() => {
			// Could show a toast here
		});
	}

	// Derive URL parts for display
	function getUrlParts(url) {
		if (!url) return { path: '', query: '' };
		const qIndex = url.indexOf('?');
		if (qIndex === -1) return { path: url, query: '' };
		return {
			path: url.substring(0, qIndex),
			query: url.substring(qIndex + 1)
		};
	}
</script>

<div class="logs-panel">
	<!-- Panel Header -->
	<div class="panel-header">
		<div class="header-title">
			<span class="header-icon">📡</span>
			<h3>FHIR API Logs</h3>
			<span class="transaction-count" class:active={transactions.length > 0}>
				{transactions.length}
			</span>
		</div>
		<div class="header-actions">
			{#if transactions.length > 0}
				<button class="clear-btn" onclick={clearLogs} title="Clear all logs">
					🗑️ Clear
				</button>
			{/if}
			{#if !isEnabled}
				<div class="disabled-notice">Logs disabled</div>
			{/if}
		</div>
	</div>

	{#if !isEnabled}
		<div class="empty-state">
			<div class="empty-icon">📡</div>
			<p>FHIR API logging is disabled</p>
			<span class="empty-hint">Click "Logs" in the header to enable</span>
		</div>
	{:else if transactions.length === 0}
		<div class="empty-state">
			<div class="empty-icon">⏳</div>
			<p>No transactions yet</p>
			<span class="empty-hint">FHIR API calls will appear here</span>
		</div>
	{:else}
		<!-- Transaction List -->
		<div class="panel-content">
			<div class="transaction-list">
				{#each transactions as tx (tx.id)}
					{@const urlParts = getUrlParts(tx.url)}
					<button
						class="transaction-item"
						class:selected={selectedTransaction?.id === tx.id}
						class:error={tx.error || (tx.responseStatus >= 400)}
						onclick={() => selectTransaction(tx.id)}
					>
						<div class="transaction-row">
							<span 
								class="method-badge"
								style="background: {getMethodColor(tx.method)}20; color: {getMethodColor(tx.method)}"
							>
								{tx.method}
							</span>
							<span class="timestamp">{formatTimestamp(tx.timestamp)}</span>
						</div>
						<div class="url-path" title={tx.url}>{urlParts.path}</div>
						{#if urlParts.query}
							<div class="url-query">?{urlParts.query}</div>
						{/if}
						<div class="transaction-row status-row">
							{#if tx.responseStatus}
								<span 
									class="status-badge"
									style="background: {getStatusColor(tx.responseStatus)}20; color: {getStatusColor(tx.responseStatus)}"
								>
									{tx.responseStatus} {getStatusText(tx.responseStatus)}
								</span>
							{:else if tx.error}
								<span class="status-badge error-badge">
									Error
								</span>
							{:else}
								<span class="status-badge pending-badge">Pending...</span>
							{/if}
						</div>
					</button>
				{/each}
			</div>

			<!-- Transaction Detail -->
			{#if selectedTransaction}
				<div class="transaction-detail">
					<div class="detail-header">
						<h4>Transaction #{selectedTransaction.id}</h4>
						<button 
							class="copy-btn"
							onclick={() => copyToClipboard(formatJson(selectedTransaction))}
							title="Copy full transaction"
						>
							📋 Copy
						</button>
					</div>

					<!-- Tabs -->
					<div class="detail-tabs">
						<button 
							class="tab-btn"
							class:active={activeTab === 'request'}
							onclick={() => activeTab = 'request'}
						>
							Request
						</button>
						<button 
							class="tab-btn"
							class:active={activeTab === 'response'}
							onclick={() => activeTab = 'response'}
						>
							Response
							{#if selectedTransaction.error}
								<span class="tab-error">!</span>
							{/if}
						</button>
					</div>

					<!-- Tab Content -->
					<div class="tab-content">
						{#if activeTab === 'request'}
							<div class="detail-section">
								<div class="section-title">Request Details</div>
								<div class="detail-row">
									<span class="detail-label">Method:</span>
									<span class="detail-value method-value" style="color: {getMethodColor(selectedTransaction.method)}">
										{selectedTransaction.method}
									</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">URL:</span>
									<span class="detail-value url-value">{selectedTransaction.url}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Timestamp:</span>
									<span class="detail-value">{selectedTransaction.timestamp.toLocaleString()}</span>
								</div>
							</div>

							{#if selectedTransaction.requestBody}
								<div class="detail-section">
									<div class="section-header">
										<span class="section-title">Request Body</span>
										<button 
											class="copy-small"
											onclick={() => copyToClipboard(formatBody(selectedTransaction.requestBody))}
										>
											📋
										</button>
									</div>
									<pre class="code-block">{formatBody(selectedTransaction.requestBody)}</pre>
								</div>
							{/if}
						{:else}
							<div class="detail-section">
								<div class="section-title">Response Details</div>
								<div class="detail-row">
									<span class="detail-label">Status:</span>
									<span 
										class="detail-value"
										style="color: {getStatusColor(selectedTransaction.responseStatus)}; font-weight: 600;"
									>
										{selectedTransaction.responseStatus || 'No Response'}
									</span>
								</div>
								{#if selectedTransaction.error}
									<div class="detail-row error-row">
										<span class="detail-label">Error:</span>
										<span class="detail-value error-value">{selectedTransaction.error}</span>
									</div>
								{/if}
							</div>

							{#if selectedTransaction.responseBody}
								<div class="detail-section">
									<div class="section-header">
										<span class="section-title">Response Body</span>
										<button 
											class="copy-small"
											onclick={() => copyToClipboard(formatBody(selectedTransaction.responseBody))}
										>
											📋
										</button>
									</div>
									<pre class="code-block">{formatBody(selectedTransaction.responseBody)}</pre>
								</div>
							{:else if !selectedTransaction.error}
								<div class="detail-section">
									<p class="no-body">No response body</p>
								</div>
							{/if}
						{/if}
					</div>
				</div>
			{:else}
				<div class="no-selection">
					<p>Select a transaction to view details</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.logs-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #1E293B;
		color: #E2E8F0;
		font-family: 'SF Mono', Monaco, monospace;
		font-size: 13px;
	}

	/* Header */
	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid #334155;
		background: #0F172A;
	}

	.header-title {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.header-icon {
		font-size: 16px;
	}

	.header-title h3 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: #F8FAFC;
	}

	.transaction-count {
		font-size: 11px;
		padding: 2px 6px;
		border-radius: 10px;
		background: #334155;
		color: #94A3B8;
	}

	.transaction-count.active {
		background: #10B981;
		color: white;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.clear-btn {
		padding: 4px 10px;
		border: 1px solid #EF4444;
		border-radius: 4px;
		background: transparent;
		color: #EF4444;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.clear-btn:hover {
		background: #EF4444;
		color: white;
	}

	.disabled-notice {
		font-size: 11px;
		color: #EF4444;
		padding: 4px 8px;
		background: #EF444420;
		border-radius: 4px;
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 20px;
		text-align: center;
		flex: 1;
	}

	.empty-icon {
		font-size: 32px;
		margin-bottom: 12px;
		opacity: 0.5;
	}

	.empty-state p {
		margin: 0 0 4px 0;
		color: #94A3B8;
		font-size: 14px;
	}

	.empty-hint {
		font-size: 12px;
		color: #64748B;
	}

	/* Panel Content */
	.panel-content {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	/* Transaction List */
	.transaction-list {
		width: 280px;
		border-right: 1px solid #334155;
		overflow-y: auto;
		background: #1E293B;
	}

	.transaction-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 10px 12px;
		border: none;
		border-bottom: 1px solid #334155;
		background: transparent;
		color: inherit;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: all 0.15s;
	}

	.transaction-item:hover {
		background: #33415550;
	}

	.transaction-item.selected {
		background: #2563EB30;
		border-left: 3px solid #3B82F6;
	}

	.transaction-item.error {
		border-left: 3px solid #EF4444;
	}

	.transaction-item.error.selected {
		background: #EF444420;
	}

	.transaction-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.method-badge {
		font-size: 10px;
		font-weight: 700;
		padding: 2px 6px;
		border-radius: 3px;
		text-transform: uppercase;
	}

	.timestamp {
		font-size: 11px;
		color: #64748B;
	}

	.url-path {
		font-size: 12px;
		color: #E2E8F0;
		word-break: break-all;
		line-height: 1.3;
	}

	.url-query {
		font-size: 11px;
		color: #94A3B8;
		word-break: break-all;
		font-family: monospace;
	}

	.status-row {
		margin-top: 4px;
	}

	.status-badge {
		font-size: 10px;
		font-weight: 600;
		padding: 2px 6px;
		border-radius: 3px;
	}

	.error-badge {
		background: #EF444420;
		color: #EF4444;
	}

	.pending-badge {
		background: #F59E0B20;
		color: #F59E0B;
	}

	/* Transaction Detail */
	.transaction-detail {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: #0F172A;
	}

	.no-selection {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #64748B;
		font-style: italic;
	}

	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid #334155;
	}

	.detail-header h4 {
		margin: 0;
		font-size: 13px;
		font-weight: 600;
		color: #F8FAFC;
	}

	.copy-btn {
		padding: 4px 10px;
		border: 1px solid #64748B;
		border-radius: 4px;
		background: transparent;
		color: #94A3B8;
		font-size: 11px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.copy-btn:hover {
		border-color: #E2E8F0;
		color: #E2E8F0;
	}

	/* Tabs */
	.detail-tabs {
		display: flex;
		border-bottom: 1px solid #334155;
	}

	.tab-btn {
		flex: 1;
		padding: 10px 16px;
		border: none;
		background: transparent;
		color: #94A3B8;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		position: relative;
	}

	.tab-btn:hover {
		color: #E2E8F0;
		background: #33415550;
	}

	.tab-btn.active {
		color: #3B82F6;
		background: #2563EB15;
	}

	.tab-error {
		position: absolute;
		top: 6px;
		right: 6px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #EF4444;
		color: white;
		font-size: 9px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Tab Content */
	.tab-content {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
	}

	.detail-section {
		margin-bottom: 20px;
	}

	.section-title {
		font-size: 11px;
		font-weight: 600;
		color: #64748B;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 8px;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.copy-small {
		padding: 4px 8px;
		border: none;
		background: #334155;
		color: #94A3B8;
		font-size: 11px;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.copy-small:hover {
		background: #475569;
		color: #E2E8F0;
	}

	.detail-row {
		display: flex;
		gap: 8px;
		padding: 6px 0;
		border-bottom: 1px solid #33415550;
		font-size: 12px;
	}

	.detail-label {
		color: #64748B;
		min-width: 80px;
		flex-shrink: 0;
	}

	.detail-value {
		color: #E2E8F0;
		word-break: break-all;
	}

	.method-value {
		font-weight: 700;
	}

	.url-value {
		font-family: monospace;
		font-size: 11px;
		color: #60A5FA;
	}

	.error-row {
		background: #EF444415;
		padding: 8px;
		border-radius: 4px;
		margin: 4px 0;
	}

	.error-value {
		color: #EF4444;
	}

	.code-block {
		background: #1E293B;
		border: 1px solid #334155;
		border-radius: 6px;
		padding: 12px;
		margin: 0;
		font-family: 'SF Mono', Monaco, monospace;
		font-size: 11px;
		line-height: 1.5;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-word;
		color: #E2E8F0;
		max-height: 400px;
		overflow-y: auto;
	}

	.no-body {
		color: #64748B;
		font-style: italic;
		margin: 0;
		padding: 20px;
		text-align: center;
	}

	/* Scrollbar Styling */
	.transaction-list::-webkit-scrollbar,
	.tab-content::-webkit-scrollbar,
	.code-block::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.transaction-list::-webkit-scrollbar-track,
	.tab-content::-webkit-scrollbar-track,
	.code-block::-webkit-scrollbar-track {
		background: #0F172A;
	}

	.transaction-list::-webkit-scrollbar-thumb,
	.tab-content::-webkit-scrollbar-thumb,
	.code-block::-webkit-scrollbar-thumb {
		background: #334155;
		border-radius: 4px;
	}

	.transaction-list::-webkit-scrollbar-thumb:hover,
	.tab-content::-webkit-scrollbar-thumb:hover,
	.code-block::-webkit-scrollbar-thumb:hover {
		background: #475569;
	}
</style>
