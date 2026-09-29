import { useEffect, useState } from 'react';
import api from '../services/api';

const TABS = ['Overview', 'Staff', 'Tasks', 'Rooms', 'Bookings', 'Reviews'];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-kwetu-green mb-8">Admin Dashboard</h1>

      <div className="flex flex-wrap gap-2 border-b border-kwetu-gold/30 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm rounded-t-md transition-colors ${
              activeTab === tab
                ? 'bg-kwetu-green text-kwetu-cream'
                : 'text-gray-500 hover:text-kwetu-green'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && <OverviewTab />}
      {activeTab === 'Staff' && <StaffTab />}
      {activeTab === 'Tasks' && <TasksTab />}
      {activeTab === 'Rooms' && <RoomsTab />}
      {activeTab === 'Bookings' && <BookingsTab />}
      {activeTab === 'Reviews' && <ReviewsTab />}
    </div>
  );
}

// ─────────────────────────────────────────────
// OVERVIEW — summary stat cards
// ─────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading stats...</p>;
  if (!stats) return <p className="text-red-600">Could not load stats.</p>;

  const cards = [
    { label: 'Occupancy Rate', value: `${stats.occupancyRate}%`, sub: `${stats.occupiedRooms}/${stats.totalRooms} rooms` },
    { label: 'Total Bookings', value: stats.totalBookings, sub: 'rooms, all time' },
    { label: 'Booking Value', value: `KES ${stats.totalBookingValue.toLocaleString()}`, sub: 'not confirmed payments yet' },
    { label: 'Pending Tasks', value: stats.pendingTasks, sub: 'housekeeping/maintenance' },
    { label: 'Customers', value: stats.totalCustomers, sub: 'registered accounts' },
    { label: 'Staff', value: stats.totalStaff, sub: 'worker accounts' },
    { label: 'Average Rating', value: `${stats.averageRating} ★`, sub: `${stats.totalReviews} reviews` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((c) => (
        <div key={c.label} className="border border-kwetu-gold/30 rounded-lg p-6">
          <p className="text-sm text-gray-500 mb-1">{c.label}</p>
          <p className="text-3xl font-bold text-kwetu-green">{c.value}</p>
          <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// STAFF — create staff accounts + list existing staff
// ─────────────────────────────────────────────
function StaffTab() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'WORKER', departmentName: '', position: '',
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function loadStaff() {
    api.get('/admin/staff').then((res) => setStaff(res.data)).finally(() => setLoading(false));
  }

  useEffect(loadStaff, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api.post('/admin/staff', form);
      setMessage(`${form.role === 'ADMIN' ? 'Admin' : 'Worker'} account created.`);
      setForm({ name: '', email: '', password: '', phone: '', role: 'WORKER', departmentName: '', position: '' });
      loadStaff();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not create account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div>
        <h2 className="text-xl font-bold text-kwetu-green mb-4">Create Staff Account</h2>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
          <input placeholder="Full name" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2" />
          <input type="email" placeholder="Email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2" />
          <input type="password" placeholder="Temporary password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2" />
          <input placeholder="Phone" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="WORKER">Worker</option>
            <option value="ADMIN">Admin</option>
          </select>
          {form.role === 'WORKER' && (
            <>
              <input placeholder="Department (e.g. Housekeeping)" value={form.departmentName}
                onChange={(e) => setForm({ ...form, departmentName: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2" />
              <input placeholder="Position (e.g. Cleaner)" value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2" />
            </>
          )}
          {message && <p className="text-sm text-kwetu-green font-medium">{message}</p>}
          <button type="submit" disabled={submitting}
            className="bg-kwetu-green text-kwetu-cream font-semibold px-6 py-2 rounded-md hover:bg-kwetu-green-dark transition-colors disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold text-kwetu-green mb-4">Current Staff ({staff.length})</h2>
        {loading ? <p className="text-gray-500">Loading...</p> : (
          <div className="space-y-2">
            {staff.map((s) => (
              <div key={s.id} className="border border-kwetu-gold/30 rounded-lg p-3">
                <p className="font-semibold text-kwetu-green">{s.name}</p>
                <p className="text-sm text-gray-500">{s.email}</p>
                {s.staffProfile && (
                  <p className="text-xs text-gray-400">{s.staffProfile.position} — {s.staffProfile.department.name}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TASKS — assign a task to a staff member
// ─────────────────────────────────────────────
function TasksTab() {
  const [staff, setStaff] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ assignedToId: '', roomId: '', type: 'CLEANING', priority: 'MEDIUM', notes: '' });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function loadAll() {
    Promise.all([api.get('/admin/staff'), api.get('/rooms'), api.get('/tasks')])
      .then(([s, r, t]) => { setStaff(s.data); setRooms(r.data); setTasks(t.data); });
  }

  useEffect(loadAll, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api.post('/tasks', { ...form, roomId: form.roomId || null });
      setMessage('Task assigned.');
      setForm({ assignedToId: '', roomId: '', type: 'CLEANING', priority: 'MEDIUM', notes: '' });
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Could not assign task.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div>
        <h2 className="text-xl font-bold text-kwetu-green mb-4">Assign a Task</h2>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
          <select required value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Assign to...</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">No specific room</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.roomType.name})</option>)}
          </select>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="CLEANING">Cleaning</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="ROOM_SERVICE">Room Service</option>
          </select>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <textarea placeholder="Notes (optional)" rows={2} value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2" />
          {message && <p className="text-sm text-kwetu-green font-medium">{message}</p>}
          <button type="submit" disabled={submitting}
            className="bg-kwetu-green text-kwetu-cream font-semibold px-6 py-2 rounded-md hover:bg-kwetu-green-dark transition-colors disabled:opacity-50">
            {submitting ? 'Assigning...' : 'Assign Task'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold text-kwetu-green mb-4">All Tasks ({tasks.length})</h2>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {tasks.map((t) => (
            <div key={t.id} className="border border-kwetu-gold/30 rounded-lg p-3 flex justify-between">
              <div>
                <p className="font-semibold text-kwetu-green">{t.type.replace('_', ' ')} — {t.assignedTo.name}</p>
                {t.room && <p className="text-xs text-gray-500">Room {t.room.roomNumber}</p>}
              </div>
              <span className="text-xs font-semibold self-start">{t.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOMS — every room + quick status change
// ─────────────────────────────────────────────
function RoomsTab() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  function loadRooms() {
    api.get('/rooms').then((res) => setRooms(res.data)).finally(() => setLoading(false));
  }

  useEffect(loadRooms, []);

  async function handleStatusChange(roomId, status) {
    await api.patch(`/rooms/${roomId}/status`, { status });
    loadRooms();
  }

  if (loading) return <p className="text-gray-500">Loading rooms...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-kwetu-green mb-4">All Rooms ({rooms.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((r) => (
          <div key={r.id} className="border border-kwetu-gold/30 rounded-lg p-4">
            <p className="font-semibold text-kwetu-green">Room {r.roomNumber} — {r.roomType.name}</p>
            <p className="text-xs text-gray-500 mb-2">Floor {r.floor}</p>
            <select value={r.status} onChange={(e) => handleStatusChange(r.id, e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="CLEANING">Cleaning</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BOOKINGS — every booking across rooms, services, conference
// ─────────────────────────────────────────────
function BookingsTab() {
  const [roomBookings, setRoomBookings] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [conferenceBookings, setConferenceBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/bookings'), api.get('/services/bookings'), api.get('/conference-rooms/bookings')])
      .then(([r, s, c]) => { setRoomBookings(r.data); setServiceBookings(s.data); setConferenceBookings(c.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading bookings...</p>;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-bold text-kwetu-green mb-4">Room Bookings ({roomBookings.length})</h2>
        <div className="space-y-2">
          {roomBookings.map((b) => (
            <div key={b.id} className="border border-kwetu-gold/30 rounded-lg p-3 flex justify-between">
              <span>{b.customer.name} — Room {b.room.roomNumber}</span>
              <span className="text-sm text-gray-500">{b.status}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold text-kwetu-green mb-4">Spa/Gym Bookings ({serviceBookings.length})</h2>
        <div className="space-y-2">
          {serviceBookings.map((b) => (
            <div key={b.id} className="border border-kwetu-gold/30 rounded-lg p-3 flex justify-between">
              <span>{b.customer.name} — {b.service.name}</span>
              <span className="text-sm text-gray-500">{b.status}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold text-kwetu-green mb-4">Conference Bookings ({conferenceBookings.length})</h2>
        <div className="space-y-2">
          {conferenceBookings.map((b) => (
            <div key={b.id} className="border border-kwetu-gold/30 rounded-lg p-3 flex justify-between">
              <span>{b.customer.name} — {b.conferenceRoom.name}</span>
              <span className="text-sm text-gray-500">{new Date(b.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// REVIEWS — read + respond
// ─────────────────────────────────────────────
function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);
  const [responseText, setResponseText] = useState('');

  function loadReviews() {
    api.get('/reviews').then((res) => setReviews(res.data.reviews)).finally(() => setLoading(false));
  }

  useEffect(loadReviews, []);

  async function handleRespond(reviewId) {
    await api.patch(`/reviews/${reviewId}/respond`, { adminResponse: responseText });
    setResponding(null);
    setResponseText('');
    loadReviews();
  }

  if (loading) return <p className="text-gray-500">Loading reviews...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-kwetu-green mb-4">Guest Reviews ({reviews.length})</h2>
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="border border-kwetu-gold/30 rounded-lg p-4">
            <div className="flex justify-between items-start mb-1">
              <p className="font-semibold text-kwetu-green">{r.customer.name} — {r.category}</p>
              <span className="text-kwetu-gold">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            </div>
            {r.comment && <p className="text-sm text-gray-600 mb-2">{r.comment}</p>}
            {r.adminResponse ? (
              <p className="text-sm bg-kwetu-cream rounded p-2"><strong>Hotel response:</strong> {r.adminResponse}</p>
            ) : responding === r.id ? (
              <div className="flex gap-2">
                <input value={responseText} onChange={(e) => setResponseText(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm" placeholder="Write a response..." />
                <button onClick={() => handleRespond(r.id)}
                  className="bg-kwetu-green text-kwetu-cream px-3 py-1 rounded-md text-sm">Send</button>
              </div>
            ) : (
              <button onClick={() => setResponding(r.id)} className="text-sm text-kwetu-green font-medium hover:underline">
                Respond
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
