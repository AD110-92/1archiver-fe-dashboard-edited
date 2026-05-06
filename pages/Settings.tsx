import React from 'react';
import { Save, Lock, Globe, Shield } from 'lucide-react';
import { Card, Button } from '../components/UI';
import { useAuthStore } from '../src/store/authStore';
import { useTenantStore } from '../src/store/tenantStore';

export const Settings: React.FC = () => {
   const { user } = useAuthStore();
   const { tenant } = useTenantStore();

   return (
      <div className="space-y-6 max-w-4xl">
         <div className="flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
               <p className="text-slate-500 mt-1 text-sm">Platform configuration and security parameters.</p>
            </div>
            <Button icon={<Save className="w-4 h-4" />}>Save Changes</Button>
         </div>

         {/* General Settings */}
         <Card title="Tenant Information" className="pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
                  <input type="text" value={tenant?.name || 'Loading...'} readOnly className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tenant ID</label>
                  <input type="text" value={user?.tenant_id || ''} readOnly className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500 font-mono" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Primary Administrator Email</label>
                  <input type="email" value={user?.primary_email || ''} readOnly className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deployment Type</label>
                  <input type="text" value={tenant?.deployment_type === 'on_premise' ? 'On-Premises / Air-Gapped' : tenant?.deployment_type || ''} readOnly className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-slate-900 outline-none">
                     <option>UTC (Universal Coordinated Time)</option>
                     <option>EST (Eastern Standard Time)</option>
                     <option>PST (Pacific Standard Time)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                  <input type="text" value={user?.display_name || ''} readOnly className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500" />
               </div>
            </div>
         </Card>

         {/* Security Section */}
         <Card title="Security & Encryption">
            <div className="space-y-6">
               <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-100 rounded">
                     <Lock className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                     <h4 className="font-medium text-slate-900">Encryption at Rest</h4>
                     <p className="text-sm text-slate-500 mt-0.5">AES-256 encryption is enforced on all storage volumes. Keys are managed via HSM.</p>
                     <div className="mt-3 flex gap-4 text-sm">
                        <label className="flex items-center gap-2">
                           <input type="radio" name="enc" checked readOnly className="text-slate-900 focus:ring-slate-900" /> System Managed Keys
                        </label>
                        <label className="flex items-center gap-2">
                           <input type="radio" name="enc" className="text-slate-900 focus:ring-slate-900" /> Customer Managed Keys (BYOK)
                        </label>
                     </div>
                  </div>
               </div>

               <hr className="border-slate-100" />

               <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-100 rounded">
                     <Globe className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                     <h4 className="font-medium text-slate-900">Network Access Control</h4>
                     <p className="text-sm text-slate-500 mt-0.5">Restrict admin panel access to specific IP ranges.</p>
                     <textarea className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-md font-mono text-sm h-20" placeholder="10.0.0.0/8, 192.168.1.1"></textarea>
                  </div>
               </div>
            </div>
         </Card>

         {/* Retention Defaults */}
         <Card title="Default Retention Rules">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-slate-400" />
                  <div>
                     <h4 className="text-sm font-medium text-slate-900">Unclassified Data Retention</h4>
                     <p className="text-xs text-slate-500">Apply to items not matching any specific policy.</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <input type="number" value="7" className="w-16 px-2 py-1 border border-slate-300 rounded text-center" />
                  <select className="px-2 py-1 border border-slate-300 rounded bg-white">
                     <option>Years</option>
                     <option>Months</option>
                  </select>
               </div>
            </div>
         </Card>
      </div>
   );
};
