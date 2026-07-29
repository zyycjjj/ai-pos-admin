import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { EmptyState, ErrorState, LoadingState } from '../components/PageState';
import { createStaff, disableStaff, fetchPermissionPolicy, fetchStaff, resetStaffPin, updatePermissionPolicy, updateStaffRole } from '../services/adminApi';
import { useAuthStore } from '../stores/authStore';
import type { PermissionPolicy } from '../types/admin';
import type { StoreRole } from '../types/auth';

const roles: Array<Exclude<StoreRole, 'OWNER'>> = ['MANAGER', 'CASHIER', 'KITCHEN', 'WAITER', 'STAFF'];

export function StaffPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const query = useQuery({ queryKey: ['admin', 'staff'], queryFn: fetchStaff });
  const policyQuery = useQuery({ queryKey: ['admin', 'permission-policy'], queryFn: fetchPermissionPolicy });
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('password123');
  const [newRole, setNewRole] = useState<Exclude<StoreRole, 'OWNER'>>('STAFF');
  const [error, setError] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
  const createMutation = useMutation({ mutationFn: createStaff, onSuccess: invalidate });
  const roleMutation = useMutation({ mutationFn: ({ id, nextRole }: { id: string; nextRole: Exclude<StoreRole, 'OWNER'> }) => updateStaffRole(id, nextRole), onSuccess: invalidate });
  const disableMutation = useMutation({ mutationFn: ({ id, disabled }: { id: string; disabled: boolean }) => disableStaff(id, disabled), onSuccess: invalidate });
  const pinMutation = useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) => resetStaffPin(id, pin),
    onSuccess: invalidate,
  });
  const policyMutation = useMutation({
    mutationFn: updatePermissionPolicy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'permission-policy'] }),
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      await createMutation.mutateAsync({ email, name, password, role: newRole });
      setEmail('');
      setName('');
      setPassword('password123');
      setNewRole('STAFF');
    } catch {
      setError('Could not create staff. Check duplicate email or permissions.');
    }
  }

  return (
    <section>
      <div className="page-header">
        <span className="eyebrow">People</span>
        <h1>Staff Management</h1>
      </div>
      <form className="inline-form" onSubmit={submit}>
        <input placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        <input placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
        <input placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
        <select value={newRole} onChange={(event) => setNewRole(event.target.value as Exclude<StoreRole, 'OWNER'>)}>
          {roles.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button className="primary-button" type="submit" disabled={createMutation.isPending}>
          Create Staff
        </button>
      </form>
      {error ? <div className="form-error">{error}</div> : null}
      <PermissionPolicyCard
        policy={policyQuery.data}
        saving={policyMutation.isPending}
        onSave={(input) => policyMutation.mutate(input)}
      />
      {query.isLoading ? <LoadingState title="Loading staff" /> : null}
      {query.isError ? <ErrorState title="Staff unavailable" description="Check your permissions and connection." /> : null}
      {query.data?.length === 0 ? <EmptyState title="No staff yet" description="Create the first staff account for this store." /> : null}
      {query.data && query.data.length > 0 ? (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>PIN</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((staff) => {
                const isSelf = staff.userId === user?.id;
                const managerBlocked = role === 'MANAGER' && staff.role === 'OWNER';
                const disabled = isSelf || managerBlocked;
                return (
                  <tr key={staff.id}>
                    <td>{staff.name ?? '-'}</td>
                    <td>{staff.email}</td>
                    <td>
                      {staff.role === 'OWNER' ? (
                        staff.role
                      ) : (
                        <select
                          value={staff.role}
                          disabled={disabled}
                          onChange={(event) => roleMutation.mutate({ id: staff.id, nextRole: event.target.value as Exclude<StoreRole, 'OWNER'> })}
                        >
                          {roles.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>{staff.role === 'OWNER' || staff.role === 'MANAGER' ? (staff.pinSet ? 'Set' : 'Not set') : '-'}</td>
                    <td><span className={`status ${staff.status.toLowerCase()}`}>{staff.status}</span></td>
                    <td>
                      {(staff.role === 'OWNER' || staff.role === 'MANAGER') && !managerBlocked ? (
                        <button
                          className="secondary-button"
                          disabled={pinMutation.isPending}
                          type="button"
                          onClick={() => {
                            const pin = window.prompt('Enter a numeric manager PIN');
                            if (pin) pinMutation.mutate({ id: staff.id, pin });
                          }}
                        >
                          Reset PIN
                        </button>
                      ) : null}
                      <button
                        className="secondary-button"
                        disabled={disabled}
                        type="button"
                        onClick={() => disableMutation.mutate({ id: staff.id, disabled: staff.status === 'ACTIVE' })}
                      >
                        {staff.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function PermissionPolicyCard({ onSave, policy, saving }: { onSave: (input: Partial<PermissionPolicy>) => void; policy?: PermissionPolicy; saving: boolean }) {
  const [draft, setDraft] = useState<PermissionPolicy | null>(null);
  const value = draft ?? policy;
  if (!value) return null;
  const update = (patch: Partial<PermissionPolicy>) => setDraft({ ...value, ...patch });

  return (
    <section className="table-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Permissions</span>
          <h2>Manager Approval Policy</h2>
        </div>
        <button className="primary-button" type="button" disabled={saving} onClick={() => onSave(value)}>
          Save Policy
        </button>
      </div>
      <div className="settings-grid">
        <label><input type="checkbox" checked={value.refundRequiresApproval} onChange={(event) => update({ refundRequiresApproval: event.target.checked })} /> Refund requires approval</label>
        <label><input type="checkbox" checked={value.voidRequiresApproval} onChange={(event) => update({ voidRequiresApproval: event.target.checked })} /> Void requires approval</label>
        <label><input type="checkbox" checked={value.preparedItemCancelRequiresApproval} onChange={(event) => update({ preparedItemCancelRequiresApproval: event.target.checked })} /> Prepared item cancel requires approval</label>
        <label>Manual discount threshold<input type="number" min="0" value={value.manualDiscountApprovalThreshold} onChange={(event) => update({ manualDiscountApprovalThreshold: Number(event.target.value) || 0 })} /></label>
        <label>Cash out threshold<input type="number" min="0" value={value.cashOutApprovalThreshold} onChange={(event) => update({ cashOutApprovalThreshold: Number(event.target.value) || 0 })} /></label>
        <label>Refund threshold<input type="number" min="0" value={value.refundApprovalThreshold} onChange={(event) => update({ refundApprovalThreshold: Number(event.target.value) || 0 })} /></label>
      </div>
    </section>
  );
}
