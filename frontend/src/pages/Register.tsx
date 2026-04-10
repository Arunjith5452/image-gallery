import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ToastContainer } from '../components/Toast';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Array<{id: string, message: string, type: 'success' | 'error' | 'info'}>>([]);
  const navigate = useNavigate();
  const { login } = useAuth();

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
    
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!passwordRegex.test(password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (password !== confirmPassword) return 'Passwords do not match';
    
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
      const { data } = await axios.post('http://localhost:5000/api/auth/register', { email, phone, password });
      setError('');
      if (data.token) {
        login(data, data.token);
        addToast('Registration successful! Welcome to ImageGallery.', 'success');
        setTimeout(() => navigate('/'), 500);
      } else {
        addToast('Registration successful! Please check your email.', 'success');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to register';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="glass-card">
        <h2>Create Account</h2>
        <p>Join our premium image gallery</p>
        
        {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        
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
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
              minLength={8}
              placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required
              minLength={8}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Sign Up'}
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
