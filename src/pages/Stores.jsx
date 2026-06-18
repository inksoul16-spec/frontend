import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "./Layout";
import { FiSearch, FiMapPin, FiShield, FiUsers, FiPackage, FiStar, FiArrowRight, FiClock } from "react-icons/fi";

const STORES = [
  {
    id:1, name:"Simba Supermarket", tagline:"Unlimited Shopping At One Stop!",
    emoji:"🦁", color:"#fff8f0", followers:187, items:1868, rating:4.8,
    status:"open", closes:"9:00 PM",
    categories:["Cement","Bricks & Blocks","Sand & Gravel"],
    img:"https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&q=80",
  },
  {
    id:2, name:"TechHub Kigali", tagline:"Your one-stop electronics destination",
    emoji:"💻", color:"#f0f4ff", followers:312, items:450, rating:4.6,
    status:"open", closes:"8:00 PM",
    categories:["Electrical Cables & Wires","Switches & Sockets"],
    img:"https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80",
  },
  {
    id:3, name:"Fresh Farms Rwanda", tagline:"Farm-fresh groceries delivered daily",
    emoji:"🥬", color:"#f0fff4", followers:95, items:230, rating:4.9,
    status:"closed", opens:"8:00 AM",
    categories:["Tiles & Flooring","Paints & Finishes"],
    img:"https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
  },
  {
    id:4, name:"Kigali Fashion Hub", tagline:"Trendy styles for every occasion",
    emoji:"👗", color:"#f8f0ff", followers:540, items:890, rating:4.5,
    status:"open", closes:"7:00 PM",
    categories:["Roofing Sheets","Plumbing Materials"],
    img:"https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80",
  },
  {
    id:5, name:"Home Essentials RW", tagline:"Everything your home needs",
    emoji:"🏠", color:"#fff8f0", followers:178, items:620, rating:4.7,
    status:"open", closes:"6:00 PM",
    categories:["Doors & Windows","Electrical Panels"],
    img:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
  },
  {
    id:6, name:"Beauty & More", tagline:"Premium beauty products at your door",
    emoji:"💄", color:"#fff0f8", followers:265, items:380, rating:4.8,
    status:"closed", opens:"9:00 AM",
    categories:["Batteries & Generators"],
    img:"https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80",
  },
];

export default function Stores() {
  const [search, setSearch] = useState("");

  const filtered = STORES.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.categories.some(c => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero banner */}
      <section className="py-10 border-b" >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold mb-2 vc-body-text">
              Explore Our <span className="text-amber-500">Stores</span>
            </h1>
            <p className="text-sm max-w-md leading-relaxed vc-muted">
              Discover local sellers and shop unique products from trusted vendors across Kigali
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center">
              <p className="text-3xl font-extrabold vc-body-text">50</p>
              <p className="text-xs vc-muted font-semibold uppercase tracking-widest mt-0.5">Verified Stores</p>
            </div>
            <div className="w-px h-12 bg-amber-200"/>
            <div className="text-center flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <FiShield className="text-green-500" size={18}/>
                <p className="text-3xl font-extrabold text-gray-900">50</p>
              </div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Trusted Sellers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Count + search */}
      <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between gap-4 vc-border-bottom">
        <p className="text-sm vc-muted">
          <strong className="vc-body-text">{filtered.length}</strong> stores available
        </p>
        <div className="flex items-center rounded-xl px-4 py-2 gap-2 w-64 vc-card">
          <FiSearch size={14} className="text-gray-400"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search stores..."
            className="text-sm site-search-input placeholder-gray-400 focus:outline-none flex-1 bg-transparent vc-body-text"
          />
        </div>
      </div>

      {/* Store grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(store => (
            <div key={store.id} className="rounded-2xl overflow-hidden transition-all group vc-card">
              {/* Store cover image */}
              <div className="relative h-36 overflow-hidden bg-gray-100">
                <img src={store.img} alt={store.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"/>
                {/* Open/closed badge */}
                <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  store.status === "open"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                }`}>
                  {store.status === "open" ? `Open · Closes ${store.closes}` : `Closed · Opens ${store.opens}`}
                </span>
              </div>

              {/* Store info */}
              <div className="p-4" style={{ backgroundColor: store.color }}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl vc-card">
                    {store.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold vc-body-text">{store.name}</h3>
                    <p className="text-xs vc-muted">{store.tagline}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs vc-muted">
                      <span className="flex items-center gap-1"><FiUsers size={11}/> {store.followers} followers</span>
                      <span className="flex items-center gap-1"><FiPackage size={11}/> {store.items.toLocaleString()} items</span>
                      <span className="flex items-center gap-1"><FiStar size={11} className="text-amber-500"/> {store.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Category pills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {store.categories.map(c => (
                      <span key={c} className="text-xs vc-muted vc-pill">{c}</span>
                    ))}
                </div>

                <Link
                  to={`/stores/${store.id}`}
                  className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition-colors vc-cta"
                >
                  Visit Store <FiArrowRight size={13}/>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 vc-dashed">
            <p className="font-medium vc-muted">No stores found</p>
            <p className="text-sm vc-muted">Try a different search term.</p>
          </div>
        )}
      </div>

      <Footer/>
    </div>
  );
}