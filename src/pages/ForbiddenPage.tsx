import { useAuthStore } from '../stores/authStore';
import { formatStatusLabel, useAdminI18n } from '../i18n';

export function ForbiddenPage() {
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.role);
  const { t } = useAdminI18n();
  const roleLabel = formatStatusLabel(t, role);

  return (
    <div className="forbidden-screen">
      <div className="state-panel danger">
        <strong>{t('forbidden.title')}</strong>
        <span>{t('forbidden.body', { role: roleLabel })}</span>
        <button className="secondary-button" type="button" onClick={logout}>
          {t('forbidden.back')}
        </button>
      </div>
    </div>
  );
}
