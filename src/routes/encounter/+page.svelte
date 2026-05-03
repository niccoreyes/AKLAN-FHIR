<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { appStore } from '$stores/appStore.svelte.js';
  import { fhirClient } from '$services/fhir-client.js';
  import AppHeader from '$components/AppHeader.svelte';

  // Get patient ID from URL query param
  const patientId = $derived($page.url.searchParams.get('patient') || '');

  // Form state
  let encounterType = $state('ambulatory');
  let reason = $state('');
  let status = $state('in-progress');
  let notes = $state('');
  
  // UI state
  let isSubmitting = $state(false);
  let error = $state('');
  let success = $state(false);
  let createdEncounter = $state(null);

  // Patient info if provided
  let patient = $state(null);
  let isLoadingPatient = $state(false);

  // Redirect if not configured (use replaceState to avoid back-button issues)
  onMount(async () => {
    if (browser && !appStore.isConfigured) {
      window.location.replace('/workshop');
      return;
    }
    
    // Load patient if ID provided
    if (patientId) {
      await loadPatient();
    }
  });

  async function loadPatient() {
    isLoadingPatient = true;
    try {
      patient = await fhirClient.read('Patient', patientId);
    } catch (e) {
      console.error('Error loading patient:', e);
    } finally {
      isLoadingPatient = false;
    }
  }

  function getPatientName() {
    if (!patient) return 'Unknown';
    const name = patient.name?.[0];
    if (!name) return 'Unknown';
    const given = name.given?.join(' ') || '';
    const family = name.family || '';
    return `${given} ${family}`.trim();
  }

  async function handleSubmit() {
    if (!patientId) {
      error = 'Please select a patient first';
      return;
    }
    
    if (!reason.trim()) {
      error = 'Please enter a reason for visit';
      return;
    }

    isSubmitting = true;
    error = '';

    try {
      const encounter = {
        resourceType: 'Encounter',
        status: status,
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: encounterType,
          display: getEncounterTypeDisplay(encounterType)
        },
        type: [{
          text: reason
        }],
        subject: {
          reference: `Patient/${patientId}`
        },
        period: {
          start: new Date().toISOString()
        },
        reasonCode: [{
          text: reason
        }],
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${notes || 'No additional notes'}</div>`
        }
      };

      const result = await fhirClient.create(encounter, appStore.workshopCode);
      
      if (result.success) {
        createdEncounter = result.data;
        success = true;
      } else {
        error = 'Failed to create encounter';
      }
    } catch (e) {
      error = e.message || 'Error creating encounter';
    } finally {
      isSubmitting = false;
    }
  }

  function getEncounterTypeDisplay(type) {
    const types = {
      'ambulatory': 'Ambulatory',
      'emergency': 'Emergency',
      'home': 'Home Visit',
      'inpatient': 'Inpatient',
      'outpatient': 'Outpatient'
    };
    return types[type] || type;
  }

  function recordVitals() {
    goto(`/vitals?patient=${patientId}`);
  }

  function goToDashboard() {
    goto('/dashboard');
  }
</script>

<AppHeader active="clinical" />

<div class="page-container">
  <div class="page-header">
    {#if patientId}
      <a href="/patient/{patientId}" class="back-link">← Back to Patient</a>
    {:else}
      <a href="/patient/search" class="back-link">← Back to Patients</a>
    {/if}
    <h1>📋 Record Visit</h1>
    <p class="subtitle">Document a patient encounter</p>
  </div>

  {#if !patientId}
    <!-- No patient selected - show search prompt -->
    <div class="select-patient-prompt">
      <div class="prompt-icon">👤</div>
      <h3>Select a Patient First</h3>
      <p>You need to select a patient before recording an encounter.</p>
      <div class="prompt-actions">
        <a href="/patient/search" class="btn-primary">
          🔍 Find Patient
        </a>
        <a href="/patient/new" class="btn-secondary">
          ➕ Register New Patient
        </a>
      </div>
    </div>
  {:else if isLoadingPatient}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading patient...</p>
    </div>
  {:else if success}
    <div class="success-banner">
      <div class="success-icon">✅</div>
      <div class="success-content">
        <h3>Encounter Recorded Successfully!</h3>
        <p>Patient: <strong>{getPatientName()}</strong></p>
        <p class="encounter-id">ID: <code>{createdEncounter.id}</code></p>
        
        <div class="next-actions">
          <button class="btn-primary" onclick={recordVitals}>
            🩺 Record Vitals
          </button>
          <button class="btn-secondary" onclick={() => { success = false; reason = ''; notes = ''; }}>
            Record Another Visit
          </button>
          <button class="btn-tertiary" onclick={goToDashboard}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="encounter-form">
      {#if error}
        <div class="error-banner">
          ⚠️ {error}
        </div>
      {/if}

      <!-- Patient Info Card -->
      {#if patient}
        <div class="patient-card">
          <div class="patient-avatar">
            {patient.gender === 'male' ? '👨' : patient.gender === 'female' ? '👩' : '👤'}
          </div>
          <div class="patient-info">
            <h3>{getPatientName()}</h3>
            <p class="patient-meta">
              ID: {patient.id} • {patient.gender} • {patient.birthDate}
            </p>
          </div>
        </div>
      {/if}

      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="form-section">
          <h3>Encounter Details</h3>
          
          <div class="form-group">
            <label for="encounter-type">Encounter Type</label>
            <select id="encounter-type" bind:value={encounterType}>
              <option value="ambulatory">Ambulatory (Clinic Visit)</option>
              <option value="emergency">Emergency</option>
              <option value="home">Home Visit</option>
              <option value="inpatient">Inpatient</option>
              <option value="outpatient">Outpatient</option>
            </select>
          </div>

          <div class="form-group">
            <label for="reason">Reason for Visit *</label>
            <input 
              type="text" 
              id="reason"
              bind:value={reason}
              placeholder="e.g., Regular checkup, Fever, Follow-up"
              required
            />
          </div>

          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" bind:value={status}>
              <option value="in-progress">In Progress</option>
              <option value="finished">Finished</option>
              <option value="planned">Planned</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div class="form-section">
          <h3>Notes</h3>
          <div class="form-group">
            <textarea 
              id="notes"
              bind:value={notes}
              placeholder="Additional notes about the encounter..."
              rows="4"
            ></textarea>
          </div>
        </div>

        <div class="workshop-badge">
          🏷️ Will be tagged with workshop: <strong>{appStore.workshopCode || 'None'}</strong>
        </div>

        <div class="form-actions">
          {#if patientId}
            <a href="/patient/{patientId}" class="btn-cancel">Cancel</a>
          {:else}
            <a href="/patient/search" class="btn-cancel">Cancel</a>
          {/if}
          <button 
            type="submit" 
            class="btn-submit"
            disabled={isSubmitting}
          >
            {#if isSubmitting}
              <span class="spinner"></span>
              Saving...
            {:else}
              📋 Save Encounter
            {/if}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>

<style>
  .page-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 24px;
    padding-bottom: 100px;
  }

  .page-header {
    margin-bottom: 24px;
  }

  .back-link {
    display: inline-block;
    color: #64748B;
    text-decoration: none;
    font-size: 14px;
    margin-bottom: 12px;
  }

  .back-link:hover {
    color: #2563EB;
  }

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: #1E293B;
    margin: 0 0 8px 0;
  }

  .subtitle {
    color: #64748B;
    font-size: 14px;
    margin: 0;
  }

  .select-patient-prompt {
    background: white;
    border-radius: 16px;
    border: 2px dashed #CBD5E1;
    padding: 48px 24px;
    text-align: center;
  }

  .prompt-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .select-patient-prompt h3 {
    font-size: 20px;
    color: #1E293B;
    margin: 0 0 12px 0;
  }

  .select-patient-prompt p {
    color: #64748B;
    margin: 0 0 24px 0;
  }

  .prompt-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-primary {
    padding: 12px 24px;
    background: #2563EB;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .btn-primary:hover {
    background: #1D4ED8;
  }

  .btn-secondary {
    padding: 12px 24px;
    background: white;
    color: #2563EB;
    border: 2px solid #2563EB;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .btn-secondary:hover {
    background: #EFF6FF;
  }

  .btn-tertiary {
    padding: 12px 24px;
    background: transparent;
    color: #64748B;
    border: 1px solid #CBD5E1;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
  }

  .loading-state {
    text-align: center;
    padding: 48px;
    color: #64748B;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #E2E8F0;
    border-top-color: #2563EB;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .success-banner {
    background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%);
    border: 2px solid #86EFAC;
    border-radius: 16px;
    padding: 32px;
    text-align: center;
  }

  .success-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .success-content h3 {
    font-size: 20px;
    color: #166534;
    margin: 0 0 12px 0;
  }

  .success-content p {
    color: #166534;
    margin: 0 0 8px 0;
  }

  .encounter-id {
    font-family: monospace;
    background: rgba(255,255,255,0.7);
    padding: 8px 16px;
    border-radius: 8px;
    display: inline-block;
    margin: 12px 0;
  }

  .encounter-id code {
    color: #15803D;
    font-weight: 600;
  }

  .next-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 24px;
  }

  .encounter-form {
    background: white;
    border-radius: 16px;
    border: 1px solid #E2E8F0;
    padding: 24px;
  }

  .error-banner {
    background: #FEF2F2;
    border: 1px solid #FECACA;
    color: #DC2626;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
  }

  .patient-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: 12px;
    margin-bottom: 24px;
  }

  .patient-avatar {
    font-size: 32px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .patient-info h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1E293B;
    margin: 0 0 4px 0;
  }

  .patient-meta {
    font-size: 13px;
    color: #64748B;
    font-family: monospace;
  }

  .form-section {
    margin-bottom: 24px;
  }

  .form-section h3 {
    font-size: 14px;
    font-weight: 600;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #E2E8F0;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  label {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
  }

  input, select, textarea {
    padding: 12px;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
  }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #2563EB;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .workshop-badge {
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    color: #1E40AF;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    margin: 24px 0;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid #E2E8F0;
  }

  .btn-cancel {
    padding: 12px 24px;
    color: #64748B;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
  }

  .btn-cancel:hover {
    background: #F8FAFC;
  }

  .btn-submit {
    padding: 12px 24px;
    background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .btn-submit:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
  }

  .btn-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
</style>
