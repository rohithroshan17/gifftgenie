export type Product = {
  id: string
  name: string
  maker: string
  location: string
  price: number
  rating: number
  reviewCount: number
  category: string
  collection: string
  description: string
  note: string
  image: string
  gallery?: string[]
  accent: string
  tags: string[]
  story: string
}

export type Collection = {
  id: string
  eyebrow: string
  title: string
  description: string
  tone: string
  image: string
}

const image = (id: string, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`

const coreProducts: Product[] = [
  {
    id: 'wildflower-vase', name: 'Wildflower bud vase', maker: 'Clay & Kind', location: 'Jaipur, Rajasthan', price: 38, rating: 4.9, reviewCount: 46, category: 'Home', collection: 'small-joys',
    description: 'A tiny, hand-thrown reminder to notice the little things.', note: 'For the person who keeps a flower in every room.', image: image('photo-1610701596007-11502861dcfa'), gallery: [image('photo-1610701596007-11502861dcfa'), image('photo-1494438639946-1ebd1d20bf85'), image('photo-1507643179773-3e975d7ac515')], accent: 'ochre', tags: ['handmade', 'home', 'under ₹3,500'], story: 'Each vase is thrown, glazed, and finished in small batches by a two-person studio in Jaipur. The gentle shape is designed to make even one stem feel special.'
  },
  {
    id: 'candle-set', name: 'A little moment candle set', maker: 'Sunday Rituals', location: 'Bengaluru, Karnataka', price: 32, rating: 4.8, reviewCount: 32, category: 'Wellness', collection: 'slow-moments',
    description: 'Three small scents for the days that deserve a pause.', note: 'For a friend who needs a softer evening.', image: image('photo-1603006905003-be475563bc59'), accent: 'lilac', tags: ['self-care', 'hand-poured', 'under ₹3,500'], story: 'Poured by hand with coconut wax and essential-oil blends, this trio moves from sunlit citrus to sandalwood dusk. The labels are printed locally on recycled cotton paper.'
  },
  {
    id: 'pearl-pendant', name: 'Everyday pearl pendant', maker: 'Mira Studio', location: 'Mumbai, Maharashtra', price: 64, rating: 5.0, reviewCount: 28, category: 'Jewellery', collection: 'quietly-iconic',
    description: 'A luminous freshwater pearl, made for every day.', note: 'For the one whose style never tries too hard.', image: image('photo-1617038220319-276d3cfab638'), accent: 'sage', tags: ['jewellery', 'keepsake', 'under ₹6,000'], story: 'Mira Studio pairs imperfectly beautiful freshwater pearls with a fine gold-plated chain, giving each piece a little individuality without losing its everyday ease.'
  },
  {
    id: 'linen-journal', name: 'The good ideas journal', maker: 'Paper Plane Press', location: 'Kolkata, West Bengal', price: 24, rating: 4.9, reviewCount: 57, category: 'Stationery', collection: 'small-joys',
    description: 'A linen-bound place for thoughts worth keeping.', note: 'For the collector of lists, dreams, and side quests.', image: image('photo-1517842645767-c639042777db'), accent: 'terracotta', tags: ['paper goods', 'for creatives', 'under ₹3,500'], story: 'The journal is bound in a neighbourhood print studio using archival paper, exposed thread binding, and a cover cloth that gets better with a little time and handling.'
  },
  {
    id: 'wildflower-note-cards', name: 'Wildflower note cards', maker: 'Paper Plane Press', location: 'Kolkata, West Bengal', price: 16, rating: 4.8, reviewCount: 24, category: 'Stationery', collection: 'small-joys',
    description: 'A small set of illustrated cards for saying the thing in your own handwriting.', note: 'For the friend who still sends the best messages on paper.', image: image('photo-1516321318423-f06f85e504b3'), accent: 'marigold', tags: ['birthday', 'writing', 'paper goods', 'under ₹2,000'], story: 'Printed in small runs with botanical inks, these cards are made for the messages that deserve more than a notification.'
  },
  {
    id: 'tea-trio', name: 'Three quiet teas', maker: 'Mountain & Mellow', location: 'Darjeeling, West Bengal', price: 29, rating: 4.8, reviewCount: 18, category: 'Food & drink', collection: 'slow-moments',
    description: 'A considered trio for long conversations and slow mornings.', note: 'For the one who makes a ritual out of tea.', image: image('photo-1594631252845-29fc4cc8cde9'), accent: 'forest', tags: ['tea', 'for hosts', 'under ₹3,500'], story: 'Small-lot leaves are blended with rose, lemongrass, and toasted rice by a family-run tea house. Every tin includes a note about the harvest and the people who picked it.'
  },
  {
    id: 'sun-catcher', name: 'Sun catcher, small', maker: 'Studio Nadi', location: 'Pune, Maharashtra', price: 42, rating: 4.9, reviewCount: 21, category: 'Home', collection: 'small-joys',
    description: 'A little prism of light for a favourite corner.', note: 'For making ordinary rooms feel a little more alive.', image: image('photo-1507643179773-3e975d7ac515'), accent: 'marigold', tags: ['home', 'handmade', 'under ₹3,500'], story: 'Cut from reclaimed glass and finished by hand, each sun catcher has a slightly different constellation of tiny imperfections. Hang it near a window and let the room do the rest.'
  },
  {
    id: 'silk-scarf', name: 'The easy silk scarf', maker: 'Tara Textiles', location: 'Ahmedabad, Gujarat', price: 58, rating: 4.7, reviewCount: 19, category: 'Wearables', collection: 'quietly-iconic',
    description: 'A generous silk square in a colour that goes everywhere.', note: 'For the one who always adds the final touch.', image: image('photo-1601924928376-3e7f6d0d1f4f'), accent: 'indigo', tags: ['textiles', 'keepsake', 'under ₹6,000'], story: 'Printed in small runs on mulberry silk, the pattern takes its cue from old botanical field notes. It works tied at the neck, in the hair, or on the handle of a favourite bag.'
  },
  {
    id: 'weekend-box', name: 'The just-because box', maker: 'Kindred Edit', location: 'Curated with care', price: 76, rating: 4.9, reviewCount: 14, category: 'Curated sets', collection: 'just-because',
    description: 'A little of everything lovely, wrapped up for no particular reason.', note: 'For a message that does not need a special occasion.', image: image('photo-1607082349566-187342175e2f'), gallery: [image('photo-1607082349566-187342175e2f'), image('photo-1513475382585-d06e58bcb0e0'), image('photo-1490750967868-88aa4486c946')], accent: 'coral', tags: ['curated', 'best seller', 'under ₹6,000'], story: 'A rotating edit of three maker-made favourites: something for the senses, something useful, and one small surprise. The contents change with the season; the feeling stays the same.'
  },
]


const budgetThemes = [
  { category: 'Birthday', collection: 'small-joys', maker: 'Kindred Finds', location: 'Across India', accent: 'coral', names: ['Mini birthday candle', 'Party-ready note set', 'Tiny celebration garland', 'Birthday wish keyring', 'Pocket confetti kit', 'Cake-day tea tin', 'Bright little gift box', 'Birthday flower wrap'] },
  { category: 'Anniversary', collection: 'quietly-iconic', maker: 'Little Keeps', location: 'Mumbai, Maharashtra', accent: 'lilac', names: ['Two-cup chai set', 'Love note stationery', 'Pocket photo frame', 'Pair of lucky charms', 'Date-night question cards', 'Soft evening incense', 'Tiny keepsake dish', 'Together tea blend'] },
  { category: 'Housewarming', collection: 'small-joys', maker: 'Good Corner Studio', location: 'Pune, Maharashtra', accent: 'sage', names: ['Mini plant pot', 'Kitchen herb markers', 'Handmade coaster pair', 'Doorway welcome bell', 'Little room spray', 'Sunlit matchbox', 'Tea towel set', 'New-home candle'] },
  { category: 'Thank you', collection: 'just-because', maker: 'Kindred Finds', location: 'Across India', accent: 'ochre', names: ['Thank-you card bundle', 'Gratitude tea sachets', 'Little chocolate wrap', 'Kindness bookmark', 'Pocket flower press', 'Warm wishes tag set', 'Small-batch jam jar', 'Golden thank-you pin'] },
  { category: 'Personalized', collection: 'quietly-iconic', maker: 'Made For You', location: 'Bengaluru, Karnataka', accent: 'terracotta', names: ['Initials key tag', 'Nameplate bookmark', 'Custom mini print', 'Monogram gift tag', 'Initial charm', 'Personal note book', 'Little name stamp', 'Custom colour card'] },
  { category: 'Fashion', collection: 'quietly-iconic', maker: 'Common Thread', location: 'Ahmedabad, Gujarat', accent: 'indigo', names: ['Cotton scrunchie set', 'Colour-pop socks', 'Tiny fabric pouch', 'Everyday hair clip', 'Printed pocket scarf', 'Canvas card holder', 'Soft travel eye mask', 'Braided friendship band'] },
  { category: 'Gadgets', collection: 'just-because', maker: 'Bright Utility', location: 'New Delhi, India', accent: 'forest', names: ['Cable organiser', 'Pocket phone stand', 'Mini desk light', 'Travel tech pouch', 'Screen-cleaning kit', 'Tiny USB reading light', 'Wireless tracker tag', 'Desk timer cube'] },
  { category: 'Flowers', collection: 'slow-moments', maker: 'Petal Post', location: 'Delhi, India', accent: 'marigold', names: ['Dried flower posy', 'Pressed flower card', 'Mini marigold bunch', 'Wild bloom bookmark', 'Lavender sachet', 'Flower seed envelope', 'Petal gift wrap', 'Little garden note'] },
  { category: 'Chocolates', collection: 'slow-moments', maker: 'Cocoa Noon', location: 'Bengaluru, Karnataka', accent: 'coral', names: ['Sea-salt chocolate bar', 'Mini truffle trio', 'Cocoa nib sachet', 'Chai chocolate bites', 'Dark chocolate bark', 'Coffee bonbon box', 'Orange peel chocolate', 'Little fudge parcel'] },
  { category: 'Wellness', collection: 'slow-moments', maker: 'Sunday Rituals', location: 'Bengaluru, Karnataka', accent: 'lilac', names: ['Pocket bath soak', 'Calm roll-on oil', 'Herbal eye pillow', 'Soft hands balm', 'Sleepy tea sachets', 'Tiny incense bundle', 'Mindful prompt cards', 'Mini body scrub'] },
  { category: 'Kids', collection: 'small-joys', maker: 'Little Wonder Co.', location: 'Jaipur, Rajasthan', accent: 'marigold', names: ['Colouring postcard set', 'Pocket puzzle cards', 'Tiny animal stamp set', 'Make-your-own bookmark', 'Doodle pencil pack', 'Mini story zine', 'Friendship bead kit', 'Little explorer badge'] },
  { category: 'Luxury', collection: 'quietly-iconic', maker: 'The Small Indulgence', location: 'Mumbai, Maharashtra', accent: 'sage', names: ['Silk sleep sachet', 'Mini brass tray', 'Scented drawer card', 'Gold-edge note set', 'Velvet jewellery pouch', 'Small-batch olive soap', 'Pearl hair pin', 'Luxe tea envelope'] },
]

const budgetImagePools: Record<string, string[]> = {
  Birthday: ['photo-1513159446162-54eb8bdaa79b', 'photo-1513475382585-d06e58bcb0e0', 'photo-1607082349566-187342175e2f'],
  Anniversary: ['photo-1519225421980-715cb0215aed', 'photo-1513475382585-d06e58bcb0e0', 'photo-1617038220319-276d3cfab638'],
  Housewarming: ['photo-1493663284031-b7e3aefcae8e', 'photo-1494438639946-1ebd1d20bf85', 'photo-1610701596007-11502861dcfa'],
  'Thank you': ['photo-1513475382585-d06e58bcb0e0', 'photo-1490750967868-88aa4486c946', 'photo-1607082349566-187342175e2f'],
  Personalized: ['photo-1517842645767-c639042777db', 'photo-1516321318423-f06f85e504b3', 'photo-1607082349566-187342175e2f'],
  Fashion: ['photo-1601924928376-3e7f6d0d1f4f', 'photo-1490481651871-ab68de25d43d', 'photo-1617038220319-276d3cfab638'],
  Gadgets: ['photo-1516321318423-f06f85e504b3', 'photo-1494438639946-1ebd1d20bf85', 'photo-1556760544-74068565f05c'],
  Flowers: ['photo-1490750967868-88aa4486c946', 'photo-1507643179773-3e975d7ac515', 'photo-1511988617509-a57c8a288659'],
  Chocolates: ['photo-1607082349566-187342175e2f', 'photo-1513475382585-d06e58bcb0e0', 'photo-1594631252845-29fc4cc8cde9'],
  Wellness: ['photo-1603006905003-be475563bc59', 'photo-1594631252845-29fc4cc8cde9', 'photo-1494438639946-1ebd1d20bf85'],
  Kids: ['photo-1513159446162-54eb8bdaa79b', 'photo-1516321318423-f06f85e504b3', 'photo-1607082349566-187342175e2f'],
  Luxury: ['photo-1617038220319-276d3cfab638', 'photo-1490481651871-ab68de25d43d', 'photo-1519225421980-715cb0215aed'],
}
const titleImageRules: Array<{ words: string[]; images: string[] }> = [
  { words: ['flower', 'floral', 'petal', 'marigold', 'lavender', 'bloom', 'garden'], images: ['photo-1490750967868-88aa4486c946', 'photo-1507643179773-3e975d7ac515'] },
  { words: ['candle', 'incense', 'bath', 'balm', 'scrub', 'scent', 'soak'], images: ['photo-1603006905003-be475563bc59', 'photo-1494438639946-1ebd1d20bf85'] },
  { words: ['tea', 'chai', 'cocoa', 'chocolate', 'truffle', 'fudge', 'jam'], images: ['photo-1594631252845-29fc4cc8cde9', 'photo-1607082349566-187342175e2f'] },
  { words: ['journal', 'note', 'bookmark', 'stamp', 'print', 'card', 'zine', 'pencil'], images: ['photo-1517842645767-c639042777db', 'photo-1516321318423-f06f85e504b3'] },
  { words: ['jewellery', 'charm', 'pin', 'pearl', 'gold', 'monogram', 'keyring'], images: ['photo-1617038220319-276d3cfab638', 'photo-1490481651871-ab68de25d43d'] },
  { words: ['scarf', 'scrunchie', 'socks', 'pouch', 'hair', 'fashion', 'fabric'], images: ['photo-1601924928376-3e7f6d0d1f4f', 'photo-1490481651871-ab68de25d43d'] },
  { words: ['phone', 'cable', 'usb', 'tech', 'desk', 'timer', 'screen', 'light'], images: ['photo-1516321318423-f06f85e504b3', 'photo-1494438639946-1ebd1d20bf85'] },
]
const imageForBudget = (category: string, title: string, sequence: number) => {
  const normalizedTitle = title.toLowerCase()
  const titleRule = titleImageRules.find((rule) => rule.words.some((word) => normalizedTitle.includes(word)))
  const pool = titleRule?.images || budgetImagePools[category] || budgetImagePools.Birthday
  return pool[(sequence - 1) % pool.length]
}

const budgetProducts: Product[] = budgetThemes.flatMap((theme, themeIndex) => theme.names.map((name, index) => {
  const sequence = themeIndex * theme.names.length + index + 1
  const price = 8 + ((sequence * 3) % 19)
  const imageId = imageForBudget(theme.category, name, sequence)
  return {
    id: `budget-${theme.category.toLowerCase().replace(/[^a-z]+/g, '-')}-${index + 1}`,
    name,
    maker: theme.maker,
    location: theme.location,
    price,
    rating: Number((4.5 + ((sequence % 5) / 10)).toFixed(1)),
    reviewCount: 8 + (sequence * 7) % 44,
    category: theme.category,
    collection: theme.collection,
    description: `A small, thoughtful ${theme.category.toLowerCase()} gift made for lovely everyday moments.`,
    note: 'For someone who deserves a little more thought.',
    image: image(imageId),
    accent: theme.accent,
    tags: [theme.category.toLowerCase(), 'low price', 'independent maker', 'under ₹2,500'],
    story: `Made in small batches by ${theme.maker}, this little find is easy to give and even nicer to receive.`,
  }
}))

export const products: Product[] = [...coreProducts, ...budgetProducts]

export const collections: Collection[] = [
  { id: 'just-because', eyebrow: 'No occasion needed', title: 'Small reasons to smile', description: 'For the “saw this and thought of you” moments.', tone: 'peach', image: image('photo-1511988617509-a57c8a288659', 1200) },
  { id: 'slow-moments', eyebrow: 'For the softer days', title: 'Make a little room', description: 'Gifts that turn an ordinary evening into a ritual.', tone: 'lilac', image: image('photo-1494438639946-1ebd1d20bf85', 1200) },
  { id: 'quietly-iconic', eyebrow: 'Always a good idea', title: 'Quietly iconic', description: 'Beautiful things they will reach for again and again.', tone: 'sage', image: image('photo-1490481651871-ab68de25d43d', 1200) },
]

export const categories = ['All gifts', 'Home', 'Wellness', 'Jewellery', 'Stationery', 'Food & drink', 'Wearables', 'Curated sets', 'Birthday', 'Anniversary', 'Housewarming', 'Thank you', 'Personalized', 'Fashion', 'Gadgets', 'Flowers', 'Chocolates', 'Kids', 'Luxury']

export const findProduct = (id?: string) => products.find((product) => product.id === id)
