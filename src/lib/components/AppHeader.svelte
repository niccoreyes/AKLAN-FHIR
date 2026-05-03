<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { APP_NAME, CLINICS, CLINIC_CAPABILITIES, ROLES } from '$constants';
	import { appStore } from '$stores/appStore.svelte.js';

	let { active = 'clinical' } = $props();

	let serverStatus = $state('checking');
	let showClinicSwitcher = $state(false);
	let showUserMenu = $state(false);
	let isRegistering = $state(false);
	let hasRegistered = $state(false);

	// Auto-register participant when configured but no practitionerId
	// This handles clinic switching where practitionerId is lost
	$effect(() => {
		if (browser && appStore.isConfigured && !appStore.practitionerId && !appStore.isLoading && !isRegistering && !hasRegistered) {
			// Don't auto-register if we're on the workshop page (manual registration)
			if (window.location.pathname === '/workshop') return;
			
			console.log('[AppHeader] Auto-registering participant...');
			isRegistering = true;
			appStore.registerParticipant().then(() => {
				isRegistering = false;
				hasRegistered = true;
			}).catch(() => {
				isRegistering = false;
			});
		}
	});

	async function checkServer() {
		try {
			const res = await fetch('https://cdr.fhirlab.net/fhir/metadata', {
				headers: { 'Accept': 'application/fhir+json' }
			});
			serverStatus = res.ok ? 'connected' : 'error';
		} catch (e) {
			serverStatus = 'error';
		}
	}

	function switchClinic(clinicId) {
		appStore.setClinic(clinicId);
		showClinicSwitcher = false;
		// Preserve all workshop parameters when switching clinics
		const params = new URLSearchParams();
		if (appStore.workshopCode) params.set('w', appStore.workshopCode);
		if (appStore.userName) params.set('u', appStore.userName);
		params.set('c', clinicId); // Set new clinic
		if (appStore.roleId) params.set('r', appStore.roleId);
		window.location.href = '/dashboard?' + params.toString();
	}
	
	function handleLogout() {
		showUserMenu = false;
		if (confirm('Are you sure you want to log out? This will clear your session.')) {
			appStore.logout();
		}
	}

	const navItems = [
		{ id: 'clinical', label: 'Clinical View', href: '/' },
		{ id: 'developer', label: 'Technical Dashboard', href: '/developer' },
		{ id: 'architecture', label: 'Architecture', href: '/architecture' },
		{ id: 'about', label: 'About', href: '/about' }
	];

	const currentClinic = $derived(CLINICS.find(c => c.id === appStore.clinicId));
	const currentRole = $derived(ROLES.find(r => r.id === appStore.roleId));
	const currentCaps = $derived(CLINIC_CAPABILITIES[appStore.clinicId] || {});
</script>

<!-- Toast Notifications - Fixed position, non-blocking -->
{#if appStore.notifications.length > 0}
	<div class="toast-container">
		{#each appStore.notifications as notification (notification.id)}
			<div class="toast toast-{notification.type}" role="alert">
				<span class="toast-message">{notification.message}</span>
				<button 
					class="toast-close" 
					onclick={() => appStore.removeNotification(notification.id)}
					aria-label="Dismiss notification"
				>
					✕
				</button>
			</div>
		{/each}
	</div>
{/if}

<!-- Auto-registration Loading Overlay -->
{#if isRegistering}
	<div class="registration-overlay">
		<div class="registration-spinner">
			<div class="spinner"></div>
			<span>Connecting to FHIR server...</span>
		</div>
	</div>
{/if}

<!-- Header -->
<header class="top-bar">
	<div class="logo">
		<span class="logo-icon">🏥</span>
		<div>
			<h1>{APP_NAME}</h1>
			<span>FHIR Fundamentals 2026 - Aklan</span>
		</div>
	</div>
	
	{#if appStore.isConfigured}
		<div class="user-section">
			<!-- Clinic Switcher -->
			<div class="clinic-context">
				<button
					class="clinic-switcher-btn"
					onclick={() => showClinicSwitcher = !showClinicSwitcher}
					style="--clinic-color: {currentClinic?.color || '#2563EB'}"
					title="Click to switch clinic and experience HIE from different perspectives"
				>
					<span class="clinic-icon-large">{currentClinic?.icon}</span>
					<span class="clinic-name">{currentClinic?.shortName}</span>
					<span class="switch-indicator">↻</span>
				</button>
				{#if showClinicSwitcher}
					<div class="clinic-dropdown">
						<div class="dropdown-header">Switch Clinic (HIE Demo)</div>
						{#each CLINICS as clinic}
							<button 
								class="clinic-option"
								class:active={clinic.id === appStore.clinicId}
								onclick={() => switchClinic(clinic.id)}
							>
								<span class="option-icon">{clinic.icon}</span>
								<div class="option-info">
									<strong>{clinic.shortName}</strong>
									<span>{CLINIC_CAPABILITIES[clinic.id]?.description || ''}</span>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
			
			<!-- User Menu -->
			<div class="user-menu-container">
				<button
					class="user-menu-btn"
					onclick={() => showUserMenu = !showUserMenu}
					title="User menu"
				>
					<span class="user-avatar">👤</span>
					<span class="user-name">{appStore.userName}</span>
					<span class="dropdown-arrow">▼</span>
				</button>
				{#if showUserMenu}
					<div class="user-dropdown">
						<div class="user-info-section">
							<div class="user-info-row">
								<span class="info-label">Name:</span>
								<span class="info-value">{appStore.userName}</span>
							</div>
							<div class="user-info-row">
								<span class="info-label">Workshop:</span>
								<span class="info-value">{appStore.workshopCode}</span>
							</div>
							{#if currentRole}
								<div class="user-info-row">
									<span class="info-label">Role:</span>
									<span class="info-value">{currentRole.name}</span>
								</div>
							{/if}
							<div class="user-info-row">
								<span class="info-label">FHIR ID:</span>
								<span class="info-value fhir-id">{appStore.practitionerId || 'Not registered'}</span>
							</div>
						</div>
						<div class="dropdown-divider"></div>
						<button class="logout-btn" onclick={handleLogout}>
							<span class="logout-icon">🚪</span>
							<span>Log Out</span>
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
	
	<nav class="main-nav">
		{#each navItems as item}
			<a 
				href={item.href} 
				class="nav-link"
				class:active={active === item.id}
			>
				{item.label}
			</a>
		{/each}
	</nav>
</header>

<!-- Server Status -->
<div class="server-bar">
	<div class="server-info-group">
		<div class="server-info">
			<span class="status-dot {serverStatus}"></span>
			<span>SHR: cdr.fhirlab.net</span>
		</div>
		<div class="server-info">
			<span class="status-dot {serverStatus}"></span>
			<span>Terminology: tx.fhirlab.net</span>
		</div>
	</div>
	{#if appStore.isConfigured && currentCaps}
		<div class="server-info clinic-mode">
			<span>🏥</span>
			<span>{currentClinic?.shortName} — {currentCaps.description}</span>
		</div>
	{/if}
</div>

<style>
	/* Toast Notifications - Fixed position, non-blocking */
	.toast-container {
		position: fixed;
		top: 130px;
		right: 16px;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: 8px;
		pointer-events: none;
		max-width: calc(100vw - 32px);
	}

	.toast {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		border-radius: 8px;
		background: white;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
		min-width: auto;
		max-width: 320px;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.toast-success {
		border-left: 4px solid #10B981;
	}

	.toast-info {
		border-left: 4px solid #3B82F6;
	}

	.toast-error {
		border-left: 4px solid #EF4444;
	}

	.toast-warning {
		border-left: 4px solid #F59E0B;
	}

	.toast-message {
		flex: 1;
		font-size: 14px;
		color: #1E293B;
		line-height: 1.4;
	}

	.toast-close {
		background: none;
		border: none;
		font-size: 16px;
		color: #94A3B8;
		cursor: pointer;
		padding: 4px;
		line-height: 1;
		transition: color 0.2s;
		border-radius: 4px;
	}

	.toast-close:hover {
		color: #64748B;
		background: #F1F5F9;
	}

	/* Registration Loading Overlay */
	.registration-overlay {
		position: fixed;
		inset: 0;
		background: rgba(255,255,255,0.9);
		backdrop-filter: blur(4px);
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.registration-spinner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 32px;
		background: white;
		border-radius: 16px;
		box-shadow: 0 10px 40px rgba(0,0,0,0.15);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #E2E8F0;
		border-top-color: #3B82F6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.registration-spinner span {
		font-size: 14px;
		color: #64748B;
	}

	/* Header Styles */
	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 24px;
		background: white;
		border-bottom: 1px solid #E2E8F0;
		flex-wrap: wrap;
		gap: 12px;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.logo-icon {
		font-size: 28px;
	}

	.logo h1 {
		margin: 0;
		font-size: 18px;
		font-weight: 700;
		color: #1E293B;
	}

	.logo span {
		font-size: 12px;
		color: #64748B;
	}

	/* User Section */
	.user-section {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	/* User Menu */
	.user-menu-container {
		position: relative;
	}

	.user-menu-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		border-radius: 20px;
		border: 1px solid #E2E8F0;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 14px;
		font-weight: 500;
	}

	.user-menu-btn:hover {
		background: #F8FAFC;
		border-color: #CBD5E1;
	}

	.user-avatar {
		font-size: 18px;
	}

	.user-name {
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.dropdown-arrow {
		font-size: 10px;
		color: #94A3B8;
		margin-left: 2px;
	}

	.user-dropdown {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		background: white;
		border: 1px solid #E2E8F0;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0,0,0,0.15);
		padding: 12px;
		min-width: 240px;
		z-index: 200;
	}

	.user-info-section {
		padding: 4px;
	}

	.user-info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 0;
		font-size: 13px;
	}

	.info-label {
		color: #64748B;
		font-weight: 500;
	}

	.info-value {
		color: #1E293B;
		font-weight: 600;
	}

	.fhir-id {
		font-family: monospace;
		font-size: 11px;
		background: #F1F5F9;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.dropdown-divider {
		height: 1px;
		background: #E2E8F0;
		margin: 8px 0;
	}

	.logout-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 10px 12px;
		border: none;
		border-radius: 8px;
		background: #FEE2E2;
		color: #DC2626;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.logout-btn:hover {
		background: #FECACA;
	}

	.logout-icon {
		font-size: 16px;
	}

	.main-nav {
		display: flex;
		gap: 8px;
	}

	.nav-link {
		padding: 8px 16px;
		border-radius: 8px;
		text-decoration: none;
		color: #64748B;
		font-size: 14px;
		font-weight: 500;
		transition: all 0.2s;
	}

	.nav-link:hover {
		background: #F1F5F9;
		color: #1E293B;
	}

	.nav-link.active {
		background: #EFF6FF;
		color: #2563EB;
	}

	.server-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		padding: 8px 24px;
		background: #F1F5F9;
		font-size: 12px;
		color: #64748B;
		border-bottom: 1px solid #E2E8F0;
	}

	.server-info-group {
		display: flex;
		gap: 16px;
	}

	.server-info {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #94A3B8;
	}

	.status-dot.connected {
		background: #10B981;
	}

	.status-dot.error {
		background: #EF4444;
	}

	/* Clinic Switcher */
	.clinic-context {
		position: relative;
	}

	.clinic-switcher-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		border-radius: 20px;
		border: 2px solid var(--clinic-color);
		background: linear-gradient(135deg, color-mix(in srgb, var(--clinic-color) 12%, white) 0%, white 100%);
		color: var(--clinic-color);
		font-size: 14px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 2px 4px rgba(0,0,0,0.05);
	}

	.clinic-switcher-btn:hover {
		background: linear-gradient(135deg, color-mix(in srgb, var(--clinic-color) 20%, white) 0%, color-mix(in srgb, var(--clinic-color) 5%, white) 100%);
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0,0,0,0.1);
	}

	.clinic-switcher-btn:active {
		transform: translateY(0);
		box-shadow: 0 1px 2px rgba(0,0,0,0.05);
	}

	.clinic-icon-large {
		font-size: 18px;
	}

	.clinic-name {
		max-width: 140px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.switch-indicator {
		font-size: 13px;
		opacity: 0.7;
		margin-left: 2px;
	}

	.clinic-dropdown {
		position: absolute;
		top: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		background: white;
		border: 1px solid #E2E8F0;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0,0,0,0.15);
		padding: 8px;
		min-width: 280px;
		z-index: 200;
	}

	.dropdown-header {
		font-size: 11px;
		font-weight: 700;
		color: #94A3B8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 8px 12px;
		border-bottom: 1px solid #F1F5F9;
		margin-bottom: 4px;
	}

	.clinic-option {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		border-radius: 8px;
		border: none;
		background: none;
		cursor: pointer;
		width: 100%;
		text-align: left;
		transition: all 0.2s;
	}

	.clinic-option:hover {
		background: #F8FAFC;
	}

	.clinic-option.active {
		background: #EFF6FF;
	}

	.option-icon {
		font-size: 20px;
	}

	.option-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.option-info strong {
		font-size: 13px;
		color: #1E293B;
	}

	.option-info span {
		font-size: 11px;
		color: #64748B;
		line-height: 1.3;
	}

	.clinic-mode {
		font-weight: 500;
		color: #475569;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.top-bar {
			padding: 12px 16px;
		}

		.user-name {
			display: none;
		}

		.clinic-name {
			max-width: 80px;
		}

		.nav-link {
			padding: 6px 10px;
			font-size: 12px;
		}

		.toast-container {
			top: 70px;
			right: 12px;
			left: 12px;
		}

		.toast {
			min-width: auto;
			max-width: none;
		}
	}
</style>