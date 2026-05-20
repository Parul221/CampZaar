import { useEffect, useState } from "react";
import { API_ORIGIN } from '../services/api';

export default function LoginSuccess() {
  const [message, setMessage] = useState('Logging you in...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (token) {
      localStorage.setItem("cz_token", token);

      // Try to fetch the current user immediately so the app can update
      // but don't wait forever — if backend is slow we'll redirect after timeout.
      const controller = new AbortController();
      const signal = controller.signal;
      const timeout = setTimeout(() => controller.abort(), 5000);

      fetch(`${API_ORIGIN}/api/auth/me`, {
        headers: { Authorization: 'Bearer ' + token },
        signal,
      })
        .then(async (r) => {
          if (!r.ok) throw new Error('me fetch failed: ' + r.status);
          const user = await r.json();
          try {
            localStorage.setItem('cz_user', JSON.stringify(user));
            window.dispatchEvent(new CustomEvent('cz_user_loaded', { detail: { user, token } }));
          } catch (e) {}
        })
        .catch(() => {
          // ignore — AuthProvider will attempt to load user on mount
        })
        .finally(() => {
          clearTimeout(timeout);
          try { window.dispatchEvent(new CustomEvent('cz_token_changed', { detail: { token } })); } catch(e) {}
          window.location.href = window.location.origin + '/';
        });

      return;
    }

    if (error) {
      setMessage(`Login failed: ${error}`);
      return;
    }

    setMessage('No login token found. Please try signing in again.');
  }, []);

  return <h2 style={{ textAlign: "center", marginTop: "100px" }}>{message}</h2>;
}
