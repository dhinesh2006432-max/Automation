import React, { useState } from 'react';
import api from '../services/api';
import { Star, Utensils, CheckCircle2, MessageSquare } from 'lucide-react';

export default function MessFeedbackPage() {
  const [qRating, setQRating] = useState(4);
  const [tRating, TRating] = useState(4);
  const [cRating, setCRating] = useState(5);
  const [mRating, setMRating] = useState(4);
  const [sRating, setSRating] = useState(4);
  const [comments, setComments] = useState('');

  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/feedback/mess', {
        food_quality_rating: qRating,
        taste_rating: tRating,
        cleanliness_rating: cRating,
        menu_rating: mRating,
        service_rating: sRating,
        comments
      });

      setMsg('Mess feedback submitted successfully! Thank you for helping us improve quality.');
      setComments('');
    } catch (err) {
      alert('Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, setRating) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          className={`p-1 rounded-lg transition-all ${star <= rating ? 'text-amber-400' : 'text-slate-200'}`}
        >
          <Star className="w-5 h-5 fill-current" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-teal-600" /> Student Mess & Dining Feedback
          </h2>
          <p className="text-xs text-slate-500">Rate daily food quality, hygiene standards, and suggest mess menu items</p>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>{msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Food Quality Rating</label>
              {renderStars(qRating, setQRating)}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Taste & Preparation</label>
              {renderStars(tRating, TRating)}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mess Cleanliness & Hygiene</label>
              {renderStars(cRating, setCRating)}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Weekly Menu Variety</label>
              {renderStars(mRating, setMRating)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Comments & Menu Suggestions</label>
            <textarea
              rows={3}
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="What did you enjoy about today's meal? Any food suggestions?"
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-lg shadow-teal-600/30 transition-all"
          >
            {loading ? 'Submitting...' : 'Submit Mess Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
