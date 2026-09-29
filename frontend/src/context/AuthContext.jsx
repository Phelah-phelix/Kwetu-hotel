import { createContext, useContext, useState } from 'react';

// Holds the logged-in user (or null) and exposes login/logout to the
// whole app, so Navbar, dashboards, etc. all read from one place.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // On first load, restore any saved session from localStorage —
  // so refreshing the page doesn't log the user out.
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kwetu_user');
    return saved ? JSON.parse(saved) : null;
  });

  function login(token, userData) {
    localStorage.setItem('kwetu_token', token);
    localStorage.setItem('kwetu_user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('kwetu_token');
    localStorage.removeItem('kwetu_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook so components just do: const { user, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
