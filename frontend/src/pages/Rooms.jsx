import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Rooms() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);

  const [availableRooms, setAvailableRooms] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [bookingRoomId, setBookingRoomId] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  useEffect(() => {
    api.get('/rooms/types')
      .then((res) => setRoomTypes(res.data))
      .finally(() => setLoading(false));
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    setSearchError('');
    setBookingSuccess('');

    if (!checkIn || !checkOut) {
      setSearchError('Please choose both check-in and check-out dates.');
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setSearchError('Check-out date must be after check-in date.');
      return;
    }

    setSearching(true);
    try {
      const res = await api.get('/rooms/available', { params: { checkIn, checkOut } });
      setAvailableRooms(res.data);
    } catch (err) {
      setSearchError('Could not check availability. Please try again.');
    } finally {
      setSearching(false);
    }
  }

  async function handleBook(roomId) {
    if (!user) {
      navigate('/login');
      return;
    }

    setBookingRoomId(roomId);
    setBookingError('');
    setBookingSuccess('');

    try {
      await api.post('/bookings', {
        roomId,
        checkIn,
        checkOut,
        numberOfGuests: Number(numberOfGuests),
      });
      setBookingSuccess('Booking confirmed! You can view it in your dashboard.');
      setAvailableRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Could not complete booking.');
    } finally {
      setBookingRoomId(null);
    }
  }

  if (loading) {
    return <p className="text-center py-20 text-gray-500">Loading rooms...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold text-kwetu-green text-center mb-4">Our Rooms</h1>
      <p className="text-center text-gray-600 mb-10">
        Choose your dates to check live availability, or browse our room types below.
      </p>

      <form
        onSubmit={handleSearch}
        className="bg-kwetu-cream border border-kwetu-gold/30 rounded-lg p-6 mb-12 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
          <input
            type="date" required value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kwetu-gold"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
          <input
            type="date" required value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kwetu-gold"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
          <input
            type="number" min="1" required value={numberOfGuests}
            onChange={(e) => setNumberOfGuests(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kwetu-gold"
          />
        </div>
        <button
          type="submit" disabled={searching}
          className="bg-kwetu-green text-kwetu-cream font-semibold py-2 rounded-md hover:bg-kwetu-green-dark transition-colors disabled:opacity-50"
        >
          {searching ? 'Checking...' : 'Check Availability'}
        </button>
      </form>

      {searchError && <p className="text-red-600 text-center mb-6">{searchError}</p>}
      {bookingError && <p className="text-red-600 text-center mb-6">{bookingError}</p>}
      {bookingSuccess && <p className="text-green-700 text-center mb-6 font-medium">{bookingSuccess}</p>}

      {availableRooms !== null && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-kwetu-green mb-6">
            {availableRooms.length} room{availableRooms.length !== 1 ? 's' : ''} available for your dates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availableRooms.map((room) => (
              <div key={room.id} className="border border-kwetu-gold/30 rounded-lg overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/kwetu-${room.roomType.name.toLowerCase()}/600/400`}
                  alt={room.roomType.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-6">
                <h3 className="text-xl font-bold text-kwetu-green">{room.roomType.name} — Room {room.roomNumber}</h3>
                <p className="text-sm text-gray-500 mb-2">Floor {room.floor}</p>
                <p className="text-kwetu-gold font-bold text-lg mb-4">
                  KES {Number(room.roomType.basePrice).toLocaleString()} / night
                </p>
                <button
                  onClick={() => handleBook(room.id)}
                  disabled={bookingRoomId === room.id}
                  className="w-full bg-kwetu-green text-kwetu-cream font-semibold py-2 rounded-md hover:bg-kwetu-green-dark transition-colors disabled:opacity-50"
                >
                  {bookingRoomId === room.id ? 'Booking...' : 'Book This Room'}
                </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-kwetu-green mb-6">Room Types & Pricing</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {roomTypes.map((rt) => (
          <div key={rt.id} className="border border-kwetu-gold/30 rounded-lg overflow-hidden">
            <img
              src={`https://picsum.photos/seed/kwetu-${rt.name.toLowerCase()}/600/400`}
              alt={rt.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-2xl font-bold text-kwetu-green mb-2">{rt.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{rt.description}</p>
              <p className="text-kwetu-gold font-bold text-xl mb-4">
                KES {Number(rt.basePrice).toLocaleString()} <span className="text-sm text-gray-500 font-normal">/ night</span>
              </p>
              <p className="text-sm text-gray-500 mb-4">Sleeps up to {rt.maxOccupancy} guests</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {rt.amenities.map((a) => (
                  <li key={a}>• {a}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
