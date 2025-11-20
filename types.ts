
export enum Gender {
  HOMME = 'Homme',
  FEMME = 'Femme',
  TRANSEXUEL = 'Transexuel',
  TRANSEXUELLE = 'Transexuelle',
  COUPLE = 'Couple',
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  location: string;
  bioText: string;
  imageUrls: string[]; // Changed to array for multiple photos
  audioBase64?: string; // Base64 encoded audio
  
  // Fields for Couple
  secondName?: string;
  secondAge?: number;
}

export interface UserProfile extends Profile {
  isPremium: boolean; // Has paid the 9.99
  targetGenders: Gender[]; // Who they want to meet
  searchRadius: number; // Distance in km
  hasAcceptedTerms: boolean; // GDPR Consent
}

export interface UserPreferences {
  targetGender: Gender[];
  minAge: number;
  maxAge: number;
}

export interface Message {
  id: string;
  senderId: string;
  audioBase64?: string; // Voice message
  timestamp: number;
  isMe: boolean;
}
