import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'OVERALL', label: 'Overall Stay' },
  { value: 'ROOM', label: 'Rooms' },
  { value: 'SPA', label: 'Spa' },
  { value: 'SERVICE', label: 'Services' },
  { value: 'CONFERENCE', label: 'Conference' },
];

function Stars({ rating }) {
  return (
    <span className="text-kwetu-gold">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export default function Reviews() {
  const { user } = useAuth();

  const [category, setCategory] = useState('');
  const [data, setData] = useState({ reviews: [], averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);

  // Re-fetch whenever the selected category changes.
  useEffect(() => {
    setLoading(true);
    api.get('/reviews', { params: category ? { category } : {} })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold text-kwetu-green text-center mb-4">Guest Reviews</h1>
      <p className="text-center text-gray-600 mb-8">
        Hear from guests who have made Kwetu their home away from home.
      </p>

      {/* Summary */}
      <div className="text-center mb-8">
        <p className="text-5xl font-bold text-kwetu-green">{data.averageRating || '–'}</p>
        <p className="text-xl"><Stars rating={Math.round(data.averageRating)} /></p>
        <p className="text-sm text-gray-500 mt-1">
          Based on {data.totalReviews} review{data.totalReviews !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`px-4 py-1 rounded-full text-sm border transition-colors ${
              category === c.value
                ? 'bg-kwetu-green text-kwetu-cream border-kwetu-green'
                : 'border-kwetu-gold/50 text-kwetu-green hover:bg-kwetu-cream'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {loading ? (
        <p className="text-center text-gray-500">Loading reviews...</p>
      ) : data.reviews.length === 0 ? (
        <p className="text-center text-gray-500">No reviews here yet — be the first!</p>
      ) : (
        <div className="space-y-4">
          {data.reviews.map((r) => (
            <div key={r.id} className="border border-kwetu-gold/30 rounded-lg p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-kwetu-green">{r.customer.name}</p>
                  <p className="text-xs text-gray-400">
                    {r.category} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Stars rating={r.rating} />
              </div>
              {r.comment && <p className="text-gray-700 text-sm">{r.comment}</p>}
              {r.adminResponse && (
                <div className="mt-3 bg-kwetu-cream border-l-4 border-kwetu-gold rounded p-3">
                  <p className="text-xs font-semibold text-kwetu-green mb-1">Response from Kwetu Hotel</p>
                  <p className="text-sm text-gray-700">{r.adminResponse}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Call to action */}
      <div className="text-center mt-12">
        {user?.role === 'CUSTOMER' ? (
          <Link to="/dashboard" className="text-kwetu-green font-semibold hover:underline">
            Stayed with us? Leave a review from your dashboard →
          </Link>
        ) : !user ? (
          <Link to="/login" className="text-kwetu-green font-semibold hover:underline">
            Log in to leave a review →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
