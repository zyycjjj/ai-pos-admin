import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { login } from '../services/authApi';
import { useAuthStore } from '../stores/authStore';
import { useAdminI18n } from '../i18n';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, role, setSession } = useAuthStore();
  const { t } = useAdminI18n();
  const [email, setEmail] = useState('owner@aipos.test');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && (role === 'OWNER' || role === 'MANAGER')) {
    return <Navigate to="/dashboard" replace />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const session = await login(email, password);
      setSession(session);
      if (session.role === 'OWNER' || session.role === 'MANAGER') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <section className="login-copy">
        <span className="eyebrow">AI-POS Admin</span>
        <h1>{t('login.heroTitle')}</h1>
        <p>{t('login.heroBody')}</p>
      </section>
      <form className="login-card" onSubmit={submit}>
        <label>
          {t('login.email')}
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
        </label>
        <label>
          {t('login.password')}
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary-button" disabled={loading} type="submit">
          {loading ? t('login.signingIn') : t('login.signIn')}
        </button>
        <div className="demo-accounts">
          <strong>{t('login.demoAccounts')}</strong>
          <span>owner@aipos.test / password123</span>
          <span>manager@aipos.test / password123</span>
          <span>cashier@aipos.test / password123</span>
        </div>
      </form>
    </div>
  );
}
