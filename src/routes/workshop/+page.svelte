<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { appStore } from '$stores/appStore.svelte.js';
	import { CLINICS, ROLES } from '$constants';

	// Predefined workshop codes
	const PREDEFINED_WORKSHOPS = ['AK26-A', 'AK26-B', 'AK26-C', 'AK26-D', 'AK26-E'];

	// Form state
	let workshopCode = $state(appStore.workshopCode || '');
	let userName = $state(appStore.userName || '');
	let selectedClinic = $state(appStore.clinicId || CLINICS[0]?.id || '');
	let selectedRole = $state(appStore.roleId || '');
	let isLoading = $state(false);
	let error = $state('');

	// Autocomplete state
	let showDropdown = $state(false);
	let highlightedIndex = $state(-1);
	let filteredWorkshops = $state([]);

	// Filter workshops based on input
	function filterWorkshops(input) {
		if (!input) {
			filteredWorkshops = PREDEFINED_WORKSHOPS;
			return;
		}
		const searchTerm = input.toLowerCase();
		filteredWorkshops = PREDEFINED_WORKSHOPS.filter(w => 
			w.toLowerCase().includes(searchTerm)
		);
	}

	// Handle input changes
	function handleWorkshopInput(e) {
		workshopCode = e.target.value;
		filterWorkshops(workshopCode);
		showDropdown = true;
		highlightedIndex = -1;
	}

	// Handle keyboard navigation
	function handleKeydown(e) {
		if (!showDropdown) return;

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				highlightedIndex = (highlightedIndex + 1) % filteredWorkshops.length;
				break;
			case 'ArrowUp':
				e.preventDefault();
				highlightedIndex = highlightedIndex <= 0 ? filteredWorkshops.length - 1 : highlightedIndex - 1;
				break;
			case 'Tab':
			case 'Enter':
				if (highlightedIndex >= 0 && filteredWorkshops[highlightedIndex]) {
					e.preventDefault();
					selectWorkshop(filteredWorkshops[highlightedIndex]);
				}
				break;
			case 'Escape':
				showDropdown = false;
				highlightedIndex = -1;
				break;
		}
	}

	// Select a workshop
	function selectWorkshop(code) {
		workshopCode = code;
		showDropdown = false;
		highlightedIndex = -1;
	}

	// Handle input focus
	function handleFocus() {
		filterWorkshops(workshopCode);
		showDropdown = true;
	}

	// Handle input blur (delayed to allow clicks)
	function handleBlur() {
		setTimeout(() => {
			showDropdown = false;
			highlightedIndex = -1;
		}, 200);
	}

	// Redirect if already configured (use replaceState to avoid back-button issues)
	onMount(() => {
		if (browser && appStore.isConfigured) {
			// Use window.location.replace to avoid adding to history stack
			// Preserve workshop parameters
			window.location.replace(appStore.buildUrl('/dashboard'));
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
			goto(appStore.buildUrl('/dashboard'));
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
			<div class="header-top">
				<a href="/" class="back-link">← Public Viewer</a>
				{#if appStore.isConfigured}
					<a href={appStore.buildUrl('/dashboard')} class="dashboard-link">Dashboard →</a>
				{/if}
			</div>
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
				
				<!-- Autocomplete Input -->
				<div class="autocomplete-wrapper">
					<input
						id="workshop-code"
						type="text"
						value={workshopCode}
						placeholder="Type or select a workshop code..."
						class="input"
						disabled={isLoading}
						oninput={handleWorkshopInput}
						onkeydown={handleKeydown}
						onfocus={handleFocus}
						onblur={handleBlur}
						autocomplete="off"
					/>
					
					{#if showDropdown && filteredWorkshops.length > 0}
						<div class="autocomplete-dropdown">
							{#each filteredWorkshops as workshop, index}
								<button
									type="button"
									class="dropdown-item"
									class:highlighted={index === highlightedIndex}
									onclick={() => selectWorkshop(workshop)}
								>
									🏷️ {workshop}
								</button>
							{/each}
						</div>
					{/if}
				</div>
				
				<!-- Chips -->
				<div class="chips-container">
					<span class="chips-label">Quick select:</span>
					<div class="chips">
						{#each PREDEFINED_WORKSHOPS as workshop}
							<button
								type="button"
								class="chip"
								class:selected={workshopCode === workshop}
								onclick={() => selectWorkshop(workshop)}
								disabled={isLoading}
							>
								{workshop}
							</button>
						{/each}
					</div>
				</div>
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

			<!-- Role Selection (Always Visible) -->
			<div class="field">
				<span class="label">Select Your Role (Optional)</span>
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
			</div>

			<!-- Submit -->
			<button
				type="submit"
				class="submit"
				disabled={isLoading || !workshopCode || !userName || !selectedClinic}
				data-loading={isLoading}
				data-has-workshop={!!workshopCode}
				data-has-username={!!userName}
				data-has-clinic={!!selectedClinic}
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
			<div class="footer-links">
				<a href="/" class="back-link">← Public Viewer</a>
				{#if appStore.isConfigured}
					<a href={appStore.buildUrl('/dashboard')} class="dashboard-link">Dashboard →</a>
				{/if}
			</div>
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

	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 1px solid #e2e8f0;
	}

	.back-link,
	.dashboard-link {
		font-size: 13px;
		color: #64748b;
		text-decoration: none;
		padding: 6px 12px;
		border-radius: 8px;
		transition: all 0.2s;
	}

	.back-link:hover,
	.dashboard-link:hover {
		color: #0f172a;
		background: #f1f5f9;
	}

	.dashboard-link {
		color: #059669;
		font-weight: 500;
	}

	.dashboard-link:hover {
		color: #047857;
		background: #d1fae5;
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
	}

	.footer-links {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
	}

	.footer .back-link,
	.footer .dashboard-link {
		font-size: 14px;
		font-weight: 500;
		color: #64748b;
		text-decoration: none;
		transition: color 0.2s;
		padding: 8px 16px;
		border-radius: 8px;
	}

	.footer .back-link:hover,
	.footer .dashboard-link:hover {
		color: #0f172a;
		text-decoration: underline;
		background: #f1f5f9;
	}

	.footer .dashboard-link {
		color: #059669;
	}

	.footer .dashboard-link:hover {
		color: #047857;
		background: #d1fae5;
	}

	/* Autocomplete */
	.autocomplete-wrapper {
		position: relative;
	}

	.autocomplete-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #e2e8f0;
		border-top: none;
		border-radius: 0 0 10px 10px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		z-index: 100;
		max-height: 200px;
		overflow-y: auto;
	}

	.dropdown-item {
		display: block;
		width: 100%;
		padding: 10px 14px;
		background: white;
		border: none;
		text-align: left;
		cursor: pointer;
		font-size: 14px;
		transition: background 0.15s;
	}

	.dropdown-item:hover,
	.dropdown-item.highlighted {
		background: #eff6ff;
		color: #2563eb;
	}

	/* Chips */
	.chips-container {
		margin-top: 12px;
	}

	.chips-label {
		display: block;
		font-size: 12px;
		color: #64748b;
		margin-bottom: 8px;
		font-weight: 500;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.chip {
		padding: 6px 14px;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		border-radius: 20px;
		font-size: 13px;
		font-weight: 500;
		color: #475569;
		cursor: pointer;
		transition: all 0.2s;
	}

	.chip:hover {
		background: #e2e8f0;
		border-color: #cbd5e1;
	}

	.chip.selected {
		background: #2563eb;
		border-color: #2563eb;
		color: white;
	}

	.chip:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
