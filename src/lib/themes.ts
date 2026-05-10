export type ThemeMood = 'midnight' | 'evergreen' | 'celestial' | 'golden' | 'deepsea';

export interface ThemeConfig {
  id: ThemeMood;
  name: string;
  gradient: string;
  accent: string;
  accentText: string;
  secondaryAccent: string;
  blob1: string;
  blob2: string;
}

export const THEMES: Record<ThemeMood, ThemeConfig> = {
  midnight: {
    id: 'midnight',
    name: 'Midnight Bloom',
    gradient: 'midnight-gradient',
    accent: 'text-romantic-rose',
    accentText: 'text-romantic-rose',
    secondaryAccent: 'text-romantic-gold',
    blob1: 'bg-romantic-rose/10',
    blob2: 'bg-romantic-gold/5',
  },
  evergreen: {
    id: 'evergreen',
    name: 'Evergreen Sanctuary',
    gradient: 'evergreen-gradient',
    accent: 'text-[#C7FFB2]',
    accentText: 'text-[#C7FFB2]',
    secondaryAccent: 'text-[#FFF5DC]',
    blob1: 'bg-[#C7FFB2]/10',
    blob2: 'bg-[#FFF5DC]/5',
  },
  celestial: {
    id: 'celestial',
    name: 'Celestial Dream',
    gradient: 'celestial-gradient',
    accent: 'text-[#A5B4FC]',
    accentText: 'text-[#A5B4FC]',
    secondaryAccent: 'text-[#E0E7FF]',
    blob1: 'bg-[#A5B4FC]/10',
    blob2: 'bg-white/5',
  },
  golden: {
    id: 'golden',
    name: 'Golden Hour',
    gradient: 'golden-gradient',
    accent: 'text-[#FDE68A]',
    accentText: 'text-[#FDE68A]',
    secondaryAccent: 'text-[#FDBA74]',
    blob1: 'bg-[#FDE68A]/10',
    blob2: 'bg-[#FDBA74]/5',
  },
  deepsea: {
    id: 'deepsea',
    name: 'Deep Sea Echo',
    gradient: 'deepsea-gradient',
    accent: 'text-[#2DD4BF]',
    accentText: 'text-[#2DD4BF]',
    secondaryAccent: 'text-[#99F6E4]',
    blob1: 'bg-[#2DD4BF]/10',
    blob2: 'bg-[#99F6E4]/5',
  }
};
