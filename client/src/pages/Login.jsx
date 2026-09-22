import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Veuillez renseigner votre nom d’utilisateur et mot de passe.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Identifiants invalides. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <MessageSquare size={22} />
            </div>
            <span className="auth-brand-name">NexusChat</span>
          </div>
          <p className="auth-subtitle">Bienvenue ! Connectez-vous à votre espace.</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Nom d'utilisateur</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="ex: admin ou herby"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Comptes de test :</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: 11, padding: '4px 8px' }}
              onClick={() => handleQuickFill('admin', 'admin123')}
            >
              admin / admin123
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: 11, padding: '4px 8px' }}
              onClick={() => handleQuickFill('user', 'password')}
            >
              user / password
            </button>
          </div>
        </div>

        <div className="auth-footer">
          Pas encore de compte ?{' '}
          <Link to="/register">Créer un compte</Link>
        </div>
      </div>
    </div>
  );
}
