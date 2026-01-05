import React, { useState, useEffect } from 'react';
import {
    X, Star, User, GraduationCap, MapPin, ArrowRight, DollarSign
} from 'lucide-react';
import { USER_API, apiCall } from '../config/api';

const DoctorProfileModal = ({ doctor, onClose, onBook }) => {
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (doctor?.user_id) {
            fetchDoctorDetails(doctor.user_id);
        }
    }, [doctor]);

    const fetchDoctorDetails = async (doctorId) => {
        setLoading(true);
        try {
            const response = await apiCall(`${USER_API}/profiles/doctor/${doctorId}/profile/`);
            if (response.ok) {
                const data = await response.json();
                setDoctorProfile(data);
            }
        } catch (err) {
            console.error('Failed to fetch doctor profile:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!doctor) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header Section */}
                <div className="relative h-32 bg-gradient-to-r from-teal-500 to-emerald-600 shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 transition backdrop-blur-md"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="absolute -bottom-16 left-8">
                        <div className="w-32 h-32 rounded-3xl bg-white p-1.5 shadow-xl">
                            <div className="w-full h-full rounded-2xl bg-gray-100 flex items-center justify-center text-4xl font-bold text-teal-700 bg-gradient-to-br from-teal-50 to-teal-100">
                                {doctor.name?.charAt(0)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="pt-20 px-8 pb-8 overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{doctor.name}</h2>
                            <p className="text-teal-600 font-bold uppercase tracking-wide text-sm flex items-center gap-2">
                                {doctor.specialization}
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                {doctorProfile?.experience_years || doctor.experience_years || 0}+ Years
                            </p>
                            <div className="flex items-center gap-1.5 mt-2">
                                <Star className="w-4 h-4 text-amber-400 fill-current" />
                                <span className="font-bold text-gray-900">{doctor.average_rating || 'New'}</span>
                                <span className="text-gray-400 text-sm">({doctor.total_ratings || 0} reviews)</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Consultation</p>
                            <p className="text-2xl font-black text-emerald-600">₹{doctorProfile?.consultation_fee || doctor.consultation_fee || '--'}</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-12 flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4 text-teal-500" /> About
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-sm">
                                    {doctorProfile?.bio || "No biography available."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                            <GraduationCap className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 uppercase">Education</span>
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">{doctorProfile?.qualifications || "Verified Specialist"}</p>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 uppercase">Location</span>
                                    </div>
                                    <p className="font-bold text-gray-900 text-sm">{doctorProfile?.clinic_address || "Tele-health"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => onBook(doctor)}
                            className="flex-1 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                        >
                            Book Appointment <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorProfileModal;
