<script>
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { appStore } from '$stores/appStore.svelte.js';

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
</script>

<div class="app-container">
	<main class="main-content">
		<slot />
	</main>
	
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
</div>

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

	.app-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.main-content {
		flex: 1;
		padding-bottom: 80px; /* Space for bottom nav */
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
