<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, ROLES } from '$constants';

	// Redirect if not configured (use replaceState to avoid back-button issues)
	onMount(() => {
		if (browser && !appStore.isConfigured) {
			// Use window.location.replace to avoid adding to history stack
			window.location.replace('/');
		}
	});

	const clinic = $derived(CLINICS.find(c => c.id === appStore.clinicId));
	const role = $derived(ROLES.find(r => r.id === appStore.roleId));
</script>

{#if appStore.isConfigured}
	<div class="dashboard" style="--clinic-color: {clinic?.color || '#2563EB'}">
		<!-- Header -->
		<header class="dashboard-header">
			<div class="clinic-badge" style="background: {clinic?.color}20; color: {clinic?.color}; border-color: {clinic?.color}">
				<span class="clinic-icon">{clinic?.icon}</span>
				<span class="clinic-name">{clinic?.shortName}</span>
			</div>
			<div class="user-info">
				<strong>{appStore.userName}</strong>
				{#if role}
					<span>{role.name}</span>
				{/if}
			</div>
			<button 
				class="view-toggle"
				on:click={() => appStore.toggleView()}
				title="Switch to Developer Mode"
			>
				{appStore.view === 'clinical' ? '👁️' : '🔧'}
			</button>
		</header>

		<!-- Main Content -->
		<main class="dashboard-content">
			<h1>What do you want to do?</h1>
			
			<div class="action-grid">
				<a href="/patient/search" class="action-card">
					<span class="action-icon">🔍</span>
					<div class="action-text">
						<strong>Find Patient</strong>
						<span>Search by name or ID</span>
					</div>
				</a>
				
				<a href="/patient/new" class="action-card primary">
					<span class="action-icon">➕</span>
					<div class="action-text">
						<strong>Register Patient</strong>
						<span>Add new person to SHR</span>
					</div>
				</a>
				
				<a href="/encounter" class="action-card">
					<span class="action-icon">📋</span>
					<div class="action-text">
						<strong>Record Visit</strong>
						<span>Document encounter</span>
					</div>
				</a>
				
				<a href="/vitals" class="action-card">
					<span class="action-icon">🩺</span>
					<div class="action-text">
						<strong>Record Vitals</strong>
						<span>BP, HR, Temperature</span>
					</div>
				</a>
			</div>

			<!-- Workshop Info -->
			<div class="workshop-info">
				<p>🎓 Workshop: <strong>{appStore.workshopCode}</strong></p>
				<p>🌐 Group Filter: 
					<button 
						class="filter-toggle"
						on:click={() => appStore.toggleGroupFilter()}
					>
						{appStore.groupFilterEnabled ? '🏷️ Group Only' : '🌐 Full SHR'}
					</button>
				</p>
			</div>
		</main>

		<!-- Bottom Navigation -->
		<nav class="bottom-nav">
			<a href="/dashboard" class="nav-item active">
				<span class="nav-icon">🏠</span>
				<span class="nav-label">Home</span>
			</a>
			<a href="/patient/search" class="nav-item">
				<span class="nav-icon">👤</span>
				<span class="nav-label">Patients</span>
			</a>
			<a href="/developer" class="nav-item">
				<span class="nav-icon">🔧</span>
				<span class="nav-label">Developer</span>
			</a>
		</nav>
	</div>
{:else}
	<div class="loading">
		<p>Redirecting to setup...</p>
	</div>
{/if}

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: #F9FAFB;
	}

	.dashboard-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		background: white;
		border-bottom: 1px solid #E5E7EB;
		gap: 12px;
	}

	.clinic-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 20px;
		border: 2px solid;
		font-size: 14px;
		font-weight: 600;
	}

	.clinic-icon {
		font-size: 16px;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		flex: 1;
		min-width: 0;
	}

	.user-info strong {
		font-size: 14px;
		color: #111827;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.user-info span {
		font-size: 12px;
		color: #6B7280;
	}

	.view-toggle {
		width: 40px;
		height: 40px;
		border-radius: 10px;
		border: 1px solid #E5E7EB;
		background: white;
		font-size: 18px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.dashboard-content {
		flex: 1;
		padding: 24px 16px;
		padding-bottom: 100px;
	}

	.dashboard-content h1 {
		font-size: 22px;
		font-weight: 700;
		color: #111827;
		margin: 0 0 24px 0;
	}

	.action-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-bottom: 32px;
	}

	@media (min-width: 640px) {
		.action-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.action-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 24px 16px;
		background: white;
		border: 2px solid #E5E7EB;
		border-radius: 16px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
	}

	.action-card:hover {
		border-color: var(--clinic-color);
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.action-card.primary {
		border-color: var(--clinic-color);
		background: linear-gradient(135deg, white 0%, rgba(255,255,255,0.9) 100%);
	}

	.action-icon {
		font-size: 32px;
	}

	.action-text {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.action-text strong {
		font-size: 14px;
		color: #111827;
	}

	.action-text span {
		font-size: 12px;
		color: #6B7280;
		text-align: center;
	}

	.workshop-info {
		background: white;
		border-radius: 12px;
		padding: 16px;
		border: 1px solid #E5E7EB;
	}

	.workshop-info p {
		margin: 0 0 8px 0;
		font-size: 14px;
		color: #374151;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.filter-toggle {
		padding: 4px 8px;
		font-size: 12px;
		border: 1px solid #E5E7EB;
		border-radius: 6px;
		background: white;
		cursor: pointer;
		margin-left: auto;
	}

	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-around;
		padding: 12px 0 calc(12px + env(safe-area-inset-bottom));
		background: white;
		border-top: 1px solid #E5E7EB;
		z-index: 100;
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px 16px;
		color: #6B7280;
		text-decoration: none;
		font-size: 12px;
	}

	.nav-item.active {
		color: var(--clinic-color);
	}

	.nav-icon {
		font-size: 20px;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		font-size: 16px;
		color: #6B7280;
	}
</style>
