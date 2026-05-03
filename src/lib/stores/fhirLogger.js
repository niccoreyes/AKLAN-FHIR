import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * FHIR Transaction Logger Store
 * Tracks all REST API calls to FHIR servers for debugging
 */

// Maximum number of transactions to keep in memory
const MAX_TRANSACTIONS = 100;

function createFhirLogger() {
	const { subscribe, set, update } = writable({
		transactions: [],
		isEnabled: false,
		selectedTransaction: null
	});

	let transactionId = 0;

	return {
		subscribe,
		
		/**
		 * Toggle logging on/off
		 */
		toggle: () => {
			update(state => ({ ...state, isEnabled: !state.isEnabled }));
		},

		/**
		 * Enable/disable logging
		 */
		setEnabled: (enabled) => {
			update(state => ({ ...state, isEnabled: enabled }));
		},

		/**
		 * Log a new FHIR transaction
		 */
		logTransaction: (transaction) => {
			update(state => {
				if (!state.isEnabled) return state;

				const newTransaction = {
					id: ++transactionId,
					timestamp: new Date(),
					...transaction
				};

				const transactions = [newTransaction, ...state.transactions].slice(0, MAX_TRANSACTIONS);
				return { ...state, transactions };
			});
		},

		/**
		 * Select a transaction to view details
		 */
		selectTransaction: (id) => {
			update(state => ({
				...state,
				selectedTransaction: state.transactions.find(t => t.id === id) || null
			}));
		},

		/**
		 * Clear all transactions
		 */
		clear: () => {
			update(state => ({ ...state, transactions: [], selectedTransaction: null }));
			transactionId = 0;
		}
	};
}

export const fhirLogger = createFhirLogger();

/**
 * Helper to format JSON for display
 */
export function formatJson(obj, compact = false) {
	try {
		if (compact) {
			return JSON.stringify(obj);
		}
		return JSON.stringify(obj, null, 2);
	} catch (e) {
		return String(obj);
	}
}

/**
 * Helper to format timestamp
 */
export function formatTimestamp(date) {
	return date.toLocaleTimeString('en-US', {
		hour12: false,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		fractionalSecondDigits: 3
	});
}

/**
 * Helper to get status color
 */
export function getStatusColor(status) {
	if (!status) return '#94A3B8';
	if (status >= 200 && status < 300) return '#10B981';
	if (status >= 300 && status < 400) return '#F59E0B';
	if (status >= 400) return '#EF4444';
	return '#94A3B8';
}

/**
 * Helper to get method color
 */
export function getMethodColor(method) {
	switch (method?.toUpperCase()) {
		case 'GET': return '#3B82F6';
		case 'POST': return '#10B981';
		case 'PUT': return '#F59E0B';
		case 'PATCH': return '#8B5CF6';
		case 'DELETE': return '#EF4444';
		default: return '#64748B';
	}
}
