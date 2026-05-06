import { create } from 'zustand';
import { api } from '../lib/api';
import { ApiResponse, RetentionPolicy } from '../types/api';

interface CreatePolicyRequest {
    policy_name: string;
    description?: string;
    retention_days: number;
    legal_basis?: string;
}

interface RetentionState {
    policies: RetentionPolicy[];
    loading: boolean;
    error: string | null;

    fetchPolicies: () => Promise<void>;
    createPolicy: (data: CreatePolicyRequest) => Promise<ApiResponse<RetentionPolicy>>;
}

export const useRetentionStore = create<RetentionState>((set) => ({
    policies: [],
    loading: false,
    error: null,

    fetchPolicies: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get<RetentionPolicy[]>('/retention-policies');
            if (response.success && response.data) {
                set({ policies: response.data });
            } else {
                set({ error: response.message || 'Failed to fetch retention policies' });
            }
        } catch (err) {
            set({ error: 'Network error fetching retention policies' });
        } finally {
            set({ loading: false });
        }
    },

    createPolicy: async (data) => {
        try {
            const response = await api.post<RetentionPolicy>('/retention-policies', data);
            if (response.success && response.data) {
                set((state) => ({ policies: [response.data!, ...state.policies] }));
            }
            return response;
        } catch (err) {
            return { success: false, message: 'Network error creating policy', data: null };
        }
    },
}));
