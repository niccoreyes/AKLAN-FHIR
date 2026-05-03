<script>
	import AppHeader from '$components/AppHeader.svelte';
	import { CLINICS, FHIR_CONFIG, WORKSHON_TAG_SYSTEM } from '$constants';

	// Interactive state
	let selectedComponent = $state(null);
	let showTechnicalDetails = $state(false);
	let activeFlowStep = $state(0);

	const components = {
		pos: {
			id: 'pos',
			title: 'Point of Service (PoS)',
			icon: '🏥',
			color: '#059669',
			description: 'Clinical systems where healthcare workers directly interact with patients. Each clinic has its own EHR instance.',
			details: [
				'Register new patients',
				'Record vital signs and observations',
				'Document encounters and diagnoses',
				'Create medication requests and referrals',
				'Retrieve patient history from SHR'
			],
			examples: ['RHU Kalibo', 'Aklan Provincial Hospital', 'RHU Malay']
		},
		app: {
			id: 'app',
			title: 'OpenHIE Mock EHR',
			icon: '🔧',
			color: '#2563EB',
			description: 'This web application acts as the interoperability layer, connecting multiple PoS systems to the Shared Health Record.',
			details: [
				'Web-based Svelte 5 application',
				'URL-driven state (no localStorage)',
				'Mobile-first responsive design',
				'Supports 5 concurrent clinic roles',
				'Workshop isolation via FHIR meta.tag'
			],
			examples: ['Clinical View', 'Technical Dashboard', 'Architecture']
		},
		shr: {
			id: 'shr',
			title: 'Shared Health Record (SHR)',
			icon: '🗄️',
			color: '#7C3AED',
			description: 'The central repository that stores and shares patient health information across all connected systems.',
			details: [
				'FHIR R4 compliant server (cdr.fhirlab.net)',
				'Stores Patient, Encounter, Observation resources',
				'Retrieves complete patient history',
				'Workshop-tagged data isolation',
				'Public test server for learning'
			],
			examples: ['Patient demographics', 'Vital signs history', 'Encounter timeline']
		},
		terminology: {
			id: 'terminology',
			title: 'Terminology Server',
			icon: '📚',
			color: '#DC2626',
			description: 'Standardizes clinical concepts using coded values from international code systems.',
			details: [
				'LOINC codes for laboratory observations',
				'SNOMED CT for clinical conditions',
				'Validates codes in real-time',
				'Ensures semantic interoperability',
				'tx.fhirlab.net (Ontoserver)'
			],
			examples: ['85354-9 (Blood Pressure)', '38341003 (Hypertension)']
		}
	};

	const dataFlowSteps = [
		{ icon: '📝', title: 'Register Patient', desc: 'Clerk creates Patient resource with demographics and PhilHealth ID' },
		{ icon: '🩺', title: 'Record Vitals', desc: 'Nurse creates Observation resources (BP, HR, Temp) linked to Patient' },
		{ icon: '📋', title: 'Document Encounter', desc: 'Physician creates Encounter with diagnosis (Condition) and orders' },
		{ icon: '🔄', title: 'Share to SHR', desc: 'All resources saved to Shared Health Record with workshop tag' },
		{ icon: '🔍', title: 'Retrieve Anywhere', desc: 'Another clinic searches Patient by ID and sees complete history' }
	];

	const apiExamples = [
		{
			title: 'Create Patient',
			method: 'POST',
			url: `${FHIR_CONFIG.shrBaseUrl}/Patient`,
			body: `{
  "resourceType": "Patient",
  "name": [{"family": "Santos", "given": ["Maria"]}],
  "gender": "female",
  "birthDate": "1980-03-15",
  "identifier": [{
    "system": "http://philhealth.gov.ph/id",
    "value": "12-123456789-0"
  }],
  "meta": {
    "tag": [{
      "system": "${WORKSHON_TAG_SYSTEM}",
      "code": "AK26-A"
    }]
  }
}`
		},
		{
			title: 'Record Blood Pressure',
			method: 'POST',
			url: `${FHIR_CONFIG.shrBaseUrl}/Observation`,
			body: `{
  "resourceType": "Observation",
  "status": "final",
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "85354-9",
      "display": "Blood pressure panel"
    }]
  },
  "subject": {"reference": "Patient/123"},
  "component": [
    {
      "code": {"coding": [{"system": "http://loinc.org", "code": "8480-6"}]},
      "valueQuantity": {"value": 120, "unit": "mmHg"}
    },
    {
      "code": {"coding": [{"system": "http://loinc.org", "code": "8462-4"}]},
      "valueQuantity": {"value": 80, "unit": "mmHg"}
    }
  ]
}`
		},
		{
			title: 'Search by Workshop',
			method: 'GET',
			url: `${FHIR_CONFIG.shrBaseUrl}/Patient?_tag=${encodeURIComponent(WORKSHON_TAG_SYSTEM)}|AK26-A&_count=50`,
			body: null
		}
	];

	function selectComponent(id) {
		selectedComponent = selectedComponent === id ? null : id;
	}

	function nextFlowStep() {
		activeFlowStep = (activeFlowStep + 1) % dataFlowSteps.length;
	}

	function prevFlowStep() {
		activeFlowStep = (activeFlowStep - 1 + dataFlowSteps.length) % dataFlowSteps.length;
	}
</script>

<svelte:head>
	<title>Architecture | OpenHIE Mock EHR</title>
</svelte:head>

<div class="architecture-page">
	<AppHeader active="architecture" />

	<div class="content-area">
		<!-- Page Header -->
		<div class="page-header">
			<h2>🏗️ OpenHIE Architecture</h2>
			<p>Understanding how health information flows across systems</p>
		</div>

		<!-- Interactive Diagram -->
		<div class="section-card">
			<h3>System Components</h3>
			<p class="section-hint">Click each component to learn more</p>
			
			<div class="architecture-diagram">
				<!-- Clinics Row -->
				<div class="diagram-row">
					{#each CLINICS as clinic}
						<button 
							class="diagram-node clinic-node"
							onclick={() => selectComponent('pos')}
							style="--node-color: {clinic.color}"
						>
							<span class="node-icon">{clinic.icon}</span>
							<span class="node-label">{clinic.shortName}</span>
						</button>
					{/each}
				</div>

				<!-- Arrow Down -->
				<div class="diagram-arrow">↓</div>

				<!-- App Layer -->
				<button 
					class="diagram-node app-node"
					onclick={() => selectComponent('app')}
					class:active={selectedComponent === 'app'}
				>
					<span class="node-icon">🔧</span>
					<span class="node-label">OpenHIE Mock EHR</span>
					<span class="node-sub">Interoperability Layer</span>
				</button>

				<!-- Arrows Split -->
				<div class="diagram-split">
					<div class="split-line"></div>
					<div class="split-branches">
						<div class="branch">↙</div>
						<div class="branch">↘</div>
					</div>
				</div>

				<!-- Backend Row -->
				<div class="diagram-row backend-row">
					<button 
						class="diagram-node backend-node"
						onclick={() => selectComponent('shr')}
						class:active={selectedComponent === 'shr'}
						style="--node-color: #7C3AED"
					>
						<span class="node-icon">🗄️</span>
						<span class="node-label">Shared Health Record</span>
						<span class="node-sub">cdr.fhirlab.net</span>
					</button>
					
					<button 
						class="diagram-node backend-node"
						onclick={() => selectComponent('terminology')}
						class:active={selectedComponent === 'terminology'}
						style="--node-color: #DC2626"
					>
						<span class="node-icon">📚</span>
						<span class="node-label">Terminology Server</span>
						<span class="node-sub">tx.fhirlab.net</span>
					</button>
				</div>
			</div>

			<!-- Component Details Panel -->
			{#if selectedComponent}
				{@const comp = components[selectedComponent]}
				<div class="component-details">
					<div class="details-header" style="--detail-color: {comp.color}">
						<span class="details-icon">{comp.icon}</span>
						<div>
							<h4>{comp.title}</h4>
							<p>{comp.description}</p>
						</div>
					</div>
					<div class="details-body">
						<div class="details-list">
							<h5>Key Functions</h5>
							<ul>
								{#each comp.details as detail}
									<li>{detail}</li>
								{/each}
							</ul>
						</div>
						<div class="details-examples">
							<h5>Examples</h5>
							{#each comp.examples as example}
								<span class="example-tag">{example}</span>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Data Flow -->
		<div class="section-card">
			<h3>📊 Patient Data Flow</h3>
			<p class="section-hint">Follow how a patient record travels across the system</p>
			
			<div class="flow-container">
				<div class="flow-progress">
					{#each dataFlowSteps as step, i}
						<button 
							class="flow-step"
							class:active={i === activeFlowStep}
							onclick={() => activeFlowStep = i}
						>
							<span class="step-number">{i + 1}</span>
							<span class="step-icon">{step.icon}</span>
						</button>
						{#if i < dataFlowSteps.length - 1}
							<div class="step-connector" class:active={i < activeFlowStep}></div>
						{/if}
					{/each}
				</div>
				
				<div class="flow-detail">
					<h4>{dataFlowSteps[activeFlowStep].icon} {dataFlowSteps[activeFlowStep].title}</h4>
					<p>{dataFlowSteps[activeFlowStep].desc}</p>
				</div>
				
				<div class="flow-controls">
					<button class="flow-btn" onclick={prevFlowStep}>← Previous</button>
					<span class="flow-indicator">{activeFlowStep + 1} / {dataFlowSteps.length}</span>
					<button class="flow-btn" onclick={nextFlowStep}>Next →</button>
				</div>
			</div>
		</div>

		<!-- Workshop Isolation -->
		<div class="section-card">
			<h3>🏷️ Workshop Isolation</h3>
			<div class="isolation-explanation">
				<div class="isolation-visual">
					{#each ['AK26-A', 'AK26-B', 'AK26-C', 'AK26-D', 'AK26-E'] as tag, i}
						<div class="workshop-bucket" style="--bucket-color: hsl({i * 72}, 70%, 45%)">
							<div class="bucket-header">{tag}</div>
							<div class="bucket-items">
								{#each Array(3) as _, j}
									<div class="bucket-item" style="animation-delay: {i * 0.2 + j * 0.1}s"></div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
				<div class="isolation-text">
					<p>Each workshop group has completely isolated data. Resources are tagged with the workshop code in their <code>meta.tag</code> field:</p>
					<pre class="code-block">{""}"meta": {""}
{""}  "tag": [{""}
{""}    "system": "{WORKSHON_TAG_SYSTEM}",""}
{""}    "code": "AK26-A"{""}
{""}  ]{""}
{""}{""}</pre>
					<p>When searching, the app filters by tag: <code>_tag=https://aklan-fhir.app/workshop|AK26-A</code></p>
					<p><strong>Result:</strong> Group A never sees Group B's patients. Facilitators can wipe one group's data without affecting others.</p>
				</div>
			</div>
		</div>

		<!-- Why It Matters -->
		<div class="section-card">
			<h3>💡 Why This Matters</h3>
			<div class="benefits-grid">
				<div class="benefit-card">
					<div class="benefit-icon">🗄️</div>
					<h4>Without SHR</h4>
					<ul>
						<li>Each clinic has separate patient records</li>
						<li>Patients carry paper folders between facilities</li>
						<li>No history available at new clinics</li>
						<li>Duplicate tests and prescriptions</li>
					</ul>
				</div>
				<div class="benefit-card benefit-positive">
					<div class="benefit-icon">✅</div>
					<h4>With SHR</h4>
					<ul>
						<li>One patient, one complete record</li>
						<li>History available at every clinic instantly</li>
						<li>Better clinical decisions with full context</li>
						<li>Reduced costs, improved outcomes</li>
					</ul>
				</div>
				<div class="benefit-card">
					<div class="benefit-icon">❓</div>
					<h4>Without Terminology</h4>
					<ul>
						<li>"Blood Pressure" = 10 different strings</li>
						<li>Systems can't understand each other</li>
						<li>Manual mapping between hospitals</li>
						<li>Errors in data exchange</li>
					</ul>
				</div>
				<div class="benefit-card benefit-positive">
					<div class="benefit-icon">📚</div>
					<h4>With Terminology</h4>
					<ul>
						<li>LOINC 85354-9 = one universal code</li>
						<li>Semantic interoperability</li>
						<li>Accurate reporting and analytics</li>
						<li>Global standard compliance</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- URL State -->
		<div class="section-card">
			<h3>🔗 URL-Driven State</h3>
			<p>This app uses the URL to store all participant identity — no accounts, no passwords, no localStorage.</p>
			
			<div class="url-example">
				<div class="url-bar">
					<span class="url-base">https://aklan-fhir.vercel.app</span>
					<span class="url-params">?w=AK26-A&u=Ana&c=rhu-kalibo</span>
				</div>
				<div class="url-legend">
					<div class="url-param">
						<span class="param-key">w</span>
						<span class="param-desc">Workshop code (group isolation)</span>
					</div>
					<div class="url-param">
						<span class="param-key">u</span>
						<span class="param-desc">User first name (participant tracking)</span>
					</div>
					<div class="url-param">
						<span class="param-key">c</span>
						<span class="param-desc">Clinic ID (role context)</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Technical Details Toggle -->
		<div class="section-card">
			<details bind:open={showTechnicalDetails}>
				<summary class="tech-toggle">
					<span>🔧 Show Technical Details</span>
					<span class="toggle-hint">Raw API examples for developers</span>
				</summary>
				
				<div class="technical-content">
					<h4>Raw HTTP API Examples</h4>
					{#each apiExamples as example}
						<div class="api-example">
							<div class="api-header">
								<span class="api-method">{example.method}</span>
								<span class="api-title">{example.title}</span>
							</div>
							<div class="api-url">{example.url}</div>
							{#if example.body}
								<pre class="api-body">{example.body}</pre>
							{/if}
						</div>
					{/each}
					
					<h4>Tech Stack</h4>
					<div class="tech-stack">
						<div class="tech-item">
							<strong>Frontend</strong>
							<span>Svelte 5 + SvelteKit</span>
						</div>
						<div class="tech-item">
							<strong>Deployment</strong>
							<span>Vercel (Serverless)</span>
						</div>
						<div class="tech-item">
							<strong>FHIR Version</strong>
							<span>R4 (4.0.1)</span>
						</div>
						<div class="tech-item">
							<strong>State Management</strong>
							<span>URL query parameters</span>
						</div>
						<div class="tech-item">
							<strong>Terminology</strong>
							<span>Ontoserver 6.25 (LOINC + SNOMED CT)</span>
						</div>
						<div class="tech-item">
							<strong>Testing</strong>
							<span>Playwright E2E</span>
						</div>
					</div>
				</div>
			</details>
		</div>
	</div>
</div>

<style>
	.architecture-page {
		min-height: 100vh;
		background: #F8FAFC;
	}

	.content-area {
		padding: 24px;
		max-width: 1000px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 24px;
	}

	.page-header h2 {
		margin: 0 0 4px 0;
		font-size: 24px;
		color: #1E293B;
	}

	.page-header p {
		margin: 0;
		font-size: 15px;
		color: #64748B;
	}

	.section-card {
		background: white;
		border: 1px solid #E2E8F0;
		border-radius: 12px;
		padding: 24px;
		margin-bottom: 24px;
	}

	.section-card h3 {
		margin: 0 0 8px 0;
		font-size: 18px;
		color: #1E293B;
	}

	.section-hint {
		font-size: 14px;
		color: #94A3B8;
		margin: 0 0 20px 0;
	}

	/* Architecture Diagram */
	.architecture-diagram {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 20px 0;
	}

	.diagram-row {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.diagram-node {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 16px 20px;
		border: 2px solid #E2E8F0;
		border-radius: 12px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 120px;
	}

	.diagram-node:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
	}

	.diagram-node.active {
		border-color: var(--node-color, #2563EB);
		background: color-mix(in srgb, var(--node-color, #2563EB) 5%, white);
	}

	.clinic-node {
		border-color: color-mix(in srgb, var(--node-color) 30%, #E2E8F0);
	}

	.clinic-node:hover {
		border-color: var(--node-color);
	}

	.app-node {
		border-color: #2563EB;
		background: #EFF6FF;
		min-width: 200px;
	}

	.backend-node {
		border-color: var(--node-color);
		min-width: 180px;
	}

	.node-icon {
		font-size: 24px;
	}

	.node-label {
		font-size: 13px;
		font-weight: 600;
		color: #1E293B;
	}

	.node-sub {
		font-size: 11px;
		color: #64748B;
	}

	.diagram-arrow {
		font-size: 24px;
		color: #94A3B8;
	}

	.diagram-split {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 200px;
	}

	.split-line {
		width: 2px;
		height: 20px;
		background: #E2E8F0;
	}

	.split-branches {
		display: flex;
		justify-content: space-between;
		width: 100%;
		padding: 0 40px;
	}

	.branch {
		font-size: 20px;
		color: #94A3B8;
	}

	/* Component Details */
	.component-details {
		margin-top: 20px;
		border: 1px solid #E2E8F0;
		border-radius: 12px;
		overflow: hidden;
	}

	.details-header {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		background: color-mix(in srgb, var(--detail-color) 8%, white);
		border-bottom: 1px solid #E2E8F0;
	}

	.details-icon {
		font-size: 32px;
	}

	.details-header h4 {
		margin: 0 0 4px 0;
		font-size: 16px;
		color: var(--detail-color);
	}

	.details-header p {
		margin: 0;
		font-size: 14px;
		color: #475569;
	}

	.details-body {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 20px;
		padding: 16px;
	}

	@media (max-width: 640px) {
		.details-body {
			grid-template-columns: 1fr;
		}
	}

	.details-list h5 {
		margin: 0 0 8px 0;
		font-size: 13px;
		color: #64748B;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.details-list ul {
		margin: 0;
		padding-left: 18px;
	}

	.details-list li {
		font-size: 14px;
		color: #475569;
		margin-bottom: 4px;
	}

	.details-examples h5 {
		margin: 0 0 8px 0;
		font-size: 13px;
		color: #64748B;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.example-tag {
		display: inline-block;
		padding: 4px 10px;
		background: #F1F5F9;
		border-radius: 20px;
		font-size: 12px;
		color: #475569;
		margin: 0 4px 4px 0;
	}

	/* Data Flow */
	.flow-container {
		padding: 20px 0;
	}

	.flow-progress {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0;
		margin-bottom: 24px;
		flex-wrap: wrap;
	}

	.flow-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 10px;
		background: #F8FAFC;
		border: 2px solid #E2E8F0;
		border-radius: 10px;
		cursor: pointer;
		min-width: 70px;
		transition: all 0.2s;
	}

	.flow-step:hover {
		border-color: #CBD5E1;
	}

	.flow-step.active {
		border-color: #2563EB;
		background: #EFF6FF;
	}

	.step-number {
		font-size: 11px;
		font-weight: 700;
		color: #94A3B8;
	}

	.flow-step.active .step-number {
		color: #2563EB;
	}

	.step-icon {
		font-size: 24px;
	}

	.step-connector {
		width: 30px;
		height: 2px;
		background: #E2E8F0;
		transition: background 0.3s;
	}

	.step-connector.active {
		background: #2563EB;
	}

	.flow-detail {
		text-align: center;
		padding: 20px;
		background: #F8FAFC;
		border-radius: 10px;
		margin-bottom: 16px;
	}

	.flow-detail h4 {
		margin: 0 0 8px 0;
		font-size: 18px;
		color: #1E293B;
	}

	.flow-detail p {
		margin: 0;
		font-size: 15px;
		color: #475569;
	}

	.flow-controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 16px;
	}

	.flow-btn {
		padding: 8px 16px;
		background: white;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		color: #475569;
		font-size: 14px;
		cursor: pointer;
		font-weight: 500;
	}

	.flow-btn:hover {
		background: #F1F5F9;
	}

	.flow-indicator {
		font-size: 14px;
		color: #94A3B8;
		font-weight: 500;
	}

	/* Workshop Isolation */
	.isolation-explanation {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
		align-items: start;
	}

	@media (max-width: 768px) {
		.isolation-explanation {
			grid-template-columns: 1fr;
		}
	}

	.isolation-visual {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.workshop-bucket {
		width: 100px;
		border: 2px solid var(--bucket-color);
		border-radius: 10px;
		padding: 8px;
		background: color-mix(in srgb, var(--bucket-color) 5%, white);
	}

	.bucket-header {
		font-size: 12px;
		font-weight: 700;
		color: var(--bucket-color);
		text-align: center;
		margin-bottom: 8px;
	}

	.bucket-items {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.bucket-item {
		height: 16px;
		background: var(--bucket-color);
		border-radius: 4px;
		opacity: 0.6;
	}

	.isolation-text {
		font-size: 14px;
		color: #475569;
		line-height: 1.6;
	}

	.isolation-text p {
		margin: 0 0 12px 0;
	}

	.code-block {
		background: #1E293B;
		color: #E2E8F0;
		padding: 12px;
		border-radius: 8px;
		font-size: 12px;
		overflow-x: auto;
		font-family: monospace;
	}

	/* Benefits Grid */
	.benefits-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
	}

	@media (max-width: 640px) {
		.benefits-grid {
			grid-template-columns: 1fr;
		}
	}

	.benefit-card {
		padding: 20px;
		background: #F8FAFC;
		border: 1px solid #E2E8F0;
		border-radius: 10px;
	}

	.benefit-card.benefit-positive {
		background: #F0FDF4;
		border-color: #BBF7D0;
	}

	.benefit-icon {
		font-size: 28px;
		margin-bottom: 8px;
	}

	.benefit-card h4 {
		margin: 0 0 10px 0;
		font-size: 15px;
		color: #1E293B;
	}

	.benefit-card ul {
		margin: 0;
		padding-left: 18px;
	}

	.benefit-card li {
		font-size: 13px;
		color: #475569;
		margin-bottom: 4px;
	}

	/* URL Example */
	.url-example {
		margin-top: 16px;
	}

	.url-bar {
		background: #1E293B;
		color: #E2E8F0;
		padding: 12px 16px;
		border-radius: 8px;
		font-family: monospace;
		font-size: 13px;
		overflow-x: auto;
		white-space: nowrap;
		margin-bottom: 16px;
	}

	.url-base {
		color: #94A3B8;
	}

	.url-params {
		color: #60A5FA;
	}

	.url-legend {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.url-param {
		display: flex;
		gap: 12px;
		align-items: center;
		padding: 8px 12px;
		background: #F8FAFC;
		border-radius: 6px;
	}

	.param-key {
		font-family: monospace;
		font-weight: 700;
		color: #2563EB;
		min-width: 24px;
	}

	.param-desc {
		font-size: 14px;
		color: #475569;
	}

	/* Technical Toggle */
	.tech-toggle {
		cursor: pointer;
		font-weight: 600;
		color: #475569;
		padding: 8px 0;
		list-style: none;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.tech-toggle::-webkit-details-marker {
		display: none;
	}

	.toggle-hint {
		font-size: 13px;
		color: #94A3B8;
		font-weight: 400;
	}

	.technical-content {
		padding-top: 16px;
		border-top: 1px solid #E2E8F0;
		margin-top: 8px;
	}

	.technical-content h4 {
		margin: 0 0 12px 0;
		font-size: 14px;
		color: #475569;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.api-example {
		margin-bottom: 16px;
		border: 1px solid #E2E8F0;
		border-radius: 8px;
		overflow: hidden;
	}

	.api-header {
		display: flex;
		gap: 8px;
		align-items: center;
		padding: 10px 12px;
		background: #F8FAFC;
		border-bottom: 1px solid #E2E8F0;
	}

	.api-method {
		padding: 2px 8px;
		background: #2563EB;
		color: white;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 700;
	}

	.api-title {
		font-size: 14px;
		font-weight: 600;
		color: #1E293B;
	}

	.api-url {
		padding: 8px 12px;
		font-size: 12px;
		color: #64748B;
		font-family: monospace;
		background: #F8FAFC;
		border-bottom: 1px solid #E2E8F0;
	}

	.api-body {
		margin: 0;
		padding: 12px;
		background: #1E293B;
		color: #E2E8F0;
		font-size: 12px;
		overflow-x: auto;
		font-family: monospace;
	}

	.tech-stack {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 12px;
	}

	.tech-item {
		padding: 12px;
		background: #F8FAFC;
		border-radius: 8px;
	}

	.tech-item strong {
		display: block;
		font-size: 13px;
		color: #1E293B;
		margin-bottom: 2px;
	}

	.tech-item span {
		font-size: 13px;
		color: #64748B;
	}
</style>
