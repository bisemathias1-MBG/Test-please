
import { Gender, Profile } from "../types";

// These represent "Real" users in the database.
export const MOCK_DB_PROFILES: Profile[] = [
  {
    id: "u1",
    name: "Sophie",
    age: 26,
    gender: Gender.FEMME,
    location: "Paris",
    bioText: "Je suis une passionnée d'art et de café. J'adore flâner dans les musées le dimanche.",
    imageUrls: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
    ],
    audioBase64: undefined 
  },
  {
    id: "u2",
    name: "Thomas",
    age: 31,
    gender: Gender.HOMME,
    location: "Lyon",
    bioText: "Entrepreneur dans la tech, je cours après le temps mais je m'arrête toujours pour un bon vin.",
    imageUrls: [
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80"
    ],
    audioBase64: undefined
  },
  {
    id: "u3",
    name: "Alex & Jess",
    age: 28,
    gender: Gender.COUPLE,
    location: "Bordeaux",
    bioText: "Couple épicurien, on adore les voyages et la gastronomie. On cherche à élargir notre cercle.",
    imageUrls: [
        "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519671482538-518b5c2faa9c?auto=format&fit=crop&w=800&q=80"
    ],
    audioBase64: undefined
  },
  {
    id: "u4",
    name: "Léa",
    age: 24,
    gender: Gender.TRANSEXUELLE,
    location: "Marseille",
    bioText: "Solaire et spontanée, je vis près de la mer. J'aime la danse.",
    imageUrls: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
    ],
    audioBase64: undefined
  },
  {
    id: "u5",
    name: "Marc",
    age: 35,
    gender: Gender.HOMME,
    location: "Lille",
    bioText: "Architecte, j'aime construire des choses solides. Je cherche la même chose en amour.",
    imageUrls: [
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?auto=format&fit=crop&w=800&q=80"
    ],
    audioBase64: undefined
  }
];