<script>
  import { appStore } from '$stores/appStore.svelte.js';
  import { VITAL_SIGNS_LOINC_CODES } from '$constants';

  // Props
  let { 
    patients = [], 
    isLoading = false, 
    error = '',
    clinicColor = '#2563EB'
  } = $props();

  // Local state
  let searchQuery = $state('');
  
  // Helper functions
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

  function getGenderEmoji(gender) {
    if (gender === 'male') return '👨';
    if (gender === 'female') return '👩';
    return '👤';
  }

  function formatRelativeDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  }

  function formatEncounterDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  }

  function formatVitals(vitalsObj) {
    if (!vitalsObj || Object.keys(vitalsObj).length === 0) return null;
    
    const parts = [];
    if (vitalsObj['8480-6']) {
      const sbp = vitalsObj['8480-6'].valueQuantity?.value;
      const dbp = vitalsObj['8462-4']?.valueQuantity?.value;
      parts.push(`BP ${sbp}/${dbp || '-'}`);
    }
    if (vitalsObj['8867-4']) parts.push(`HR ${vitalsObj['8867-4'].valueQuantity?.value}`);
    if (vitalsObj['8310-5']) parts.push(`Temp ${vitalsObj['8310-5'].valueQuantity?.value}°C`);
    if (vitalsObj['2708-6'] || vitalsObj['59408-5']) {
      const spo2 = vitalsObj['2708-6'] || vitalsObj['59408-5'];
      parts.push(`SpO2 ${spo2.valueQuantity?.value}%`);
    }
    if (vitalsObj['9279-1']) parts.push(`RR ${vitalsObj['9279-1'].valueQuantity?.value}`);
    if (vitalsObj['29463-7']) parts.push(`Wt ${vitalsObj['29463-7'].valueQuantity?.value}kg`);
    
    return parts.length ? parts.join(' • ') : null;
  }

  function getEncounterTypeText(encounter) {
    if (!encounter) return null;
    return encounter.type?.[0]?.text || 
           encounter.type?.[0]?.coding?.[0]?.display || 
           encounter.class?.display || 
           'Visit';
  }

  function getActiveConditionsText(conditions) {
    if (!conditions || conditions.length === 0) return null;
    const texts = conditions.slice(0, 3).map(c => 
      c.code?.text || c.code?.coding?.[0]?.display || 'Unknown'
    );
    return texts.join(', ');
  }

  // Client-side filtered patients
  const filteredPatients = $derived(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patients;
    
    return patients.filter(p => {
      // Search name
      const name = getPatientName(p).toLowerCase();
      if (name.includes(q)) return true;
      
      // Search PHID
      const phid = getPHID(p).toLowerCase();
      if (phid.includes(q)) return true;
      
      // Search conditions
      const conds = (p._conditions || []).map(c => 
        (c.code?.text || c.code?.coding?.[0]?.display || '').toLowerCase()
      ).join(' ');
      if (conds.includes(q)) return true;
      
      return false;
    });
  });

  function clearSearch() {
    searchQuery = '';
  }
</script>

<div class="patient-grid-section">
  <!-- Section Header -->
  <div class="section-header">
    <h2>👤 My Patients</h2>
    <span class="patient-count">{patients.length} patient{patients.length !== 1 ? 's' : ''}</span>
  </div>

  <!-- Search Bar -->
  <div class="search-bar">
    <span class="search-icon">🔍</span>
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search patients by name, PHID, or condition…"
      class="search-input"
    />
    {#if searchQuery}
      <button class="clear-btn" onclick={clearSearch} aria-label="Clear search">✕</button>
    {/if}
  </div>

  <!-- Error Banner -->
  {#if error}
    <div class="error-banner">⚠️ {error}</div>
  {/if}

  <!-- Loading Skeletons -->
  {#if isLoading && patients.length === 0}
    <div class="patient-grid">
      {#each Array(6) as _, i}
        <div class="skeleton-card"></div>
      {/each}
    </div>
  
  <!-- Empty State -->
  {:else if filteredPatients().length === 0}
    <div class="empty-state">
      <div class="empty-icon">{searchQuery ? '🔍' : '👤'}</div>
      <p class="empty-title">{searchQuery ? 'No patients match your search' : 'No patients found'}</p>
      <p class="empty-hint">
        {searchQuery 
          ? 'Try a different search term or clear the filter' 
          : 'Patients registered in this workshop will appear here'}
      </p>
      {#if !searchQuery && appStore.clinicId !== 'aklan-pharmacy' && appStore.clinicId !== 'kalibo-lab'}
        <a href={appStore.buildUrl('/patient/new')} class="btn-register">
          ➕ Register Patient
        </a>
      {/if}
    </div>
  
  <!-- Card Grid -->
  {:else}
    <div class="patient-grid">
      {#each filteredPatients() as patient (patient.id)}
        {@const name = getPatientName(patient)}
        {@const age = getAge(patient.birthDate)}
        {@const phid = getPHID(patient)}
        {@const encounter = patient._latestEncounter}
        {@const vitalsStr = formatVitals(patient._latestVitals)}
        {@const conditionsStr = getActiveConditionsText(patient._conditions)}
        {@const lastUpdated = patient.meta?.lastUpdated}
        
        <a 
          href={appStore.buildUrl(`/patient/${patient.id}`)}
          class="patient-card"
          style="--card-accent: {clinicColor}"
        >
          <!-- Card Header: Patient Info -->
          <div class="card-header">
            <div class="patient-avatar">
              {getGenderEmoji(patient.gender)}
            </div>
            <div class="patient-header-info">
              <h3 class="patient-name">{name}</h3>
              <div class="patient-meta">
                <span>{age} years • {patient.gender || 'Unknown'}</span>
                {#if phid}
                  <span class="phid-badge">PHID: {phid}</span>
                {/if}
              </div>
            </div>
          </div>

          <!-- Clinical Summary -->
          <div class="clinical-summary">
            {#if encounter}
              <div class="summary-row">
                <span class="summary-icon">📋</span>
                <span class="summary-text">
                  <strong>{getEncounterTypeText(encounter)}</strong>
                  <span class="summary-date">{formatEncounterDate(encounter.period?.start)}</span>
                </span>
              </div>
            {:else}
              <div class="summary-row muted">
                <span class="summary-icon">📋</span>
                <span class="summary-text">No visits recorded</span>
              </div>
            {/if}

            {#if vitalsStr}
              <div class="summary-row vitals-row">
                <span class="summary-icon">🩺</span>
                <span class="summary-text vitals-text">{vitalsStr}</span>
              </div>
            {/if}

            {#if conditionsStr}
              <div class="summary-row conditions-row">
                <span class="summary-icon">🏥</span>
                <span class="summary-text conditions-text">{conditionsStr}</span>
              </div>
            {/if}
          </div>

          <!-- Card Footer -->
          <div class="card-footer">
            <span class="last-updated">
              Updated {formatRelativeDate(lastUpdated)}
            </span>
            <span class="open-link">Open →</span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .patient-grid-section {
    margin-bottom: 32px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 16px;
  }

  .section-header h2 {
    font-size: 18px;
    font-weight: 700;
    color: #1E293B;
    margin: 0;
  }

  .patient-count {
    font-size: 13px;
    color: #64748B;
    font-weight: 500;
  }

  /* Search Bar */
  .search-bar {
    position: relative;
    margin-bottom: 16px;
  }

  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    color: #94A3B8;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    padding: 12px 40px 12px 40px;
    border: 2px solid #E2E8F0;
    border-radius: 10px;
    font-size: 15px;
    background: white;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--card-accent, #2563EB);
  }

  .clear-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: #F1F5F9;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    color: #64748B;
    transition: all 0.2s;
  }

  .clear-btn:hover {
    background: #E2E8F0;
    color: #1E293B;
  }

  /* Error Banner */
  .error-banner {
    background: #FEF2F2;
    border: 1px solid #FECACA;
    color: #DC2626;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
  }

  /* Grid - Responsive with auto-fill for dynamic columns */
  .patient-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  /* Small tablets and up: dynamic columns based on available width */
  @media (min-width: 480px) {
    .patient-grid {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
  }

  /* Large screens: ensure max 4 columns even on very wide screens */
  @media (min-width: 1400px) {
    .patient-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  /* Card */
  .patient-card {
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 12px;
    border-top: 4px solid var(--card-accent);
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    padding: 16px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
    position: relative;
  }

  .patient-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.12);
  }

  .patient-card:focus-visible {
    outline: 2px solid var(--card-accent);
    outline-offset: 2px;
  }

  /* Card Header */
  .card-header {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #F1F5F9;
  }

  .patient-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #F1F5F9;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  .patient-header-info {
    flex: 1;
    min-width: 0;
  }

  .patient-name {
    font-size: 15px;
    font-weight: 700;
    color: #1E293B;
    margin: 0 0 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .patient-meta {
    font-size: 12px;
    color: #64748B;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .phid-badge {
    font-family: 'SF Mono', Monaco, monospace;
    background: #E2E8F0;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    color: #475569;
  }

  /* Clinical Summary */
  .clinical-summary {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .summary-row {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    font-size: 13px;
  }

  .summary-row.muted {
    color: #94A3B8;
  }

  .summary-icon {
    flex-shrink: 0;
    font-size: 14px;
  }

  .summary-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1.4;
    color: #374151;
  }

  .summary-text strong {
    color: #1E293B;
    font-weight: 600;
  }

  .summary-date {
    color: #64748B;
    font-size: 12px;
  }

  .vitals-row {
    background: #F0FDF4;
    padding: 6px 8px;
    border-radius: 6px;
    margin-left: -2px;
  }

  .vitals-text {
    color: #166534;
    font-weight: 500;
    font-size: 12px;
  }

  .conditions-row {
    background: #EFF6FF;
    padding: 6px 8px;
    border-radius: 6px;
    margin-left: -2px;
  }

  .conditions-text {
    color: #1E40AF;
    font-size: 12px;
  }

  /* Card Footer */
  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #F1F5F9;
    font-size: 12px;
  }

  .last-updated {
    color: #94A3B8;
    font-style: italic;
  }

  .open-link {
    color: var(--card-accent);
    font-weight: 600;
    transition: transform 0.2s;
  }

  .patient-card:hover .open-link {
    transform: translateX(4px);
  }

  /* Skeleton */
  .skeleton-card {
    height: 200px;
    background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 12px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Empty State */
  .empty-state {
    background: white;
    border-radius: 12px;
    border: 2px dashed #E2E8F0;
    padding: 48px 24px;
    text-align: center;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 16px;
    font-weight: 600;
    color: #1E293B;
    margin: 0 0 8px 0;
  }

  .empty-hint {
    font-size: 14px;
    color: #64748B;
    margin: 0 0 24px 0;
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
  }

  .btn-register {
    display: inline-block;
    padding: 12px 24px;
    background: var(--card-accent, #2563EB);
    color: white;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s;
  }

  .btn-register:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    filter: brightness(1.1);
  }
</style>
