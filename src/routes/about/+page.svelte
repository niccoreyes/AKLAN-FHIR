<script>
	import AppHeader from '$components/AppHeader.svelte';
	import { APP_NAME, APP_VERSION } from '$constants';
</script>

<svelte:head>
	<title>About | OpenHIE Mock EHR</title>
</svelte:head>

<div class="about-page">
	<AppHeader active="about" />

	<div class="content-area">
		<div class="about-card">
			<div class="about-header">
				<span class="about-icon">🏥</span>
				<h1>{APP_NAME}</h1>
				<span class="version">v{APP_VERSION}</span>
			</div>

			<div class="about-section">
				<h2>🎓 Workshop</h2>
				<p><strong>FHIR Fundamentals 2026 — Aklan, Philippines</strong></p>
				<p>This interactive Mock EHR was built for the FHIR Fundamentals workshop to demonstrate OpenHIE interoperability concepts using real FHIR R4 APIs.</p>
			</div>

			<div class="about-section">
				<h2>🎯 Purpose</h2>
				<ul>
					<li>Teach healthcare professionals how FHIR enables data sharing</li>
					<li>Demonstrate OpenHIE architecture with live systems</li>
					<li>Let participants create and retrieve real FHIR resources</li>
					<li>Show the value of standardized terminology (LOINC, SNOMED CT)</li>
				</ul>
			</div>

			<div class="about-section">
				<h2>🛠️ Tech Stack</h2>
				<div class="tech-grid">
					<div class="tech-card">
						<strong>Frontend</strong>
						<span>Svelte 5 + SvelteKit</span>
					</div>
					<div class="tech-card">
						<strong>Deployment</strong>
						<span>Vercel (Serverless)</span>
					</div>
					<div class="tech-card">
						<strong>FHIR Version</strong>
						<span>R4 (4.0.1)</span>
					</div>
					<div class="tech-card">
						<strong>State</strong>
						<span>URL query parameters</span>
					</div>
					<div class="tech-card">
						<strong>SHR Server</strong>
						<span>cdr.fhirlab.net</span>
					</div>
					<div class="tech-card">
						<strong>Terminology</strong>
						<span>tx.fhirlab.net (Ontoserver)</span>
					</div>
				</div>
			</div>

			<div class="about-section">
				<h2>⚠️ Important Notes</h2>
				<div class="notice">
					<p><strong>Test Environment Only</strong></p>
					<p>This application connects to public test FHIR servers. All data is synthetic and will be cleared periodically. Do not enter real patient information.</p>
				</div>
			</div>

			<div class="about-section">
				<h2>🔗 Connected Systems</h2>
				<div class="systems-list">
					<div class="system-item">
						<span class="system-status online"></span>
						<div>
							<strong>Shared Health Record</strong>
							<span>cdr.fhirlab.net — FHIR R4 server for patient data</span>
						</div>
					</div>
					<div class="system-item">
						<span class="system-status online"></span>
						<div>
							<strong>Terminology Server</strong>
							<span>tx.fhirlab.net — LOINC, SNOMED CT validation</span>
						</div>
					</div>
				</div>
			</div>

			<div class="about-footer">
				<p>Made with ❤️ for the Philippine healthcare interoperability community</p>
				<p class="credits">Powered by <a href="https://svelte.dev" target="_blank">Svelte</a>, <a href="https://hl7.org/fhir" target="_blank">FHIR</a>, and <a href="https://ohie.org" target="_blank">OpenHIE</a></p>
			</div>
		</div>
	</div>
</div>

<style>
	.about-page {
		min-height: 100vh;
		background: #F8FAFC;
	}

	.content-area {
		padding: 24px;
		max-width: 800px;
		margin: 0 auto;
	}

	.about-card {
		background: white;
		border: 1px solid #E2E8F0;
		border-radius: 16px;
		padding: 32px;
	}

	.about-header {
		text-align: center;
		margin-bottom: 32px;
		padding-bottom: 24px;
		border-bottom: 1px solid #E2E8F0;
	}

	.about-icon {
		font-size: 48px;
		display: block;
		margin-bottom: 8px;
	}

	.about-header h1 {
		margin: 0 0 4px 0;
		font-size: 24px;
		color: #1E293B;
	}

	.version {
		font-size: 13px;
		color: #94A3B8;
		font-family: monospace;
		background: #F1F5F9;
		padding: 2px 8px;
		border-radius: 4px;
	}

	.about-section {
		margin-bottom: 28px;
	}

	.about-section h2 {
		font-size: 16px;
		color: #1E293B;
		margin: 0 0 12px 0;
	}

	.about-section p {
		font-size: 14px;
		color: #475569;
		line-height: 1.6;
		margin: 0 0 8px 0;
	}

	.about-section ul {
		margin: 0;
		padding-left: 20px;
	}

	.about-section li {
		font-size: 14px;
		color: #475569;
		margin-bottom: 6px;
		line-height: 1.5;
	}

	.tech-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 12px;
	}

	.tech-card {
		padding: 12px;
		background: #F8FAFC;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
	}

	.tech-card strong {
		display: block;
		font-size: 13px;
		color: #1E293B;
		margin-bottom: 2px;
	}

	.tech-card span {
		font-size: 12px;
		color: #64748B;
	}

	.notice {
		padding: 16px;
		background: #FEF3C7;
		border: 1px solid #FDE68A;
		border-radius: 10px;
	}

	.notice p {
		margin: 0;
		color: #92400E;
	}

	.notice p strong {
		display: block;
		margin-bottom: 4px;
	}

	.systems-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.system-item {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 12px;
		background: #F8FAFC;
		border-radius: 8px;
	}

	.system-status {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		margin-top: 4px;
		flex-shrink: 0;
	}

	.system-status.online {
		background: #10B981;
	}

	.system-item strong {
		display: block;
		font-size: 14px;
		color: #1E293B;
	}

	.system-item span {
		font-size: 13px;
		color: #64748B;
	}

	.about-footer {
		text-align: center;
		padding-top: 24px;
		border-top: 1px solid #E2E8F0;
		margin-top: 8px;
	}

	.about-footer p {
		margin: 0 0 4px 0;
		font-size: 14px;
		color: #475569;
	}

	.credits {
		font-size: 13px !important;
		color: #94A3B8 !important;
	}

	.credits a {
		color: #2563EB;
		text-decoration: none;
	}

	.credits a:hover {
		text-decoration: underline;
	}
</style>
