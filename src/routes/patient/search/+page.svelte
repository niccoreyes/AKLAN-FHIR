<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { appStore } from '$stores/appStore.svelte.js';
  import { fhirClient } from '$services/fhir-client.js';
  import AppHeader from '$components/AppHeader.svelte';
  import { WORKSHON_TAG_SYSTEM } from '$constants';

  // State
  let searchQuery = $state('');
  let patients = $state([]);
  let isLoading = $state(false);
  let hasSearched = $state(false);
  let error = $state('');

  // Pagination state
  let totalCount = $state(0);
  let nextPageUrl = $state(null);
  let hasMore = $state(false);

  // Redirect if not configured
  onMount(() => {
    if (browser && !appStore.isConfigured) {
      goto('/workshop');
    }
  });

  async function searchPatients() {
    if (!searchQuery.trim()) {
      error = 'Please enter a search term';
      return;
    }

    isLoading = true;
    error = '';
    hasSearched = true;

    try {
      const params = {
        name: searchQuery.trim(),
        _count: '20',
        _sort: '-_lastUpdated'
      };

      // If group filter is enabled, restrict to workshop
      if (appStore.groupFilterEnabled && appStore.workshopCode) {
        params._tag = `${WORKSHON_TAG_SYSTEM}|${appStore.workshopCode}`;
      }

      const result = await fhirClient.searchPaginated('Patient', params);
      patients = result.resources;
      totalCount = result.total;
      nextPageUrl = result.nextUrl;
      hasMore = result.hasMore;
    } catch (e) {
      error = e.message || 'Error searching patients';
      patients = [];
    } finally {
      isLoading = false;
    }
  }

  async function loadMore() {
    if (!nextPageUrl || isLoading) return;
    
    isLoading = true;
    try {
      const result = await fhirClient.fetchNextPage(nextPageUrl);
      patients = [...patients, ...result.resources];
      nextPageUrl = result.nextUrl;
      hasMore = result.hasMore;
    } catch (e) {
      console.error('Error loading more:', e);
    } finally {
      isLoading = false;
    }
  }

  function selectPatient(patientId) {
    goto(`/patient/${patientId}`);
  }

  function startEncounter(patientId) {
    goto(`/encounter?patient=${patientId}`);
  }

  function recordVitals(patientId) {
    goto(`/vitals?patient=${patientId}`);
  }

  function getPatientName(patient) {
    const name = patient.name?.[0];
    if (!name) return 'Unknown';
    const given = name.given?.join(' ') || '';
    const family = name.family || '';
    return `${given} ${family}`.trim();
  }

  function getAge(birthDate) {
    if (!birthDate) return '';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function getPHID(patient) {
    return patient.identifier?.find(id => id.system?.includes('philhealth'))?.value || '';
  }

  function getWorkshopTag(patient) {
    return patient.meta?.tag?.find(t => t.system === WORKSHON_TAG_SYSTEM)?.code || '';
  }
</script>

<AppHeader active="clinical" />

<div class="page-container">
  <div class="page-header">
    <a href="/dashboard" class="back-link">← Back to Dashboard</a>
    <h1>🔍 Find Patient</h1>
    <p class="subtitle">
      {appStore.groupFilterEnabled 
        ? `Searching within workshop: ${appStore.workshopCode}` 
        : 'Searching all patients in SHR'}
    </p>
  </div>

  <div class="search-box">
    <div class="search-input-group">
      <input 
        type="text" 
        bind:value={searchQuery}
        placeholder="Enter patient name..."
        class="search-input"
        onkeydown={(e) => e.key === 'Enter' && searchPatients()}
      />
      <button 
        class="search-btn"
        onclick={searchPatients}
        disabled={isLoading}
      >
        {#if isLoading && !hasSearched}
          <span class="spinner"></span>
        {:else}
          🔍 Search
        {/if}
      </button>
    </div>
    
    <div class="filter-toggle">
      <label class="toggle-label">
        <input 
          type="checkbox" 
          checked={appStore.groupFilterEnabled}
          onchange={() => appStore.toggleGroupFilter()}
        />
        <span>🏷️ Only show {appStore.workshopCode} patients</span>
      </label>
    </div>
  </div>

  {#if error}
    <div class="error-banner">
      ⚠️ {error}
    </div>
  {/if}

  {#if hasSearched}
    <div class="results-section">
      <div class="results-header">
        <h2>Results</h2>
        {#if !isLoading}
          <span class="results-count">
            {patients.length} of {totalCount} patient{totalCount !== 1 ? 's' : ''}
          </span>
        {/if}
      </div>

      {#if isLoading && patients.length === 0}
        <div class="loading-state">
          <div class="skeleton-row"></div>
          <div class="skeleton-row"></div>
          <div class="skeleton-row"></div>
        </div>
      {:else if patients.length === 0}
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>No patients found</p>
          <span>Try a different search term or check if the patient is registered</span>
        </div>
      {:else}
        <div class="patient-list">
          {#each patients as patient}
            <div class="patient-card">
              <div class="patient-main">
                <div class="patient-avatar">
                  {patient.gender === 'male' ? '👨' : patient.gender === 'female' ? '👩' : '👤'}
                </div>
                <div class="patient-info">
                  <h3>{getPatientName(patient)}</h3>
                  <div class="patient-meta">
                    <span class="ph-id">{getPHID(patient)}</span>
                    <span>{getAge(patient.birthDate)} years • {patient.gender}</span>
                    {#if getWorkshopTag(patient)}
                      <span class="tag-badge">🏷️ {getWorkshopTag(patient)}</span>
                    {/if}
                  </div>
                  <div class="patient-id">ID: {patient.id}</div>
                </div>
              </div>
              <div class="patient-actions">
                <button class="action-btn view" onclick={() => selectPatient(patient.id)}>
                  👁️ View
                </button>
                <button class="action-btn encounter" onclick={() => startEncounter(patient.id)}>
                  📋 Visit
                </button>
                <button class="action-btn vitals" onclick={() => recordVitals(patient.id)}>
                  🩺 Vitals
                </button>
              </div>
            </div>
          {/each}
        </div>

        {#if hasMore}
          <div class="load-more">
            <button class="load-more-btn" onclick={loadMore} disabled={isLoading}>
              {#if isLoading}
                <span class="spinner"></span>
                Loading...
              {:else}
                📥 Load More ({patients.length} of {totalCount})
              {/if}
            </button>
          </div>
        {/if}
      {/if}
    </div>
  {:else}
    <div class="hint-box">
      <h4>💡 Search Tips</h4>
      <ul>
        <li>Enter the patient's first or last name</li>
        <li>Search is case-insensitive</li>
        <li>Use the toggle above to search only within your workshop group</li>
      </ul>
    </div>
  {/if}
</div>

<style>
  .page-container {
    max-width: 900px;
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

  .search-box {
    background: white;
    border-radius: 16px;
    border: 1px solid #E2E8F0;
    padding: 24px;
    margin-bottom: 24px;
  }

  .search-input-group {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .search-input {
    flex: 1;
    padding: 14px 18px;
    border: 2px solid #E2E8F0;
    border-radius: 10px;
    font-size: 16px;
  }

  .search-input:focus {
    outline: none;
    border-color: #2563EB;
  }

  .search-btn {
    padding: 14px 24px;
    background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .search-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
  }

  .search-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .filter-toggle {
    padding-top: 8px;
    border-top: 1px solid #E2E8F0;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #475569;
    cursor: pointer;
  }

  .toggle-label input {
    width: 18px;
    height: 18px;
    cursor: pointer;
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

  .results-section {
    background: white;
    border-radius: 16px;
    border: 1px solid #E2E8F0;
    padding: 24px;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #E2E8F0;
  }

  .results-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: #1E293B;
    margin: 0;
  }

  .results-count {
    font-size: 14px;
    color: #64748B;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .skeleton-row {
    height: 80px;
    background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 10px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .empty-state {
    text-align: center;
    padding: 48px 24px;
    color: #64748B;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .empty-state p {
    font-size: 18px;
    font-weight: 600;
    color: #1E293B;
    margin: 0 0 8px 0;
  }

  .empty-state span {
    font-size: 14px;
  }

  .patient-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .patient-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #F8FAFC;
    border-radius: 12px;
    border: 2px solid transparent;
    transition: all 0.2s;
    flex-wrap: wrap;
    gap: 16px;
  }

  .patient-card:hover {
    border-color: #CBD5E1;
    background: #F1F5F9;
  }

  .patient-main {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 200px;
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
    margin: 0 0 6px 0;
  }

  .patient-meta {
    display: flex;
    gap: 8px;
    font-size: 13px;
    color: #64748B;
    flex-wrap: wrap;
    align-items: center;
  }

  .ph-id {
    font-family: monospace;
    background: #E2E8F0;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .tag-badge {
    background: #DBEAFE;
    color: #1E40AF;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .patient-id {
    font-size: 11px;
    color: #94A3B8;
    font-family: monospace;
    margin-top: 4px;
  }

  .patient-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .action-btn {
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .action-btn.view {
    background: white;
    border: 1px solid #E2E8F0;
    color: #475569;
  }

  .action-btn.view:hover {
    background: #F1F5F9;
  }

  .action-btn.encounter {
    background: #EFF6FF;
    color: #2563EB;
  }

  .action-btn.encounter:hover {
    background: #DBEAFE;
  }

  .action-btn.vitals {
    background: #F0FDF4;
    color: #16A34A;
  }

  .action-btn.vitals:hover {
    background: #DCFCE7;
  }

  .load-more {
    margin-top: 20px;
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid #E2E8F0;
  }

  .load-more-btn {
    padding: 12px 24px;
    background: white;
    border: 2px solid #2563EB;
    color: #2563EB;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .load-more-btn:hover:not(:disabled) {
    background: #EFF6FF;
  }

  .load-more-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .hint-box {
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: 12px;
    padding: 20px;
  }

  .hint-box h4 {
    font-size: 14px;
    font-weight: 600;
    color: #1E40AF;
    margin: 0 0 12px 0;
  }

  .hint-box ul {
    margin: 0;
    padding-left: 20px;
    color: #1E40AF;
    font-size: 14px;
  }

  .hint-box li {
    margin-bottom: 6px;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
