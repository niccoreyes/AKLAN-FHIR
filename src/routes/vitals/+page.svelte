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
  const encounterId = $derived($page.url.searchParams.get('encounter') || '');

  // Vitals form state
  let systolic = $state('');
  let diastolic = $state('');
  let heartRate = $state('');
  let respiratoryRate = $state('');
  let temperature = $state('');
  let oxygenSaturation = $state('');
  let weight = $state('');
  let height = $state('');
  let notes = $state('');
  
  // UI state
  let isSubmitting = $state(false);
  let error = $state('');
  let success = $state(false);
  let createdObservations = $state([]);

  // Patient info if provided
  let patient = $state(null);
  let isLoadingPatient = $state(false);
  
  // Encounters
  let encounters = $state([]);
  let selectedEncounterId = $state(encounterId);
  let isLoadingEncounters = $state(false);
  let showEncounterSelector = $state(false);

  // Redirect if not configured (use replaceState to avoid back-button issues)
  onMount(async () => {
    if (browser && !appStore.isConfigured) {
      window.location.replace('/workshop');
      return;
    }
    
    // Load patient and encounters if ID provided
    if (patientId) {
      await loadPatientAndEncounters();
    }
  });

  async function loadPatientAndEncounters() {
    isLoadingPatient = true;
    isLoadingEncounters = true;
    try {
      // Load patient
      patient = await fhirClient.read('Patient', patientId);
      
      // Load recent encounters for this patient
      const result = await fhirClient.search('Encounter', { 
        patient: `Patient/${patientId}`, 
        _count: '10', 
        _sort: '-date' 
      });
      encounters = result.entry?.map(e => e.resource) || [];
      
      // If encounterId provided in URL but not in selectedEncounterId, use it
      if (encounterId && !selectedEncounterId) {
        selectedEncounterId = encounterId;
      }
      
      // If no encounter selected and we have encounters, show selector
      if (!selectedEncounterId && encounters.length > 0) {
        showEncounterSelector = true;
      }
    } catch (e) {
      console.error('Error loading patient/encounters:', e);
    } finally {
      isLoadingPatient = false;
      isLoadingEncounters = false;
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
  
  function getSelectedEncounter() {
    return encounters.find(e => e.id === selectedEncounterId);
  }
  
  function selectEncounter(id) {
    selectedEncounterId = id;
    showEncounterSelector = false;
  }
  
  function createNewEncounter() {
    goto(`/encounter?patient=${patientId}`);
  }

  async function handleSubmit() {
    if (!patientId) {
      error = 'Please select a patient first';
      return;
    }
    
    if (!selectedEncounterId) {
      error = 'Please select or create an encounter first';
      showEncounterSelector = true;
      return;
    }

    isSubmitting = true;
    error = '';
    createdObservations = [];

    try {
      const observations = [];
      const now = new Date().toISOString();
      
      // Build encounter reference
      const encounterRef = { reference: `Encounter/${selectedEncounterId}` };

      // Blood Pressure (component observation)
      if (systolic && diastolic) {
        const bpObservation = {
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }]
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '85354-9',
              display: 'Blood pressure panel with all children optional'
            }],
            text: 'Blood Pressure'
          },
          subject: { reference: `Patient/${patientId}` },
          encounter: encounterRef,
          encounter: encounterRef,
          effectiveDateTime: now,
          component: [
            {
              code: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '8480-6',
                  display: 'Systolic blood pressure'
                }]
              },
              valueQuantity: {
                value: parseFloat(systolic),
                unit: 'mmHg',
                system: 'http://unitsofmeasure.org',
                code: 'mm[Hg]'
              }
            },
            {
              code: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '8462-4',
                  display: 'Diastolic blood pressure'
                }]
              },
              valueQuantity: {
                value: parseFloat(diastolic),
                unit: 'mmHg',
                system: 'http://unitsofmeasure.org',
                code: 'mm[Hg]'
              }
            }
          ]
        };
        observations.push(bpObservation);
      }

      // Heart Rate
      if (heartRate) {
        observations.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }]
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8867-4',
              display: 'Heart rate'
            }],
            text: 'Heart Rate'
          },
          subject: { reference: `Patient/${patientId}` },
          encounter: encounterRef,
          effectiveDateTime: now,
          valueQuantity: {
            value: parseFloat(heartRate),
            unit: 'beats/min',
            system: 'http://unitsofmeasure.org',
            code: '/min'
          }
        });
      }

      // Respiratory Rate
      if (respiratoryRate) {
        observations.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }]
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '9279-1',
              display: 'Respiratory rate'
            }],
            text: 'Respiratory Rate'
          },
          subject: { reference: `Patient/${patientId}` },
          encounter: encounterRef,
          effectiveDateTime: now,
          valueQuantity: {
            value: parseFloat(respiratoryRate),
            unit: 'breaths/min',
            system: 'http://unitsofmeasure.org',
            code: '/min'
          }
        });
      }

      // Temperature
      if (temperature) {
        observations.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }]
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8310-5',
              display: 'Body temperature'
            }],
            text: 'Temperature'
          },
          subject: { reference: `Patient/${patientId}` },
          encounter: encounterRef,
          effectiveDateTime: now,
          valueQuantity: {
            value: parseFloat(temperature),
            unit: '°C',
            system: 'http://unitsofmeasure.org',
            code: 'Cel'
          }
        });
      }

      // Oxygen Saturation
      if (oxygenSaturation) {
        observations.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }]
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '2708-6',
              display: 'Oxygen saturation in Arterial blood'
            }],
            text: 'Oxygen Saturation'
          },
          subject: { reference: `Patient/${patientId}` },
          encounter: encounterRef,
          effectiveDateTime: now,
          valueQuantity: {
            value: parseFloat(oxygenSaturation),
            unit: '%',
            system: 'http://unitsofmeasure.org',
            code: '%'
          }
        });
      }

      // Weight
      if (weight) {
        observations.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }]
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '29463-7',
              display: 'Body weight'
            }],
            text: 'Weight'
          },
          subject: { reference: `Patient/${patientId}` },
          encounter: encounterRef,
          effectiveDateTime: now,
          valueQuantity: {
            value: parseFloat(weight),
            unit: 'kg',
            system: 'http://unitsofmeasure.org',
            code: 'kg'
          }
        });
      }

      // Height
      if (height) {
        observations.push({
          resourceType: 'Observation',
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }]
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8302-2',
              display: 'Body height'
            }],
            text: 'Height'
          },
          subject: { reference: `Patient/${patientId}` },
          encounter: encounterRef,
          effectiveDateTime: now,
          valueQuantity: {
            value: parseFloat(height),
            unit: 'cm',
            system: 'http://unitsofmeasure.org',
            code: 'cm'
          }
        });
      }

      if (observations.length === 0) {
        error = 'Please enter at least one vital sign';
        isSubmitting = false;
        return;
      }

      // Submit all observations
      for (const obs of observations) {
        const result = await fhirClient.create(obs, appStore.workshopCode);
        if (result.success) {
          createdObservations.push(result.data);
        }
      }

      success = true;
    } catch (e) {
      error = e.message || 'Error recording vitals';
    } finally {
      isSubmitting = false;
    }
  }

  function recordAnother() {
    success = false;
    createdObservations = [];
    systolic = '';
    diastolic = '';
    heartRate = '';
    respiratoryRate = '';
    temperature = '';
    oxygenSaturation = '';
    weight = '';
    height = '';
    notes = '';
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
    <h1>🩺 Record Vitals</h1>
    <p class="subtitle">Document patient vital signs</p>
  </div>

  {#if !patientId}
    <!-- No patient selected - show search prompt -->
    <div class="select-patient-prompt">
      <div class="prompt-icon">👤</div>
      <h3>Select a Patient First</h3>
      <p>You need to select a patient before recording vitals.</p>
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
        <h3>Vitals Recorded Successfully!</h3>
        <p>Patient: <strong>{getPatientName()}</strong></p>
        <p class="vitals-count">{createdObservations.length} observation(s) saved</p>
        
        <div class="saved-vitals">
          {#each createdObservations as obs}
            <div class="vital-tag">
              {obs.code?.text || 'Observation'}: {obs.id}
            </div>
          {/each}
        </div>
        
        <div class="next-actions">
          <button class="btn-primary" onclick={recordAnother}>
            🩺 Record More Vitals
          </button>
          <button class="btn-tertiary" onclick={goToDashboard}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="vitals-form">
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

      <!-- Encounter Selection -->
      {#if isLoadingEncounters}
        <div class="encounter-loading">
          <span class="spinner"></span>
          <span>Loading encounters...</span>
        </div>
      {:else if showEncounterSelector || !selectedEncounterId}
        <div class="encounter-selector">
          <h3>📋 Select Encounter</h3>
          <p class="encounter-hint">Choose an existing visit or create a new one</p>
          
          {#if encounters.length > 0}
            <div class="encounter-list">
              {#each encounters as encounter}
                <button 
                  type="button"
                  class="encounter-option"
                  class:selected={selectedEncounterId === encounter.id}
                  onclick={() => selectEncounter(encounter.id)}
                >
                  <div class="encounter-option-main">
                    <span class="encounter-type">{encounter.type?.[0]?.text || 'Visit'}</span>
                    <span class="encounter-date">{new Date(encounter.period?.start).toLocaleDateString()}</span>
                  </div>
                  {#if encounter.reasonCode?.[0]?.text}
                    <div class="encounter-reason">{encounter.reasonCode[0].text}</div>
                  {/if}
                </button>
              {/each}
            </div>
          {:else}
            <div class="no-encounters">
              <p>No previous encounters found</p>
            </div>
          {/if}
          
          <div class="encounter-actions">
            <button type="button" class="btn-create-encounter" onclick={createNewEncounter}>
              ➕ Create New Encounter
            </button>
          </div>
        </div>
      {:else if selectedEncounterId}
        {@const selectedEnc = getSelectedEncounter()}
        {#if selectedEnc}
          <div class="selected-encounter">
            <div class="selected-encounter-header">
              <div>
                <span class="selected-label">Recording vitals for:</span>
                <span class="selected-type">{selectedEnc.type?.[0]?.text || 'Visit'}</span>
                <span class="selected-date">{new Date(selectedEnc.period?.start).toLocaleDateString()}</span>
              </div>
              <button type="button" class="btn-change" onclick={() => showEncounterSelector = true}>
                Change
              </button>
            </div>
          </div>
        {/if}
      {/if}

      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div class="form-section">
          <h3>Blood Pressure</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="systolic">Systolic (mmHg)</label>
              <input 
                type="number" 
                id="systolic"
                bind:value={systolic}
                placeholder="120"
                min="50"
                max="300"
              />
            </div>
            <div class="form-group">
              <label for="diastolic">Diastolic (mmHg)</label>
              <input 
                type="number" 
                id="diastolic"
                bind:value={diastolic}
                placeholder="80"
                min="30"
                max="200"
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Cardiovascular</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="heartRate">Heart Rate (bpm)</label>
              <input 
                type="number" 
                id="heartRate"
                bind:value={heartRate}
                placeholder="72"
                min="30"
                max="250"
              />
            </div>
            <div class="form-group">
              <label for="respiratoryRate">Respiratory Rate (breaths/min)</label>
              <input 
                type="number" 
                id="respiratoryRate"
                bind:value={respiratoryRate}
                placeholder="16"
                min="8"
                max="60"
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Other Measurements</h3>
          <div class="form-row three-col">
            <div class="form-group">
              <label for="temperature">Temperature (°C)</label>
              <input 
                type="number" 
                id="temperature"
                bind:value={temperature}
                placeholder="37.0"
                step="0.1"
                min="30"
                max="45"
              />
            </div>
            <div class="form-group">
              <label for="oxygenSaturation">Oxygen Saturation (%)</label>
              <input 
                type="number" 
                id="oxygenSaturation"
                bind:value={oxygenSaturation}
                placeholder="98"
                min="50"
                max="100"
              />
            </div>
          </div>
          <div class="form-row three-col">
            <div class="form-group">
              <label for="weight">Weight (kg)</label>
              <input 
                type="number" 
                id="weight"
                bind:value={weight}
                placeholder="70"
                step="0.1"
                min="0"
                max="500"
              />
            </div>
            <div class="form-group">
              <label for="height">Height (cm)</label>
              <input 
                type="number" 
                id="height"
                bind:value={height}
                placeholder="170"
                min="0"
                max="300"
              />
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3>Notes</h3>
          <div class="form-group">
            <textarea 
              id="notes"
              bind:value={notes}
              placeholder="Additional notes about the vital signs..."
              rows="3"
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
              🩺 Save Vitals
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

  .vitals-count {
    font-weight: 600;
  }

  .saved-vitals {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin: 16px 0;
  }

  .vital-tag {
    background: rgba(255,255,255,0.7);
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-family: monospace;
    color: #166534;
  }

  .next-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 24px;
  }

  .vitals-form {
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

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-row.three-col {
    grid-template-columns: 1fr 1fr;
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

  label {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
  }

  input, textarea {
    padding: 12px;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
  }

  input:focus, textarea:focus {
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

  /* Encounter Selector Styles */
  .encounter-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px;
    background: #F8FAFC;
    border-radius: 12px;
    margin-bottom: 24px;
    color: #64748B;
  }

  .encounter-selector {
    background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
    border: 2px solid #BFDBFE;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .encounter-selector h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1E40AF;
    margin: 0 0 8px 0;
  }

  .encounter-hint {
    font-size: 14px;
    color: #475569;
    margin: 0 0 16px 0;
  }

  .encounter-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
    max-height: 300px;
    overflow-y: auto;
  }

  .encounter-option {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 12px 16px;
    background: white;
    border: 2px solid #E2E8F0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    text-align: left;
  }

  .encounter-option:hover {
    border-color: #2563EB;
    background: #F8FAFC;
  }

  .encounter-option.selected {
    border-color: #2563EB;
    background: #EFF6FF;
  }

  .encounter-option-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .encounter-type {
    font-weight: 600;
    color: #1E293B;
  }

  .encounter-date {
    font-size: 13px;
    color: #64748B;
  }

  .encounter-reason {
    font-size: 12px;
    color: #94A3B8;
  }

  .no-encounters {
    text-align: center;
    padding: 24px;
    color: #64748B;
    font-style: italic;
  }

  .encounter-actions {
    display: flex;
    justify-content: center;
  }

  .btn-create-encounter {
    padding: 12px 24px;
    background: white;
    color: #2563EB;
    border: 2px solid #2563EB;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-create-encounter:hover {
    background: #EFF6FF;
  }

  .selected-encounter {
    background: #F0FDF4;
    border: 1px solid #86EFAC;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
  }

  .selected-encounter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .selected-label {
    font-size: 12px;
    color: #166534;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: block;
    margin-bottom: 4px;
  }

  .selected-type {
    font-weight: 600;
    color: #166534;
  }

  .selected-date {
    font-size: 13px;
    color: #64748B;
    margin-left: 8px;
  }

  .btn-change {
    padding: 6px 12px;
    background: white;
    color: #2563EB;
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
  }

  .btn-change:hover {
    background: #F8FAFC;
  }
</style>
