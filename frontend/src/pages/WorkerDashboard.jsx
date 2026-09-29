import { useAuth } from '../context/AuthContext';

export default function WorkerDashboard() {
  const { user } = useAuth();
  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold text-kwetu-green">WorkerDashboard</h1>
      <p className="text-gray-500 mt-2">Welcome, {user?.name}. We'll build this dashboard next.</p>
    </div>
  );
}
