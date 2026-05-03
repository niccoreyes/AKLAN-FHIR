<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { appStore } from '$stores/appStore.svelte.js';
  import { fhirClient } from '$services/fhir-client.js';
  import AppHeader from '$components/AppHeader.svelte';

  // Get patient ID from URL
  const patientId = $derived($page.url.searchParams.get('id') || '');

  // Form state
  let patient = $state(null);
  let isLoading = $state(true);
  let isSaving = $state(false);
  let error = $state('');
  let success = $state(false);

  // Editable fields
  let givenName = $state('');
  let familyName = $state('');
  let gender = $state('');
  let birthDate = $state('');
  let phone = $state('');
  let email = $state('');
  let address = $state('');
  let city = $state('');
  let philHealthId = $state('');

  // Redirect if not configured
  onMount(async () => {
    if (browser && !appStore.isConfigured) {
      window.location.replace('/workshop');
      return;
    }
    
    if (patientId) {
      await loadPatient();
    } else {
      error = 'No patient ID provided';
      isLoading = false;
    }
  });

  async function loadPatient() {
    isLoading = true;
    error = '';
    
    try {
      patient = await fhirClient.read('Patient', patientId);
      
      // Populate form fields
      const name = patient.name?.[0];
      givenName = name?.given?.join(' ') || '';
      familyName = name?.family || '';
      gender = patient.gender || '';
      birthDate = patient.birthDate || '';
      
      // Contact info
      const phoneContact = patient.telecom?.find(t => t.system === 'phone');
      phone = phoneContact?.value || '';
      
      const emailContact = patient.telecom?.find(t => t.system === 'email');
      email = emailContact?.value || '';
      
      // Address
      const addr = patient.address?.[0];
      address = addr?.text || addr?.line?.join(', ') || '';
      city = addr?.city || '';
      
      // Identifier
      const phId = patient.identifier?.find(id => id.system?.includes('philhealth'));
      philHealthId = phId?.value || '';
    } catch (e) {
      error = e.message || 'Failed to load patient';
    } finally {
      isLoading = false;
    }
  }

  function getPatientDisplayName() {
    if (!patient) return 'Unknown';
    return `${givenName} ${familyName}`.trim() || 'Unknown';
  }

  async function handleSubmit() {
    if (!patient) {
      error = 'No patient loaded';
      return;
    }

    if (!familyName.trim()) {
      error = 'Family name is required';
      return;
    }

    isSaving = true;
    error = '';

    try {
      // Build updated patient
      const updatedPatient = {
        ...patient,
        name: [{
          use: 'official',
          family: familyName.trim(),
          given: givenName.trim().split(' ').filter(Boolean)
        }],
        gender: gender || undefined,
        birthDate: birthDate || undefined,
        telecom: [
          ...(phone ? [{ system: 'phone', value: phone.trim(), use: 'mobile' }] : []),
          ...(email ? [{ system: 'email', value: email.trim() }] : [])
        ].filter(Boolean),
        address: address ? [{
          use: 'home',
          text: address.trim(),
          city: city.trim() || undefined,
          country: 'PH'
        }] : undefined
      };

      // Handle identifiers
      const existingIdentifiers = patient.identifier?.filter(id => !id.system?.includes('philhealth')) || [];
      if (philHealthId.trim()) {
        existingIdentifiers.push({
          system: 'https://philhealth.gov.ph/id',
          value: philHealthId.trim(),
          type: { text: 'PhilHealth ID' }
        });
      }
      updatedPatient.identifier = existingIdentifiers.length > 0 ? existingIdentifiers : undefined;

      // Remove undefined values
      if (!updatedPatient.gender) delete updatedPatient.gender;
      if (!updatedPatient.birthDate) delete updatedPatient.birthDate;
      if (!updatedPatient.telecom.length) delete updatedPatient.telecom;
      if (!updatedPatient.address) delete updatedPatient.address;
      if (!updatedPatient.identifier) delete updatedPatient.identifier;

      // Update via PUT
      const result = await fhirClient.update('Patient', patientId, updatedPatient);
      
      if (result.success) {
        success = true;
        patient = result.data;
      } else {
        error = 'Failed to update patient';
      }
    } catch (e) {
      error = e.message || 'Error updating patient';
    } finally {
      isSaving = false;
    }
  }

  function goBack() {
    goto(`/patient/${patientId}`);
  }
</script>

<AppHeader active="clinical" />

<div class="page-container">
  <div class="page-header">
    <button type="button" class="back-link" onclick={goBack}>
      ← Back to Patient
    </button>
    <h1>✏️ Edit Patient</h1>
    <p class="subtitle">Update patient demographics and contact information</p>
  </div>

  {#if isLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading patient...</p>
    </div>
  {:else if error && !patient}
    <div class="error-banner">
      ⚠️ {error}
      <button onclick={() => loadPatient()} class="retry-btn">Retry</button>
    </div>
  {:else if success}
    <div class="success-banner">
      <div class="success-icon">✅</div>
      <div class="success-content">
        <h3>Patient Updated Successfully!</h3>
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
  {:else if patient}
    <div class="patient-form">
      {#if error}
        <div class="error-banner">
          ⚠️ {error}
        </div>
      {/if}

      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="form-section">
          <h3>👤 Name</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="givenName">Given Names</label>
              <input 
                type="text" 
                id="givenName"
                bind:value={givenName}
                placeholder="e.g., Maria Clara"
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
          <h3>📋 Demographics</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="gender">Gender</label>
              <select id="gender" bind:value={gender}>
                <option value="">Select gender...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div class="form-group">
              <label for="birthDate">Birth Date</label>
              <input 
                type="date" 
                id="birthDate"
                bind:value={birthDate}
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>📞 Contact Information</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input 
                type="tel" 
                id="phone"
                bind:value={phone}
                placeholder="e.g., +63 912 345 6789"
              />
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email"
                bind:value={email}
                placeholder="e.g., patient@email.com"
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>🏠 Address</h3>
          <div class="form-group full-width">
            <label for="address">Street Address</label>
            <textarea 
              id="address"
              bind:value={address}
              placeholder="e.g., 123 Rizal St."
              rows="2"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="city">City/Municipality</label>
            <input 
              type="text" 
              id="city"
              bind:value={city}
              placeholder="e.g., Kalibo"
            />
          </div>
        </div>

        <div class="form-section">
          <h3>🆔 Identifiers</h3>
          <div class="form-group">
            <label for="philHealthId">PhilHealth ID</label>
            <input 
              type="text" 
              id="philHealthId"
              bind:value={philHealthId}
              placeholder="e.g., 1234-5678901-2"
            />
          </div>
        </div>

        <div class="form-section">
          <h3>ℹ️ FHIR Information</h3>
          <div class="fhir-info">
            <div class="fhir-row">
              <span class="fhir-label">Patient ID:</span>
              <span class="fhir-value">{patient.id}</span>
            </div>
            <div class="fhir-row">
              <span class="fhir-label">Last Updated:</span>
              <span class="fhir-value">{new Date(patient.meta?.lastUpdated).toLocaleString()}</span>
            </div>
            <div class="fhir-row">
              <span class="fhir-label">Version:</span>
              <span class="fhir-value">{patient.meta?.versionId || '1'}</span>
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

  .patient-form {
    background: white;
    border-radius: 16px;
    border: 1px solid #E2E8F0;
    padding: 24px;
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