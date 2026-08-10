import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import { clearPermissions } from '../store/permissionsSlice';

const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const useIdleLogout = (timeout = DEFAULT_TIMEOUT) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        dispatch(logout());
        dispatch(clearPermissions());
        navigate('/login');
      }, timeout);
    };

    // Start the timer initially
    resetTimer();

    // Events that reset the timer
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      // Cleanup on unmount
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [dispatch, navigate, timeout]);
};

export default useIdleLogout;