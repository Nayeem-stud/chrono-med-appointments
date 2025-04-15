
export interface DoctorProfile {
  id: string;
  full_name: string;
  specialization: string;
  qualification: string;
  experience: number;
  about: string | null;
  profile_image: string | null;
  created_at: string;
}

export interface PatientProfile {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  contact_number: string | null;
  medical_history: string | null;
  profile_image: string | null;
  created_at: string;
}

export interface DoctorSession {
  id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  session_type: string;
  max_patients: number;
  patients_booked: number;
  is_available: boolean;
  location: string | null;
  created_at: string;
  doctor?: DoctorProfile;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  session_id: string;
  status: string;
  symptoms: string | null;
  notes: string | null;
  created_at: string;
  doctor?: DoctorProfile;
  patient?: PatientProfile;
  session?: DoctorSession;
}

export const SESSION_TYPES = [
  "General Checkup",
  "Follow-up",
  "Specialist Consultation",
  "Emergency",
  "Virtual Appointment"
];

export const SPECIALIZATIONS = [
  "General Medicine",
  "Pediatrics",
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "Neurology",
  "Gynecology",
  "Ophthalmology",
  "ENT",
  "Psychiatry",
  "Oncology",
  "Urology",
  "Dentistry",
  "Endocrinology"
];
