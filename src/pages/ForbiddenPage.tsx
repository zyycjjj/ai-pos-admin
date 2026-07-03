import { useAuthStore } from '../stores/authStore';

export function ForbiddenPage() {
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.role);

  return (
    <div className="forbidden-screen">
      <div className="state-panel danger">
        <strong>403 Forbidden</strong>
        <span>{role ?? 'This role'} cannot access AI-POS Admin. Owner or Manager access is required.</span>
        <button className="secondary-button" type="button" onClick={logout}>
          Back to login
        </button>
      </div>
    </div>
  );
}
