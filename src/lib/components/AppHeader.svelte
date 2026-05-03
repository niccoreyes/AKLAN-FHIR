<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { APP_NAME, CLINICS, CLINIC_CAPABILITIES } from '$constants';
	import { appStore } from '$stores/appStore.svelte.js';

	let { active = 'clinical' } = $props();

	let serverStatus = $state('checking');
	let showClinicSwitcher = $state(false);
	let hasAttemptedRegistration = $state(false);

	// Auto-register participant when configured but no practitionerId
	// This handles clinic switching where practitionerId is lost
	$effect(() => {
		if (browser && appStore.isConfigured && !appStore.practitionerId && !appStore.isLoading && !hasAttemptedRegistration) {
			// Don't auto-register if we're on the workshop page (manual registration)
			if (window.location.pathname === '/workshop') {
				hasAttemptedRegistration = true;
				return;
			}
			console.log('[AppHeader] Auto-registering participant...');
			hasAttemptedRegistration = true;
			appStore.registerParticipant();
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

	const navItems = [
		{ id: 'clinical', label: 'Clinical View', href: '/' },
		{ id: 'developer', label: 'Technical Dashboard', href: '/developer' },
		{ id: 'architecture', label: 'Architecture', href: '/architecture' },
		{ id: 'about', label: 'About', href: '/about' }
	];

	const currentClinic = $derived(CLINICS.find(c => c.id === appStore.clinicId));
	const currentCaps = $derived(CLINIC_CAPABILITIES[appStore.clinicId] || {});
</script>

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
	<div class="server-info">
		<span class="status-dot {serverStatus}"></span>
		<span>SHR: cdr.fhirlab.net</span>
	</div>
	<div class="server-info">
		<span class="status-dot {serverStatus}"></span>
		<span>Terminology: tx.fhirlab.net</span>
	</div>
	{#if appStore.isConfigured && currentCaps}
		<div class="server-info clinic-mode">
			<span>🏥</span>
			<span>{currentClinic?.shortName} — {currentCaps.description}</span>
		</div>
	{/if}
</div>

<style>
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
		gap: 16px;
		padding: 8px 24px;
		background: #F1F5F9;
		font-size: 12px;
		color: #64748B;
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
		margin-left: auto;
		font-weight: 500;
		color: #475569;
	}
</style>
