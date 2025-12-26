
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mockBackend } from '../services/apiService';

const VerifyEmail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email') || 'your email';

  const [resending, setResending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleResend = async () => {
    setResending(true);
    setStatus(null);
    try {
      await mockBackend.resendVerification();
      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = async () => {
    await mockBackend.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-zinc-950 to-zinc-950">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 text-center">
        <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </div>
        
        <h1 className="text-3xl font-black tracking-tight text-white mb-4">Check your inbox</h1>
        <p className="text-zinc-400 leading-relaxed mb-6">
          We have sent a verification email to <span className="text-indigo-400 font-bold">{email}</span>. Please verify it to access the studio.
        </p>

        {/* New Requested Spam Notice */}
        <div className="mb-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-center">
          <p className="text-xs text-amber-200/60 leading-relaxed">
            <span className="font-bold text-amber-400 uppercase tracking-tighter mr-1">Check Spam:</span> 
            Verification emails sometimes land in the Spam or Junk folder.
          </p>
        </div>

        {status === "success" && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-xs rounded-lg font-bold">
            Email resent successfully!
          </div>
        )}

        {status === "error" && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg font-bold">
            Failed to resend. Please try logging in again first.
          </div>
        )}

        <button 
          onClick={handleBackToLogin}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-[0.98]"
        >
          I've Verified My Email
        </button>
        
        <div className="mt-8 flex flex-col gap-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
            Didn't get the email?{' '}
            <button 
              disabled={resending}
              onClick={handleResend}
              className="text-indigo-400 hover:underline disabled:opacity-50"
            >
              {resending ? "Resending..." : "Resend Email"}
            </button>
          </p>
          
          <button 
            onClick={handleBackToLogin}
            className="text-xs text-zinc-600 hover:text-zinc-400 font-bold uppercase tracking-widest"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
