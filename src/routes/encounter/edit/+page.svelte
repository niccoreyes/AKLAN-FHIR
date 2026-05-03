<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { appStore } from '$stores/appStore.svelte.js';
  import { fhirClient } from '$services/fhir-client.js';
  import AppHeader from '$components/AppHeader.svelte';

  // Get encounter ID from URL
  const encounterId = $derived($page.url.searchParams.get('id') || '');

  // Form state
  let encounter = $state(null);
  let isLoading = $state(true);
  let isSaving = $state(false);
  let error = $state('');
  let success = $state(false);

  // Editable fields
  let status = $state('in-progress');
  let encounterClass = $state('ambulatory');
  let encounterType = $state('');
  let startDate = $state('');
  let endDate = $state('');
  let reason = $state('');
  let notes = $state('');

  // Redirect if not configured
  onMount(async () => {
    if (browser && !appStore.isConfigured) {
      window.location.replace('/workshop');
      return;
    }
    
    if (encounterId) {
      await loadEncounter();
    } else {
      error = 'No encounter ID provided';
      isLoading = false;
    }
  });

  async function loadEncounter() {
    isLoading = true;
    error = '';
    
    try {
      encounter = await fhirClient.read('Encounter', encounterId);
      
      // Populate form fields
      status = encounter.status || 'in-progress';
      encounterClass = encounter.class?.code || 'ambulatory';
      encounterType = encounter.type?.[0]?.text || '';
      startDate = encounter.period?.start ? encounter.period.start.substring(0, 16) : ''; // Format for datetime-local
      endDate = encounter.period?.end ? encounter.period.end.substring(0, 16) : '';
      reason = encounter.reasonCode?.[0]?.text || '';
      notes = encounter.text?.div || '';
    } catch (e) {
      error = e.message || 'Failed to load encounter';
    } finally {
      isLoading = false;
    }
  }

  function getPatientName() {
    if (!encounter?.subject?.display) return 'Unknown';
    return encounter.subject.display;
  }

  function getPatientId() {
    if (!encounter?.subject?.reference) return '';
    return encounter.subject.reference.replace('Patient/', '');
  }

  async function handleSubmit() {
    if (!encounter) {
      error = 'No encounter loaded';
      return;
    }

    isSaving = true;
    error = '';

    try {
      // Build updated encounter
      const updatedEncounter = {
        ...encounter,
        status: status,
        class: {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: encounterClass,
          display: getClassDisplay(encounterClass)
        },
        type: encounterType ? [{
          text: encounterType
        }] : [],
        period: {
          start: startDate ? new Date(startDate).toISOString() : undefined,
          end: endDate ? new Date(endDate).toISOString() : undefined
        },
        reasonCode: reason ? [{
          text: reason
        }] : [],
        text: notes ? {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml">${notes}</div>`
        } : undefined
      };

      // Remove undefined values
      if (!updatedEncounter.period.start) delete updatedEncounter.period.start;
      if (!updatedEncounter.period.end) delete updatedEncounter.period.end;
      if (!reason) delete updatedEncounter.reasonCode;
      if (!notes) delete updatedEncounter.text;
      if (!encounterType) delete updatedEncounter.type;

      // Update via PUT
      const result = await fhirClient.update('Encounter', encounterId, updatedEncounter);
      
      if (result.success) {
        success = true;
        encounter = result.data;
      } else {
        error = 'Failed to update encounter';
      }
    } catch (e) {
      error = e.message || 'Error updating encounter';
    } finally {
      isSaving = false;
    }
  }

  function getClassDisplay(code) {
    const classes = {
      'ambulatory': 'Ambulatory',
      'emergency': 'Emergency',
      'home': 'Home',
      'inpatient': 'Inpatient',
      'outpatient': 'Outpatient',
      'virtual': 'Virtual'
    };
    return classes[code] || code;
  }

  function goBack() {
    const patientId = getPatientId();
    if (patientId) {
      goto(appStore.buildUrl(`/patient/${patientId}`));
    } else {
      goto(appStore.buildUrl('/patient/search'));
    }
  }
</script>

<AppHeader active="clinical" />

<div class="page-container">
  <div class="page-header">
    <button type="button" class="back-link" onclick={goBack}>
      ← Back
    </button>
    <h1>✏️ Edit Encounter</h1>
    <p class="subtitle">Update encounter details</p>
  </div>

  {#if isLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading encounter...</p>
    </div>
  {:else if error && !encounter}
    <div class="error-banner">
      ⚠️ {error}
      <button onclick={() => loadEncounter()} class="retry-btn">Retry</button>
    </div>
  {:else if success}
    <div class="success-banner">
      <div class="success-icon">✅</div>
      <div class="success-content">
        <h3>Encounter Updated Successfully!</h3>
        <div class="next-actions">
          <button class="btn-primary" onclick={() => success = false}>
            Continue Editing
          </button>
          <button class="btn-secondary" onclick={goBack}>
            Back to Patient
          </button>
        </div>
      </div>
    </div>
  {:else if encounter}
    <div class="encounter-form">
      {#if error}
        <div class="error-banner">
          ⚠️ {error}
        </div>
      {/if}

      <!-- Patient Info -->
      <div class="patient-card">
        <div class="patient-avatar">👤</div>
        <div class="patient-info">
          <h3>{getPatientName()}</h3>
          <p class="patient-meta">ID: {getPatientId()}</p>
        </div>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="form-section">
          <h3>Encounter Details</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="status">Status *</label>
              <select id="status" bind:value={status} required>
                <option value="in-progress">In Progress</option>
                <option value="finished">Finished</option>
                <option value="planned">Planned</option>
                <option value="arrived">Arrived</option>
                <option value="triaged">Triaged</option>
                <option value="cancelled">Cancelled</option>
                <option value="entered-in-error">Entered in Error</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="class">Class *</label>
              <select id="class" bind:value={encounterClass} required>
                <option value="ambulatory">Ambulatory</option>
                <option value="emergency">Emergency</option>
                <option value="home">Home</option>
                <option value="inpatient">Inpatient</option>
                <option value="outpatient">Outpatient</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="type">Encounter Type</label>
            <input 
              type="text" 
              id="type"
              bind:value={encounterType}
              placeholder="e.g., Checkup, Consultation, Follow-up"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="start">Start Date/Time</label>
              <input 
                type="datetime-local" 
                id="start"
                bind:value={startDate}
              />
            </div>
            
            <div class="form-group">
              <label for="end">End Date/Time</label>
              <input 
                type="datetime-local" 
                id="end"
                bind:value={endDate}
              />
            </div>
          </div>

          <div class="form-group">
            <label for="reason">Reason for Visit</label>
            <input 
              type="text" 
              id="reason"
              bind:value={reason}
              placeholder="e.g., Regular checkup, Fever, Follow-up"
            />
          </div>

          <div class="form-group">
            <label for="notes">Notes</label>
            <textarea 
              id="notes"
              bind:value={notes}
              placeholder="Additional notes about the encounter..."
              rows="4"
            ></textarea>
          </div>
        </div>

        <div class="form-section">
          <h3>FHIR Information</h3>
          <div class="fhir-info">
            <div class="fhir-row">
              <span class="fhir-label">Encounter ID:</span>
              <span class="fhir-value">{encounter.id}</span>
            </div>
            <div class="fhir-row">
              <span class="fhir-label">Last Updated:</span>
              <span class="fhir-value">{new Date(encounter.meta?.lastUpdated).toLocaleString()}</span>
            </div>
            <div class="fhir-row">
              <span class="fhir-label">Version:</span>
              <span class="fhir-value">{encounter.meta?.versionId || '1'}</span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" onclick={goBack}>
            Cancel
          </button>
          <button 
            type="submit" 
            class="btn-submit"
            disabled={isSaving}
          >
            {#if isSaving}
              <span class="spinner"></span>
              Saving...
            {:else}
              💾 Save Changes
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
    background: none;
    border: none;
    color: #64748B;
    font-size: 14px;
    cursor: pointer;
    margin-bottom: 12px;
    padding: 0;
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

  .error-banner {
    background: #FEF2F2;
    border: 1px solid #FECACA;
    color: #DC2626;
    padding: 16px;
    border-radius: 10px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .retry-btn {
    padding: 6px 12px;
    background: white;
    border: 1px solid #FECACA;
    border-radius: 6px;
    color: #DC2626;
    cursor: pointer;
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
    margin: 0 0 20px 0;
  }

  .next-actions {
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
  }

  .btn-secondary {
    padding: 12px 24px;
    background: white;
    color: #64748B;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }

  .encounter-form {
    background: white;
    border-radius: 16px;
    border: 1px solid #E2E8F0;
    padding: 24px;
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

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  @media (max-width: 640px) {
    .form-row {
      grid-template-columns: 1fr;
    }
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

  .fhir-info {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 16px;
  }

  .fhir-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #E2E8F0;
  }

  .fhir-row:last-child {
    border-bottom: none;
  }

  .fhir-label {
    font-size: 13px;
    color: #64748B;
  }

  .fhir-value {
    font-size: 13px;
    font-weight: 500;
    color: #1E293B;
    font-family: monospace;
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
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
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