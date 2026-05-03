<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, ROLES } from '$constants';

	// Form state
	let workshopCode = $state(appStore.workshopCode || '');
	let userName = $state(appStore.userName || '');
	let selectedClinic = $state(appStore.clinicId || '');
	let selectedRole = $state(appStore.roleId || '');
	let isLoading = $state(false);
	let error = $state('');
	let showAdvanced = $state(false);

	// Check if already configured
	onMount(() => {
		if (browser && appStore.isConfigured) {
			// Already has required info, redirect to main app
			goto('/dashboard');
		}
	});

	// Handle form submission
	async function handleSubmit() {
		error = '';
		
		// Validate
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
			// Update store (this also updates URL)
			appStore.setWorkshopCode(workshopCode.trim().toUpperCase());
			appStore.setUserName(userName.trim());
			appStore.setClinic(selectedClinic);
			if (selectedRole) {
				appStore.setRole(selectedRole);
			}

			// Register participant in SHR
			await appStore.registerParticipant();

			// Navigate to main app
			goto('/dashboard');
		} catch (err) {
			error = err.message || 'Failed to register. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	// Select a clinic
	function selectClinic(clinicId) {
		selectedClinic = clinicId;
	}

	// Select a role
	function selectRole(roleId) {
		selectedRole = roleId;
	}
</script>

<div class="welcome-container">
	<div class="welcome-header">
		<h1>🏥 OpenHIE Mock EMR</h1>
		<p>FHIR Fundamentals 2026 - Aklan Workshop</p>
	</div>

	{#if error}
		<div class="error-message">
			⚠️ {error}
		</div>
	{/if}

	<form on:submit|preventDefault={handleSubmit} class="setup-form">
		<!-- Step 1: Workshop Code -->
		<div class="form-section">
			<label class="section-label">
				<span class="step-number">1</span>
				Workshop Code
			</label>
			<input
				type="text"
				bind:value={workshopCode}
				placeholder="Enter code (e.g., AK26-A)"
				class="text-input"
				disabled={isLoading}
			/>
			<p class="help-text">Your facilitator will provide this code</p>
		</div>

		<!-- Step 2: Your Name -->
		<div class="form-section">
			<label class="section-label">
				<span class="step-number">2</span>
				Your First Name
			</label>
			<input
				type="text"
				bind:value={userName}
				placeholder="Enter your first name"
				class="text-input"
				disabled={isLoading}
			/>
			<p class="help-text">This helps track your contributions</p>
		</div>

		<!-- Step 3: Select Clinic -->
		<div class="form-section">
			<label class="section-label">
				<span class="step-number">3</span>
				Select Your Clinic
			</label>
			<div class="clinic-grid">
				{#each CLINICS as clinic}
					<button
						type="button"
						class="clinic-card"
						class:selected={selectedClinic === clinic.id}
						style="--clinic-color: {clinic.color}"
						on:click={() => selectClinic(clinic.id)}
						disabled={isLoading}
					>
						<span class="clinic-icon">{clinic.icon}</span>
						<div class="clinic-info">
							<strong>{clinic.shortName}</strong>
							<span>{clinic.type}</span>
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Advanced: Select Role (optional) -->
		<div class="form-section">
			<button
				type="button"
				class="toggle-advanced"
				on:click={() => showAdvanced = !showAdvanced}
			>
				{showAdvanced ? '▼' : '▶'} Optional: Select Your Role
			</button>
			
			{#if showAdvanced}
				<div class="role-grid">
					{#each ROLES as role}
						<button
							type="button"
							class="role-card"
							class:selected={selectedRole === role.id}
							on:click={() => selectRole(role.id)}
							disabled={isLoading}
						>
							<span class="role-icon">{role.icon}</span>
							<div class="role-info">
								<strong>{role.name}</strong>
								<span>{role.description}</span>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Submit Button -->
		<button
			type="submit"
			class="submit-button"
			disabled={isLoading || !workshopCode || !userName || !selectedClinic}
		>
			{#if isLoading}
				<span class="spinner">⟳</span> Connecting to SHR...
			{:else}
				🚀 Enter OpenHIE System
			{/if}
		</button>
	</form>

	<div class="footer-info">
		<p>🔗 Connected to: <strong>cdr.fhirlab.net</strong></p>
		<p>📚 Terminology: <strong>tx.fhirlab.net</strong></p>
	</div>
</div>

<style>
	.welcome-container {
		max-width: 600px;
		margin: 0 auto;
		padding: 24px 16px;
		min-height: 100vh;
	}

	.welcome-header {
		text-align: center;
		margin-bottom: 32px;
	}

	.welcome-header h1 {
		font-size: 28px;
		font-weight: 700;
		margin: 0 0 8px 0;
		color: #111827;
	}

	.welcome-header p {
		font-size: 16px;
		color: #6B7280;
		margin: 0;
	}

	.error-message {
		background: #FEE2E2;
		border: 1px solid #FECACA;
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 24px;
		color: #DC2626;
		font-size: 14px;
	}

	.setup-form {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.section-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
		font-size: 16px;
		color: #374151;
	}

	.step-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: #2563EB;
		color: white;
		border-radius: 50%;
		font-size: 12px;
		font-weight: 700;
	}

	.text-input {
		padding: 16px;
		font-size: 16px;
		border: 2px solid #E5E7EB;
		border-radius: 12px;
		background: white;
		transition: border-color 0.2s;
	}

	.text-input:focus {
		outline: none;
		border-color: #2563EB;
	}

	.text-input:disabled {
		background: #F3F4F6;
		cursor: not-allowed;
	}

	.help-text {
		margin: 0;
		font-size: 13px;
		color: #6B7280;
	}

	.clinic-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	@media (min-width: 640px) {
		.clinic-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.clinic-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 16px 12px;
		border: 2px solid #E5E7EB;
		border-radius: 12px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
	}

	.clinic-card:hover {
		border-color: var(--clinic-color);
		transform: translateY(-2px);
	}

	.clinic-card.selected {
		border-color: var(--clinic-color);
		background: #F0FDF4;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.clinic-card:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.clinic-icon {
		font-size: 32px;
	}

	.clinic-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.clinic-info strong {
		font-size: 14px;
		color: #111827;
		text-align: center;
	}

	.clinic-info span {
		font-size: 12px;
		color: #6B7280;
	}

	.toggle-advanced {
		background: none;
		border: none;
		padding: 8px 0;
		color: #2563EB;
		font-size: 14px;
		cursor: pointer;
		text-align: left;
	}

	.role-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 8px;
		margin-top: 8px;
	}

	@media (min-width: 480px) {
		.role-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.role-card {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		border: 2px solid #E5E7EB;
		border-radius: 12px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.role-card:hover {
		border-color: #2563EB;
	}

	.role-card.selected {
		border-color: #2563EB;
		background: #EFF6FF;
	}

	.role-icon {
		font-size: 24px;
		flex-shrink: 0;
	}

	.role-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.role-info strong {
		font-size: 14px;
		color: #111827;
	}

	.role-info span {
		font-size: 12px;
		color: #6B7280;
	}

	.submit-button {
		padding: 18px 24px;
		font-size: 18px;
		font-weight: 600;
		color: white;
		background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
		border: none;
		border-radius: 14px;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 16px;
	}

	.submit-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
	}

	.submit-button:disabled {
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

	.footer-info {
		margin-top: 32px;
		padding-top: 24px;
		border-top: 1px solid #E5E7EB;
		text-align: center;
	}

	.footer-info p {
		margin: 4px 0;
		font-size: 13px;
		color: #6B7280;
	}
</style>
