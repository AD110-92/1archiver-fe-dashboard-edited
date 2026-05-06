import React, { useEffect, useState } from 'react';
import { Clock, Shield, FileText, Plus, X } from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useRetentionStore } from '../src/store/retentionStore';

export const RetentionPolicies: React.FC = () => {
   const { policies, loading, error, fetchPolicies, createPolicy } = useRetentionStore();
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isCreating, setIsCreating] = useState(false);
   const [form, setForm] = useState({
      policy_name: '',
      description: '',
      retention_days: 365,
      legal_basis: '',
   });

   useEffect(() => {
      fetchPolicies();
   }, [fetchPolicies]);

   const handleCreate = async () => {
      if (!form.policy_name) return;
      setIsCreating(true);
      const res = await createPolicy(form);
      setIsCreating(false);
      if (res.success) {
         setIsModalOpen(false);
         setForm({ policy_name: '', description: '', retention_days: 365, legal_basis: '' });
      } else {
         alert(res.message);
      }
   };

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">Retention Policies</h1>
               <p className="text-slate-500 mt-1 text-sm">Define data lifecycle and immutable preservation rules.</p>
            </div>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>New Policy</Button>
         </div>

         {/* WORM Compliance Banner */}
         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
               <h4 className="text-sm font-semibold text-blue-900">Global WORM Compliance Mode Enabled</h4>
               <p className="text-xs text-blue-700 mt-1">
                  All retention policies are enforced with Write-Once-Read-Many (WORM) protection.
                  Data cannot be modified or deleted before the retention period expires.
               </p>
            </div>
         </div>

         {loading && <div className="text-center text-slate-500">Loading retention policies...</div>}
         {error && <div className="text-center text-rose-500">{error}</div>}

         <div className="grid grid-cols-1 gap-6">
            {policies?.map((policy) => (
               <Card key={policy.retention_policy_id} className="hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                     <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-100 rounded-lg text-slate-500">
                           <FileText className="w-6 h-6" />
                        </div>
                        <div>
                           <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-slate-900">{policy.policy_name}</h3>
                              <Badge variant={policy.status === 'active' ? 'success' : 'neutral'}>
                                 {policy.status}
                              </Badge>
                           </div>
                           <p className="text-sm text-slate-500 mt-1">{policy.description}</p>
                           <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                 <Clock className="w-4 h-4" /> {policy.retention_days} Days Retention
                              </span>
                              <span className="flex items-center gap-1">
                                 <Shield className="w-4 h-4" /> {policy.legal_basis}
                              </span>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center gap-3 pl-14 md:pl-0">
                        <Button variant="secondary" size="sm">Edit Rules</Button>
                        <Button variant="secondary" size="sm">View Items</Button>
                     </div>
                  </div>
               </Card>
            ))}
            {!loading && policies?.length === 0 && (
               <div className="text-center text-slate-500 py-8">No retention policies found.</div>
            )}
         </div>

         {/* Create Policy Modal */}
         {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
               <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-4">
                     <h2 className="text-xl font-bold text-slate-900">New Retention Policy</h2>
                     <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                     </button>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Policy Name *</label>
                        <input
                           type="text"
                           value={form.policy_name}
                           onChange={(e) => setForm({ ...form, policy_name: e.target.value })}
                           className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 outline-none"
                           placeholder="e.g. GDPR Data Retention"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                           value={form.description}
                           onChange={(e) => setForm({ ...form, description: e.target.value })}
                           className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 outline-none"
                           rows={2}
                           placeholder="Describe the policy purpose"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Retention Period (Days)</label>
                           <input
                              type="number"
                              value={form.retention_days}
                              onChange={(e) => setForm({ ...form, retention_days: parseInt(e.target.value) || 365 })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 outline-none"
                           />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Legal Basis</label>
                           <select
                              value={form.legal_basis}
                              onChange={(e) => setForm({ ...form, legal_basis: e.target.value })}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 outline-none bg-white"
                           >
                              <option value="">Select...</option>
                              <option value="SEC Rule 17a-4">SEC Rule 17a-4</option>
                              <option value="GDPR Art. 5(1)(e)">GDPR Art. 5(1)(e)</option>
                              <option value="SOX">SOX Compliance</option>
                              <option value="HIPAA">HIPAA</option>
                              <option value="Internal Policy">Internal Policy</option>
                           </select>
                        </div>
                     </div>
                     <div className="flex justify-end gap-3 mt-6">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!form.policy_name || isCreating}>
                           {isCreating ? 'Creating...' : 'Create Policy'}
                        </Button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};
