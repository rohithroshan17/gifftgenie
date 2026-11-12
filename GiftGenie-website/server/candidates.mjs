const coreGiftCandidates = [
  { id: 'wildflower-vase', name: 'Wildflower bud vase', category: 'Home', price: 38, tags: ['home', 'handmade', 'flowers', 'minimal', 'new home'], description: 'A tiny hand-thrown vase for noticing the little things.' },
  { id: 'candle-set', name: 'A little moment candle set', category: 'Wellness', price: 32, tags: ['self-care', 'relaxation', 'home', 'scent', 'cozy'], description: 'Three small scents for a softer evening.' },
  { id: 'pearl-pendant', name: 'Everyday pearl pendant', category: 'Jewellery', price: 64, tags: ['jewellery', 'classic', 'style', 'keepsake', 'minimal'], description: 'A luminous freshwater pearl made for every day.' },
  { id: 'linen-journal', name: 'The good ideas journal', category: 'Stationery', price: 24, tags: ['writing', 'creative', 'stationery', 'books', 'lists'], description: 'A linen-bound place for thoughts worth keeping.' },
  { id: 'wildflower-note-cards', name: 'Wildflower note cards', category: 'Stationery', price: 16, tags: ['birthday', 'writing', 'paper goods', 'messages'], description: 'A small set of illustrated cards for saying the thing in your own handwriting.' },
  { id: 'tea-trio', name: 'Three quiet teas', category: 'Food & drink', price: 29, tags: ['tea', 'food', 'hosting', 'slow mornings', 'ritual'], description: 'A considered trio for long conversations and slow mornings.' },
  { id: 'sun-catcher', name: 'Sun catcher, small', category: 'Home', price: 42, tags: ['home', 'light', 'joy', 'handmade', 'colour'], description: 'A little prism of light for a favourite corner.' },
  { id: 'silk-scarf', name: 'The easy silk scarf', category: 'Wearables', price: 58, tags: ['style', 'fashion', 'travel', 'textiles', 'classic'], description: 'A generous silk square in a colour that goes everywhere.' },
  { id: 'weekend-box', name: 'The just-because box', category: 'Curated sets', price: 76, tags: ['curated', 'surprise', 'self-care', 'home', 'celebration'], description: 'A little of everything lovely, wrapped up for no particular reason.' },
]
const budgetThemes = [
  ['Birthday', ['Mini birthday candle', 'Party-ready note set', 'Tiny celebration garland', 'Birthday wish keyring', 'Pocket confetti kit', 'Cake-day tea tin', 'Bright little gift box', 'Birthday flower wrap']],
  ['Anniversary', ['Two-cup chai set', 'Love note stationery', 'Pocket photo frame', 'Pair of lucky charms', 'Date-night question cards', 'Soft evening incense', 'Tiny keepsake dish', 'Together tea blend']],
  ['Housewarming', ['Mini plant pot', 'Kitchen herb markers', 'Handmade coaster pair', 'Doorway welcome bell', 'Little room spray', 'Sunlit matchbox', 'Tea towel set', 'New-home candle']],
  ['Thank you', ['Thank-you card bundle', 'Gratitude tea sachets', 'Little chocolate wrap', 'Kindness bookmark', 'Pocket flower press', 'Warm wishes tag set', 'Small-batch jam jar', 'Golden thank-you pin']],
  ['Personalized', ['Initials key tag', 'Nameplate bookmark', 'Custom mini print', 'Monogram gift tag', 'Initial charm', 'Personal note book', 'Little name stamp', 'Custom colour card']],
  ['Fashion', ['Cotton scrunchie set', 'Colour-pop socks', 'Tiny fabric pouch', 'Everyday hair clip', 'Printed pocket scarf', 'Canvas card holder', 'Soft travel eye mask', 'Braided friendship band']],
  ['Gadgets', ['Cable organiser', 'Pocket phone stand', 'Mini desk light', 'Travel tech pouch', 'Screen-cleaning kit', 'Tiny USB reading light', 'Wireless tracker tag', 'Desk timer cube']],
  ['Flowers', ['Dried flower posy', 'Pressed flower card', 'Mini marigold bunch', 'Wild bloom bookmark', 'Lavender sachet', 'Flower seed envelope', 'Petal gift wrap', 'Little garden note']],
  ['Chocolates', ['Sea-salt chocolate bar', 'Mini truffle trio', 'Cocoa nib sachet', 'Chai chocolate bites', 'Dark chocolate bark', 'Coffee bonbon box', 'Orange peel chocolate', 'Little fudge parcel']],
  ['Wellness', ['Pocket bath soak', 'Calm roll-on oil', 'Herbal eye pillow', 'Soft hands balm', 'Sleepy tea sachets', 'Tiny incense bundle', 'Mindful prompt cards', 'Mini body scrub']],
  ['Kids', ['Colouring postcard set', 'Pocket puzzle cards', 'Tiny animal stamp set', 'Make-your-own bookmark', 'Doodle pencil pack', 'Mini story zine', 'Friendship bead kit', 'Little explorer badge']],
  ['Luxury', ['Silk sleep sachet', 'Mini brass tray', 'Scented drawer card', 'Gold-edge note set', 'Velvet jewellery pouch', 'Small-batch olive soap', 'Pearl hair pin', 'Luxe tea envelope']],
]
const budgetCandidates = budgetThemes.flatMap(([category, names], themeIndex) => names.map((name, index) => ({
  id: `budget-${String(category).toLowerCase().replace(/[^a-z]+/g, '-')}-${index + 1}`,
  name,
  category,
  price: 8 + (((themeIndex * 8 + index + 1) * 3) % 19),
  tags: [String(category).toLowerCase(), 'low price', 'independent maker', 'under ₹2,500'],
  description: `A small, thoughtful ${String(category).toLowerCase()} gift made for lovely everyday moments.`,
})))
export const giftCandidates = [...coreGiftCandidates, ...budgetCandidates]

export function fallbackRecommendations(answers, excluded = [], usdToInr = 83.5) {
  const budget = Number(String(answers.budget || '').match(/\d[\d,]*/)?.[0]?.replace(/,/g, '') || 0)
  const query = [answers.recipient, answers.relationship, answers.occasion, answers.interests, answers.personality, answers.preferences].filter(Boolean).join(' ').toLowerCase()
  return giftCandidates
    .filter((candidate) => !excluded.includes(candidate.id))
    .map((candidate) => {
      const matches = candidate.tags.filter((tag) => query.includes(tag)).length
      const budgetMatch = budget > 0 && candidate.price * usdToInr <= budget ? 2 : budget > 0 ? -2 : 0
      return { candidate, score: matches + budgetMatch }
    })
    .sort((a, b) => b.score - a.score || a.candidate.price - b.candidate.price)
    .slice(0, 4)
    .map(({ candidate, score }) => ({
      productId: candidate.id,
      whyItFits: score > 1 ? `A strong match for their ${answers.interests || 'personal style'} and the feeling you want to create.` : 'A versatile, maker-made find with an easy-to-love point of view.',
      personalNote: answers.occasion ? `A thoughtful pick for ${answers.occasion.toLowerCase()}.` : 'A lovely just-because surprise.',
      matchScore: Math.max(72, Math.min(94, 76 + score * 5)),
    }))
}
