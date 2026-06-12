// Globally patches fetch so every request to our API automatically carries
// the logged-in user's JWT. This avoids touching the ~50 fetch() call sites
// scattered across the app while still enforcing authenticated requests.
const originalFetch = window.fetch.bind(window);

window.fetch = (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url || '';

  if (url.includes('/api/')) {
    let token = null;
    try {
      const stored = JSON.parse(localStorage.getItem('user'));
      token = stored?.token || null;
    } catch {
      token = null;
    }

    if (token) {
      const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
      headers.set('Authorization', `Bearer ${token}`);
      return originalFetch(input, { ...init, headers });
    }
  }

  return originalFetch(input, init);
};
