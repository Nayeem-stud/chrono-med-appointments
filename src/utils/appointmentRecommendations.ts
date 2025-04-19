
import { DoctorSession } from "@/types";

// Simplified ML model for appointment recommendations
// This is a content-based filtering approach
export class AppointmentRecommender {
  // Historical pattern weights (simplified ML model)
  private timeSlotPopularity: Record<string, number> = {
    "08:00": 0.7,  // Morning slots - moderately popular
    "09:00": 0.8, 
    "10:00": 0.9,  // Late morning - highly popular
    "11:00": 0.85,
    "12:00": 0.6,  // Lunch time - less popular
    "13:00": 0.65,
    "14:00": 0.75, // Early afternoon - moderately popular
    "15:00": 0.8,
    "16:00": 0.85, // Late afternoon - highly popular
    "17:00": 0.7,
    "18:00": 0.5,  // Evening - less popular
  };

  private dayPopularity: Record<string, number> = {
    "Monday": 0.8,
    "Tuesday": 0.7,
    "Wednesday": 0.75,
    "Thursday": 0.8,
    "Friday": 0.65,
    "Saturday": 0.9,
    "Sunday": 0.5
  };

  // User preferences (would be personalized in a real system)
  private userTimePreference: Record<string, number> = {
    "morning": 0.8,   // 8:00 - 11:59
    "afternoon": 0.6, // 12:00 - 16:59
    "evening": 0.4    // 17:00 - 20:00
  };

  // Score a session based on various factors
  public scoreSession(session: DoctorSession, userHistory: DoctorSession[] = []): number {
    const date = new Date(session.date);
    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
    const hour = parseInt(session.start_time.split(':')[0]);
    
    // Base score from time popularity
    let score = this.timeSlotPopularity[`${hour}:00`] || 0.5;
    
    // Factor in day of week popularity
    score *= this.dayPopularity[dayOfWeek] || 0.7;
    
    // Factor in time of day preference
    let timeOfDay = "afternoon";
    if (hour < 12) timeOfDay = "morning";
    else if (hour >= 17) timeOfDay = "evening";
    score *= this.userTimePreference[timeOfDay];
    
    // Prefer sessions with fewer patients (more availability)
    const availabilityFactor = 1 - (session.patients_booked / session.max_patients);
    score *= (0.5 + 0.5 * availabilityFactor);
    
    // If user has history, prefer similar times
    if (userHistory.length > 0) {
      const historicalHourPreference = this.calculateHistoricalTimePreference(userHistory);
      const hourDifference = Math.min(
        Math.abs(hour - historicalHourPreference), 
        Math.abs(hour + 24 - historicalHourPreference),
        Math.abs(hour - 24 - historicalHourPreference)
      );
      const similarityScore = Math.max(0, 1 - (hourDifference / 12));
      score *= (0.7 + 0.3 * similarityScore);
    }
    
    return score;
  }
  
  private calculateHistoricalTimePreference(sessions: DoctorSession[]): number {
    if (sessions.length === 0) return 12; // Default to noon
    
    // Calculate average preferred hour
    const totalHours = sessions.reduce((sum, session) => {
      return sum + parseInt(session.start_time.split(':')[0]);
    }, 0);
    
    return totalHours / sessions.length;
  }
  
  // Recommend best sessions based on scoring
  public recommendSessions(availableSessions: DoctorSession[], userHistory: DoctorSession[] = [], limit: number = 3): DoctorSession[] {
    // Score each session
    const scoredSessions = availableSessions.map(session => ({
      session,
      score: this.scoreSession(session, userHistory)
    }));
    
    // Sort by score (descending)
    scoredSessions.sort((a, b) => b.score - a.score);
    
    // Return top N sessions
    return scoredSessions.slice(0, limit).map(item => item.session);
  }
}

// Singleton instance
export const appointmentRecommender = new AppointmentRecommender();
