import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { ToastContainer } from '../components/Toast';
import PasswordInput from '../components/PasswordInput';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Array<{id: string, message: string, type: 'success' | 'error' | 'info'}>>([]);
  const navigate = useNavigate();

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const validateForm = (): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+]?[0-9]{10,15}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

    if (!email.trim()) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    
    if (!phone.trim()) return 'Phone number is required';
    if (!phoneRegex.test(phone)) return 'Phone number must be 10-15 digits (optional + at start)';
    
    if (!newPassword) return 'New password is required';
    if (newPassword.length < 8) return 'Password must be at least 8 characters long';
    if (!passwordRegex.test(newPassword)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, phone, newPassword });
      setSuccess(true);
      setError('');
      addToast('Password reset successful! Redirecting to login...', 'success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to reset password';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <ToastContainer toasts={toasts} removeToast={removeToast} confirmDialog={null} closeConfirm={() => {}} />
      <div className="glass-card">
        <h2>Reset Password</h2>
        <p>Enter your details to create a new password</p>
        
        {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: '#10b981', marginBottom: '1rem', textAlign: 'center' }}>Password reset successfully! Redirecting...</div>}
        
        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                className="form-control" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="text" 
                className="form-control" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                required
              />
            </div>
            <PasswordInput 
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              label="New Password"
              required
              minLength={8}
              placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
            />
            <PasswordInput 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              label="Confirm New Password"
              required
              minLength={8}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <p>Remembered your password? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
