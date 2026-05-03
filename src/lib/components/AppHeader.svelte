<script>
	import { page } from '$app/stores';
	import { APP_NAME } from '$constants';

	let { active = 'clinical' } = $props();

	let serverStatus = $state('checking');

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

	const navItems = [
		{ id: 'clinical', label: 'Clinical View', href: '/' },
		{ id: 'developer', label: 'Technical Dashboard', href: '/developer' },
		{ id: 'architecture', label: 'Architecture', href: '/architecture' },
		{ id: 'about', label: 'About', href: '/about' }
	];
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
</style>
