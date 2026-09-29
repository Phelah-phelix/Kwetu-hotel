import { Link, NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/rooms', label: 'Rooms' },
  { to: '/spa', label: 'Spa & Gym' },
  { to: '/conference', label: 'Conference' },
  { to: '/reviews', label: 'Reviews' },
];

function linkClasses({ isActive }) {
  return isActive
    ? 'text-kwetu-gold font-semibold'
    : 'text-kwetu-cream hover:text-kwetu-gold-light transition-colors';
}

function dashboardPathFor(role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'WORKER') return '/worker';
  return '/dashboard';
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="bg-kwetu-green sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Kwetu Hotel logo" className="h-14 w-auto" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClasses}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to={dashboardPathFor(user.role)}
                className="text-kwetu-cream hover:text-kwetu-gold-light transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-kwetu-gold text-kwetu-green-dark font-semibold px-4 py-2 rounded-md hover:bg-kwetu-gold-light transition-colors"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-kwetu-cream hover:text-kwetu-gold-light transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="bg-kwetu-gold text-kwetu-green-dark font-semibold px-4 py-2 rounded-md hover:bg-kwetu-gold-light transition-colors"
              >
                Book Now
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
