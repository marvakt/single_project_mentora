import React from 'react';
import { Star, Calendar, Award } from 'lucide-react';

const DoctorSuggestions = ({ doctors, onBookAppointment }) => {
  if (!doctors || doctors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">No doctors available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-800">
          Recommended Mental Health Professionals
        </h2>
        <p className="text-gray-600 mt-1">
          Based on your assessment results and doctor ratings
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium text-gray-900">{doctor.name}</h3>
                  <div className="ml-3 flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(doctor.average_rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="ml-1 text-sm text-gray-600">
                      {doctor.average_rating} ({doctor.total_ratings})
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">{doctor.specialization}</p>
                
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <Award className="w-4 h-4 mr-1" />
                  <span>{doctor.experience_years} years experience</span>
                  <span className="mx-2">•</span>
                  <span>₹{doctor.consultation_fee}</span>
                </div>
              </div>
              
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => onBookAppointment && onBookAppointment(doctor)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Book
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-6 py-4 bg-gray-50 text-center">
        <p className="text-sm text-gray-600">
          These suggestions are based on your assessment results, doctor ratings, experience, and availability.
        </p>
      </div>
    </div>
  );
};

export default DoctorSuggestions;