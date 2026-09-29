import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Conference() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [bookingRoomId, setBookingRoomId] = useState(null);
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '', purpose: '', attendees: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/conference-rooms')
      .then((res) => setRooms(res.data))
      .finally(() => setLoading(false));
  }, []);

  function openBookingForm(roomId) {
    if (!user) {
      navigate('/login');
      return;
    }
    setBookingRoomId(roomId);
    setForm({ date: '', startTime: '', endTime: '', purpose: '', attendees: '' });
    setError('');
    setSuccess('');
  }

  async function handleBook(e, roomId) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/conference-rooms/${roomId}/book`, {
        ...form,
        attendees: Number(form.attendees),
      });
      setSuccess('Conference room booked! Check your dashboard for details.');
      setBookingRoomId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not complete booking.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-center py-20 text-gray-500">Loading conference rooms...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold text-kwetu-green text-center mb-4">Conference & Meetings</h1>
      <p className="text-center text-gray-600 mb-12">
        Fully-equipped spaces for meetings, workshops, and events of any size.
      </p>

      {success && <p className="text-green-700 text-center mb-6 font-medium">{success}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {rooms.map((room) => (
          <div key={room.id} className="border border-kwetu-gold/30 rounded-lg overflow-hidden">
            <img
              src="https://picsum.photos/seed/kwetu-conference/700/400"
              alt="Conference room"
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-xl font-bold text-kwetu-green mb-2">{room.name}</h3>
              <p className="text-sm text-gray-500 mb-2">Capacity: up to {room.capacity} people</p>
              <p className="text-kwetu-gold font-bold mb-3">
                KES {Number(room.hourlyRate).toLocaleString()} <span className="text-sm text-gray-500 font-normal">/ hour</span>
              </p>
              <ul className="text-sm text-gray-600 mb-4">
                {room.equipment.map((eq) => (
                  <li key={eq}>• {eq}</li>
                ))}
              </ul>

              {bookingRoomId === room.id ? (
                <form onSubmit={(e) => handleBook(e, room.id)} className="space-y-2">
                  <input
                    type="date" required value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time" required value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    <input
                      type="time" required value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <input
                    type="number" min="1" required placeholder="Number of attendees" value={form.attendees}
                    onChange={(e) => setForm({ ...form, attendees: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                  <input
                    type="text" placeholder="Purpose (optional)" value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
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
                  onClick={() => openBookingForm(room.id)}
                  className="w-full bg-kwetu-green text-kwetu-cream font-semibold py-2 rounded-md hover:bg-kwetu-green-dark transition-colors"
                >
                  Book This Room
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
