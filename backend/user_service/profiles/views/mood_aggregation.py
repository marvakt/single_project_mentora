"""
profiles/views/mood_aggregation.py - API views for mood data aggregation for doctors
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from datetime import datetime, timedelta
from django.utils import timezone
from ..models import UserProfile, DoctorProfile, MoodEntry
from ..permissions import IsAuthenticatedJWT, IsDoctor
from ..authentication import JWTAuthentication


class DoctorMoodDashboardAPIView(APIView):
    """
    API view for doctors to get aggregated mood data of their patients
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor]

    def get(self, request):
        """
        Get aggregated mood data for the requesting doctor's patients
        """
        try:
            # Get the doctor's profile
            doctor_profile = get_object_or_404(DoctorProfile, profile_id=request.user_data['user_id'])
            
            # Get date range from query parameters (default to last 7 days)
            days = int(request.GET.get('days', 7))
            start_date = timezone.now() - timedelta(days=days)
            
            # Get all mood entries for patients of this doctor in the date range
            patient_profiles = UserProfile.objects.filter(
                mood_entries__created_at__gte=start_date,
                doctor_assignments__doctor=doctor_profile  # Assuming there's a doctor-patient assignment model
            ).distinct()
            
            # If no assignment model exists, we'll use a simpler approach
            # For now, we'll assume that users who have mood entries and are connected to doctors somehow
            mood_data = []
            
            for patient in patient_profiles:
                patient_mood_entries = MoodEntry.objects.filter(
                    user_profile=patient,
                    created_at__gte=start_date
                ).order_by('-created_at')
                
                if patient_mood_entries.exists():
                    # Calculate patient mood statistics
                    mood_entries_list = []
                    total_mood = 0
                    total_anxiety = 0
                    concerning_count = 0
                    entry_count = 0
                    
                    for entry in patient_mood_entries:
                        mood_entry_data = {
                            'date': entry.created_at.strftime('%Y-%m-%d'),
                            'mood_score': entry.mood_score,
                            'anxiety_level': entry.anxiety_level,
                            'energy_level': entry.energy_level,
                            'sleep_hours': entry.sleep_hours,
                            'notes': entry.notes,
                            'is_concerning': entry.mood_score <= 3 or entry.anxiety_level >= 8
                        }
                        
                        if mood_entry_data['is_concerning']:
                            concerning_count += 1
                            
                        total_mood += entry.mood_score
                        total_anxiety += entry.anxiety_level
                        entry_count += 1
                        mood_entries_list.append(mood_entry_data)
                    
                    patient_data = {
                        'patient_id': patient.user_id,
                        'patient_name': patient.name or patient.email,
                        'total_entries': entry_count,
                        'average_mood': round(total_mood / entry_count, 2) if entry_count > 0 else 0,
                        'average_anxiety': round(total_anxiety / entry_count, 2) if entry_count > 0 else 0,
                        'concerning_entries_count': concerning_count,
                        'mood_trend': self._calculate_trend(mood_entries_list),
                        'mood_entries': mood_entries_list[:5]  # Last 5 entries
                    }
                    
                    mood_data.append(patient_data)
            
            # Calculate overall statistics
            overall_stats = self._calculate_overall_stats(mood_data)
            
            response_data = {
                'doctor_name': doctor_profile.profile.name,
                'period_days': days,
                'from_date': start_date.strftime('%Y-%m-%d'),
                'to_date': timezone.now().strftime('%Y-%m-%d'),
                'overall_stats': overall_stats,
                'patients_data': mood_data
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'detail': f'Error retrieving mood data: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _calculate_trend(self, mood_entries):
        """
        Calculate mood trend based on recent entries
        """
        if len(mood_entries) < 2:
            return 'insufficient_data'
        
        # Compare last entry with first entry in the list
        first_entry = mood_entries[-1]  # Oldest
        last_entry = mood_entries[0]   # Most recent
        
        if last_entry['mood_score'] > first_entry['mood_score'] + 1:
            return 'improving'
        elif last_entry['mood_score'] < first_entry['mood_score'] - 1:
            return 'declining'
        else:
            return 'stable'
    
    def _calculate_overall_stats(self, patients_data):
        """
        Calculate overall statistics for all patients
        """
        if not patients_data:
            return {
                'total_patients': 0,
                'total_mood_entries': 0,
                'average_patient_mood': 0,
                'concerning_patients_count': 0,
                'patients_with_data': 0
            }
        
        total_patients = len(patients_data)
        total_entries = sum(p['total_entries'] for p in patients_data)
        total_mood = sum(p['average_mood'] * p['total_entries'] for p in patients_data if p['total_entries'] > 0)
        concerning_patients = sum(1 for p in patients_data if p['concerning_entries_count'] > 0)
        patients_with_data = sum(1 for p in patients_data if p['total_entries'] > 0)
        
        average_patient_mood = (
            total_mood / sum(p['total_entries'] for p in patients_data if p['total_entries'] > 0)
            if sum(p['total_entries'] for p in patients_data if p['total_entries'] > 0) > 0
            else 0
        )
        
        return {
            'total_patients': total_patients,
            'total_mood_entries': total_entries,
            'average_patient_mood': round(average_patient_mood, 2),
            'concerning_patients_count': concerning_patients,
            'patients_with_data': patients_with_data
        }


class PatientMoodHistoryAPIView(APIView):
    """
    API view for doctors to get specific patient's mood history
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedJWT, IsDoctor]

    def get(self, request, patient_user_id):
        """
        Get mood history for a specific patient
        """
        try:
            # Get the doctor's profile
            doctor_profile = get_object_or_404(DoctorProfile, profile_id=request.user_data['user_id'])
            
            # Get the patient's profile
            patient_profile = get_object_or_404(UserProfile, user_id=patient_user_id)
            
            # Verify that this patient is associated with this doctor
            # (This check depends on how you implement doctor-patient relationships)
            
            # Get date range from query parameters (default to last 30 days)
            days = int(request.GET.get('days', 30))
            start_date = timezone.now() - timedelta(days=days)
            
            # Get mood entries for this patient
            mood_entries = MoodEntry.objects.filter(
                user_profile=patient_profile,
                created_at__gte=start_date
            ).order_by('-created_at')
            
            mood_history = []
            for entry in mood_entries:
                mood_history.append({
                    'date': entry.created_at.strftime('%Y-%m-%d %H:%M'),
                    'mood_score': entry.mood_score,
                    'anxiety_level': entry.anxiety_level,
                    'energy_level': entry.energy_level,
                    'sleep_hours': entry.sleep_hours,
                    'notes': entry.notes,
                    'is_concerning': entry.mood_score <= 3 or entry.anxiety_level >= 8
                })
            
            # Calculate patient statistics
            if mood_entries:
                total_mood = sum(e.mood_score for e in mood_entries)
                total_anxiety = sum(e.anxiety_level for e in mood_entries)
                concerning_entries = [e for e in mood_entries if e.mood_score <= 3 or e.anxiety_level >= 8]
                
                patient_stats = {
                    'total_entries': len(mood_entries),
                    'average_mood': round(total_mood / len(mood_entries), 2),
                    'average_anxiety': round(total_anxiety / len(mood_entries), 2),
                    'concerning_entries_count': len(concerning_entries),
                    'mood_trend': self._calculate_trend(mood_history),
                }
            else:
                patient_stats = {
                    'total_entries': 0,
                    'average_mood': 0,
                    'average_anxiety': 0,
                    'concerning_entries_count': 0,
                    'mood_trend': 'no_data',
                }
            
            response_data = {
                'patient_id': patient_profile.user_id,
                'patient_name': patient_profile.name or patient_profile.email,
                'period_days': days,
                'from_date': start_date.strftime('%Y-%m-%d'),
                'to_date': timezone.now().strftime('%Y-%m-%d'),
                'stats': patient_stats,
                'mood_history': mood_history
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'detail': f'Error retrieving patient mood data: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _calculate_trend(self, mood_history):
        """
        Calculate mood trend based on mood history
        """
        if len(mood_history) < 2:
            return 'insufficient_data'
        
        # Compare last entry with first entry in the list
        first_entry = mood_history[-1]  # Oldest
        last_entry = mood_history[0]   # Most recent
        
        if last_entry['mood_score'] > first_entry['mood_score'] + 1:
            return 'improving'
        elif last_entry['mood_score'] < first_entry['mood_score'] - 1:
            return 'declining'
        else:
            return 'stable'