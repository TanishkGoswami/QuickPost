/* ─────────────────────────────────────────────────────────────────
   MOCK TREND DATA
   Replace with real API response when backend is ready.
   Shape mirrors: { topic, score, niche, ideas, hashtags, images, memes, platforms }
   ───────────────────────────────────────────────────────────────── */

export const NICHES = ['All', 'Trading', 'Fitness', 'AI & Tech', 'Crypto', 'Lifestyle', 'Business', 'Entertainment', 'Sports'];
export const PLATFORMS = ['All', 'Instagram', 'YouTube', 'LinkedIn', 'X', 'Facebook', 'Threads'];
export const CONTENT_TYPES = ['All', 'Reel', 'Post', 'Video', 'Story', 'Carousel'];

export const MOCK_TRENDS = [
  {
    id: 1,
    topic: 'AI Agents Are Taking Over',
    score: 97,
    niche: 'AI & Tech',
    ideas: [
      'Show a "Day in my life" where AI handles everything',
      'React to the top 3 AI agents launched this week',
      'Poll: Would you let AI manage your social media?',
    ],
    hashtags: ['#AIAgents', '#FutureOfWork', '#ArtificialIntelligence', '#TechTrends', '#AI2026'],
    images: [
      'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80',
      'https://images.unsplash.com/photo-1676277791608-ac2da0f0b8e7?w=400&q=80',
    ],
    memes: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80'],
    platforms: [
      { name: 'LinkedIn', type: 'Post', icon: '/icons/linkedin-icon.svg' },
      { name: 'YouTube', type: 'Video', icon: '/icons/youtube-color-icon.svg' },
      { name: 'Instagram', type: 'Reel', icon: '/icons/ig-instagram-icon.svg' },
    ],
  },
  {
    id: 2,
    topic: 'IPL 2026 Fever',
    score: 92,
    niche: 'Sports',
    ideas: [
      'Match reaction reel — your live take on the final over',
      'Top 3 most insane moments of the season',
      '"Which IPL team are you?" personality quiz post',
    ],
    hashtags: ['#IPL2026', '#Cricket', '#MatchDay', '#IPL', '#CricketFever'],
    images: [
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&q=80',
      'https://images.unsplash.com/photo-1594549181132-9045fed330ce?w=400&q=80',
    ],
    memes: ['https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=400&q=80'],
    platforms: [
      { name: 'Instagram', type: 'Reel', icon: '/icons/ig-instagram-icon.svg' },
      { name: 'YouTube', type: 'Video', icon: '/icons/youtube-color-icon.svg' },
    ],
  },
  {
    id: 3,
    topic: 'Bitcoin Hits New ATH',
    score: 94,
    niche: 'Crypto',
    ideas: [
      'Explain what this ATH means in 60 seconds',
      '"What I wish I knew before buying BTC" story post',
      'Comparison chart reel: BTC vs Gold last 5 years',
    ],
    hashtags: ['#Bitcoin', '#BTC', '#CryptoATH', '#Crypto2026', '#HODL'],
    images: [
      'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&q=80',
      'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=400&q=80',
    ],
    memes: ['https://images.unsplash.com/photo-1616514197671-15d99ce7a6f8?w=400&q=80'],
    platforms: [
      { name: 'X', type: 'Post', icon: '/icons/x-social-media-round-icon.svg' },
      { name: 'YouTube', type: 'Video', icon: '/icons/youtube-color-icon.svg' },
      { name: 'Instagram', type: 'Reel', icon: '/icons/ig-instagram-icon.svg' },
    ],
  },
  {
    id: 4,
    topic: '75 Hard Challenge',
    score: 88,
    niche: 'Fitness',
    ideas: [
      'Day 1 transformation check-in reel',
      'What I eat in a day on 75 Hard',
      '5 things nobody tells you about 75 Hard',
    ],
    hashtags: ['#75Hard', '#75HardChallenge', '#FitnessMotivation', '#Discipline', '#MindsetShift'],
    images: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80',
    ],
    memes: [],
    platforms: [
      { name: 'Instagram', type: 'Reel', icon: '/icons/ig-instagram-icon.svg' },
      { name: 'YouTube', type: 'Video', icon: '/icons/youtube-color-icon.svg' },
      { name: 'Threads', type: 'Post', icon: '/icons/threads-icon.svg' },
    ],
  },
  {
    id: 5,
    topic: 'Stock Market Correction',
    score: 85,
    niche: 'Trading',
    ideas: [
      'Live reaction to today\'s market drop — what I\'m buying',
      '"Should you panic sell?" — debunking myths in a reel',
      'My watchlist during corrections — educational post',
    ],
    hashtags: ['#StockMarket', '#MarketCorrection', '#Investing', '#TradingTips', '#FinancialLiteracy'],
    images: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&q=80',
    ],
    memes: ['https://images.unsplash.com/photo-1559526324-593bc073d938?w=400&q=80'],
    platforms: [
      { name: 'LinkedIn', type: 'Post', icon: '/icons/linkedin-icon.svg' },
      { name: 'X', type: 'Post', icon: '/icons/x-social-media-round-icon.svg' },
      { name: 'YouTube', type: 'Video', icon: '/icons/youtube-color-icon.svg' },
    ],
  },
  {
    id: 6,
    topic: 'Notion AI Features Drop',
    score: 82,
    niche: 'Business',
    ideas: [
      '"I replaced my entire team with Notion AI" — clickable title reel',
      'Top 5 Notion AI features you\'re not using yet',
      'My full business workflow using Notion (tutorial)',
    ],
    hashtags: ['#NotionAI', '#Productivity', '#Notion', '#WorkSmarter', '#BusinessTools'],
    images: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&q=80',
    ],
    memes: [],
    platforms: [
      { name: 'LinkedIn', type: 'Post', icon: '/icons/linkedin-icon.svg' },
      { name: 'YouTube', type: 'Video', icon: '/icons/youtube-color-icon.svg' },
      { name: 'Instagram', type: 'Carousel', icon: '/icons/ig-instagram-icon.svg' },
    ],
  },
  {
    id: 7,
    topic: 'Solo Travel in 2026',
    score: 79,
    niche: 'Lifestyle',
    ideas: [
      '"Things I wish I packed" — aesthetic reel from your last trip',
      'Budget breakdown: solo trip under ₹20,000',
      '"Is solo travel safe?" — your honest take in a post',
    ],
    hashtags: ['#SoloTravel', '#TravelIn2026', '#BackpackerLife', '#TravelBlogger', '#Wanderlust'],
    images: [
      'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=80',
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80',
    ],
    memes: ['https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80'],
    platforms: [
      { name: 'Instagram', type: 'Reel', icon: '/icons/ig-instagram-icon.svg' },
      { name: 'YouTube', type: 'Video', icon: '/icons/youtube-color-icon.svg' },
    ],
  },
  {
    id: 8,
    topic: 'Quiet Luxury Aesthetic',
    score: 76,
    niche: 'Lifestyle',
    ideas: [
      '"Quiet luxury look for under ₹5000" — outfit reel',
      'What quiet luxury actually means (and what it doesn\'t)',
      'My minimalist morning routine — aesthetic B-roll',
    ],
    hashtags: ['#QuietLuxury', '#MinimalistFashion', '#OldMoney', '#LuxuryAesthetic', '#SlowLiving'],
    images: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    ],
    memes: [],
    platforms: [
      { name: 'Instagram', type: 'Reel', icon: '/icons/ig-instagram-icon.svg' },
      { name: 'Threads', type: 'Post', icon: '/icons/threads-icon.svg' },
    ],
  },
  {
    id: 9,
    topic: 'ChatGPT o3 Released',
    score: 91,
    niche: 'AI & Tech',
    ideas: [
      '"I tested o3 for 7 days" — honest review reel',
      'Side-by-side: o3 vs o1 — which is better for creators?',
      '5 prompts that broke my brain (in a good way)',
    ],
    hashtags: ['#ChatGPT', '#OpenAI', '#GPT4o', '#AITools', '#PromptEngineering'],
    images: [
      'https://images.unsplash.com/photo-1675557009486-1e0d82bbfa84?w=400&q=80',
      'https://images.unsplash.com/photo-1659040898348-4a9a2bfb8bbe?w=400&q=80',
    ],
    memes: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80'],
    platforms: [
      { name: 'YouTube', type: 'Video', icon: '/icons/youtube-color-icon.svg' },
      { name: 'LinkedIn', type: 'Post', icon: '/icons/linkedin-icon.svg' },
      { name: 'Instagram', type: 'Reel', icon: '/icons/ig-instagram-icon.svg' },
    ],
  },
  {
    id: 10,
    topic: 'Gym Vlog Comeback',
    score: 73,
    niche: 'Fitness',
    ideas: [
      '"Back to the gym after 3 months" — honest raw vlog',
      'My exact gym routine (no fluff) — carousel post',
      '"Why I stopped going to the gym" — story time reel',
    ],
    hashtags: ['#GymVlog', '#FitnessJourney', '#GymMotivation', '#BackToGym', '#WorkoutRoutine'],
    images: [
      'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
    ],
    memes: ['https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=400&q=80'],
    platforms: [
      { name: 'Instagram', type: 'Reel', icon: '/icons/ig-instagram-icon.svg' },
      { name: 'YouTube', type: 'Video', icon: '/icons/youtube-color-icon.svg' },
    ],
  },
  {
    id: 11,
    topic: 'Entrepreneurship at 20',
    score: 80,
    niche: 'Business',
    ideas: [
      '"I started a business at 20 — here\'s what I wish I knew"',
      'My first ₹1 lakh online — honest breakdown',
      'Stop waiting for the "right time" — motivational post',
    ],
    hashtags: ['#YoungEntrepreneur', '#StartupLife', '#Entrepreneurship', '#BuildInPublic', '#Hustler'],
    images: [
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    ],
    memes: [],
    platforms: [
      { name: 'LinkedIn', type: 'Post', icon: '/icons/linkedin-icon.svg' },
      { name: 'Instagram', type: 'Reel', icon: '/icons/ig-instagram-icon.svg' },
      { name: 'YouTube', type: 'Video', icon: '/icons/youtube-color-icon.svg' },
    ],
  },
  {
    id: 12,
    topic: 'Sabrina Carpenter Tour',
    score: 71,
    niche: 'Entertainment',
    ideas: [
      'React to the tour setlist — ranking every song',
      '"Would you pay ₹10k for a concert?" — engagement post',
      'POV: you\'re at the Sabrina Carpenter concert — aesthetic reel',
    ],
    hashtags: ['#SabrinaCarpenter', '#ShortNSweet', '#SabrinaTour', '#PopMusic', '#ConcertVibes'],
    images: [
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80',
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80',
    ],
    memes: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80'],
    platforms: [
      { name: 'Instagram', type: 'Reel', icon: '/icons/ig-instagram-icon.svg' },
      { name: 'Threads', type: 'Post', icon: '/icons/threads-icon.svg' },
      { name: 'YouTube', type: 'Video', icon: '/icons/youtube-color-icon.svg' },
    ],
  },
];
