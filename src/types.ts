export interface UserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  coupleId?: string;
  role: 'partner1' | 'partner2';
}

export interface Couple {
  id: string; // The pair code
  partner1: {
    uid: string;
    name: string;
    location: string;
    lat?: number;
    lng?: number;
    timezone: string;
    heartStatus?: string;
  };
  partner2?: {
    uid: string;
    name: string;
    location: string;
    lat?: number;
    lng?: number;
    timezone: string;
    heartStatus?: string;
  };
  interaction?: {
     p1Touching: boolean;
     p2Touching: boolean;
  };
  relationshipTone?: string;
  dailyWhisper?: string;
  startDate: string;
  firstMeetingDate: string;
  birthdayPartner2: string; // (May 22)
  spotifyPlaylistId?: string;
  status: 'pairing' | 'active';
  lastActivity?: any;
  themeMood?: 'midnight' | 'evergreen' | 'celestial' | 'golden' | 'deepsea';
}

export interface BucketItem {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: any;
}

export interface VoiceNote {
  id: string;
  title: string;
  url: string;
  duration: string;
  senderName: string;
  createdAt: any;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUrl: string;
  createdAt: any;
}

export interface Letter {
  id: string;
  title: string;
  content: string;
  unlockDate: string;
  isUnlocked: boolean;
  createdAt: any;
}

export enum View {
  Auth = 'auth',
  Home = 'home',
  Timeline = 'timeline',
  Letters = 'letters',
  Together = 'together',
  Admin = 'admin'
}
