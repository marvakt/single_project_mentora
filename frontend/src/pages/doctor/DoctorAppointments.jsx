
// ═══════════════════════════════════════════════════════════════
// FILE 3: src/pages/doctor/DoctorAppointments.jsx
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, Video, CheckCircle, AlertCircle, 
  Activity, FileText, Filter, Search, ChevronDown, Star
} from 'lucide-react';
import { APPOINTMENT_API, apiCall } from '../../config/api';

const DoctorAppointments = ({ user, token }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`${APPOINTMENT_API}/appointments/`);

      if (response.ok) {
        const data = await response.json();
        const sorted = data.appointments?.sort((a, b) => 
          new Date(a.scheduled_at) - new Date(b.scheduled_at)
        ) || [];
        setAppointments(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const completeAppointment = async (appointmentId) => {
    if (!confirm('Mark this appointment as completed?')) return;

    try {
      const response = await apiCall(
        `${APPOINTMENT_API}/appointments/${appointmentId}/complete/`,
        { method: 'POST' }
      );

      if (response.ok) {
        alert('Appointment marked as completed');
        fetchAppointments();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to complete appointment');
      }
    } catch (err) {
      console.error('Complete error:', err);
      alert('Something went wrong');
    }
  };

  // ... (Rest of the component as provided in the artifact)
};

export default DoctorAppointments;
