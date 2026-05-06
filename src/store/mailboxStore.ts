import { create } from 'zustand';
import { api } from '../lib/api';
import { ApiResponse, Mailbox } from '../types/api';

interface CreateMailboxRequest {
    source_type?: string;
    email_address: string;
    imap_host?: string;
    imap_port?: number;
    imap_username?: string;
    imap_password?: string;
    use_ssl?: boolean;
}

interface SyncResult {
    archived_count: number;
}

interface MailboxState {
    mailboxes: Mailbox[];
    loading: boolean;
    syncing: string | null;
    error: string | null;

    fetchMailboxes: () => Promise<void>;
    createMailbox: (data: CreateMailboxRequest) => Promise<ApiResponse<Mailbox>>;
    syncMailbox: (mailboxId: string) => Promise<ApiResponse<SyncResult>>;
}

export const useMailboxStore = create<MailboxState>((set, get) => ({
    mailboxes: [],
    loading: false,
    syncing: null,
    error: null,

    fetchMailboxes: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get<Mailbox[]>('/mailboxes');
            if (response.success && response.data) {
                set({ mailboxes: response.data });
            } else {
                set({ error: response.message || 'Failed to fetch mailboxes' });
            }
        } catch (err) {
            set({ error: 'Network error fetching mailboxes' });
        } finally {
            set({ loading: false });
        }
    },

    createMailbox: async (data) => {
        try {
            const response = await api.post<Mailbox>('/mailboxes', data);
            if (response.success && response.data) {
                set((state) => ({ mailboxes: [response.data!, ...state.mailboxes] }));
            }
            return response;
        } catch (err) {
            return { success: false, message: 'Network error creating mailbox', data: null };
        }
    },

    syncMailbox: async (mailboxId) => {
        set({ syncing: mailboxId });
        try {
            const response = await api.post<SyncResult>(`/mailboxes/${mailboxId}/sync`, {});
            return response;
        } catch (err) {
            return { success: false, message: 'Network error syncing mailbox', data: null };
        } finally {
            set({ syncing: null });
        }
    },
}));
