<script>
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { appStore } from '$stores/appStore.svelte.js';
	import { fhirLogger } from '$stores/fhirLogger.js';
	import FhirLogsPanel from '$components/FhirLogsPanel.svelte';

	// Handle URL parameter changes using $effect
	$effect(() => {
		if (browser && $page) {
			const url = new URL($page.url);
			const params = {
				w: url.searchParams.get('w') || '',
				u: url.searchParams.get('u') || '',
				c: url.searchParams.get('c') || '',
				r: url.searchParams.get('r') || ''
			};
			
			// Update store if URL params changed
			if (params.w && params.w !== appStore.workshopCode) {
				appStore.setWorkshopCode(params.w);
			}
			if (params.u && params.u !== appStore.userName) {
				appStore.setUserName(params.u);
			}
			if (params.c && params.c !== appStore.clinicId) {
				appStore.setClinic(params.c);
			}
			if (params.r && params.r !== appStore.roleId) {
				appStore.setRole(params.r);
			}
		}
	});

	// Logs panel state
	let isLogsEnabled = $state(false);
	let logsPanelWidth = $state(450); // Default width
	let isResizing = $state(false);
	
	const MIN_PANEL_WIDTH = 300;
	const MAX_PANEL_WIDTH = 800;
	const DEFAULT_PANEL_WIDTH = 450;

	// Subscribe to logger state
	$effect(() => {
		const unsubscribe = fhirLogger.subscribe(state => {
			isLogsEnabled = state.isEnabled;
		});
		return unsubscribe;
	});

	// Resize functionality
	function startResize(e) {
		isResizing = true;
		e.preventDefault();
		
		const startX = e.clientX;
		const startWidth = logsPanelWidth;
		
		function handleMouseMove(e) {
			if (!isResizing) return;
			const delta = startX - e.clientX;
			const newWidth = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, startWidth + delta));
			logsPanelWidth = newWidth;
		}
		
		function handleMouseUp() {
			isResizing = false;
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		}
		
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}

	function resetPanelWidth() {
		logsPanelWidth = DEFAULT_PANEL_WIDTH;
	}
</script>

<div class="app-layout" class:logs-open={isLogsEnabled}>
	<div class="main-content-area">
		<slot />
	</div>
	
	<!-- Resizable Logs Panel -->
	{#if isLogsEnabled}
		<div 
			class="logs-resizer" 
			class:resizing={isResizing}
			onmousedown={startResize}
			title="Drag to resize"
		>
			<div class="resizer-handle"></div>
		</div>
		<div 
			class="logs-sidebar" 
			style="width: {logsPanelWidth}px"
		>
			<div class="logs-header">
				<span class="logs-title">📡 FHIR API Logs</span>
				<button class="reset-width-btn" onclick={resetPanelWidth} title="Reset width">
					↺
				</button>
			</div>
			<div class="logs-content">
				<FhirLogsPanel />
			</div>
		</div>
	{/if}
</div>

<!-- Notifications -->
{#if appStore.notifications.length > 0}
	<div class="notifications-container">
		{#each appStore.notifications as notification (notification.id)}
			<div class="notification notification-{notification.type}">
				<span class="notification-icon">
					{#if notification.type === 'success'}✓
					{:else if notification.type === 'error'}✕
					{:else if notification.type === 'warning'}⚠
					{:else}ℹ{/if}
				</span>
				<div class="notification-content">
					{#if notification.title}
						<strong>{notification.title}</strong>
					{/if}
					<p>{notification.message}</p>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	:global(body) {
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		margin: 0;
		padding: 0;
		background-color: #F9FAFB;
		color: #111827;
		line-height: 1.5;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(.app-layout) {
		min-height: 100vh;
		display: flex;
		flex-direction: row;
	}

	:global(.app-layout.logs-open) {
		flex-direction: row;
	}

	:global(.main-content-area) {
		flex: 1;
		min-width: 0;
		overflow-x: hidden;
	}

	/* Resizable Logs Panel */
	:global(.logs-resizer) {
		width: 6px;
		background: #E2E8F0;
		cursor: col-resize;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.2s;
		flex-shrink: 0;
	}

	:global(.logs-resizer:hover),
	:global(.logs-resizer.resizing) {
		background: #3B82F6;
	}

	:global(.resizer-handle) {
		width: 2px;
		height: 40px;
		background: #94A3B8;
		border-radius: 1px;
	}

	:global(.logs-resizer:hover .resizer-handle),
	:global(.logs-resizer.resizing .resizer-handle) {
		background: white;
	}

	:global(.logs-sidebar) {
		background: #1E293B;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		border-left: 1px solid #334155;
		max-width: 800px;
		min-width: 300px;
	}

	:global(.logs-header) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		background: #0F172A;
		border-bottom: 1px solid #334155;
		flex-shrink: 0;
	}

	:global(.logs-title) {
		font-size: 13px;
		font-weight: 600;
		color: #F8FAFC;
	}

	:global(.reset-width-btn) {
		background: transparent;
		border: 1px solid #475569;
		color: #94A3B8;
		padding: 4px 8px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 12px;
		transition: all 0.2s;
	}

	:global(.reset-width-btn:hover) {
		background: #334155;
		color: #E2E8F0;
		border-color: #64748B;
	}

	:global(.logs-content) {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.notifications-container {
		position: fixed;
		top: 16px;
		left: 16px;
		right: 16px;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: 8px;
		pointer-events: none;
	}

	.notification {
		background: white;
		border-radius: 12px;
		padding: 16px;
		display: flex;
		align-items: center;
		gap: 12px;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		pointer-events: auto;
		animation: slideDown 0.3s ease-out;
	}

	@keyframes slideDown {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.notification-success {
		border-left: 4px solid #059669;
	}

	.notification-error {
		border-left: 4px solid #DC2626;
	}

	.notification-warning {
		border-left: 4px solid #D97706;
	}

	.notification-info {
		border-left: 4px solid #2563EB;
	}

	.notification-icon {
		font-size: 20px;
		flex-shrink: 0;
	}

	.notification-content p {
		margin: 0;
		font-size: 14px;
	}

	/* Safe area support for mobile */
	@supports (padding-top: env(safe-area-inset-top)) {
		.notifications-container {
			top: calc(16px + env(safe-area-inset-top));
		}
	}
</style>
