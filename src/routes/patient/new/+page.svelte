<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { appStore } from '$stores/appStore.svelte.js';
  import { fhirClient } from '$services/fhir-client.js';
  import AppHeader from '$components/AppHeader.svelte';

  // Form state
  let givenName = $state('');
  let familyName = $state('');
  let gender = $state('');
  let birthDate = $state('');
  let phId = $state('');
  let address = $state('');
  let phone = $state('');
  
  // UI state
  let isSubmitting = $state(false);
  let error = $state('');
  let success = $state(false);
  let createdPatient = $state(null);

  // Redirect if not configured (use replaceState to avoid back-button issues)
  onMount(() => {
    if (browser && !appStore.isConfigured) {
      window.location.replace('/workshop');
    }
  });

  async function handleSubmit() {
    if (!givenName || !familyName || !gender || !birthDate) {
      error = 'Please fill in all required fields';
      return;
    }

    isSubmitting = true;
    error = '';

    try {
      // Build Patient resource
      const patient = {
        resourceType: 'Patient',
        identifier: phId ? [{
          system: 'https://philhealth.gov.ph/id',
          value: phId,
          type: { text: 'PhilHealth ID' }
        }] : [],
        name: [{
          use: 'official',
          family: familyName,
          given: givenName.split(' ').filter(Boolean)
        }],
        gender: gender,
        birthDate: birthDate,
        address: address ? [{
          use: 'home',
          text: address,
          country: 'PH'
        }] : [],
        telecom: phone ? [{
          system: 'phone',
          value: phone,
          use: 'mobile'
        }] : []
      };

      // Submit to SHR with workshop tag
      const result = await fhirClient.create(patient, appStore.workshopCode);
      
      if (result.success) {
        createdPatient = result.data;
        success = true;
        
        // Reset form after short delay
        setTimeout(() => {
          givenName = '';
          familyName = '';
          gender = '';
          birthDate = '';
          phId = '';
          address = '';
          phone = '';
        }, 100);
      } else {
        error = 'Failed to create patient';
      }
    } catch (e) {
      error = e.message || 'Error creating patient';
    } finally {
      isSubmitting = false;
    }
  }

  function startEncounter() {
    if (createdPatient?.id) {
      goto(`/encounter?patient=${createdPatient.id}`);
    }
  }

  function recordVitals() {
    if (createdPatient?.id) {
      goto(`/vitals?patient=${createdPatient.id}`);
    }
  }
</script>

<AppHeader active="clinical" />

<div class="page-container">
  <div class="page-header">
    <a href="/patient/search" class="back-link">← Back to Patients</a>
    <h1>➕ Register New Patient</h1>
    <p class="subtitle">Create a new patient record in the Shared Health Record</p>
  </div>

  {#if success}
    <div class="success-banner">
      <div class="success-icon">✅</div>
      <div class="success-content">
        <h3>Patient Created Successfully!</h3>
        <p><strong>{createdPatient.name?.[0]?.given?.join(' ')} {createdPatient.name?.[0]?.family}</strong></p>
        <p class="patient-id">FHIR ID: <code>{createdPatient.id}</code></p>
        
        <div class="next-actions">
          <button class="btn-primary" onclick={startEncounter}>
            📋 Start Encounter
          </button>
          <button class="btn-secondary" onclick={recordVitals}>
            🩺 Record Vitals
          </button>
          <button class="btn-tertiary" onclick={() => { success = false; createdPatient = null; }}>
            Register Another Patient
          </button>
        </div>
      </div>
    </div>
  {:else}
    <form class="patient-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      {#if error}
        <div class="error-banner">
          ⚠️ {error}
        </div>
      {/if}

      <div class="form-section">
        <h3>Name *</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="givenName">Given Names</label>
            <input 
              type="text" 
              id="givenName"
              bind:value={givenName}
              placeholder="e.g., Maria Clara"
              required
            />
          </div>
          <div class="form-group">
            <label for="familyName">Family Name *</label>
            <input 
              type="text" 
              id="familyName"
              bind:value={familyName}
              placeholder="e.g., Dela Cruz"
              required
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Demographics *</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="gender">Gender *</label>
            <select id="gender" bind:value={gender} required>
              <option value="">Select gender...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div class="form-group">
            <label for="birthDate">Birth Date *</label>
            <input 
              type="date" 
              id="birthDate"
              bind:value={birthDate}
              required
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Contact Information</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="phId">PhilHealth ID</label>
            <input 
              type="text" 
              id="phId"
              bind:value={phId}
              placeholder="e.g., 1234-5678901-2"
            />
          </div>
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input 
              type="tel" 
              id="phone"
              bind:value={phone}
              placeholder="e.g., +63 912 345 6789"
            />
          </div>
        </div>
        <div class="form-group full-width">
          <label for="address">Address</label>
          <textarea 
            id="address"
            bind:value={address}
            placeholder="e.g., 123 Rizal St., Kalibo, Aklan"
            rows="2"
          ></textarea>
        </div>
      </div>

      <div class="workshop-badge">
        🏷️ Will be tagged with workshop: <strong>{appStore.workshopCode || 'None'}</strong>
      </div>

      <div class="form-actions">
        <a href="/patient/search" class="btn-cancel">Cancel</a>
        <button 
          type="submit" 
          class="btn-submit"
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            <span class="spinner"></span>
            Creating...
          {:else}
            ➕ Create Patient
          {/if}
        </button>
      </div>
    </form>
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

  .patient-id {
    font-family: monospace;
    background: rgba(255,255,255,0.7);
    padding: 8px 16px;
    border-radius: 8px;
    display: inline-block;
    margin: 12px 0;
  }

  .patient-id code {
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

  .btn-tertiary:hover {
    background: #F8FAFC;
  }

  .patient-form {
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
  }

  .form-group.full-width {
    grid-column: 1 / -1;
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

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
