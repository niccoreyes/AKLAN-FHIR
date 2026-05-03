<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, ROLES } from '$constants';

	// Form state
	let workshopCode = $state(appStore.workshopCode || '');
	let userName = $state(appStore.userName || '');
	let selectedClinic = $state(appStore.clinicId || CLINICS[0]?.id || '');
	let selectedRole = $state(appStore.roleId || '');
	let isLoading = $state(false);
	let error = $state('');
	let showRoleToggle = $state(false);

	// Redirect if already configured
	onMount(() => {
		if (browser && appStore.isConfigured) {
			goto('/dashboard');
		}
	});

	// Handle form submission
	async function handleSubmit() {
		error = '';

		if (!workshopCode.trim()) {
			error = 'Please enter a workshop code';
			return;
		}
		if (!userName.trim()) {
			error = 'Please enter your first name';
			return;
		}
		if (!selectedClinic) {
			error = 'Please select your clinic';
			return;
		}

		isLoading = true;

		try {
			appStore.setWorkshopCode(workshopCode.trim().toUpperCase());
			appStore.setUserName(userName.trim());
			appStore.setClinic(selectedClinic);
			if (selectedRole) {
				appStore.setRole(selectedRole);
			}

			await appStore.registerParticipant();
			goto('/dashboard');
		} catch (err) {
			error = err.message || 'Failed to register. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function selectClinic(clinicId) {
		selectedClinic = clinicId;
	}

	function selectRole(roleId) {
		selectedRole = roleId;
	}
</script>

<svelte:head>
	<title>Join Workshop - OpenHIE Mock EHR</title>
</svelte:head>

<div class="page">
	<div class="card">
		<header class="header">
			<h1>🎓 Join Workshop</h1>
			<p class="subtitle">OpenHIE Mock EHR</p>
		</header>

		{#if error}
			<div class="alert" role="alert">
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="form">
			<!-- Workshop Code -->
			<div class="field">
				<label for="workshop-code" class="label">Workshop Code</label>
				<input
					id="workshop-code"
					type="text"
					bind:value={workshopCode}
					placeholder="e.g., AK26-A"
					class="input"
					disabled={isLoading}
				/>
			</div>

			<!-- First Name -->
			<div class="field">
				<label for="first-name" class="label">First Name</label>
				<input
					id="first-name"
					type="text"
					bind:value={userName}
					placeholder="Enter your first name"
					class="input"
					disabled={isLoading}
				/>
			</div>

			<!-- Clinic Selection -->
			<div class="field">
				<span class="label">Select Clinic</span>
				<div class="clinic-grid">
					{#each CLINICS as clinic}
						<button
							type="button"
							class="clinic-card"
							class:selected={selectedClinic === clinic.id}
							style="--clinic-color: {clinic.color}"
							onclick={() => selectClinic(clinic.id)}
							disabled={isLoading}
						>
							<span class="clinic-icon">{clinic.icon}</span>
							<span class="clinic-name">{clinic.shortName}</span>
							<span class="clinic-type">{clinic.type}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Optional Role Toggle -->
			<div class="field">
				<button
					type="button"
					class="toggle"
					onclick={() => (showRoleToggle = !showRoleToggle)}
					aria-expanded={showRoleToggle}
				>
					<span class="toggle-icon">{showRoleToggle ? '▼' : '▶'}</span>
					<span>Optional: Select Your Role</span>
				</button>

				{#if showRoleToggle}
					<div class="role-grid">
						{#each ROLES as role}
					<button
						type="button"
						class="role-card"
						class:selected={selectedRole === role.id}
						onclick={() => selectRole(role.id)}
						disabled={isLoading}
					>
								<span class="role-icon">{role.icon}</span>
								<div class="role-info">
									<span class="role-name">{role.name}</span>
									<span class="role-desc">{role.description}</span>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Submit -->
			<button
				type="submit"
				class="submit"
				disabled={isLoading || !workshopCode || !userName || !selectedClinic}
			>
				{#if isLoading}
					<span class="spinner"></span>
					<span>Connecting…</span>
				{:else}
					<span>🚀 Enter EHR System</span>
				{/if}
			</button>
		</form>

		<footer class="footer">
			<a href="/" class="back-link">← Back to Public Viewer</a>
		</footer>
	</div>
</div>

<style>
	.page {
		min-height: 100vh;
		padding: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f8fafc;
	}

	.card {
		width: 100%;
		max-width: 560px;
		background: #ffffff;
		border-radius: 20px;
		padding: 28px 20px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 10px 30px rgba(0, 0, 0, 0.06);
	}

	@media (min-width: 640px) {
		.card {
			padding: 36px 32px;
		}
	}

	.header {
		text-align: center;
		margin-bottom: 28px;
	}

	.header h1 {
		font-size: 24px;
		font-weight: 800;
		margin: 0;
		color: #0f172a;
		letter-spacing: -0.02em;
	}

	.subtitle {
		margin: 6px 0 0;
		font-size: 15px;
		color: #64748b;
		font-weight: 500;
	}

	.alert {
		background: #fef2f2;
		color: #b91c1c;
		padding: 12px 16px;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 500;
		margin-bottom: 20px;
		border: 1px solid #fecaca;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.label {
		font-size: 14px;
		font-weight: 600;
		color: #334155;
	}

	.input {
		padding: 14px 16px;
		font-size: 16px;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		background: #ffffff;
		color: #0f172a;
		transition: border-color 0.2s, box-shadow 0.2s;
		width: 100%;
		box-sizing: border-box;
	}

	.input::placeholder {
		color: #94a3b8;
	}

	.input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
	}

	.input:disabled {
		background: #f1f5f9;
		cursor: not-allowed;
	}

	/* Clinic Cards */
	.clinic-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
	}

	@media (min-width: 480px) {
		.clinic-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.clinic-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 14px 8px;
		border: 2px solid #e2e8f0;
		border-radius: 14px;
		background: #ffffff;
		cursor: pointer;
		transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
	}

	.clinic-card:hover {
		border-color: var(--clinic-color);
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.06);
	}

	.clinic-card.selected {
		border-color: var(--clinic-color);
		background: color-mix(in srgb, var(--clinic-color) 8%, white);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
	}

	.clinic-card:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.clinic-icon {
		font-size: 28px;
		line-height: 1;
	}

	.clinic-name {
		font-size: 13px;
		font-weight: 700;
		color: #0f172a;
		text-align: center;
	}

	.clinic-type {
		font-size: 11px;
		color: #64748b;
		text-align: center;
	}

	/* Role Toggle */
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: none;
		border: none;
		padding: 6px 0;
		font-size: 14px;
		font-weight: 600;
		color: #3b82f6;
		cursor: pointer;
	}

	.toggle-icon {
		font-size: 12px;
		color: #64748b;
	}

	.role-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 8px;
		margin-top: 4px;
	}

	@media (min-width: 480px) {
		.role-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.role-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		background: #ffffff;
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
		text-align: left;
	}

	.role-card:hover {
		border-color: #3b82f6;
	}

	.role-card.selected {
		border-color: #3b82f6;
		background: #eff6ff;
	}

	.role-card:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.role-icon {
		font-size: 22px;
		flex-shrink: 0;
	}

	.role-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.role-name {
		font-size: 14px;
		font-weight: 600;
		color: #0f172a;
	}

	.role-desc {
		font-size: 12px;
		color: #64748b;
	}

	/* Submit Button */
	.submit {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		width: 100%;
		padding: 16px;
		font-size: 17px;
		font-weight: 700;
		color: #ffffff;
		background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
		border: none;
		border-radius: 14px;
		cursor: pointer;
		transition: transform 0.15s, box-shadow 0.15s;
		box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
	}

	.submit:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
	}

	.submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(255, 255, 255, 0.4);
		border-top-color: #ffffff;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Footer */
	.footer {
		margin-top: 24px;
		text-align: center;
	}

	.back-link {
		font-size: 14px;
		font-weight: 500;
		color: #64748b;
		text-decoration: none;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: #0f172a;
		text-decoration: underline;
	}
</style>
