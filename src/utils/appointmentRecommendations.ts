
import { DoctorSession } from "@/types";

// Enhanced ML model for appointment recommendations
// This is a hybrid model combining content-based filtering with collaborative filtering elements
export class AppointmentRecommender {
  // Historical pattern weights (enhanced ML model)
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

  // Specialty preferences (for collaborative filtering simulation)
  private specialtyPopularity: Record<string, number> = {
    "General Medicine": 0.75,
    "Pediatrics": 0.8,
    "Cardiology": 0.85,
    "Dermatology": 0.7,
    "Orthopedics": 0.8,
    "Neurology": 0.75,
    "Gynecology": 0.7,
    "Ophthalmology": 0.65,
    "ENT": 0.6,
    "Psychiatry": 0.7,
    "Oncology": 0.8,
    "Urology": 0.65,
    "Dentistry": 0.7,
    "Endocrinology": 0.75
  };

  // Enhanced sigmoid activation function for better normalization
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  // Vector similarity using cosine similarity
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Generate feature vector for a session
  private generateFeatureVector(session: DoctorSession): number[] {
    const date = new Date(session.date);
    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
    const hour = parseInt(session.start_time.split(':')[0]);
    
    // Time of day normalization (0-1 scale)
    const timeNormalized = hour / 24;
    
    // Day of week (Monday=0, Sunday=6, normalized to 0-1)
    const dayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(dayOfWeek);
    const dayNormalized = dayIndex / 6;
    
    // Availability ratio
    const availabilityRatio = 1 - (session.patients_booked / session.max_patients);
    
    // Day popularity from model
    const dayPopularity = this.dayPopularity[dayOfWeek] || 0.5;
    
    // Time slot popularity from model
    const timePopularity = this.timeSlotPopularity[`${hour}:00`] || 0.5;
    
    // Specialty popularity if available
    const specialtyPopularity = session.doctor?.specialization 
      ? (this.specialtyPopularity[session.doctor.specialization] || 0.7)
      : 0.7;
    
    return [
      timeNormalized,
      dayNormalized,
      availabilityRatio,
      dayPopularity,
      timePopularity,
      specialtyPopularity
    ];
  }

  // Score a session based on various factors (enhanced with ML techniques)
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
    
    // Factor in specialty popularity for collaborative filtering effect
    if (session.doctor?.specialization) {
      const specialtyFactor = this.specialtyPopularity[session.doctor.specialization] || 0.7;
      score *= specialtyFactor;
    }
    
    // If user has history, implement a more sophisticated collaborative filtering approach
    if (userHistory.length > 0) {
      // Get historical time preference (weighted average)
      const historicalHourPreference = this.calculateHistoricalTimePreference(userHistory);
      
      // Apply recency bias - more recent appointments have higher weight
      const recencyBiasedScore = this.applyRecencyBias(session, userHistory);
      score *= (0.7 + 0.3 * recencyBiasedScore);
      
      // Add similarity component based on feature vectors
      const sessionVector = this.generateFeatureVector(session);
      
      // Calculate average similarity with past sessions
      let totalSimilarity = 0;
      for (const historySession of userHistory) {
        const historyVector = this.generateFeatureVector(historySession);
        totalSimilarity += this.cosineSimilarity(sessionVector, historyVector);
      }
      
      const avgSimilarity = userHistory.length > 0 ? totalSimilarity / userHistory.length : 0;
      
      // Blend content-based and collaborative scores
      score = 0.6 * score + 0.4 * avgSimilarity;
      
      // Hour preference similarity (temporal pattern matching)
      const hourDifference = Math.min(
        Math.abs(hour - historicalHourPreference), 
        Math.abs(hour + 24 - historicalHourPreference),
        Math.abs(hour - 24 - historicalHourPreference)
      );
      const similarityScore = Math.max(0, 1 - (hourDifference / 12));
      score *= (0.8 + 0.2 * similarityScore);
    }
    
    // Apply sigmoid activation for better normalization
    return this.sigmoid(score * 2 - 1);
  }
  
  // Apply recency bias to scoring
  private applyRecencyBias(session: DoctorSession, userHistory: DoctorSession[]): number {
    if (userHistory.length === 0) return 0.5;
    
    // Sort history by date (most recent first)
    const sortedHistory = [...userHistory].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Get most recent session
    const mostRecent = sortedHistory[0];
    
    // Compare features
    const sessionVector = this.generateFeatureVector(session);
    const recentVector = this.generateFeatureVector(mostRecent);
    
    return this.cosineSimilarity(sessionVector, recentVector);
  }
  
  private calculateHistoricalTimePreference(sessions: DoctorSession[]): number {
    if (sessions.length === 0) return 12; // Default to noon
    
    // Calculate weighted average based on recency
    let totalWeight = 0;
    let weightedSum = 0;
    
    // Sort sessions by date (oldest first)
    const sortedSessions = [...sessions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Apply exponential weighting - more recent sessions have higher weight
    sortedSessions.forEach((session, index) => {
      const weight = Math.exp(index / 10); // Exponential weight
      const hour = parseInt(session.start_time.split(':')[0]);
      
      weightedSum += hour * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 12;
  }
  
  // Enhanced recommendation algorithm with diversity promotion
  public recommendSessions(availableSessions: DoctorSession[], userHistory: DoctorSession[] = [], limit: number = 3): DoctorSession[] {
    if (availableSessions.length === 0) return [];
    
    // Score each session
    const scoredSessions = availableSessions.map(session => ({
      session,
      score: this.scoreSession(session, userHistory)
    }));
    
    // Sort by score (descending)
    scoredSessions.sort((a, b) => b.score - a.score);
    
    // Promote diversity in recommendations using a greedy approach
    const recommendations: {session: DoctorSession, score: number}[] = [];
    const specialtySeen = new Set<string>();
    const timeslotSeen = new Set<string>();
    
    // First add the top recommendation
    if (scoredSessions.length > 0) {
      recommendations.push(scoredSessions[0]);
      
      // Track its specialty and timeslot
      if (scoredSessions[0].session.doctor?.specialization) {
        specialtySeen.add(scoredSessions[0].session.doctor.specialization);
      }
      timeslotSeen.add(`${scoredSessions[0].session.date}-${scoredSessions[0].session.start_time}`);
    }
    
    // Now add more recommendations, trying to ensure diversity
    for (let i = 1; i < scoredSessions.length && recommendations.length < limit; i++) {
      const candidate = scoredSessions[i];
      const specialty = candidate.session.doctor?.specialization;
      const timeslot = `${candidate.session.date}-${candidate.session.start_time}`;
      
      // If we've seen less than 75% of the recommendations, try to ensure diversity
      if (recommendations.length < limit * 0.75) {
        // Prioritize new specialties and timeslots
        if ((!specialty || !specialtySeen.has(specialty)) && !timeslotSeen.has(timeslot)) {
          recommendations.push(candidate);
          if (specialty) specialtySeen.add(specialty);
          timeslotSeen.add(timeslot);
        }
      } else {
        // For the remaining slots, just add by score
        recommendations.push(candidate);
      }
    }
    
    // If we still don't have enough, add the remaining top scored sessions
    if (recommendations.length < Math.min(limit, scoredSessions.length)) {
      for (let i = 0; i < scoredSessions.length && recommendations.length < limit; i++) {
        if (!recommendations.includes(scoredSessions[i])) {
          recommendations.push(scoredSessions[i]);
        }
      }
    }
    
    // Return just the sessions
    return recommendations.map(item => item.session);
  }
}

// Singleton instance
export const appointmentRecommender = new AppointmentRecommender();
