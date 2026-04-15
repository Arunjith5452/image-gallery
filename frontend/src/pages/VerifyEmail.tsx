import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const { data } = await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(data.message);
        setTimeout(() => navigate('/login'), 3000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Email verification failed');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="auth-container">
      <div className="glass-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <Loader2 size={64} style={{ margin: '0 auto 1.5rem', animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
            <h2>Verifying Your Email...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={64} style={{ margin: '0 auto 1.5rem', color: '#10b981' }} />
            <h2 style={{ color: '#10b981' }}>Email Verified!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{message}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Redirecting to login...</p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={64} style={{ margin: '0 auto 1.5rem', color: '#ef4444' }} />
            <h2 style={{ color: '#ef4444' }}>Verification Failed</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{message}</p>
            <Link to="/register" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block', textDecoration: 'none' }}>
              Back to Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
