<script>
	import AppHeader from '$components/AppHeader.svelte';
	import { FHIR_CONFIG, WORKSHON_TAG_SYSTEM } from '$constants';

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
			description: 'Clinical systems where healthcare workers directly interact with patients. Each institution has its own EHR instance for registration, vitals, encounters, and clinical documentation.',
			details: [
				'RHU - Rural Health Unit for primary care',
				'Hospital - Provincial and district hospitals',
				'Pharmacy - Medication dispensing and inventory',
				'Laboratory - Diagnostic test ordering and results',
				'Each PoS connects through its own Demo EHR instance'
			],
			examples: ['RHU Kalibo', 'Aklan Provincial Hospital', 'Kalibo Lab']
		},
		demoEhr: {
			id: 'demoEhr',
			title: 'Demo EHR per Institution',
			icon: '💻',
			color: '#2563EB',
			description: 'Instance of the Mock EHR application deployed at each Point of Service. Simulates a real EHR system connecting to the interoperability layer.',
			details: [
				'Web-based FHIR R4 client application',
				'Dedicated instance per clinic/institution',
				'User authentication and role management',
				'Patient registration and clinical workflows',
				'Sends FHIR resources to Interoperability Layer'
			],
			examples: ['RHU-Kalibo EHR', 'Hospital EHR', 'Pharmacy EHR']
		},
		interoperability: {
			id: 'interoperability',
			title: 'Interoperability Layer (IL)',
			icon: '🔀',
			color: '#F59E0B',
			description: 'Middleware that routes, transforms, and orchestrates health data between PoS systems and the Shared Health Record. Can be OpenHIM, Mirth Connect, or custom implementation.',
			details: [
				'OpenHIM: Open-source middleware with mediator framework',
				'Mirth Connect: Integration engine with HL7/FHIR transformers',
				'Message routing and protocol adaptation',
				'Authentication, authorization, and audit logging',
				'Error handling, retry logic, and transaction management'
			],
			examples: ['OpenHIM Core', 'Mirth Connect Channels', 'FHIR Gateway']
		},
		shr: {
			id: 'shr',
			title: 'Shared Health Record (SHR)',
			icon: '🗄️',
			color: '#7C3AED',
			description: 'The central repository that stores and shares patient health information across all connected systems. Receives standardized FHIR resources via the Interoperability Layer.',
			details: [
				'FHIR R4 compliant server (cdr.fhirlab.net)',
				'Stores Patient, Encounter, Observation, Condition resources',
				'Provides complete patient history on request',
				'Workshop-tagged data isolation',
				'Public test server for learning and demonstration'
			],
			examples: ['Patient demographics', 'Vital signs history', 'Encounter timeline']
		},
		terminology: {
			id: 'terminology',
			title: 'Terminology Server',
			icon: '📚',
			color: '#DC2626',
			description: 'Standardizes clinical concepts using coded values from international code systems. Ensures semantic interoperability across all components.',
			details: [
				'LOINC codes for laboratory observations',
				'SNOMED CT for clinical conditions and procedures',
				'ICD-10 for diagnosis classification',
				'Validates codes in real-time via FHIR $validate',
				'tx.fhirlab.net (Ontoserver or HAPI FHIR)'
			],
			examples: ['85354-9 (Blood Pressure)', '38341003 (Hypertension)']
		}
	};

	const dataFlowSteps = [
		{ icon: '🏥', title: 'PoS System', desc: 'Clerk at RHU uses local Demo EHR to register patient with demographics' },
		{ icon: '💻', title: 'Demo EHR', desc: 'EHR creates FHIR resources (Patient, Observation) locally' },
		{ icon: '🔀', title: 'Interop Layer', desc: 'FHIR resources routed via OpenHIM/Mirth to SHR with authentication' },
		{ icon: '🗄️', title: 'SHR Storage', desc: 'Shared Health Record stores resources tagged by workshop/institution' },
		{ icon: '🔍', title: 'Cross-Institution', desc: 'Hospital retrieves complete patient history via Interop Layer' }
	];

	// Architecture tiers for layered display
	const architectureTiers = [
		{
			tier: 'Point of Service (PoS)',
			icon: '🏥',
			color: '#059669',
			nodes: [
				{ name: 'RHU Kalibo', type: 'pos', icon: '🏥' },
				{ name: 'Aklan Hospital', type: 'pos', icon: '🏥' },
				{ name: 'Kalibo Lab', type: 'pos', icon: '🧪' },
				{ name: 'Local Pharmacy', type: 'pos', icon: '💊' }
			]
		},
		{
			tier: 'Demo EHR Layer',
			icon: '💻',
			color: '#2563EB',
			nodes: [
				{ name: 'RHU EHR', type: 'demoEhr', icon: '💻' },
				{ name: 'Hospital EHR', type: 'demoEhr', icon: '💻' },
				{ name: 'Lab EHR', type: 'demoEhr', icon: '💻' },
				{ name: 'Pharmacy EHR', type: 'demoEhr', icon: '💻' }
			]
		},
		{
			tier: 'Interoperability Layer',
			icon: '🔀',
			color: '#F59E0B',
			nodes: [
				{ name: 'OpenHIM / Mirth', type: 'interoperability', icon: '🔀' }
			]
		},
		{
			tier: 'Shared Services',
			icon: '🌐',
			color: '#7C3AED',
			nodes: [
				{ name: 'Shared Health Record', type: 'shr', icon: '🗄️' },
				{ name: 'Terminology Server', type: 'terminology', icon: '📚' }
			]
		}
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

		<!-- Architecture Overview -->
		<div class="section-card">
			<h3>🏗️ OpenHIE Architecture</h3>
			<p class="section-hint">
				Each Point of Service connects via <strong>FHIR</strong> through the Interoperability Layer
				to access Shared Services.
			</p>

			<!-- Architecture Diagram -->
			<div class="arch-diagram">

				<!-- POS Zone -->
				<div class="arch-zone arch-zone-pos">
					<div class="arch-zone-header">
						<span>🏥</span>
						<span>POINT OF SERVICE</span>
					</div>
					<div class="arch-zone-body">
						<button class="arch-comp" onclick={() => selectComponent('pos')}>
							<span class="arch-comp-icon">🏥</span>
							<span class="arch-comp-label">RHU Kalibo</span>
						</button>
						<button class="arch-comp" onclick={() => selectComponent('pos')}>
							<span class="arch-comp-icon">🏥</span>
							<span class="arch-comp-label">Aklan Hospital</span>
						</button>
						<button class="arch-comp" onclick={() => selectComponent('pos')}>
							<span class="arch-comp-icon">🧪</span>
							<span class="arch-comp-label">Kalibo Lab</span>
						</button>
						<button class="arch-comp" onclick={() => selectComponent('pos')}>
							<span class="arch-comp-icon">💊</span>
							<span class="arch-comp-label">Local Pharmacy</span>
						</button>
					</div>
				</div>

				<!-- Single Arrow PoS → Interop with FHIR label -->
				<div class="arch-arrow-group">
					<div class="arch-arrow-line"></div>
					<span class="arch-arrow-badge">FHIR</span>
				</div>

				<!-- Interop Zone -->
				<div class="arch-zone arch-zone-interop">
					<div class="arch-zone-header">
						<span>🔀</span>
						<span>INTEROPERABILITY LAYER</span>
					</div>
					<div class="arch-zone-body">
						<button class="arch-comp arch-comp-lg" onclick={() => selectComponent('interoperability')}>
							<span class="arch-comp-icon">🔀</span>
							<span class="arch-comp-label">OpenHIM / Mirth</span>
						</button>
					</div>
				</div>

				<!-- Single Arrow Interop → Shared -->
				<div class="arch-arrow-group">
					<div class="arch-arrow-line"></div>
				</div>

				<!-- Shared Zone -->
				<div class="arch-zone arch-zone-shared">
					<div class="arch-zone-header">
						<span>🌐</span>
						<span>SHARED SERVICES</span>
					</div>
					<div class="arch-zone-body">
						<button class="arch-comp" onclick={() => selectComponent('shr')}>
							<span class="arch-comp-icon">🗄️</span>
							<span class="arch-comp-label">Shared Health Record</span>
						</button>
						<button class="arch-comp" onclick={() => selectComponent('terminology')}>
							<span class="arch-comp-icon">📚</span>
							<span class="arch-comp-label">Terminology Server</span>
						</button>
					</div>
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
	.arch-diagram {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 24px 0;
		gap: 0;
	}

	/* Zones */
	.arch-zone {
		border: 3px solid;
		border-radius: 16px;
		padding: 24px;
		width: 100%;
		max-width: 720px;
	}

	.arch-zone-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 16px;
		padding-bottom: 10px;
		border-bottom: 2px solid;
		font-weight: 800;
		font-size: 14px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.arch-zone-pos {
		border-color: #22C55E;
		background: #F0FDF4;
	}

	.arch-zone-pos .arch-zone-header {
		color: #15803D;
		border-color: #86EFAC;
	}

	.arch-zone-interop {
		border-color: #F59E0B;
		background: #FFFBEB;
	}

	.arch-zone-interop .arch-zone-header {
		color: #B45309;
		border-color: #FCD34D;
	}

	.arch-zone-shared {
		border-color: #3B82F6;
		background: #EFF6FF;
	}

	.arch-zone-shared .arch-zone-header {
		color: #1D4ED8;
		border-color: #93C5FD;
	}

	.arch-zone-body {
		display: flex;
		gap: 12px;
		justify-content: center;
		flex-wrap: wrap;
	}

	/* Components */
	.arch-comp {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 16px 18px;
		background: white;
		border: 2px solid #E2E8F0;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 120px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.04);
	}

	.arch-comp:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
		border-color: #CBD5E1;
	}

	.arch-comp-lg {
		min-width: 200px;
		padding: 20px 28px;
	}

	.arch-comp-icon {
		font-size: 28px;
	}

	.arch-comp-label {
		font-size: 13px;
		font-weight: 700;
		color: #1E293B;
	}

	/* Single Arrow */
	.arch-arrow-group {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 720px;
		padding: 10px 0;
	}

	.arch-arrow-line {
		width: 3px;
		height: 40px;
		background: #94A3B8;
		position: relative;
	}

	.arch-arrow-line::after {
		content: '';
		position: absolute;
		bottom: -6px;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-top: 10px solid #94A3B8;
	}

	.arch-arrow-badge {
		font-size: 11px;
		font-weight: 800;
		color: #D97706;
		background: #FEF3C7;
		padding: 3px 10px;
		border-radius: 6px;
		border: 1.5px solid #FDE68A;
		margin-top: 6px;
		letter-spacing: 0.05em;
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

	.section-hint .fhir-badge {
		display: inline-block;
		font-size: 11px;
		font-weight: 700;
		color: #2563EB;
		background: #EFF6FF;
		padding: 2px 8px;
		border-radius: 4px;
		border: 1px solid #BFDBFE;
		margin-left: 8px;
		vertical-align: middle;
	}
</style>
