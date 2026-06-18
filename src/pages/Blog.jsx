import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "./Layout";
import { FiArrowRight, FiClock, FiUser, FiTag, FiSearch } from "react-icons/fi";

const BLOG_CATEGORIES = ["All","How It Works","Seller Tips","Product Guides","Kigali News","Tech & App"];

const POSTS = [
  {
    id:1,
    title:"How QR-Code Pickup Is Changing Shopping in Kigali",
    excerpt:"Skip the queue and collect your order in seconds. Here's how our QR-based pickup system works — and why thousands of Kigali shoppers are switching.",
    category:"How It Works",
    author:"QuickCollect Team",
    date:"June 10, 2026",
    readTime:"4 min read",
    featured:true,
    img:"https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    tag:"Featured",
  },
  {
    id:2,
    title:"5 Tips for Sellers to Grow Their Online Store",
    excerpt:"From writing better product descriptions to using promotions effectively — these simple tips helped our top sellers double their monthly orders.",
    category:"Seller Tips",
    author:"Aline Uwimana",
    date:"June 7, 2026",
    readTime:"5 min read",
    featured:false,
    img:"https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=600&q=80",
    tag:"For Sellers",
  },
  {
    id:3,
    title:"Best Groceries to Order Online in Rwanda",
    excerpt:"From Inyange milk to Soko maize meal — we break down the most popular grocery staples ordered through QuickCollect every week.",
    category:"Product Guides",
    author:"Eric Nshimiye",
    date:"June 4, 2026",
    readTime:"3 min read",
    featured:false,
    img:"https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
    tag:"Groceries",
  },
  {
    id:4,
    title:"Kigali's Local Markets Go Digital in 2026",
    excerpt:"Traditional market vendors are now listing on apps like QuickCollect. How this digital shift is benefiting buyers and sellers across Kigali.",
    category:"Kigali News",
    author:"Marie Claire Ishimwe",
    date:"May 30, 2026",
    readTime:"6 min read",
    featured:false,
    img:"https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80",
    tag:"Local News",
  },
  {
    id:5,
    title:"Introducing Offline Order History on Our App",
    excerpt:"Our latest update lets you view order history even without internet. Here's what's new in v2.4 and what we're building next.",
    category:"Tech & App",
    author:"Dev Team",
    date:"May 25, 2026",
    readTime:"2 min read",
    featured:false,
    img:"https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80",
    tag:"App Update",
  },
  {
    id:6,
    title:"How to Pay Safely Online in Rwanda",
    excerpt:"MTN MoMo, Visa, or Mastercard — we explain all the payment options available on QuickCollect and how each one keeps your money secure.",
    category:"How It Works",
    author:"QuickCollect Team",
    date:"May 20, 2026",
    readTime:"4 min read",
    featured:false,
    img:"https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80",
    tag:"Payments",
  },
];

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const featured = POSTS.find(p => p.featured);
  const filtered = POSTS.filter(p => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                        p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && !p.featured;
  });

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Page header */}
      <section className="py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-amber-600 font-bold uppercase tracking-widest mb-3">Our Blog</p>
          <h1 className="text-4xl font-extrabold mb-3 vc-body-text">
            Tips, News &amp; <span className="text-amber-500">Stories</span>
          </h1>
          <p className="text-base max-w-lg mx-auto mb-7 vc-muted">
            Shopping guides, seller advice, app updates, and local Kigali stories — all in one place.
          </p>
          {/* Search */}
            <div className="flex items-center rounded-xl px-4 py-3 gap-2 max-w-sm mx-auto vc-card">
            <FiSearch size={15} className="text-gray-400"/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles..."
                className="flex-1 site-search-input text-sm placeholder-gray-400 focus:outline-none bg-transparent vc-body-text"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Category pills */}
        <div className="flex items-center gap-2 flex-wrap mb-10">
          {BLOG_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors font-medium ${activeCategory === cat ? 'vc-card vc-body-text' : 'vc-muted'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured post */}
        {featured && (activeCategory === "All" || activeCategory === featured.category) && !search && (
          <div className="mb-12">
            <Link to={`/blog/${featured.id}`} className="group grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden transition-all vc-card">
              <div className="relative h-64 lg:h-auto overflow-hidden">
                <img src={featured.img} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                <span className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {featured.tag}
                </span>
              </div>
              <div className="p-8 flex flex-col justify-center vc-card">
                <span className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-3">{featured.category}</span>
                <h2 className="text-2xl font-extrabold leading-snug mb-4 group-hover:text-amber-600 transition-colors vc-body-text">
                  {featured.title}
                </h2>
                <p className="text-sm leading-relaxed mb-6 vc-muted">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-xs mb-6 vc-muted">
                  <span className="flex items-center gap-1"><FiUser size={11}/> {featured.author}</span>
                  <span className="flex items-center gap-1"><FiClock size={11}/> {featured.readTime}</span>
                  <span>{featured.date}</span>
                </div>
                <span className="inline-flex items-center gap-2 text-amber-600 font-semibold text-sm group-hover:gap-3 transition-all">
                  Read article <FiArrowRight size={14}/>
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Article grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(post => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="group rounded-2xl overflow-hidden transition-all"
                className="group rounded-2xl overflow-hidden transition-all vc-card"
              >
                <div className="relative h-44 overflow-hidden">
                  <img src={post.img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                  <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full vc-tag">
                    {post.tag}
                  </span>
                </div>
                  <div className="p-5">
                  <span className="text-xs text-amber-600 font-semibold uppercase tracking-wide">{post.category}</span>
                    <h3 className="text-base font-bold mt-1 mb-2 leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors vc-body-text">
                    {post.title}
                  </h3>
                    <p className="text-sm line-clamp-2 mb-4 leading-relaxed vc-muted">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs vc-muted">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><FiUser size={10}/> {post.author}</span>
                      <span className="flex items-center gap-1"><FiClock size={10}/> {post.readTime}</span>
                    </div>
                    <span>{post.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 vc-dashed">
            <p className="font-medium vc-muted">No articles found</p>
            <p className="text-sm vc-muted">Try a different search or category.</p>
          </div>
        )}

        {/* Newsletter CTA */}
        <div className="mt-14 rounded-2xl overflow-hidden vc-card">
          <div className="px-8 py-10 text-center max-w-xl mx-auto">
            <p className="text-xs text-amber-600 font-bold uppercase tracking-widest mb-3">Stay in the loop</p>
            <h3 className="text-2xl font-extrabold mb-2 vc-body-text">Get the latest articles</h3>
            <p className="text-sm mb-6 vc-muted">New guides, seller tips, and Kigali market news — delivered to your inbox weekly.</p>
            <div className="flex gap-2 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none vc-input"
              />
              <button className="text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0 vc-cta">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer/>
    </div>
  );
}