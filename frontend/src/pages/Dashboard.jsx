import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const statusColors = {
  PENDING: 'text-yellow-600',
  CONFIRMED: 'text-blue-600',
  CHECKED_IN: 'text-green-600',
  CHECKED_OUT: 'text-gray-500',
  CANCELLED: 'text-red-600',
  COMPLETED: 'text-green-600',
};

export default function Dashboard() {
  const { user } = useAuth();

  const [roomBookings, setRoomBookings] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [conferenceBookings, setConferenceBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reviewForm, setReviewForm] = useState({ category: 'OVERALL', rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/bookings/me'),
      api.get('/services/bookings/me'),
      api.get('/conference-rooms/bookings/me'),
    ])
      .then(([rooms, services, conferences]) => {
        setRoomBookings(rooms.data);
        setServiceBookings(services.data);
        setConferenceBookings(conferences.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleReviewSubmit(e) {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewMessage('');
    try {
      await api.post('/reviews', reviewForm);
      setReviewMessage('Thank you for your feedback!');
      setReviewForm({ category: 'OVERALL', rating: 5, comment: '' });
    } catch (err) {
      setReviewMessage(err.response?.data?.error || 'Could not submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-center py-20 text-gray-500">Loading your dashboard...</p>;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-kwetu-green mb-2">Welcome back, {user?.name}</h1>
      <p className="text-gray-500 mb-12">Here's everything you have booked with us.</p>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-kwetu-green mb-4">Room Bookings</h2>
        {roomBookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No room bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {roomBookings.map((b) => (
              <div key={b.id} className="border border-kwetu-gold/30 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-kwetu-green">
                    {b.room.roomType.name} — Room {b.room.roomNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${statusColors[b.status]}`}>{b.status}</p>
                  <p className="text-sm text-gray-500">KES {Number(b.totalAmount).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-kwetu-green mb-4">Spa & Gym Bookings</h2>
        {serviceBookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No service bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {serviceBookings.map((b) => (
              <div key={b.id} className="border border-kwetu-gold/30 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-kwetu-green">{b.service.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(b.date).toLocaleDateString()} at {b.timeSlot}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${statusColors[b.status]}`}>{b.status}</p>
                  <p className="text-sm text-gray-500">KES {Number(b.amount).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-kwetu-green mb-4">Conference Bookings</h2>
        {conferenceBookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No conference bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {conferenceBookings.map((b) => (
              <div key={b.id} className="border border-kwetu-gold/30 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-kwetu-green">{b.conferenceRoom.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(b.date).toLocaleDateString()}, {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-sm text-gray-500">KES {Number(b.amount).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-kwetu-gold/30 pt-10">
        <h2 className="text-xl font-bold text-kwetu-green mb-4">Leave a Review</h2>
        <form onSubmit={handleReviewSubmit} className="max-w-md space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What are you reviewing?</label>
            <select
              value={reviewForm.category}
              onChange={(e) => setReviewForm({ ...reviewForm, category: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="OVERALL">Overall Stay</option>
              <option value="ROOM">Room</option>
              <option value="SPA">Spa</option>
              <option value="SERVICE">Other Service</option>
              <option value="CONFERENCE">Conference</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <select
              value={reviewForm.rating}
              onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{'★'.repeat(n)}{'☆'.repeat(5 - n)} ({n})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
            <textarea
              rows={3}
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Tell us about your experience..."
            />
          </div>

          {reviewMessage && <p className="text-sm text-kwetu-green font-medium">{reviewMessage}</p>}

          <button
            type="submit"
            disabled={reviewSubmitting}
            className="bg-kwetu-gold text-kwetu-green-dark font-semibold px-6 py-2 rounded-md hover:bg-kwetu-gold-light transition-colors disabled:opacity-50"
          >
            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </section>
    </div>
  );
}
