// App Configuration
export const APP_NAME = 'OpenHIE Mock EHR';
export const APP_VERSION = '2.0.0';

// FHIR Server Configuration
export const FHIR_CONFIG = {
	shrBaseUrl: 'https://cdr.fhirlab.net/fhir',
	txBaseUrl: 'https://tx.fhirlab.net/fhir',
	fhirVersion: 'R4',
	format: 'json',
	timeout: 30000
};

// Workshop tagging
export const WORKSHOP_TAG_SYSTEM = 'https://aklan-fhir.app/workshop';
export const WORKSHOP_IDENTIFIER_SYSTEM = 'https://aklan-fhir.app/workshop';

// Clinics
export const CLINICS = [
	{
		id: 'rhu-kalibo',
		name: 'RHU Kalibo',
		shortName: 'RHU Kalibo',
		type: 'Rural Health Unit',
		color: '#059669', // Emerald
		icon: '🏥',
		location: 'Kalibo, Aklan'
	},
	{
		id: 'aklan-hospital',
		name: 'Aklan Provincial Hospital',
		shortName: 'Aklan Provincial',
		type: 'Provincial Hospital',
		color: '#2563EB', // Blue
		icon: '🏥',
		location: 'Kalibo, Aklan'
	},
	{
		id: 'rhu-malay',
		name: 'RHU Malay',
		shortName: 'RHU Malay',
		type: 'Rural Health Unit',
		color: '#0891B2', // Cyan
		icon: '🏥',
		location: 'Malay, Aklan'
	},
	{
		id: 'kalibo-lab',
		name: 'Kalibo Medical Laboratory',
		shortName: 'Kalibo Lab',
		type: 'Diagnostic Center',
		color: '#7C3AED', // Purple
		icon: '🧪',
		location: 'Kalibo, Aklan'
	},
	{
		id: 'aklan-pharmacy',
		name: 'Aklan Provincial Pharmacy',
		shortName: 'Aklan Pharmacy',
		type: 'Pharmacy',
		color: '#DC2626', // Red
		icon: '💊',
		location: 'Kalibo, Aklan'
	},
	{
		id: 'lgu-health-office',
		name: 'LGU Health Office',
		shortName: 'LGU Health Office',
		type: 'Health Office',
		color: '#059669', // Emerald Green for government
		icon: '📊',
		location: 'Kalibo, Aklan'
	}
];

// Roles
export const ROLES = [
	{ id: 'registration', name: 'Registration Clerk', icon: '📝', description: 'Register new patients' },
	{ id: 'nurse', name: 'Nurse / BHW', icon: '👩‍⚕️', description: 'Record vital signs and assessments' },
	{ id: 'physician', name: 'Physician', icon: '👨‍⚕️', description: 'Diagnose and create referrals' },
	{ id: 'lab', name: 'Lab Technician', icon: '🧪', description: 'Process lab orders and results' },
	{ id: 'pharmacy', name: 'Pharmacist', icon: '💊', description: 'Dispense medications' }
];

// Patient cases for activity
export const PATIENT_CASES = [
	{
		id: 'maria',
		name: 'Maria Santos',
		description: 'Hypertension journey',
		complexity: 3,
		age: 45,
		gender: 'female',
		philhealthId: '12-123456789-0'
	},
	{
		id: 'juan',
		name: 'Juan Dela Cruz',
		description: 'Diabetes management',
		complexity: 2,
		age: 58,
		gender: 'male',
		philhealthId: '09-876543210-1'
	},
	{
		id: 'ana',
		name: 'Ana Reyes',
		description: 'Prenatal care',
		complexity: 2,
		age: 28,
		gender: 'female',
		philhealthId: '11-111111111-1'
	},
	{
		id: 'miguel',
		name: 'Miguel Santos',
		description: 'Child immunization',
		complexity: 1,
		age: 0, // 2 months
		gender: 'male',
		philhealthId: '22-222222222-2'
	},
	{
		id: 'elena',
		name: 'Elena Torres',
		description: 'Emergency referral',
		complexity: 4,
		age: 50,
		gender: 'female',
		philhealthId: '33-333333333-3'
	}
];

// Clinic Capabilities - what each clinic can create and view
export const CLINIC_CAPABILITIES = {
	'rhu-kalibo': {
		canCreate: ['Patient', 'Encounter', 'Observation', 'ServiceRequest', 'MedicationRequest'],
		canView: ['Patient', 'Encounter', 'Observation', 'ServiceRequest', 'MedicationRequest', 'DiagnosticReport', 'MedicationDispense', 'Condition'],
		primaryActions: ['register', 'search', 'encounter', 'vitals', 'order', 'prescribe', 'viewLabs', 'viewMeds', 'analytics'],
		description: 'Primary care — register patients, record visits, order labs, view results, refer to hospital'
	},
	'aklan-hospital': {
		canCreate: ['Patient', 'Encounter', 'Observation', 'ServiceRequest', 'MedicationRequest', 'DiagnosticReport'],
		canView: ['Patient', 'Encounter', 'Observation', 'ServiceRequest', 'MedicationRequest', 'DiagnosticReport', 'MedicationDispense', 'Condition'],
		primaryActions: ['register', 'search', 'encounter', 'vitals', 'order', 'prescribe', 'report', 'viewLabs', 'viewMeds', 'analytics'],
		description: 'Secondary care — full clinical services including lab reporting and medication tracking'
	},
	'rhu-malay': {
		canCreate: ['Patient', 'Encounter', 'Observation', 'ServiceRequest', 'MedicationRequest'],
		canView: ['Patient', 'Encounter', 'Observation', 'ServiceRequest', 'MedicationRequest', 'DiagnosticReport', 'MedicationDispense'],
		primaryActions: ['register', 'search', 'encounter', 'vitals', 'order', 'prescribe', 'viewLabs', 'viewMeds'],
		description: 'Rural health — full primary care including prescriptions, referrals, and viewing results'
	},
	'kalibo-lab': {
		canCreate: ['Observation', 'DiagnosticReport'],
		canView: ['Patient', 'ServiceRequest', 'DiagnosticReport', 'Observation'],
		primaryActions: ['inbox', 'report'],
		description: 'Laboratory — receive orders, process tests, report results'
	},
	'aklan-pharmacy': {
		canCreate: ['MedicationDispense'],
		canView: ['Patient', 'MedicationRequest', 'MedicationDispense'],
		primaryActions: ['inbox', 'dispense'],
		description: 'Pharmacy — receive prescriptions, dispense medications'
	},
	'lgu-health-office': {
		canCreate: [], // No direct patient care - monitoring only
		canView: ['Patient', 'Encounter', 'Observation', 'ServiceRequest', 'MedicationRequest', 'DiagnosticReport', 'MedicationDispense', 'Condition', 'Practitioner'],
		primaryActions: ['search', 'inbox'], // Minimal actions - population data shown automatically on dashboard
		description: 'Population health monitoring — oversee all facilities and track disease patterns within the workshop group'
	}
};

// Common LOINC codes for vitals
export const LOINC_CODES = {
	bloodPressurePanel: '85354-9',
	systolicBP: '8480-6',
	diastolicBP: '8462-4',
	heartRate: '8867-4',
	respiratoryRate: '9279-1',
	bodyTemperature: '8310-5',
	oxygenSaturation: '2708-6',
	weight: '29463-7',
	height: '8302-2',
	bmi: '39156-5',
	bloodGlucose: '2339-0'
};

// SNOMED codes for common conditions
export const SNOMED_CODES = {
	hypertension: '38341003',
	diabetes: '44054006',
	pregnancy: '77386006'
};

// ICD-10 codes
export const ICD10_CODES = {
	hypertension: 'I10',
	diabetes: 'E11'
};

/**
 * PhilHealth ACR (All Case Rates) ICD-10 Terminology
 * Source: http://www.philhealth.gov.ph/fhir/CodeSystem/acr-library
 * ValueSet: http://www.philhealth.gov.ph/fhir/ValueSet/acr-icd-hierarchical
 * Server: https://tx.fhirlab.net/fhir
 * Total Codes: 9,520 ICD-10 diagnosis codes
 * 
 * Query method: GET $expand with filter parameter
 * Example: GET /ValueSet/$expand?url={ACR_ICD_VALUESET_URL}&filter=diabetes&count=10
 */
export const ACR_ICD_CODE_SYSTEM = 'http://www.philhealth.gov.ph/fhir/CodeSystem/acr-library';
export const ACR_ICD_VALUESET_URL = 'http://www.philhealth.gov.ph/fhir/ValueSet/acr-icd-hierarchical';
export const ACR_ICD_VERSION = '2.3.0-hierarchical';

/**
 * Vital Signs ValueSet URL
 * Used to identify which observations are vital signs
 * This ValueSet must exist on the terminology server (tx.fhirlab.net)
 * Created via: POST https://tx.fhirlab.net/fhir/ValueSet
 * ValueSet ID: f61716c4-0668-43ba-b4c3-3468f19e2ae6
 */
export const VITAL_SIGNS_VALUESET_URL = 'http://aklan-fhir.app/ValueSet/vital-signs-codes';

/**
 * Common vital signs LOINC codes (fallback if ValueSet not available)
 * These match the codes in the ValueSet above
 */
export const VITAL_SIGNS_LOINC_CODES = [
	'85354-9',  // Blood pressure panel
	'8480-6',   // Systolic BP
	'8462-4',   // Diastolic BP
	'8867-4',   // Heart rate
	'9279-1',   // Respiratory rate
	'8310-5',   // Body temperature
	'2708-6',   // Oxygen saturation
	'59408-5',  // Oxygen saturation in Blood
	'8302-2',   // Body height
	'8306-3',   // Body height --standing
	'29463-7',  // Body weight
	'39156-5',  // BMI
	'3141-9',   // Body weight Measured
	'3142-7'    // Body weight Stated
];
