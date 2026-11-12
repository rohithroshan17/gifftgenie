import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, Bookmark, BookmarkCheck, Check, ChevronDown, CircleHelp, Compass, Gift, Heart, Leaf, LogOut, Menu, MessageCircle, Minus, Plus, RefreshCw, Search, Send, ShoppingBag, SlidersHorizontal, Sparkles, Star, Trash2, UserRound, Volume2, VolumeX, X } from 'lucide-react'
import { categories, collections, findProduct, products, type Product } from './data/catalog'
import { getCurrentUser, getSavedGifts, isSupabaseConfigured, signIn, signOut, signUp, supabase, toggleSavedGift } from './lib/supabase'
import { DEFAULT_USD_TO_INR, formatInrFromUsd } from './lib/currency'
import type { User } from '@supabase/supabase-js'

type Route = { page: 'home' | 'finder' | 'assistant' | 'discover' | 'product' | 'saved' | 'signin' | 'cart' | 'orders' | 'not-found'; id?: string }
type Toast = { message: string; tone?: 'default' | 'success' }
type CartItem = { productId: string; quantity: number }
type FinderAnswers = { recipient: string; relationship: string; occasion: string; budget: string; interests: string; personality: string; preferences: string }
type FinderRecommendation = { productId: string; whyItFits: string; personalNote: string; matchScore: number }
type FinderResponse = { source: 'ai' | 'fallback'; message: string; recommendations: FinderRecommendation[] }
type ChatMessage = { role: 'user' | 'assistant'; content: string }
type CurrencyContextValue = { usdToInr: number; source: string; formatInr: (usd: number) => string }
const CurrencyContext = createContext<CurrencyContextValue>({ usdToInr: DEFAULT_USD_TO_INR, source: 'fallback', formatInr: (usd) => formatInrFromUsd(usd) })
const useCurrency = () => useContext(CurrencyContext)

const parseRoute = (): Route => {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  if (path === '/') return { page: 'home' }
  if (path === '/gift-finder') return { page: 'finder' }
  if (path === '/gift-assistant') return { page: 'assistant' }
  if (path === '/discover') return { page: 'discover' }
  if (path === '/saved') return { page: 'saved' }
  if (path === '/sign-in') return { page: 'signin' }
  if (path === '/cart') return { page: 'cart' }
  if (path === '/orders') return { page: 'orders' }
  if (path.startsWith('/product/')) return { page: 'product', id: path.split('/')[2] }
  return { page: 'not-found' }
}

function App() {
  const [route, setRoute] = useState<Route>(parseRoute)
  const [user, setUser] = useState<User | null>(null)
  const [usdToInr, setUsdToInr] = useState(DEFAULT_USD_TO_INR)
  const [rateSource, setRateSource] = useState('fallback')
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('kindred-saved') || '[]') } catch { return [] }
  })
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('kindred-cart') || '[]') } catch { return [] }
  })
  const [toast, setToast] = useState<Toast | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [showWelcome, setShowWelcome] = useState(() => {
    try { return sessionStorage.getItem('giftgenie-welcome-seen') !== '1' } catch { return true }
  })
  const [welcomeLeaving, setWelcomeLeaving] = useState(false)

  useEffect(() => {
    const onPopState = () => setRoute(parseRoute())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    let mounted = true
    getCurrentUser().then((nextUser) => { if (mounted) setUser(nextUser) })
    const listener = supabase?.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return
      setUser(nextSession?.user ?? null)
      if (nextSession?.user) {
        const remote = await getSavedGifts(nextSession.user.id)
        if (remote.length) setSaved((current) => Array.from(new Set([...current, ...remote])))
      }
    })
    return () => { mounted = false; listener?.data.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    localStorage.setItem('kindred-saved', JSON.stringify(saved))
  }, [saved])

  useEffect(() => {
    fetch('/api/exchange-rate').then((response) => response.ok ? response.json() : Promise.reject(new Error('rate unavailable'))).then((payload) => {
      if (Number.isFinite(payload.rate) && payload.rate > 0) { setUsdToInr(payload.rate); setRateSource(payload.source || 'live') }
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    localStorage.setItem('kindred-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setRoute(parseRoute())
    setMobileMenu(false)
    const hash = path.includes('#') ? path.split('#')[1] : ''
    window.requestAnimationFrame(() => {
      if (hash) document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const handleSave = async (product: Product) => {
    const isSaved = saved.includes(product.id)
    setSaved((current) => isSaved ? current.filter((id) => id !== product.id) : [...current, product.id])
    if (user) await toggleSavedGift(user.id, product.id, isSaved)
    setToast({ message: isSaved ? 'Removed from your saved gifts.' : user ? 'Saved to your Kindred shelf.' : 'Saved on this device — sign in to keep it across devices.', tone: isSaved ? 'default' : 'success' })
  }

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id)
      return existing ? current.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { productId: product.id, quantity: 1 }]
    })
    setToast({ message: `${product.name} is in your gift bag.`, tone: 'success' })
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart((current) => quantity <= 0 ? current.filter((item) => item.productId !== productId) : current.map((item) => item.productId === productId ? { ...item, quantity } : item))
  }

  const handleSignedOut = async () => {
    await signOut()
    setUser(null)
    setToast({ message: 'You’re signed out. Your local shelf is still here.' })
  }

  const playWelcomeSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      const audioContext = new AudioContextClass()
      const now = audioContext.currentTime
      const notes = [
        { frequency: 392, start: 0, duration: .24 },
        { frequency: 523.25, start: .13, duration: .3 },
        { frequency: 659.25, start: .28, duration: .46 },
      ]
      notes.forEach(({ frequency, start, duration }) => {
        const oscillator = audioContext.createOscillator()
        const gain = audioContext.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(frequency, now + start)
        gain.gain.setValueAtTime(.0001, now + start)
        gain.gain.exponentialRampToValueAtTime(.08, now + start + .035)
        gain.gain.exponentialRampToValueAtTime(.0001, now + start + duration)
        oscillator.connect(gain).connect(audioContext.destination)
        oscillator.start(now + start)
        oscillator.stop(now + start + duration + .02)
      })
      window.setTimeout(() => audioContext.close().catch(() => undefined), 1000)
    } catch { /* audio is an enhancement; the welcome flow must always continue */ }
  }

  const enterWelcome = (soundEnabled = true) => {
    if (soundEnabled) playWelcomeSound()
    setWelcomeLeaving(true)
    window.setTimeout(() => {
      try { sessionStorage.setItem('giftgenie-welcome-seen', '1') } catch { /* session storage can be unavailable in privacy mode */ }
      setShowWelcome(false)
      setWelcomeLeaving(false)
    }, 720)
  }

  const replayWelcome = () => {
    try { sessionStorage.removeItem('giftgenie-welcome-seen') } catch { /* no-op */ }
    setWelcomeLeaving(false)
    setShowWelcome(true)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <CurrencyContext.Provider value={{ usdToInr, source: rateSource, formatInr: (usd) => formatInrFromUsd(usd, usdToInr) }}>
    <div className="app-shell">
      <Header route={route} user={user} savedCount={saved.length} cartCount={cart.reduce((total, item) => total + item.quantity, 0)} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu} navigate={navigate} onSignOut={handleSignedOut} />
      <main>
        {route.page === 'home' && <Home navigate={navigate} saved={saved} onSave={handleSave} />}
        {route.page === 'finder' && <GiftFinder navigate={navigate} saved={saved} onSave={handleSave} />}
        {route.page === 'assistant' && <GiftChatPage navigate={navigate} saved={saved} onSave={handleSave} />}
        {route.page === 'discover' && <Discover navigate={navigate} saved={saved} onSave={handleSave} />}
        {route.page === 'product' && <ProductDetail id={route.id} navigate={navigate} saved={saved} onSave={handleSave} onAddToCart={addToCart} />}
        {route.page === 'saved' && <Saved navigate={navigate} saved={saved} onSave={handleSave} user={user} />}
        {route.page === 'cart' && <CartPage navigate={navigate} cart={cart} updateQuantity={updateCartQuantity} />}
        {route.page === 'orders' && <Orders navigate={navigate} />}
        {route.page === 'signin' && <SignIn navigate={navigate} onToast={setToast} />}
        {route.page === 'not-found' && <NotFound navigate={navigate} />}
      </main>
      <Footer navigate={navigate} onReplayWelcome={replayWelcome} />
      <MobileNav route={route} savedCount={saved.length} navigate={navigate} />
      {toast && <div className={`toast ${toast.tone === 'success' ? 'toast-success' : ''}`} role="status"><span className="toast-mark"><Check size={15} /></span>{toast.message}<button onClick={() => setToast(null)} aria-label="Dismiss"><X size={15} /></button></div>}
      <SupportWidget user={user} />
    </div>
    {showWelcome && <IntroWelcome leaving={welcomeLeaving} onEnter={enterWelcome} />}
    </CurrencyContext.Provider>
  )
}

function Header({ route, user, savedCount, cartCount, mobileMenu, setMobileMenu, navigate, onSignOut }: { route: Route; user: User | null; savedCount: number; cartCount: number; mobileMenu: boolean; setMobileMenu: (value: boolean) => void; navigate: (path: string) => void; onSignOut: () => void }) {
  return <>
    <header className="site-header">
      <button className="wordmark" onClick={() => navigate('/')} aria-label="Kindred home"><span className="wordmark-mark"><Leaf size={18} strokeWidth={1.8} /></span><span>kindred</span></button>
      <nav className="desktop-nav" aria-label="Main navigation">
        <button className={route.page === 'finder' ? 'nav-active' : ''} onClick={() => navigate('/gift-finder')}>Gift Finder</button>
        <button className={route.page === 'assistant' ? 'nav-active' : ''} onClick={() => navigate('/gift-assistant')}>Chat with Kindred</button>
        <button className={route.page === 'discover' ? 'nav-active' : ''} onClick={() => navigate('/discover')}>Find a gift</button>
        <button className={route.page === 'home' ? 'nav-active' : ''} onClick={() => navigate('/#collections')}>Collections</button>
        <button onClick={() => navigate('/#makers')}>Meet the makers</button>
      </nav>
      <div className="header-actions">
        <button className="icon-button search-trigger" onClick={() => navigate('/discover')} aria-label="Search gifts"><Search size={19} /></button>
        <button className="saved-link" onClick={() => navigate('/saved')}><Bookmark size={17} /> <span className="saved-link-label">Saved</span>{savedCount > 0 && <span className="count-pill">{savedCount}</span>}</button>
        <button className="saved-link" onClick={() => navigate('/cart')}><ShoppingBag size={17} /> <span className="saved-link-label">Bag</span>{cartCount > 0 && <span className="count-pill">{cartCount}</span>}</button>
        {user ? <button className="account-chip" onClick={onSignOut} title="Sign out"><span className="avatar-dot">{(user.email?.[0] || 'K').toUpperCase()}</span><span className="account-name">{user.email?.split('@')[0]}</span><LogOut size={14} /></button> : <button className="sign-in-link" onClick={() => navigate('/sign-in')}>Sign in <ArrowUpRight size={15} /></button>}
        <button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Open menu">{mobileMenu ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
    </header>
    {mobileMenu && <div className="mobile-menu"><button onClick={() => navigate('/gift-finder')}>Gift Finder <Sparkles size={16} /></button><button onClick={() => navigate('/gift-assistant')}>Chat with Kindred <MessageCircle size={16} /></button><button onClick={() => navigate('/discover')}>Find a gift <ArrowUpRight size={16} /></button><button onClick={() => navigate('/#collections')}>Collections <ArrowUpRight size={16} /></button><button onClick={() => navigate('/#makers')}>Meet the makers <ArrowUpRight size={16} /></button><button onClick={() => navigate('/saved')}>Saved gifts <span>{savedCount}</span></button><button onClick={() => navigate('/cart')}>Gift bag <span>{cartCount}</span></button></div>}
  </>
}

function Home({ navigate, saved, onSave }: { navigate: (path: string) => void; saved: string[]; onSave: (product: Product) => void }) {
  return <>
    <section className="hero section-pad">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> Thoughtful finds, made personal</div>
        <h1>Find the one<br /><em>that feels like them.</em></h1>
        <p className="hero-intro">Gifts with a little more feeling, from independent makers with a story worth sharing.</p>
        <div className="hero-actions"><button className="button button-dark" onClick={() => navigate('/discover')}>Start exploring <ArrowUpRight size={17} /></button><button className="button button-soft" onClick={() => navigate('/gift-finder')}><Sparkles size={16} /> Let Kindred choose</button><button className="text-link" onClick={() => navigate('/#collections')}>Browse by feeling <ArrowUpRight size={15} /></button></div>
        <div className="hero-proof"><div className="mini-avatars"><span>AK</span><span>RV</span><span>MJ</span></div><span><strong>Loved by thoughtful gifters</strong><br />A little inspiration, whenever you need it.</span></div>
      </div>
      <div className="hero-visual">
        <div className="hero-photo"><img src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=1200&q=88" alt="A thoughtful gift wrapped with a botanical card" /><div className="photo-wash" /></div>
        <div className="hero-note"><span className="note-spark">✦</span><div><strong>A little more thoughtful</strong><br /><span>a little less ordinary.</span></div></div>
        <div className="hero-stamp">Good<br />things<br /><span>inside</span></div>
      </div>
    </section>
    <section className="manifesto section-pad"><div className="manifesto-lead"><span className="eyebrow">The Kindred edit</span><h2>Not just another thing.<br /><em>A good feeling, wrapped up.</em></h2></div><div className="manifesto-copy"><p>We look for pieces that make people pause, smile, and think, “This is so me.” Every find comes from an independent maker, so your gift does a little good, too.</p><button className="text-link" onClick={() => navigate('/#makers')}>Why Kindred <ArrowUpRight size={15} /></button></div></section>
    <section className="section-pad collection-section" id="collections"><SectionHeading eyebrow="Start with the feeling" title="Gifts for the moment" action="See all collections" onAction={() => navigate('/discover')} /><div className="collection-grid">{collections.map((collection) => <button key={collection.id} className={`collection-card tone-${collection.tone}`} onClick={() => navigate(`/discover?collection=${collection.id}`)}><img src={collection.image} alt="" /><div className="collection-overlay" /><div className="collection-copy"><span>{collection.eyebrow}</span><h3>{collection.title}</h3><p>{collection.description}</p><span className="round-arrow"><ArrowUpRight size={17} /></span></div></button>)}</div></section>
    <OccasionBand navigate={navigate} />
    <section className="section-pad feature-section"><SectionHeading eyebrow="The little favorites" title="Lovely things, thoughtfully found." action="Explore all gifts" onAction={() => navigate('/discover')} /><div className="product-grid product-grid-featured">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} saved={saved.includes(product.id)} onSave={onSave} onOpen={() => navigate(`/product/${product.id}`)} />)}</div></section>
    <MakerBand navigate={navigate} />
    <section className="section-pad steps-section"><div className="steps-header"><span className="eyebrow">Thoughtful, not complicated</span><h2>A better way to <em>give well.</em></h2></div><div className="steps-grid"><div className="step"><span>01</span><h3>Tell us about them</h3><p>A few details about who they are and what they love.</p></div><div className="step"><span>02</span><h3>Explore thoughtful finds</h3><p>Discover little treasures from independent makers.</p></div><div className="step"><span>03</span><h3>Make it feel personal</h3><p>Choose a keepsake that says what you mean.</p></div></div></section>
    <section className="quote-section section-pad"><div className="quote-mark">“</div><blockquote>It felt like I’d picked it just for her — because I did.</blockquote><div className="quote-caption"><span className="quote-rule" /> A note from Anika, a happy giver</div></section>
  </>
}

function OccasionBand({ navigate }: { navigate: (path: string) => void }) {
  const occasions = [
    { id: 'birthday', title: 'Birthdays', description: 'A little more cake-day magic.', image: 'https://images.unsplash.com/photo-1513159446162-54eb8bdaa79b?auto=format&fit=crop&w=800&q=85' },
    { id: 'anniversary', title: 'Anniversaries', description: 'For the ones worth choosing again.', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=85' },
    { id: 'housewarming', title: 'Housewarming', description: 'Make their new corner feel like home.', image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=85' },
    { id: 'thank-you', title: 'Thank you', description: 'Small gestures, beautifully remembered.', image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=800&q=85' },
  ]
  return <section className="section-pad occasion-band" id="occasions"><div className="occasion-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> Choose by occasion</span><h2>Give the moment<br /><em>its own little feeling.</em></h2></div><button className="text-link" onClick={() => navigate('/discover')}>All thoughtful finds <ArrowUpRight size={15} /></button></div><div className="occasion-grid">{occasions.map((occasion) => <button key={occasion.id} className="occasion-card" onClick={() => navigate(`/gift-assistant?occasion=${occasion.id}`)}><img src={occasion.image} alt="" /><span className="occasion-card-wash" /><span className="occasion-card-copy"><strong>{occasion.title}</strong><small>{occasion.description}</small><span className="round-arrow"><ArrowUpRight size={16} /></span></span></button>)}</div></section>
}

function Discover({ navigate, saved, onSave }: { navigate: (path: string) => void; saved: string[]; onSave: (product: Product) => void }) {
  const searchParams = new URLSearchParams(window.location.search)
  const initialCollection = searchParams.get('collection') || 'all'
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All gifts')
  const [collection, setCollection] = useState(initialCollection === 'all' ? 'All collections' : collections.find((item) => item.id === initialCollection)?.title || 'All collections')
  const [sort, setSort] = useState('Curated for you')
  const [showFilters, setShowFilters] = useState(false)
  const filtered = useMemo(() => products.filter((product) => {
    const text = `${product.name} ${product.maker} ${product.category} ${product.tags.join(' ')}`.toLowerCase()
    const queryMatches = text.includes(query.toLowerCase())
    const categoryMatches = category === 'All gifts' || product.category === category
    const collectionTitle = collections.find((item) => item.title === collection)?.id
    const collectionMatches = collection === 'All collections' || product.collection === collectionTitle
    return queryMatches && categoryMatches && collectionMatches
  }).sort((a, b) => sort === 'Price: low to high' ? a.price - b.price : sort === 'Top rated' ? b.rating - a.rating : 0), [query, category, collection, sort])

  return <section className="discover-page section-pad"><div className="discover-top"><div><div className="eyebrow"><span className="eyebrow-line" /> The whole thoughtful edit</div><h1>Find something<br /><em>they’ll keep.</em></h1></div><p className="discover-blurb">A growing collection of beautiful, useful, and just-because gifts from makers we admire.</p></div><div className="search-bar-wrap"><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by person, feeling, or gift..." aria-label="Search gifts" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={17} /></button>}<button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={17} /> Filters</button></div><div className={`filter-panel ${showFilters ? 'filter-panel-open' : ''}`}><div className="filter-row"><div><span className="filter-label">Category</span><div className="chip-row">{categories.map((item) => <button key={item} className={`filter-chip ${category === item ? 'filter-chip-active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div></div><label className="select-wrap"><span className="filter-label">Collection</span><select value={collection} onChange={(event) => setCollection(event.target.value)}><option>All collections</option>{collections.map((item) => <option key={item.id}>{item.title}</option>)}</select><ChevronDown size={15} /></label><label className="select-wrap"><span className="filter-label">Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Curated for you</option><option>Top rated</option><option>Price: low to high</option></select><ChevronDown size={15} /></label></div></div><div className="results-meta"><span><strong>{filtered.length}</strong> thoughtful {filtered.length === 1 ? 'find' : 'finds'}</span><span className="results-note">Independent makers · Ships with care</span></div>{filtered.length ? <div className="product-grid discover-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} saved={saved.includes(product.id)} onSave={onSave} onOpen={() => navigate(`/product/${product.id}`)} />)}</div> : <div className="empty-state"><div className="empty-icon"><Search size={25} /></div><h2>No exact match yet.</h2><p>Try a broader feeling, or clear the filters to see the full edit.</p><button className="button button-dark" onClick={() => { setQuery(''); setCategory('All gifts'); setCollection('All collections') }}>Show everything</button></div>}</section>
}

const finderSteps: Array<{ key: keyof FinderAnswers; eyebrow: string; question: string; hint: string; options?: string[]; type: 'chips' | 'text' | 'textarea' }> = [
  { key: 'recipient', eyebrow: 'Start with the person', question: 'Who are you shopping for?', hint: 'The more we know about them, the more personal the edit.', options: ['Partner', 'Friend', 'Parent', 'Sibling', 'Colleague', 'Myself'], type: 'chips' },
  { key: 'relationship', eyebrow: 'A little context', question: 'What is your relationship?', hint: 'This helps us find the right kind of thoughtful.', options: ['They are my favourite person', 'A close friend', 'Family, always', 'A new connection', 'A brilliant colleague'], type: 'chips' },
  { key: 'occasion', eyebrow: 'The moment', question: 'What are you celebrating?', hint: 'Big occasion, small occasion, or no occasion at all.', options: ['Birthday', 'Just because', 'Housewarming', 'Thank you', 'A little celebration', 'No occasion'], type: 'chips' },
  { key: 'budget', eyebrow: 'Keep it comfortable', question: 'What feels right to spend?', hint: 'We will keep the recommendations within your range.', options: ['Under ₹2,000', '₹2,000–₹5,000', '₹5,000–₹8,500', 'Open to a little more'], type: 'chips' },
  { key: 'interests', eyebrow: 'Their world', question: 'What are they into?', hint: 'A few words is perfect — ceramics, books, long walks, good coffee...', type: 'text' },
  { key: 'personality', eyebrow: 'The little details', question: 'How would you describe them?', hint: 'Quietly stylish, always hosting, curious about everything…', type: 'text' },
  { key: 'preferences', eyebrow: 'One last thought', question: 'Any special preferences?', hint: 'Sustainability, handmade, a certain colour, something to avoid — tell us what matters.', type: 'textarea' },
]

const emptyFinderAnswers = (): FinderAnswers => ({ recipient: '', relationship: '', occasion: '', budget: '', interests: '', personality: '', preferences: '' })

function GiftFinder({ navigate, saved, onSave }: { navigate: (path: string) => void; saved: string[]; onSave: (product: Product) => void }) {
  const [answers, setAnswers] = useState<FinderAnswers>(emptyFinderAnswers)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FinderResponse | null>(null)
  const [error, setError] = useState('')
  const current = finderSteps[step]
  const currentValue = answers[current.key]
  const canContinue = current.key === 'preferences' || Boolean(currentValue.trim())

  const setAnswer = (value: string) => setAnswers((currentAnswers) => ({ ...currentAnswers, [current.key]: value }))

  const generate = async (excludedProductIds: string[] = []) => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/gift-finder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers, excludedProductIds: excludedProductIds.length >= 4 ? [] : excludedProductIds }) })
      if (!response.ok) throw new Error('The gift concierge is unavailable right now.')
      const payload = await response.json() as FinderResponse
      if (!payload.recommendations?.length) throw new Error('We could not find a thoughtful match yet.')
      setResult(payload)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went quiet. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    const resultItems = result.recommendations.map((recommendation) => ({ recommendation, product: findProduct(recommendation.productId) })).filter((item): item is { recommendation: FinderRecommendation; product: Product } => Boolean(item.product))
    return <section className="finder-results-page section-pad"><div className="finder-results-top"><div><div className="eyebrow"><span className="eyebrow-line" /> Your Kindred edit</div><h1>Made for <em>{answers.recipient || 'them'}.</em></h1><p>We found a few gifts that feel like a good beginning.</p></div><div className={`finder-source finder-source-${result.source}`}><span>{result.source === 'ai' ? <Sparkles size={16} /> : <Leaf size={16} />}</span><div><strong>{result.source === 'ai' ? 'Kindred AI concierge' : 'Kindred curated fallback'}</strong><small>{result.message}</small></div></div></div><div className="finder-answer-strip"><span>{answers.occasion || 'Just because'}</span><span>{answers.budget || 'Your budget'}</span><span>{answers.interests || 'Their interests'}</span><button onClick={() => { setResult(null); setStep(0) }}>Refine answers <ArrowUpRight size={14} /></button></div><div className="finder-result-grid">{resultItems.map(({ recommendation, product }) => <FinderResultCard key={product.id} product={product} recommendation={recommendation} saved={saved.includes(product.id)} onSave={onSave} onOpen={() => navigate(`/product/${product.id}`)} />)}</div><div className="finder-reroll"><div><span className="eyebrow">Not quite there?</span><h2>Let’s try a different <em>feeling.</em></h2></div><button className="button button-dark" onClick={() => generate(result.recommendations.map((item) => item.productId))} disabled={loading}>{loading ? 'Finding another edit…' : <><RefreshCw size={16} /> Generate new suggestions</>}</button></div></section>
  }

  return <section className="finder-page section-pad"><div className="finder-intro"><div className="finder-kicker"><span className="finder-kicker-mark"><Sparkles size={17} /></span><span>Kindred AI Gift Finder</span></div><h1>A little help finding<br /><em>the perfect feeling.</em></h1><p>Tell us a few things about them. We’ll look for a gift that feels considered, personal, and very much like you know them.</p><div className="finder-trust"><span><Leaf size={15} /> Maker-made finds</span><span><Heart size={15} /> Personal, not generic</span></div></div><div className="finder-form-shell"><div className="finder-progress"><span>Question {step + 1} of {finderSteps.length}</span><div><i style={{ width: `${((step + 1) / finderSteps.length) * 100}%` }} /></div></div><div className="finder-question"><span className="eyebrow"><span className="eyebrow-line" /> {current.eyebrow}</span><h2>{current.question}</h2><p>{current.hint}</p>{current.type === 'chips' && <div className="finder-options">{current.options?.map((option) => <button key={option} className={currentValue === option ? 'finder-option finder-option-active' : 'finder-option'} onClick={() => setAnswer(option)}>{option}{currentValue === option && <Check size={15} />}</button>)}</div>}{current.type === 'text' && <input className="finder-input" value={currentValue} onChange={(event) => setAnswer(event.target.value)} placeholder={current.key === 'interests' ? 'e.g. ceramics, weekend cooking, and old bookstores' : 'e.g. quietly stylish, curious, and always hosting'} autoFocus />}{current.type === 'textarea' && <textarea className="finder-input finder-textarea" value={currentValue} onChange={(event) => setAnswer(event.target.value)} placeholder="Anything that would make this feel especially personal?" autoFocus />}</div>{error && <div className="finder-error">{error}</div>}<div className="finder-actions">{step > 0 ? <button className="back-link" onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Back</button> : <span />}{step === finderSteps.length - 1 ? <button className="button button-dark" disabled={!canContinue || loading} onClick={() => generate()}>{loading ? 'Finding their gift…' : <>Find their gift <Sparkles size={16} /></>}</button> : <button className="button button-dark" disabled={!canContinue} onClick={() => setStep(step + 1)}>Next <ArrowUpRight size={16} /></button>}</div></div></section>
}

function GiftChatPage({ navigate, saved, onSave }: { navigate: (path: string) => void; saved: string[]; onSave: (product: Product) => void }) {
  return <section className="chat-page section-pad"><div className="chat-page-intro"><div className="finder-kicker"><span className="finder-kicker-mark"><MessageCircle size={17} /></span><span>Kindred Gift Assistant</span></div><h1>Tell me the <em>feeling.</em></h1><p>Describe what you need in your own words. I can understand Indian occasions, INR budgets, relationships, hobbies, and the little details that make a gift personal.</p><div className="chat-example"><span>Try saying</span> “I need a birthday gift for my best friend under ₹2,000.”</div></div><GiftChat navigate={navigate} saved={saved} onSave={onSave} /></section>
}

function GiftChat({ navigate, saved, onSave }: { navigate: (path: string) => void; saved: string[]; onSave: (product: Product) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: 'Tell me who you are shopping for, the occasion, and what feels comfortable to spend. I’ll start with a thoughtful edit and we can refine it together.' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<FinderResponse | null>(null)

  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    const content = input.trim()
    if (!content || loading) return
    const nextMessages = [...messages, { role: 'user' as const, content }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    try {
      const response = await fetch('/api/gift-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: nextMessages }) })
      const payload = await response.json()
      const reply = payload.reply || 'Tell me a little more about them and I’ll keep looking.'
      setMessages((current) => [...current, { role: 'assistant', content: reply }])
      setRecommendations({ source: payload.source === 'ai' ? 'ai' : 'fallback', message: reply, recommendations: payload.recommendations || [] })
    } catch {
      setMessages((current) => [...current, { role: 'assistant', content: 'The assistant is taking a quiet moment. You can use the guided finder, or try your message again.' }])
    } finally {
      setLoading(false)
    }
  }

  const resultItems = recommendations?.recommendations.map((recommendation) => ({ recommendation, product: findProduct(recommendation.productId) })).filter((item): item is { recommendation: FinderRecommendation; product: Product } => Boolean(item.product)) || []
  return <div className="gift-chat-shell"><div className="gift-chat-header"><div><span className="eyebrow"><span className="eyebrow-line" /> Conversation</span><h2>A thoughtful place to start.</h2></div><span className="chat-status"><span /> Online</span></div><div className="gift-chat-messages">{messages.map((message, index) => <div className={`chat-bubble chat-bubble-${message.role}`} key={`${message.role}-${index}`}><span>{message.role === 'assistant' ? <Sparkles size={13} /> : 'You'}</span><p>{message.content}</p></div>)}{loading && <div className="chat-bubble chat-bubble-assistant"><span><Sparkles size={13} /></span><p>Thinking about the right little thing…</p></div>}</div><form className="gift-chat-form" onSubmit={send}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="e.g. anniversary gift for my sister under ₹5,000" aria-label="Message Kindred Gift Assistant" /><button className="button button-dark" disabled={!input.trim() || loading}><Send size={16} /><span>Send</span></button></form>{recommendations && resultItems.length > 0 && <div className="chat-recommendations"><div className={`finder-source finder-source-${recommendations.source}`}><span>{recommendations.source === 'ai' ? <Sparkles size={16} /> : <Leaf size={16} />}</span><div><strong>{recommendations.source === 'ai' ? 'Kindred AI edit' : 'Curated fallback'}</strong><small>{recommendations.source === 'ai' ? 'Refine the conversation to change the edit.' : 'AI setup is required for conversational recommendations.'}</small></div></div><div className="finder-result-grid">{resultItems.map(({ recommendation, product }) => <FinderResultCard key={product.id} product={product} recommendation={recommendation} saved={saved.includes(product.id)} onSave={onSave} onOpen={() => navigate(`/product/${product.id}`)} />)}</div></div>}</div>
}

function FinderResultCard({ product, recommendation, saved, onSave, onOpen }: { product: Product; recommendation: FinderRecommendation; saved: boolean; onSave: (product: Product) => void; onOpen: () => void }) {
  const { formatInr } = useCurrency()
  return <article className="finder-result-card"><div className="finder-result-image"><img src={product.image} alt={product.name} /><span className="finder-match"><Sparkles size={12} /> {recommendation.matchScore}% match</span></div><div className="finder-result-copy"><span className="product-maker">{product.maker} <span>·</span> {product.location}</span><button className="finder-result-name" onClick={onOpen}>{product.name}</button><div className="finder-result-price">{formatInr(product.price)} <span><Star size={12} fill="currentColor" /> {product.rating}</span></div><p className="finder-why"><Sparkles size={14} /> {recommendation.whyItFits}</p><p className="finder-personal-note">“{recommendation.personalNote}”</p><div className="finder-card-actions"><button className={`save-button-inline ${saved ? 'save-button-inline-active' : ''}`} onClick={() => onSave(product)}>{saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}{saved ? 'Saved' : 'Wishlist'}</button><button className="text-link" onClick={onOpen}>View product <ArrowUpRight size={14} /></button></div></div></article>
}

function CartPage({ navigate, cart, updateQuantity }: { navigate: (path: string) => void; cart: CartItem[]; updateQuantity: (productId: string, quantity: number) => void }) {
  const { formatInr } = useCurrency()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lines = cart.map((item) => ({ item, product: findProduct(item.productId) })).filter((line): line is { item: CartItem; product: Product } => Boolean(line.product))
  const total = lines.reduce((sum, line) => sum + line.product.price * line.item.quantity, 0)

  const checkout = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim()) { setError('Add an email so Stripe can send your receipt.'); return }
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, origin: window.location.origin, items: cart }) })
      const payload = await response.json()
      if (!response.ok || !payload.url) throw new Error(payload.error || 'Checkout is not configured yet.')
      window.location.assign(payload.url)
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout is unavailable right now.')
    } finally {
      setBusy(false)
    }
  }

  if (!lines.length) return <section className="cart-page section-pad"><div className="empty-state cart-empty"><div className="empty-icon"><ShoppingBag size={25} /></div><h1>Your gift bag is waiting.</h1><p>Find something thoughtful, then come back here when you are ready to make it yours.</p><button className="button button-dark" onClick={() => navigate('/discover')}>Find a gift <ArrowUpRight size={16} /></button></div></section>
  return <section className="cart-page section-pad"><div className="eyebrow"><span className="eyebrow-line" /> Your gift bag</div><h1>Ready to make it <em>personal?</em></h1><div className="cart-layout"><div className="cart-lines">{lines.map(({ item, product }) => <article className="cart-line" key={product.id}><img src={product.image} alt={product.name} /><div className="cart-line-copy"><span className="product-maker">{product.maker} · {product.location}</span><h2>{product.name}</h2><p>{formatInr(product.price)}</p><div className="cart-line-controls"><div className="quantity-control"><button onClick={() => updateQuantity(product.id, item.quantity - 1)} aria-label={`Decrease ${product.name}`}><Minus size={14} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(product.id, item.quantity + 1)} aria-label={`Increase ${product.name}`}><Plus size={14} /></button></div><button className="remove-line" onClick={() => updateQuantity(product.id, 0)}><Trash2 size={14} /> Remove</button></div></div><strong className="cart-line-total">{formatInr(product.price * item.quantity)}</strong></article>)}</div><form className="checkout-card" onSubmit={checkout}><span className="eyebrow">Secure test checkout</span><h2>A considered choice.</h2><p>We will hand you to Stripe for the secure payment step. Orders are confirmed by webhook, never by a browser redirect.</p><label>Email for receipt<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label><div className="checkout-total"><span>Gift bag total</span><strong>{formatInr(total)} <small>INR</small></strong></div>{error && <div className="finder-error">{error}</div>}<button className="button button-dark button-wide" disabled={busy}>{busy ? 'Opening secure checkout…' : <>Continue to Stripe <ArrowUpRight size={16} /></>}</button><small className="checkout-note">Test mode · Use Stripe's 4242 4242 4242 4242 card when the sandbox is connected.</small></form></div></section>
}

function Orders({ navigate }: { navigate: (path: string) => void }) {
  const returnedFromCheckout = new URLSearchParams(window.location.search).get('checkout') === 'return'
  return <section className="orders-page section-pad"><div className="empty-state"><div className="empty-icon"><Check size={25} /></div><div className="eyebrow"><span className="eyebrow-line" /> {returnedFromCheckout ? 'Stripe return received' : 'Your orders'}</div><h1>{returnedFromCheckout ? <>A little moment<br /><em>is on its way.</em></> : <>Your thoughtful<br /><em>orders live here.</em></>}</h1><p>{returnedFromCheckout ? 'You’ve returned from Stripe. Kindred will only mark the order as paid after the signed webhook is received, so this page is not a payment confirmation.' : 'Sign in to see orders and delivery updates once they are confirmed by the payment webhook.'}</p><button className="button button-dark" onClick={() => navigate('/discover')}>Keep exploring <ArrowUpRight size={16} /></button></div></section>
}

function ProductDetail({ id, navigate, saved, onSave, onAddToCart }: { id?: string; navigate: (path: string) => void; saved: string[]; onSave: (product: Product) => void; onAddToCart: (product: Product) => void }) {
  const { formatInr } = useCurrency()
  const product = findProduct(id)
  const [activeImage, setActiveImage] = useState(product?.image || '')
  useEffect(() => setActiveImage(product?.image || ''), [product?.id, product?.image])
  if (!product) return <NotFound navigate={navigate} />
  const gallery = product.gallery?.length ? product.gallery : [product.image]
  const related = products.filter((item) => item.id !== product.id && (item.category === product.category || item.collection === product.collection)).slice(0, 3)
  return <section className="product-detail section-pad"><button className="back-link" onClick={() => navigate('/discover')}><ArrowLeft size={16} /> Back to the edit</button><div className="detail-layout"><div><div className="detail-image-wrap"><img src={activeImage} alt={product.name} /><span className={`detail-badge badge-${product.accent}`}>{product.category}</span></div>{gallery.length > 1 && <div className="detail-gallery" aria-label="Product image gallery">{gallery.map((imageUrl, index) => <button key={imageUrl} className={activeImage === imageUrl ? 'detail-thumb detail-thumb-active' : 'detail-thumb'} onClick={() => setActiveImage(imageUrl)} aria-label={`View ${product.name} image ${index + 1}`}><img src={imageUrl} alt="" /></button>)}</div>}</div><div className="detail-copy"><div className="eyebrow"><span className="eyebrow-line" /> {product.maker} · {product.location}</div><h1>{product.name}</h1><p className="detail-note">{product.note}</p><div className="detail-rating"><Star size={15} fill="currentColor" /> {product.rating} <span>({product.reviewCount} notes from gifters)</span></div><div className="detail-price">{formatInr(product.price)}<span> INR</span></div><p className="detail-description">{product.description}</p><div className="detail-actions"><button className="button button-dark button-wide" onClick={() => onAddToCart(product)}><ShoppingBag size={18} /> Add to gift bag</button><button className="button button-soft" onClick={() => onSave(product)}>{saved.includes(product.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}{saved.includes(product.id) ? 'Saved to your shelf' : 'Save this gift'}</button></div><div className="detail-perks"><div><Gift size={18} /><span><strong>Wrapped with care</strong>Maker packaging, ready to give.</span></div><div><Heart size={18} /><span><strong>A little more personal</strong>Every find has a maker story.</span></div></div></div></div><div className="story-block"><div><span className="eyebrow">Behind the find</span><h2>A lovely thing<br /><em>with a life of its own.</em></h2></div><p>{product.story}</p></div>{related.length > 0 && <div className="related-section"><SectionHeading eyebrow="Keep the feeling going" title="You might also love" action="See all gifts" onAction={() => navigate('/discover')} /><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} saved={saved.includes(item.id)} onSave={onSave} onOpen={() => navigate(`/product/${item.id}`)} />)}</div></div>}</section>
}

function Saved({ navigate, saved, onSave, user }: { navigate: (path: string) => void; saved: string[]; onSave: (product: Product) => void; user: User | null }) {
  const savedProducts = products.filter((product) => saved.includes(product.id))
  return <section className="saved-page section-pad"><div className="saved-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> Your thoughtful shelf</div><h1>Things worth<br /><em>coming back to.</em></h1></div>{savedProducts.length > 0 && <span className="saved-count-large">{savedProducts.length} {savedProducts.length === 1 ? 'find' : 'finds'}</span>}</div>{!user && savedProducts.length > 0 && <div className="sync-banner"><Sparkles size={18} /><p><strong>These are saved on this device.</strong> Sign in to keep your shelf wherever you browse.</p><button className="text-link" onClick={() => navigate('/sign-in')}>Sign in to sync <ArrowUpRight size={15} /></button></div>}{savedProducts.length ? <div className="product-grid saved-grid">{savedProducts.map((product) => <ProductCard key={product.id} product={product} saved onSave={onSave} onOpen={() => navigate(`/product/${product.id}`)} />)}</div> : <div className="empty-state saved-empty"><div className="empty-icon"><Bookmark size={25} /></div><h2>Your shelf is waiting.</h2><p>Save the gifts that make you think of someone, then come back when the moment feels right.</p><button className="button button-dark" onClick={() => navigate('/discover')}>Find a thoughtful gift <ArrowUpRight size={16} /></button></div>}</section>
}

function SignIn({ navigate, onToast }: { navigate: (path: string) => void; onToast: (toast: Toast) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('')
    if (!email || !password || password.length < 6) { setError('Use a valid email and a password with at least 6 characters.'); return }
    if (!isSupabaseConfigured) { setError('Supabase is not configured in this preview yet. Add the project URL and anon key to enable accounts.'); return }
    setBusy(true)
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)
    if (result.error) { setError(result.error.message); return }
    const hasSession = Boolean(result.data?.session)
    onToast({ message: mode === 'signin' || hasSession ? 'Welcome back to your thoughtful shelf.' : 'Account created — check your inbox to confirm your email.', tone: 'success' })
    if (mode === 'signin' || hasSession) window.setTimeout(() => navigate('/saved'), 500)
    else setDone(true)
  }
  return <section className="auth-page section-pad"><div className="auth-art"><div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" /><div className="auth-art-center"><Leaf size={29} /><span>give<br /><em>well.</em></span></div><div className="auth-art-note note-one">A little<br />more feeling.</div><div className="auth-art-note note-two">✦ made by<br />independent makers</div></div><div className="auth-card"><div className="eyebrow"><span className="eyebrow-line" /> Your Kindred shelf</div><h1>{mode === 'signin' ? <>Welcome<br /><em>back, giver.</em></> : <>Make your<br /><em>good finds last.</em></>}</h1><p className="auth-intro">{mode === 'signin' ? 'Save the gifts that feel just right and find them again when the moment comes.' : 'Create a free account to save gifts, keep inspiration close, and give a little more personally.'}</p>{done ? <div className="auth-success"><div className="success-check"><Check size={22} /></div><h2>Almost there.</h2><p>We sent a confirmation link to <strong>{email}</strong>. Once you confirm, your shelf will be ready.</p><button className="button button-dark" onClick={() => navigate('/discover')}>Keep browsing <ArrowUpRight size={16} /></button></div> : <form className="auth-form" onSubmit={submit}><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></label>{error && <div className="form-error">{error}</div>}<button className="button button-dark button-wide" disabled={busy}>{busy ? 'One moment…' : mode === 'signin' ? 'Sign in to Kindred' : 'Create my shelf'} <ArrowUpRight size={16} /></button><div className="auth-switch">{mode === 'signin' ? 'New to Kindred?' : 'Already have a shelf?'} <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}>{mode === 'signin' ? 'Create an account' : 'Sign in instead'}</button></div></form>}<button className="guest-link" onClick={() => navigate('/discover')}>Continue browsing as a guest <ArrowUpRight size={14} /></button></div></section>
}

function ProductCard({ product, saved, onSave, onOpen }: { product: Product; saved: boolean; onSave: (product: Product) => void; onOpen: () => void }) {
  const { formatInr } = useCurrency()
  const badge = product.tags.includes('under ₹2,500') ? 'Low price' : product.category === 'Personalized' ? 'Personalized' : product.rating >= 4.9 ? 'Loved by gifters' : product.category === 'Birthday' ? 'Birthday pick' : ''
  return <article className="product-card"><button className="product-image-button" onClick={onOpen} aria-label={`View ${product.name}`}><div className={`product-image accent-${product.accent}`}><img src={product.image} alt={`${product.name} gift`} loading="lazy" />{badge && <span className="card-badge">{badge}</span>}<span className="card-category">{product.category}</span><span className="card-review-badge" aria-label={`${product.rating} out of 5 stars from ${product.reviewCount} reviews`}><Star size={12} fill="currentColor" /><strong>{product.rating}</strong><span>({product.reviewCount})</span></span></div></button><button className={`save-button ${saved ? 'save-button-active' : ''}`} onClick={() => onSave(product)} aria-label={saved ? `Remove ${product.name} from saved gifts` : `Save ${product.name}`}>{saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}</button><div className="product-info"><button className="product-name" onClick={onOpen}>{product.name}</button><p className="product-maker">{product.maker} <span>·</span> {product.location}</p><div className="product-bottom"><span className="product-price">{formatInr(product.price)}</span><span className="product-rating"><Star size={13} fill="currentColor" /> {product.rating} <small>{product.reviewCount} reviews</small></span></div></div></article>
}

function SectionHeading({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action: string; onAction: () => void }) { return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><button className="text-link" onClick={onAction}>{action} <ArrowUpRight size={15} /></button></div> }
function MakerBand({ navigate }: { navigate: (path: string) => void }) { return <section className="maker-band" id="makers"><div className="maker-image"><img src="https://images.unsplash.com/photo-1556760544-74068565f05c?auto=format&fit=crop&w=1100&q=84" alt="A maker working in a bright studio" /></div><div className="maker-copy"><span className="eyebrow"><span className="eyebrow-line" /> Good gifts, good people</span><h2>Behind every lovely find is a person who <em>made it with care.</em></h2><p>We bring thoughtful shoppers a little closer to the independent makers they’ll love supporting.</p><button className="button button-outline" onClick={() => navigate('/discover')}>Meet the maker community <ArrowUpRight size={16} /></button></div></section> }
function IntroWelcome({ leaving, onEnter }: { leaving: boolean; onEnter: (soundEnabled?: boolean) => void }) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  return <div className={`welcome-overlay ${leaving ? 'welcome-overlay-leaving' : ''}`} role="dialog" aria-modal="true" aria-labelledby="welcome-title" aria-describedby="welcome-copy">
    <div className="welcome-glow welcome-glow-one" /><div className="welcome-glow welcome-glow-two" />
    <span className="welcome-particle welcome-particle-one">✦</span><span className="welcome-particle welcome-particle-two">·</span><span className="welcome-particle welcome-particle-three">✦</span><span className="welcome-particle welcome-particle-four">·</span>
    <div className="welcome-inner">
      <button className="welcome-sound-toggle" onClick={() => setSoundEnabled((enabled) => !enabled)} aria-label={soundEnabled ? 'Mute gift opening sound' : 'Enable gift opening sound'} title={soundEnabled ? 'Sound on' : 'Sound off'}>{soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}<span>{soundEnabled ? 'Sound on' : 'Sound off'}</span></button>
      <div className="welcome-brand"><span className="welcome-brand-mark"><Gift size={21} /></span><span>GiftGenie</span><Sparkles size={15} /></div>
      <p className="welcome-tagline">Gifts That Understand People.</p>
      <div className="welcome-gift-stage" aria-hidden="true"><span className="welcome-halo" /><div className="welcome-gift-shadow" /><div className="welcome-gift"><div className="welcome-gift-lid"><span className="welcome-ribbon ribbon-horizontal" /><span className="welcome-ribbon ribbon-vertical" /></div><div className="welcome-gift-box"><span className="welcome-ribbon ribbon-horizontal" /><span className="welcome-ribbon ribbon-vertical" /></div><span className="welcome-bow bow-left" /><span className="welcome-bow bow-right" /><span className="welcome-bow-knot" /></div></div>
      <div className="welcome-copy"><p className="welcome-kicker">Thoughtfully curated. Personally meaningful.</p><h1 id="welcome-title">Every Gift Has a Story.<br /><em>Let’s Find Yours.</em></h1><p id="welcome-copy">Discover thoughtful gifts, explore beautiful collections and let AI help you find something truly meaningful for the people who matter.</p></div>
      <button className="welcome-enter" onClick={() => onEnter(soundEnabled)} autoFocus><span>ENTER GIFTGENIE</span><ArrowUpRight size={18} /></button>
      <p className="welcome-footnote">A little more thought. A little less ordinary.</p>
    </div>
  </div>
}
function Footer({ navigate, onReplayWelcome }: { navigate: (path: string) => void; onReplayWelcome: () => void }) { return <footer className="site-footer section-pad"><div className="footer-top"><div><button className="wordmark footer-wordmark" onClick={() => navigate('/')}><span className="wordmark-mark"><Leaf size={18} /></span><span>kindred</span></button><p>Thoughtful gifting,<br />made personal.</p></div><div className="footer-links"><div><span>Explore</span><button onClick={() => navigate('/discover')}>Find a gift</button><button onClick={() => navigate('/#collections')}>Collections</button><button onClick={() => navigate('/saved')}>Saved gifts</button></div><div><span>Kindred</span><button onClick={() => navigate('/#makers')}>Our makers</button><button onClick={() => navigate('/sign-in')}>Your shelf</button><button onClick={() => navigate('/discover')}>Journal</button></div><div><span>GiftGenie</span><button onClick={onReplayWelcome}>Replay welcome</button></div></div><div className="footer-note"><span className="footer-spark">✦</span><p>For the little moments<br /><em>that mean a lot.</em></p></div></div><div className="footer-bottom"><span>© 2026 Kindred</span><span>Independent makers · Good things</span><button onClick={() => navigate('/sign-in')}>Join the thoughtful side <ArrowUpRight size={14} /></button></div></footer> }
function MobileNav({ route, savedCount, navigate }: { route: Route; savedCount: number; navigate: (path: string) => void }) { return <nav className="mobile-nav"><button className={route.page === 'home' ? 'mobile-nav-active' : ''} onClick={() => navigate('/')}><Sparkles size={18} /><span>Home</span></button><button className={route.page === 'discover' ? 'mobile-nav-active' : ''} onClick={() => navigate('/discover')}><Compass size={18} /><span>Explore</span></button><button className={route.page === 'saved' ? 'mobile-nav-active' : ''} onClick={() => navigate('/saved')}><Bookmark size={18} /><span>Saved{savedCount ? ` · ${savedCount}` : ''}</span></button><button className={route.page === 'signin' ? 'mobile-nav-active' : ''} onClick={() => navigate('/sign-in')}><UserRound size={18} /><span>Account</span></button></nav> }
function NotFound({ navigate }: { navigate: (path: string) => void }) { return <section className="empty-state not-found section-pad"><div className="empty-icon"><Leaf size={25} /></div><h2>This little path is still growing.</h2><p>Let’s take you back to the thoughtful finds.</p><button className="button button-dark" onClick={() => navigate('/')}>Back to Kindred <ArrowUpRight size={16} /></button></section> }
function SupportWidget({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: 'Hi — I can help with gifts, shipping, returns, or finding your way around Kindred.' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    const content = input.trim()
    if (!content || loading) return
    const next = [...messages, { role: 'user' as const, content }]
    setMessages(next); setInput(''); setLoading(true)
    try {
      const response = await fetch('/api/support-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next, authenticated: Boolean(user) }) })
      const payload = await response.json()
      setMessages((current) => [...current, { role: 'assistant', content: payload.reply || 'Please contact hello@kindred.gifts and a human will help.' }])
    } catch {
      setMessages((current) => [...current, { role: 'assistant', content: 'I’m having trouble connecting. Please contact hello@kindred.gifts for human support.' }])
    } finally { setLoading(false) }
  }
  return <div className={`support-widget ${open ? 'support-widget-open' : ''}`}><button className="support-launcher" onClick={() => setOpen(!open)} aria-label="Open Kindred support"><CircleHelp size={19} /> <span>Help</span></button>{open && <div className="support-panel"><div className="support-panel-header"><div><span className="eyebrow">Kindred support</span><strong>How can we help?</strong></div><button onClick={() => setOpen(false)} aria-label="Close support"><X size={16} /></button></div><div className="support-messages">{messages.map((message, index) => <div className={`support-message support-message-${message.role}`} key={`${message.role}-${index}`}>{message.content}</div>)}{loading && <div className="support-message support-message-assistant">Looking into that…</div>}</div><form className="support-form" onSubmit={send}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about shipping, returns…" aria-label="Ask Kindred support" /><button aria-label="Send support message" disabled={!input.trim() || loading}><Send size={15} /></button></form></div>}</div>
}
export default App
