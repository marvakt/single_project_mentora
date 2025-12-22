import React, { useState } from 'react';
import { Star } from 'lucide-react';

const DoctorRating = ({ doctorId, onRatingSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would call your API
      // await axios.post(`/api/doctor/${doctorId}/rate/`, {
      //   rating,
      //   review
      // });
      
      // For demo purposes, we'll just simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      if (onRatingSubmit) {
        onRatingSubmit({ rating, review });
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-2xl mb-2">✓</div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Thank You!</h3>
        <p className="text-green-700">
          Your rating has been submitted successfully.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Rate This Doctor</h3>
      
      <form onSubmit={handleRatingSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Rating
          </label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-2xl focus:outline-none"
              >
                {star <= (hoverRating || rating) ? (
                  <Star className="w-8 h-8 text-yellow-400 fill-current" />
                ) : (
                  <Star className="w-8 h-8 text-gray-300" />
                )}
              </button>
            ))}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
          </p>
        </div>
        
        <div className="mb-6">
          <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
            Your Review (Optional)
          </label>
          <textarea
            id="review"
            rows={4}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="Share your experience with this doctor..."
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorRating;