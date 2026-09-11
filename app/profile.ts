export type SocialIcon = 'discord' | 'github' | 'steam' | 'globe';

// Public configuration. Reference identity is demo content; replace before publishing.
export const profile = {
  name: 'ARTHAS',
  siteName: '',
  bio: 'hi welcome to my profile',
  avatar: '', // Your own image from public/, e.g. '/avatar.webp'.
  phrases: ['I regret nothing.', 'Wealthy and retarded.', 'Hi Stalker.'],
  location: '',
  viewCount: null as number | null, // Hidden until a real visitor counter is connected.
  discord: {
    userId: '1415607936209911808', // Numeric Discord user ID. Join Lanyard to publish your presence.
    syncIdentity: true, // Use Discord name and avatar in the main header.
    showActivity: true,
    url: 'https://discord.com',
  },
  timezone: 'Europe/Berlin',
  intro: { enabled: true, text: '[ Click to Continue ]' },

  effects: { tilt: true, glow: true, typing: true },
  music: {
    enabled: true,
    autoplayOnEntry: true,
    volume: 0.45,
tracks: [
  {
    title: 'Polarstern (G-House Remix)',
    src: '/ghouse.mp3',
    cover: '/song1cover.jpg',
    captions: '/ambient.vtt',
  },
  {
    title: 'NBA x mylancore',
    src: '/nba.mp3',
    cover: '/song2cover.jpg',
    captions: '/ambient.vtt',
  },
    {
    title: 'MRIZON - Другий трек',
    src: '/mrizon.mp3',
    cover: '/song3cover.jpg',
    captions: '/ambient.vtt',
  },
],
  },
  games: {
    enabled: true,
    title: 'Most played Games',
    items: [
      {
        title: 'World of Warcraft Classic',
        hours: '24.420+ Hours',  
        status: ['Active'],
        image: '/wow.jpg',
        url: 'https://worldofwarcraft.blizzard.com/',
      },
      {
        title: "Garry's Mod",
        hours: '4.500+ Hours',  
        status: ['Active'],
        image: '/GarrysMod.jpg',
        url: 'https://store.steampowered.com/app/4000/Garrys_Mod/',
      },
    ],
  },
  socials: [
    { label: 'Discord', icon: 'discord', url: 'https://discord.com/users/1415607936209911808'},
    { label: 'Steam', icon: 'steam', url: 'https://steamcommunity.com/id/ARTHXS/' },
    { label: 'Website', icon: 'globe', url: 'https://arthas.wtf' },
  ] as { label: string; icon: SocialIcon; url: string }[],
};

export type Work = {
  title: string;
  description: string;
  category: 'whois' | 'code' | 'musictaste' | 'misc';
  year: string;
  url: string;
};

// Beispiele ersetzen. Leere URLs zeigen keinen Link an.
export const portfolio = {
  enabled: true,
  title: 'My Projects',
  description: 'My previous and ever made Projects.',
  categories: [
    { id: 'alle', label: 'All Projects' },
    { id: 'projekte', label: 'Projects' },
    { id: 'design', label: 'Design' },
    { id: 'code', label: 'Code' },
  ],
  works: [
    {
      title: 'Minecraft',
      description: 'Modder for nostalgic Projects. Discontinued due Motivation and Time.',
      category: 'projekte',
      year: '2024 - 2026',
      url: '',
    },
        {
      title: 'WoW',
      description: 'HUD / Addons is my current sector.',
      category: 'projekte',
      year: '2026',
      url: '',
    },
    {
      title: 'Blender',
      description: 'Garry\'s Mod – Steamhappy Medkit e.x. Mostly HF2, CW2, M9K',
      category: 'design',
      year: '2026',
      url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3796840406',
    },
    {
      title: 'Strong Lua Code',
      description:
        'while true do end.',
      category: 'code',
      year: '2026',
      url: 'https://www.youtube.com/watch?v=Aq5WXmQQooo&pp=ygUMcmljayByb2xsaW5n',
    },
  ] as Work[],
};

// Separate project collection for the left-hand panel.
export const leftPortfolio: typeof portfolio = {
  enabled: true,
  title: 'About me',
  description: '',
  categories: [
    { id: 'whois', label: 'Who is ARTHAS?' },
    { id: 'musictaste', label: 'Music Taste' },
    { id: 'misc', label: 'Misc' },
  ],
  works: [
    {
      title: 'ARTHAS',
      description:
        'Dedicated modder and music producer, always creating, experimenting, and bringing new ideas to life. Passionate about game modding. Feel free to add me!',
      category: 'whois',
      year: 'N/A',
      url: '',
    },
    {
      title: 'What is he listening to?',
      description:
        'Hardstyle, Deep House, G-House, Mylancore, Russian Car Remixes. The link follows you to my recent Playlist on SoundCloud.',
      category: 'musictaste',
      year: 'N/A',
      url: 'https://soundcloud.com/fdj7okxlg5ae/sets/9bkouk1jvhq3?si=f46d2e8d282942f39c604b5a04650ce2&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing',
    },
    {
      title: 'Other Info...',
      description:
        'You want to be friends? Add me on Discord. (◣_◢)',
      category: 'misc',
      year: '+1',
      url: '',
    },
  ],
};
