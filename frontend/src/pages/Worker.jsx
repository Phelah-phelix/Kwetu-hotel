import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const priorityColors = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-gray-100 text-gray-600',
};

const statusOptions = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

export default function Worker() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  function loadTasks() {
    api.get('/tasks/me')
      .then((res) => setTasks(res.data))
      .catch(() => setError('Could not load your tasks.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleStatusChange(taskId, newStatus) {
    setUpdatingId(taskId);
    setError('');
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update task.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <p className="text-center py-20 text-gray-500">Loading your tasks...</p>;
  }

  const pending = tasks.filter((t) => t.status !== 'COMPLETED');
  const completed = tasks.filter((t) => t.status === 'COMPLETED');

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-kwetu-green mb-2">Hi, {user?.name}</h1>
      <p className="text-gray-500 mb-10">Here are your assigned tasks.</p>

      {error && <p className="text-red-600 mb-6">{error}</p>}

      <section className="mb-12">
        <h2 className="text-xl font-bold text-kwetu-green mb-4">
          To Do ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-gray-500 text-sm">Nothing pending — nice work!</p>
        ) : (
          <div className="space-y-3">
            {pending.map((task) => (
              <div key={task.id} className="border border-kwetu-gold/30 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className="font-semibold text-kwetu-green">{task.type.replace('_', ' ')}</span>
                  </div>
                  {task.room && (
                    <p className="text-sm text-gray-500">Room {task.room.roomNumber} (Floor {task.room.floor})</p>
                  )}
                  {task.notes && <p className="text-sm text-gray-500 mt-1">{task.notes}</p>}
                </div>

                <select
                  value={task.status}
                  disabled={updatingId === task.id}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm disabled:opacity-50"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-kwetu-green mb-4">
          Completed ({completed.length})
        </h2>
        {completed.length === 0 ? (
          <p className="text-gray-500 text-sm">No completed tasks yet.</p>
        ) : (
          <div className="space-y-3">
            {completed.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4 opacity-60">
                <span className="font-semibold text-kwetu-green">{task.type.replace('_', ' ')}</span>
                {task.room && <span className="text-sm text-gray-500"> — Room {task.room.roomNumber}</span>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
