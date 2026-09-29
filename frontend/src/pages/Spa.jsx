import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const categoryImages = {
  SPA: 'https://picsum.photos/seed/kwetu-spa/600/400',
  GYM: 'https://picsum.photos/seed/kwetu-gym/600/400',
};

export default function Spa() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [bookingServiceId, setBookingServiceId] = useState(null);
  const [form, setForm] = useState({ date: '', timeSlot: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/services')
      .then((res) => setServices(res.data.filter((s) => s.category === 'SPA' || s.category === 'GYM')))
      .finally(() => setLoading(false));
  }, []);

  function openBookingForm(serviceId) {
    if (!user) {
      navigate('/login');
      return;
    }
    setBookingServiceId(serviceId);
    setForm({ date: '', timeSlot: '' });
    setError('');
    setSuccess('');
  }

  async function handleBook(e, serviceId) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/services/${serviceId}/book`, form);
      setSuccess('Booked! Check your dashboard for details.');
      setBookingServiceId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not complete booking.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-center py-20 text-gray-500">Loading services...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold text-kwetu-green text-center mb-4">Spa & Gym</h1>
      <p className="text-center text-gray-600 mb-12">
        Unwind and recharge — full spa treatments and modern gym facilities.
      </p>

      {success && <p className="text-green-700 text-center mb-6 font-medium">{success}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((s) => (
          <div key={s.id} className="border border-kwetu-gold/30 rounded-lg overflow-hidden">
            <img src={categoryImages[s.category]} alt={s.category} className="w-full h-40 object-cover" />
            <div className="p-6">
              <span className="text-xs uppercase tracking-wide text-kwetu-gold font-semibold">{s.category}</span>
              <h3 className="text-lg font-bold text-kwetu-green mt-1 mb-2">{s.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{s.description}</p>
              <p className="text-kwetu-gold font-bold mb-4">
                KES {Number(s.price).toLocaleString()}
                {s.durationMins ? <span className="text-sm text-gray-500 font-normal"> / {s.durationMins} min</span> : null}
              </p>

              {bookingServiceId === s.id ? (
                <form onSubmit={(e) => handleBook(e, s.id)} className="space-y-2">
                  <input
                    type="date" required value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  <input
                    type="text" required placeholder="Time (e.g. 10:00 AM)" value={form.timeSlot}
                    onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  {error && <p className="text-red-600 text-xs">{error}</p>}
                  <button
                    type="submit" disabled={submitting}
                    className="w-full bg-kwetu-green text-kwetu-cream font-semibold py-2 rounded-md hover:bg-kwetu-green-dark transition-colors text-sm disabled:opacity-50"
                  >
                    {submitting ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => openBookingForm(s.id)}
                  className="w-full bg-kwetu-green text-kwetu-cream font-semibold py-2 rounded-md hover:bg-kwetu-green-dark transition-colors"
                >
                  Book Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
