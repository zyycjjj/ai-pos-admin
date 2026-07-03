import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { login } from '../services/authApi';
import { useAuthStore } from '../stores/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, role, setSession } = useAuthStore();
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
      setError('Login failed. Check the staff account and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <section className="login-copy">
        <span className="eyebrow">AI-POS Admin</span>
        <h1>Manage the store behind the counter.</h1>
        <p>Owner and manager access for staff, products, campaign drafts, and AI drafts.</p>
      </section>
      <form className="login-card" onSubmit={submit}>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
        </label>
        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
        </label>
        {error ? <div className="form-error">{error}</div> : null}
        <button className="primary-button" disabled={loading} type="submit">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <div className="demo-accounts">
          <strong>Demo accounts</strong>
          <span>owner@aipos.test / password123</span>
          <span>manager@aipos.test / password123</span>
          <span>cashier@aipos.test / password123</span>
        </div>
      </form>
    </div>
  );
}
