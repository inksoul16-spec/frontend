/**
 * QuickCollect — Admin Dashboard
 * Full React component. Drop into your project and wire up real API calls.
 *
 * Dependencies:
 *   npm install react-router-dom recharts react-icons
 *
 * Usage in App.jsx (protected route):
 *   <Route path="/admin/*" element={<AdminDashboard />} />
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  FiHome, FiShoppingCart, FiCreditCard, FiPackage, FiBox,
  FiTag, FiDatabase, FiUsers, FiShield, FiBarChart2, FiBell,
  FiSettings, FiZap, FiSearch, FiMoon, FiSun, FiMenu,
  FiPlus, FiEdit2, FiTrash2, FiDownload, FiPrinter,
  FiRefreshCw, FiX, FiCheck, FiAlertTriangle, FiClock,
  FiEye, FiUser, FiActivity, FiChevronDown, FiLogOut,
  FiFilter, FiGrid, FiCopy,
  FiMoreVertical,
} from "react-icons/fi";
import { MdQrCode2 } from "react-icons/md";
import { showToast } from '../lib/toast';

let API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
// normalize short forms like ":5000" -> include protocol+host
try {
  if (API_BASE && API_BASE.startsWith(':') && typeof window !== 'undefined') {
    API_BASE = window.location.protocol + '//' + window.location.hostname + API_BASE;
  }
} catch (e) { /* ignore */ }

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const COLORS = {
  amber:  { bg: "#faeeda", txt: "#854f0b", solid: "#c47f1a" },
  blue:   { bg: "#e6f1fb", txt: "#0c447c", solid: "#185fa5" },
  green:  { bg: "#eaf3de", txt: "#27500a", solid: "#3b6d11" },
  red:    { bg: "#fcebeb", txt: "#791f1f", solid: "#a32d2d" },
  purple: { bg: "#eeedfe", txt: "#3c3489", solid: "#534ab7" },
  teal:   { bg: "#e1f5ee", txt: "#085041", solid: "#0f6e56" },
  coral:  { bg: "#faece7", txt: "#712b13", solid: "#993c1d" },
  gray:   { bg: "#f1efe8", txt: "#444441", solid: "#5f5e5a" },
};

function sanitizeOrder(o) {
  if (!o) return null;
  return {
    _id: o._id || o.id || o._id,
    id: o._id || o.id,
    user: o.user ? (typeof o.user === 'object' ? { id: o.user._id || o.user.id, name: o.user.name, email: o.user.email } : o.user) : null,
    items: (o.items || []).map(i => (typeof i === 'object' ? { name: i.name, price: i.price, qty: i.qty } : i)),
    totalAmount: o.totalAmount || o.amount || 0,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    qrCode: o.qrCode,
    qrPayload: o.qrPayload,
    createdAt: o.createdAt,
  };
}

// ─────────────────────────────────────────────────────────────
// Runtime state (loaded from API)
// ─────────────────────────────────────────────────────────────
// Data is fetched from backend where possible. Fallback to small mocks when API unreachable.
const MOCK_ORDERS = [];

const MOCK_PRODUCTS = [];

const MOCK_CUSTOMERS = [];

const MOCK_PAYMENTS = [];

const MOCK_CATEGORIES = [];

const MOCK_STAFF = [];

// Disable mock admin data in favor of real backend data
const USE_MOCK_ADMIN_DATA = false;

const WEEKLY_REVENUE = [];

const MONTHLY_TREND = [];

const CAT_REVENUE = [];

const STATUS_PIE = [];

const ACTIVITY_LOG = [];

const NOTIFICATIONS = [];

const COLLECTION_QUEUE = [];

const MONTHLY_REPORT = [];

// ─────────────────────────────────────────────────────────────
// UTILITY COMPONENTS
// ─────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    pending:   { bg:COLORS.amber.bg,  color:COLORS.amber.txt,  label:"Pending"    },
    paid:      { bg:COLORS.blue.bg,   color:COLORS.blue.txt,   label:"Paid"       },
    preparing: { bg:COLORS.purple.bg, color:COLORS.purple.txt, label:"Preparing"  },
    ready:     { bg:COLORS.teal.bg,   color:COLORS.teal.txt,   label:"Ready"      },
    collected: { bg:COLORS.green.bg,  color:COLORS.green.txt,  label:"Collected"  },
    cancelled: { bg:COLORS.red.bg,    color:COLORS.red.txt,    label:"Cancelled"  },
    active:    { bg:COLORS.green.bg,  color:COLORS.green.txt,  label:"Active"     },
    inactive:  { bg:"#f1efe8",        color:"#5f5e5a",          label:"Inactive"   },
    suspended: { bg:COLORS.red.bg,    color:COLORS.red.txt,    label:"Suspended"  },
    success:   { bg:COLORS.green.bg,  color:COLORS.green.txt,  label:"Success"    },
    failed:    { bg:COLORS.red.bg,    color:COLORS.red.txt,    label:"Failed"     },
    refunded:  { bg:COLORS.amber.bg,  color:COLORS.amber.txt,  label:"Refunded"   },
    low:       { bg:COLORS.coral.bg,  color:COLORS.coral.txt,  label:"Low Stock"  },
    critical:  { bg:COLORS.red.bg,    color:COLORS.red.txt,    label:"Critical"   },
    ok:        { bg:COLORS.green.bg,  color:COLORS.green.txt,  label:"OK"         },
    admin:     { bg:COLORS.purple.bg, color:COLORS.purple.txt, label:"Admin"      },
    staff:     { bg:COLORS.blue.bg,   color:COLORS.blue.txt,   label:"Staff"      },
    valid:     { bg:COLORS.green.bg,  color:COLORS.green.txt,  label:"Valid"      },
    duplicate: { bg:COLORS.red.bg,    color:COLORS.red.txt,    label:"Duplicate"  },
    verified:  { bg:COLORS.teal.bg,   color:COLORS.teal.txt,   label:"QR Issued"  },
  };
  const s = map[status] || { bg:"#f1efe8", color:"#5f5e5a", label: status };
  return (
    <span className="vc-badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>
  );
}

function StatCard({ label, value, sub, color = "gray", icon }) {
  const c = COLORS[color] || COLORS.gray;
  return (
    <div className="vc-stat">
      <div className="label">{icon && <span className="text-sm">{icon}</span>}{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function Panel({ title, icon, action, onAction, children, style }) {
  return (
    <div className="vc-panel" style={style}>
      {(title || action) && (
        <div className="vc-panel-header">
          {title && (
            <div className="vc-panel-title">{icon && <span className="text-[var(--txt2)]">{icon}</span>}{title}</div>
          )}
          {action && (
            <div className="vc-panel-actions"><button onClick={onAction}>{action}</button></div>
          )}
        </div>
      )}
      <div className="vc-panel-body">{children}</div>
    </div>
  );
}

function DataTable({ columns, rows, onRowAction }) {
  return (
    <div className="vc-table-wrap">
      <table className="vc-table">
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key}>{c.label}</th>
            ))}
            {onRowAction && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr id={row && row.id ? `order-row-${row.id}` : undefined} key={row && (row.id || row._id) ? (row.id || row._id) : i}>
              {columns.map(c => (
                <td key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key]}</td>
              ))}
              {onRowAction && (
                <td>{onRowAction(row)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Btn({ children, variant = "secondary", size = "md", onClick, style }) {
  const cls = `vc-btn ${variant === 'primary' ? 'vc-btn-primary' : variant === 'danger' ? 'vc-btn-danger' : 'vc-btn-secondary'}`;
  return (
    <button onClick={onClick} className={cls} style={style} onMouseEnter={e => e.currentTarget.style.opacity = ".9"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>{children}</button>
  );
}

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="vc-modal-overlay">
      <div className="vc-modal">
        <div className="vc-modal-header">
          <h3 className="text-sm font-medium text-[var(--txt)] m-0">{title}</h3>
          <button onClick={onClose} className="bg-transparent border-0 text-[var(--txt2)] cursor-pointer text-lg"><FiX /></button>
        </div>
        <div className="vc-modal-body">{children}</div>
        {footer && <div className="vc-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-[var(--txt2)]">{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  return (<input className="vc-input" {...props} />);
}

function Select({ children, ...props }) {
  return (<select className="vc-select" {...props}>{children}</select>);
}

function Textarea({ ...props }) {
  return (<textarea className="vc-textarea" {...props} />);
}

function StockBar({ stock, threshold }) {
  const pct = Math.min(100, Math.round((stock / Math.max(threshold * 2, 1)) * 100));
  const barColor = stock <= 0 ? COLORS.red.solid : stock <= threshold ? COLORS.red.solid : stock <= threshold * 1.5 ? COLORS.amber.solid : COLORS.green.solid;
  return (
    <div className="vc-stock">
      <span className="count" style={{ color: stock <= threshold ? COLORS.red.solid : 'var(--txt)' }}>{stock}</span>
      <div className="bar"><div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius:3 }} /></div>
    </div>
  );
}

function Avatar({ name, color = "blue", size = 28 }) {
  const c = COLORS[color] || COLORS.blue;
  const initials = name.split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:c.bg, color:c.txt, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size * 0.38, fontWeight:500, flexShrink:0 }}>{initials}</div>
  );
}

function FilterRow({ children }) {
  return <div className="flex gap-2 items-center mb-3 flex-wrap">{children}</div>;
}

function SearchInput({ placeholder, value, onChange }) {
  return (<input type="text" value={value} onChange={onChange} placeholder={placeholder} className="vc-input max-w-[220px]" />);
}

// ─────────────────────────────────────────────────────────────
// QR MOCK SVG
// ─────────────────────────────────────────────────────────────
function QRMock({ seed = 0 }) {
  const patterns = [
    [[4,4],[5,5],[6,4],[3,5],[4,3]],
    [[5,4],[4,5],[6,5],[3,4],[5,3]],
    [[4,4],[6,6],[3,5],[5,5],[4,6]],
    [[5,3],[4,4],[6,4],[5,6],[3,6]],
  ];
  const extra = patterns[seed % patterns.length];
  return (
    <svg width="64" height="64" viewBox="0 0 8 8" aria-hidden="true">
      <rect x="0" y="0" width="3" height="3" fill="var(--txt)" />
      <rect x="5" y="0" width="3" height="3" fill="var(--txt)" />
      <rect x="0" y="5" width="3" height="3" fill="var(--txt)" />
      <rect x="1" y="1" width="1" height="1" fill="var(--bg2)" />
      <rect x="6" y="1" width="1" height="1" fill="var(--bg2)" />
      <rect x="1" y="6" width="1" height="1" fill="var(--bg2)" />
      {extra.map(([x,y],i) => <rect key={i} x={x} y={y} width="1" height="1" fill="var(--txt)" />)}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// SIDEBAR NAV CONFIG
// ─────────────────────────────────────────────────────────────
const NAV = [
  { section:"Overview",   items:[{ id:"overview",    icon:<FiHome />,        label:"Dashboard"   }]},
  { section:"Operations", items:[
    { id:"orders",    icon:<FiShoppingCart />, label:"Orders",      badge:12 },
    { id:"payments",  icon:<FiCreditCard />,   label:"Payments"             },
    { id:"qrcodes",   icon:<MdQrCode2 />,      label:"QR Codes"             },
    { id:"collection",icon:<FiPackage />,      label:"Collection"           },
  ]},
  { section:"Catalog", items:[
    { id:"products",   icon:<FiBox />,      label:"Products"  },
    { id:"categories", icon:<FiTag />,      label:"Categories"},
    { id:"inventory",  icon:<FiDatabase />, label:"Inventory", badge:3 },
  ]},
  { section:"People", items:[
    { id:"customers", icon:<FiUsers />,  label:"Customers" },
    { id:"staff",     icon:<FiShield />, label:"Staff"     },
  ]},
  { section:"Insights", items:[
    { id:"reports",       icon:<FiBarChart2 />, label:"Reports"       },
    { id:"notifications", icon:<FiBell />,      label:"Notifications" },
  ]},
  { section:"System", items:[
    { id:"settings", icon:<FiSettings />, label:"Settings" },
  ]},
];

// ─────────────────────────────────────────────────────────────
// PAGE COMPONENTS
// ─────────────────────────────────────────────────────────────

// ── OVERVIEW ──────────────────────────────────────────────────
function AdminLoader({ children }) {
  // centralize loading of admin data: products, orders, promotions
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');

    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

    Promise.all([
      fetch(`${API_BASE}/api/products`).then(r => r.ok ? r.json().catch(() => ({})) : Promise.resolve({})).catch(() => ({})),
      fetch(`${API_BASE}/api/orders`, { headers }).then(r => r.ok ? r.json().catch(() => ({})) : Promise.resolve({})).catch(() => ({})),
      fetch(`${API_BASE}/api/promotions/all`, { headers }).then(r => r.ok ? r.json().catch(() => ({})) : Promise.resolve({})).catch(() => ({})),
    ]).then(async ([pRes, oRes, promoRes]) => {
      if (!mounted) return;
      setProducts((pRes && pRes.products) || []);
      setOrders((oRes && oRes.orders) || []);
      // if admin-only fetch failed, fall back to public promotions endpoint
      let promos = (promoRes && promoRes.promotions) || [];
      if ((!promos || promos.length === 0) && mounted) {
        try {
          const pub = await fetch(`${API_BASE}/api/promotions`).then(r => r.ok ? r.json() : Promise.resolve({})).catch(() => ({}));
          promos = (pub && pub.promotions) || [];
        } catch (e) { promos = []; }
      }
      setPromotions(promos || []);
    }).finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  // optimistic refresh: listen for order updates and apply to orders list
  useEffect(() => {
    const handler = (e) => {
      if (!e || !e.detail || !e.detail.order) return;
      const updated = e.detail.order;
      setOrders(prev => {
        if (!prev || prev.length === 0) return [updated];
        const id = updated._id || updated.id;
        const idx = prev.findIndex(o => (o._id || o.id) === id);
        if (idx === -1) return [updated, ...prev];
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updated };
        return copy;
      });
    };
    window.addEventListener('order-updated', handler);
    return () => window.removeEventListener('order-updated', handler);
  }, []);

  return children({ loading, products, orders, promotions, setProducts, setOrders, setPromotions });
}

function PageOverview({ setPage, orders = [], products = [] }) {
  const now = new Date();
  const hour = now.getHours();
  let greet = 'Welcome Back';
  if (hour >= 5 && hour <= 11) greet = 'Good Morning';
  else if (hour >= 12 && hour <= 16) greet = 'Good Afternoon';
  else if (hour >= 17 && hour <= 20) greet = 'Good Evening';

  const totalOrders = (orders || []).length;
  const pending = (orders || []).filter(o => o.status === 'pending').length;
  const paid = (orders || []).filter(o => o.paymentStatus === 'paid').length;
  const ready = (orders || []).filter(o => o.status === 'ready').length;
  const collected = (orders || []).filter(o => o.status === 'collected').length;
  const cancelled = (orders || []).filter(o => o.status === 'cancelled').length;
  const [official, setOfficial] = useState(null);
  const [officialCounts, setOfficialCounts] = useState(null);
  const revenue = (orders || []).reduce((s,o) => s + (o.paymentStatus === 'paid' ? (o.totalAmount || o.amount || 0) : 0), 0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch((import.meta.env.VITE_API_BASE || 'http://localhost:5000') + '/api/orders/summary', { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{}) } });
        const data = await res.json().catch(() => ({}));
        if (res.ok && mounted) setOfficial(data);
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!official) return;
    setOfficialCounts({
      totalTransactions: official.totalTransactions,
      successful: official.successful,
      failed: official.failed,
      refunded: official.refunded,
    });
  }, [official]);
  const lowStock = (products || []).filter(p => typeof p.stock === 'number' && p.stock <= (p.threshold || 5)).length;

  const dateStr = now.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-medium">{greet}</div>
          <div className="text-xs vc-txt3 mt-1">{dateStr} · QuickCollect</div>
        </div>
        <div className="flex gap-2">
          <Btn size="sm" onClick={() => exportAll(products, orders, promotions)}><FiDownload size={13} />Export</Btn>
          <Btn size="sm" variant="primary" onClick={() => setPage("orders")}><FiPlus size={13} />New Order</Btn>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-5">
        <StatCard label="Total Orders" value={(officialCounts && typeof officialCounts.totalTransactions === 'number') ? officialCounts.totalTransactions : (totalOrders || 'No data available')} color="blue" icon={<FiShoppingCart />} />
        <StatCard label="Successful" value={(officialCounts && typeof officialCounts.successful === 'number') ? officialCounts.successful : (paid || 'No data available')} color="purple" icon={<FiCheck />} />
        <StatCard label="Failed" value={(officialCounts && typeof officialCounts.failed === 'number') ? officialCounts.failed : (cancelled || 'No data available')} color="red" icon={<FiX />} />
        <StatCard label="Refunded" value={(officialCounts && typeof officialCounts.refunded === 'number') ? officialCounts.refunded : 'No data available'} color="amber" icon={<FiAlertTriangle />} />
        <StatCard label="Ready for Pickup" value={ready || 'No data available'} color="teal" icon={<MdQrCode2 />} />
        <StatCard label="Collected" value={collected || 'No data available'} color="green" icon={<FiCheck />} />
        <StatCard label="Revenue" value={(official && official.totalRevenue) ? `RWF ${Number(official.totalRevenue).toLocaleString()}` : (revenue ? `RWF ${revenue.toLocaleString()}` : 'No data available')} color="amber" icon={<FiBarChart2 />} />
        <StatCard label="Low Stock Alerts" value={lowStock || 'No data available'} color="coral" icon={<FiAlertTriangle />} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-5">
        {[
          { label:"New Order",   icon:<FiPlus />,         page:"orders"     },
          { label:"Add Product", icon:<FiBox />,           page:"products"   },
          { label:"Scan QR",     icon:<MdQrCode2 />,      page:"qrcodes"    },
          { label:"Collections", icon:<FiPackage />,       page:"collection" },
          { label:"Stock Check", icon:<FiDatabase />,      page:"inventory"  },
          { label:"Reports",     icon:<FiBarChart2 />,     page:"reports"    },
          { label:"Customers",   icon:<FiUsers />,         page:"customers"  },
          { label:"Settings",    icon:<FiSettings />,      page:"settings"   },
        ].map(({ label, icon, page }) => (
          <button key={label} onClick={() => setPage(page)} className="vc-tile">
            <div className="vc-tile-icon" style={{ color: COLORS.amber.solid }}>{icon}</div>
            <span className="vc-tile-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="vc-chart">
          <div className="vc-chart-title">Weekly Revenue (RWF M)</div>
          { (WEEKLY_REVENUE || []).length === 0 ? (
            <div className="p-4 vc-txt3">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={WEEKLY_REVENUE} barCategoryGap="30%">
                <XAxis dataKey="day" tick={{ fontSize:10, fill:"#888780" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:"#888780" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}M`} />
                <Tooltip formatter={(v, n) => [n === "revenue" ? `RWF ${v}M` : v, n === "revenue" ? "Revenue" : "Orders"]} contentStyle={{ fontSize:12, borderRadius:8, border:"0.5px solid var(--brd)" }} />
                <Bar dataKey="revenue" fill={COLORS.amber.solid} radius={[4,4,0,0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="vc-chart">
          <div className="vc-chart-title">Order Status Distribution</div>
          <div className="flex flex-wrap gap-3 mb-2">
            {STATUS_PIE.map(s => (
              <div key={s.name} className="vc-legend-item"><span className="vc-legend-color" style={{ background: s.color }} />{s.name} {s.value}%</div>
            ))}
          </div>
          { (STATUS_PIE || []).length === 0 ? (
            <div className="p-4 vc-txt3">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={STATUS_PIE} dataKey="value" innerRadius={40} outerRadius={65} paddingAngle={2}>
                  {STATUS_PIE.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip formatter={v => `${v}%`} contentStyle={{ fontSize:12, borderRadius:8, border:"0.5px solid var(--brd)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent orders + low stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Recent Orders" icon={<FiShoppingCart />} action="View all" onAction={() => setPage("orders")}>
          <DataTable
            columns={[
              { key:"id",       label:"Order",    render:v => <span style={{ color:COLORS.blue.solid, fontWeight:500 }}>#{v}</span> },
              { key:"customer", label:"Customer"  },
              { key:"amount",   label:"Amount",   render:v => `RWF ${v.toLocaleString()}` },
              { key:"status",   label:"Status",   render:v => <Badge status={v} /> },
            ]}
            rows={(orders || []).slice(0,5).map(o => ({ id: o._id || o.id || '', customer: o.user?.name || o.customer || '', amount: o.totalAmount || o.amount || 0, status: o.status }))}
          />
        </Panel>

        <Panel title="Low Stock Alerts" icon={<FiAlertTriangle />} action="Manage stock" onAction={() => setPage("inventory")}>
          <DataTable
            columns={[
              { key:"name",   label:"Product" },
                { key:"stock",  label:"Stock",  render:(v,r) => <span style={{ color:v <= r.threshold ? COLORS.red.solid : "var(--txt)", fontWeight:500 }}>{v}</span> },
                { key:"stock_status",  label:"Status", render:(_v,r) => <Badge status={r.stock === 0 ? "critical" : r.stock <= r.threshold ? "low" : "ok"} /> },
            ]}
            rows={(products || []).slice(0,5).map(p => ({ ...p, threshold: p.threshold || 5 }))}
          />
        </Panel>
      </div>

      {/* Activity log */}
      <Panel title="Recent Activity" icon={<FiActivity />}>
        {(ACTIVITY_LOG || []).length === 0 ? (
          <div className="p-4 vc-txt3">No activity available</div>
        ) : (
          ACTIVITY_LOG.map((a, i) => (
            <div key={i} className="flex gap-2 py-2 border-b text-sm" style={{ borderColor: 'var(--brd)' }}>
              <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: a.color }} />
              <div>
                <span className="text-[var(--txt)]">{a.text}</span>
                {" "}<span className="text-[var(--txt3)]">· {a.time}</span>
              </div>
            </div>
          ))
        )}
      </Panel>
      
    </div>
  );
}

// ── ORDERS ────────────────────────────────────────────────────
function PageOrders({ orders = [] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [modalTab, setModalTab] = useState('summary');

  useEffect(() => {
    const handler = (e) => {
      if (e && e.detail && e.detail.order) {
        const ord = e.detail.order;
        setSelected(ord);
        setUpdateStatus(ord?.status || '');
      }
    };
    window.addEventListener('orderScanned', handler);
    const adminSearchHandler = (e) => { if (e && e.detail && e.detail.query) setSearch(e.detail.query); };
    window.addEventListener('admin-search', adminSearchHandler);
    return () => { window.removeEventListener('orderScanned', handler); window.removeEventListener('admin-search', adminSearchHandler); };
  }, []);

  // when selected changes, scroll the order row into view in the table
  useEffect(() => {
    if (!selected) return;
    const id = selected._id || selected.id;
    if (!id) return;
    const el = document.getElementById(`order-row-${id}`);
    if (el && typeof el.scrollIntoView === 'function') {
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      catch (e) { el.scrollIntoView(); }
    }
    // default to summary tab when opening
    setModalTab('summary');
  }, [selected]);

  const printInvoice = (order) => {
    if (!order) return;
    const items = order.items || [];
    const amt = order.totalAmount ?? order.amount ?? 0;
    const html = `
      <html><head><title>Invoice ${order._id || order.id}</title>
        <style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ddd}h2{margin-top:0}</style>
      </head><body>
        <h2>Invoice — Order ${order._id || order.id}</h2>
        <div><strong>Customer:</strong> ${order.user?.name || order.customer || ''}</div>
        <div><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</div>
        <br/>
        <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>
        ${items.map(it => `<tr><td>${it.name||it.product||''}</td><td>${it.qty||it.quantity||1}</td><td>${it.price||it.unitPrice||''}</td><td>${(it.qty||1)* (it.price||it.unitPrice||0)}</td></tr>`).join('')}
        </tbody></table>
        <h3>Total: ${amt}</h3>
      </body></html>`;
    const w = window.open('', '_blank');
    if (!w) return showToast('Pop-up blocked', 'error');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch (e) {} }, 500);
  };

  const loadScript = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });

  const downloadInvoicePDF = async (order) => {
    if (!order) return;
    try {
      // load html2canvas and jspdf if not already present
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      const container = document.createElement('div');
      container.style.position = 'fixed'; container.style.left = '-9999px'; container.style.top = '0'; container.style.width = '800px';
      const items = order.items || [];
      const amt = order.totalAmount ?? order.amount ?? 0;
      container.innerHTML = `
        <div style="font-family:Arial,Helvetica,sans-serif;padding:20px;width:760px;">
          <h2>Invoice — Order ${order._id || order.id}</h2>
          <div><strong>Customer:</strong> ${order.user?.name || order.customer || ''}</div>
          <div><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</div>
          <br/>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead><tr><th style="text-align:left;border-bottom:1px solid #ddd;padding:6px">Item</th><th style="border-bottom:1px solid #ddd;padding:6px">Qty</th><th style="border-bottom:1px solid #ddd;padding:6px">Price</th><th style="border-bottom:1px solid #ddd;padding:6px">Total</th></tr></thead>
            <tbody>
              ${items.map(it => `<tr><td style="padding:6px;border-bottom:1px solid #eee">${it.name||it.product||''}</td><td style="padding:6px;border-bottom:1px solid #eee">${it.qty||it.quantity||1}</td><td style="padding:6px;border-bottom:1px solid #eee">${it.price||it.unitPrice||''}</td><td style="padding:6px;border-bottom:1px solid #eee">${(it.qty||1)*(it.price||it.unitPrice||0)}</td></tr>`).join('')}
            </tbody>
          </table>
          <div style="text-align:right;margin-top:12px;font-weight:600">Total: ${amt}</div>
        </div>`;
      document.body.appendChild(container);
      // use html2canvas to render
      // @ts-ignore
      const canvas = await window.html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf || window.jspdf?.jsPDF ? window.jspdf : { jsPDF: window.jspdf?.jsPDF };
      const pdf = new jsPDF('p','pt','a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = { width: canvas.width, height: canvas.height };
      const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
      const imgWidth = imgProps.width * ratio;
      const imgHeight = imgProps.height * ratio;
      pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, 20, imgWidth, imgHeight);
      pdf.save(`invoice-${order._id || order.id}.pdf`);
      document.body.removeChild(container);
    } catch (e) {
      console.error(e);
      showToast('PDF generation failed', 'error');
    }
  };

  

  const filteredOrders = useMemo(() => (orders || []).filter(o => {
    const q = (search || "").toLowerCase();
    const id = (o && (o.id || o._id || '') ) || '';
    const customer = (o && (o.customer || (o.user && o.user.name) || '')) || '';
    const matchSearch = (id + ' ' + customer).toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || (o && o.status) === statusFilter;
    return matchSearch && matchStatus;
  }), [search, statusFilter, orders]);

  const rows = useMemo(() => (filteredOrders || []).map(o => ({
    id: o._id || o.id,
    customer: o.user?.name || o.customer || 'Unknown',
    items: (o.items && o.items.length) || 0,
    amount: o.totalAmount ?? o.amount ?? 0,
    payment: o.paymentMethod || o.paymentStatus || '—',
    status: o.status,
    date: o.createdAt ? new Date(o.createdAt).toLocaleString() : '',
    qrCode: o.qrCode || null,
  })), [filteredOrders]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-medium">Order Management</div>
        <Btn size="sm" variant="primary"><FiPlus size={13} />New Order</Btn>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
        {(() => {
          const all = (orders || []).length;
          const pending = (orders || []).filter(o => o.status === 'pending').length;
          const paid = (orders || []).filter(o => o.paymentStatus === 'paid' || o.status === 'paid').length;
          const ready = (orders || []).filter(o => o.status === 'ready').length;
          const collected = (orders || []).filter(o => o.status === 'collected').length;
          const cancelled = (orders || []).filter(o => o.status === 'cancelled').length;
          return [
            { label:"All", value: all || 'No data' },
            { label:"Pending", value: pending || 'No data', color:"amber" },
            { label:"Paid", value: paid || 'No data', color:"blue" },
            { label:"Ready", value: ready || 'No data', color:"teal" },
            { label:"Collected", value: collected || 'No data', color:"green" },
            { label:"Cancelled", value: cancelled || 'No data', color:"red" },
          ].map(s => <StatCard key={s.label} {...s} />);
        })()}
      </div>

      <Panel>
        <FilterRow>
          <SearchInput placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
          <Select className="max-w-[150px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            {["pending","paid","preparing","ready","collected","cancelled"].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
            ))}
          </Select>
          <Select className="max-w-[150px]" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
          </Select>
          <Btn size="sm" onClick={() => exportOrders(orders)}><FiDownload size={12} />Export</Btn>
        </FilterRow>
        <DataTable
          columns={[
            { key:"id",       label:"Order ID",  render:v => <span style={{ color:COLORS.blue.solid, fontWeight:500 }}>#{v}</span> },
            { key:"customer", label:"Customer"  },
            { key:"items",    label:"Items"     },
            { key:"amount",   label:"Amount",    render:v => `RWF ${v.toLocaleString()}` },
            { key:"payment",  label:"Payment"   },
            { key:"qrCode",   label:"QR Token",  render: v => (
                v ? (
                  <div className="flex items-center gap-2">
                    <code className="text-xs px-2 py-1 rounded-md bg-[var(--bg2)]">{(v||'').slice(0,20)}</code>
                    <Btn size="sm" onClick={async () => {
                      const ok = await copyText(v);
                      if (ok) {
                        showToast('Full QR token copied', 'success');
                        window.dispatchEvent(new CustomEvent('qrTokenCopied', { detail: { token: v } }));
                        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'collection' } }));
                      } else {
                        showToast('Copy failed — select and copy manually', 'error');
                      }
                    }}> <FiCopy size={12} /> Copy</Btn>
                  </div>
                ) : (<span className="text-[var(--txt3)]">—</span>)
            ) },
            { key:"status",   label:"Status",    render:v => <Badge status={v} /> },
            { key:"date",     label:"Date",      render:v => <span className="text-[var(--txt3)]">{v}</span> },
          ]}
          rows={rows}
          onRowAction={row => (
            <Btn size="sm" onClick={() => {
              const origRaw = (orders || []).find(o => (o._id||o.id) === row.id);
              const orig = origRaw ? sanitizeOrder(origRaw) : sanitizeOrder({ _id: row.id, id: row.id, status: row.status, items: row.items || [], totalAmount: row.amount || 0, qrCode: row.qrCode });
              setSelected(orig);
              setUpdateStatus(orig?.status || row.status);
            }}>View</Btn>
          )}
        />
      </Panel>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Order #${selected?.id} — Details`}
          footer={<> 
            <Btn size="sm" onClick={() => printInvoice(selected)}><FiPrinter size={12} /> Print Invoice</Btn>
            <Btn size="sm" onClick={() => downloadInvoicePDF(selected)}><FiDownload size={12} /> Download PDF</Btn>
            <Btn size="sm" variant="primary" onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                if (!token) return showToast('Not authenticated', 'error');
                const id = selected._id || selected.id;
                const res = await fetch((import.meta.env.VITE_API_BASE || 'http://localhost:5000') + `/api/orders/${id}/status`, {
                  method: 'PATCH', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: updateStatus })
                });
                const body = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(body.message || 'Update failed');
                showToast(`Order updated to ${updateStatus}`, 'success');
                const updated = body.order ? sanitizeOrder(body.order) : sanitizeOrder({ ...selected, status: updateStatus });
                setSelected(updated);
                window.dispatchEvent(new CustomEvent('order-updated', { detail: { order: updated } }));
              } catch (err) {
                showToast(err.message || 'Save failed', 'error');
              }
            }}>Save Changes</Btn>
            <Btn size="sm" onClick={() => setSelected(null)}>Close</Btn>
          </>}
        >
        {selected && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Btn size="sm" variant={modalTab==='summary' ? 'primary' : 'secondary'} onClick={() => setModalTab('summary')}>Summary</Btn>
              <Btn size="sm" variant={modalTab==='invoice' ? 'primary' : 'secondary'} onClick={() => setModalTab('invoice')}>Invoice</Btn>
              <div className="ml-auto flex gap-2">
                <Btn size="sm" onClick={() => printInvoice(selected)}><FiPrinter size={12}/> Print</Btn>
                <Btn size="sm" onClick={() => downloadInvoicePDF(selected)}><FiDownload size={12}/> Download PDF</Btn>
              </div>
            </div>

            {modalTab === 'summary' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                                  <div className="mb-3">
                                    <label className="text-xs text-[var(--txt3)] block mb-2">Update Status</label>
                                    <Select value={updateStatus} onChange={e => setUpdateStatus(e.target.value)}>
                                      {['pending','paid','preparing','ready','collected','cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                                    </Select>
                                  </div>
                  {(() => {
                    const amt = selected.totalAmount ?? selected.amount ?? 0;
                    const rows = [
                      ["Customer",  selected.user?.name || selected.customer ],
                      ["Status",    <Badge status={selected.status} />],
                      ["Payment",   selected.paymentMethod || selected.payment  ],
                      ["Items",     `${(selected.items && selected.items.length) || selected.items || 0} item(s)` ],
                      ["Amount",    amt ? `RWF ${Number(amt).toLocaleString()}` : 'No data'],
                      ["Date",      selected.createdAt ? new Date(selected.createdAt).toLocaleString() : selected.date || ''],
                      ["QR Token",  selected.qrCode ? (
                        <div className="flex flex-col gap-2 items-start">
                          <div className="flex items-center gap-2">
                            <code className="text-xs px-2 py-1 rounded-md bg-[var(--bg2)] break-words">{selected.qrCode}</code>
                            <Btn size="sm" onClick={async () => {
                              const ok = await copyText(selected.qrCode);
                              if (ok) {
                                showToast('QR token copied', 'success');
                                window.dispatchEvent(new CustomEvent('qrTokenCopied', { detail: { token: selected.qrCode } }));
                                window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'collection' } }));
                              } else {
                                showToast('Copy failed', 'error');
                              }
                            }}><FiCopy size={12} /> Copy</Btn>
                          </div>
                          <div>
                            <img alt="qr" src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(selected.qrCode)}`} className="w-[120px] h-[120px] object-contain rounded-md" style={{ border: '1px solid var(--brd)' }} />
                          </div>
                        </div>
                      ) : '—'],
                    ];
                    return rows.map(([k,v]) => (
                      <div key={k}><span className="text-[var(--txt3)]">{k}</span><div className="font-medium mt-1">{v}</div></div>
                    ));
                  })()}
                </div>
              </>
            )}

            {modalTab === 'invoice' && (
              <div className="p-3 border rounded-md bg-[var(--bg)]" style={{ borderColor: 'var(--brd2)' }}>
                <h3 className="mt-0">Invoice — Order {selected._id || selected.id}</h3>
                <div className="flex justify-between mb-3">
                  <div><strong>Customer:</strong> {selected.user?.name || selected.customer}</div>
                  <div><strong>Date:</strong> {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ''}</div>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr><th className="text-left border-b p-2" style={{ borderColor: 'var(--brd)' }}>Item</th><th className="border-b p-2" style={{ borderColor: 'var(--brd)' }}>Qty</th><th className="border-b p-2" style={{ borderColor: 'var(--brd)' }}>Price</th><th className="border-b p-2" style={{ borderColor: 'var(--brd)' }}>Total</th></tr>
                  </thead>
                  <tbody>
                    {(selected.items||[]).map((it,i) => (
                      <tr key={i}><td className="p-2 border-b" style={{ borderColor: 'var(--brd)' }}>{it.name||it.product||''}</td><td className="p-2 border-b" style={{ borderColor: 'var(--brd)' }}>{it.qty||it.quantity||1}</td><td className="p-2 border-b" style={{ borderColor: 'var(--brd)' }}>{it.price||it.unitPrice||''}</td><td className="p-2 border-b" style={{ borderColor: 'var(--brd)' }}>{(it.qty||1)*(it.price||it.unitPrice||0)}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-right mt-3 font-semibold">Total: {selected.totalAmount ?? selected.amount ?? 0}</div>
              </div>
            )}

            

            <FormGroup label="Update Status">
              <Select value={updateStatus} onChange={e => setUpdateStatus(e.target.value)}>
                {["pending","paid","preparing","ready","collected","cancelled"].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                ))}
              </Select>
            </FormGroup>
          </>
        )}
      </Modal>
    </div>
  );
}

// ── PRODUCTS ──────────────────────────────────────────────────
function PageProducts({ products = [], setProducts }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name:"", category:"Electronics", price:"", stock:"", sku:"", status:"active", description:"", image: "" });

  const filtered = useMemo(() => (products || []).filter(p => {
    const q = search.toLowerCase();
    const matchSearch = (p.name||'').toLowerCase().includes(q) || (p.sku||'').toLowerCase().includes(q);
    const matchCat = catFilter === "all" || (p.category||'').toLowerCase() === (catFilter||'').toLowerCase();
    return matchSearch && matchCat;
  }), [search, catFilter, products]);

  const openAdd = () => { setEditing(null); setForm({ name:"", category:"Electronics", price:"", stock:"", sku:"", status:"active", description:"", image: "" }); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name:p.name, category:p.category, price:p.price, stock:p.stock, sku:p.sku, status:p.status, description:p.description||'', image: p.image||p.img||'' }); setShowModal(true); };

  const fetchProducts = async (q = search, cat = catFilter) => {
    try {
      const qs = new URLSearchParams();
      if (q) qs.set('search', q);
      if (cat && cat !== 'all') qs.set('category', cat);
      const res = await fetch(`${API_BASE}/api/products?${qs.toString()}`);
      const data = await safeParseResponse(res);
      if (res.ok) setProducts(data.products || []);
      else showToast(data.message || data._text || 'Failed to load products', 'error');
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    // initial load and on filter change (debounced)
    const t = setTimeout(() => fetchProducts(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, catFilter]);

  const saveProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/products${editing ? '/' + editing._id || editing.id : ''}`, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...(token?{ Authorization: `Bearer ${token}` }:{}) },
        body: JSON.stringify({ name: form.name, category: form.category, price: Number(form.price||0), stock: Number(form.stock||0), sku: form.sku, status: form.status, description: form.description, image: form.image }),
      });
      const data = await safeParseResponse(res);
      if (!res.ok) throw new Error(data.message || data._text || 'Failed');
      // refresh product list
      await fetchProducts();
      setShowModal(false);
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error');
    }
  };

  const deleteProduct = async (row) => {
    window.dispatchEvent(new CustomEvent('app-confirm', { detail: { message: `Delete product "${row.name}"?`, onConfirm: async () => {
      try {
        const token = localStorage.getItem('token');
        const id = row._id || row.id;
        const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE', headers: { ...(token?{ Authorization:`Bearer ${token}` }:{}) } });
        if (!res.ok) throw new Error('Failed to delete');
        await fetchProducts();
        showToast('Product deleted', 'success');
      } catch (e) { showToast(e.message || 'Failed to delete', 'error'); }
    } } }));
    return;
  };

  const [fileUploading, setFileUploading] = useState(false);
  const uploadFile = async (file) => {
    if (!file) return null;
    setFileUploading(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/api/uploads`, { method: 'POST', body: fd, headers: { ...(token?{ Authorization:`Bearer ${token}` }:{}) } });
      const data = await safeParseResponse(res);
      if (!res.ok) throw new Error(data.message || data._text || 'Upload failed');
      setForm(f => ({ ...f, image: data.url }));
      return data.url;
    } catch (e) { showToast(e.message || 'Upload failed', 'error'); return null; }
    finally { setFileUploading(false); }
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:500 }}>Product Management</div>
        <Btn size="sm" variant="primary" onClick={openAdd}><FiPlus size={13} />Add Product</Btn>
      </div>

      <Panel>
        <FilterRow>
          <SearchInput placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          <Select style={{ maxWidth:160 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {["Electronics","Groceries","Clothing","Beverages","Essentials","Sports","Toys","Beauty"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Btn size="sm"><FiRefreshCw size={12} />Bulk Update</Btn>
        </FilterRow>
        <DataTable
          columns={[
            { key:"name",     label:"Product",  render:(v,r) => <div><div style={{ fontWeight:500 }}>{v}</div><div style={{ fontSize:11, color:"var(--txt3)" }}>{r.sku}</div></div> },
            { key:"category", label:"Category" },
            { key:"price",    label:"Price",    render:v => `RWF ${v.toLocaleString()}` },
            { key:"stock",    label:"Stock",    render:(v,r) => <StockBar stock={v} threshold={r.threshold} /> },
            { key:"status",   label:"Status",   render:v => <Badge status={v} /> },
          ]}
          rows={filtered}
          onRowAction={row => (
            <div style={{ display:"flex", gap:5 }}>
              <Btn size="sm" onClick={() => openEdit(row)}><FiEdit2 size={12} /></Btn>
              <Btn size="sm" variant="danger" onClick={() => deleteProduct(row)}><FiTrash2 size={12} /></Btn>
            </div>
          )}
        />
      </Panel>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? `Edit: ${editing.name}` : "Add Product"}
        footer={<> 
          <Btn size="sm" onClick={() => setShowModal(false)}>Cancel</Btn>
          <Btn size="sm" variant="primary" onClick={saveProduct}>Save Product</Btn>
        </>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div style={{ gridColumn:"1/-1" }}><FormGroup label="Product Name"><Input value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Product name" /></FormGroup></div>
          <FormGroup label="Category"><Select value={form.category} onChange={e => setForm({...form,category:e.target.value})}>{["Electronics","Groceries","Clothing","Beverages","Essentials","Sports","Toys","Beauty"].map(c => <option key={c}>{c}</option>)}</Select></FormGroup>
          <FormGroup label="Price (RWF)"><Input type="number" value={form.price} onChange={e => setForm({...form,price:e.target.value})} placeholder="0" /></FormGroup>
          <FormGroup label="Stock Quantity"><Input type="number" value={form.stock} onChange={e => setForm({...form,stock:e.target.value})} placeholder="0" /></FormGroup>
          <FormGroup label="SKU"><Input value={form.sku} onChange={e => setForm({...form,sku:e.target.value})} placeholder="SKU-001" /></FormGroup>
          <div style={{ gridColumn:"1/-1" }}><FormGroup label="Description"><Textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Product description…" /></FormGroup></div>
          <FormGroup label="Status"><Select value={form.status} onChange={e => setForm({...form,status:e.target.value})}><option value="active">Active</option><option value="inactive">Inactive</option></Select></FormGroup>
          <div style={{ gridColumn:"1/-1" }}>
            <FormGroup label="Image URL"><Input value={form.image} onChange={e => setForm({...form,image:e.target.value})} placeholder="https://..." /></FormGroup>
            <FormGroup label="Or Upload Image">
              <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) uploadFile(f); }} />
              {fileUploading && <div style={{ fontSize:12, color:"var(--txt3)", marginTop:6 }}>Uploading…</div>}
            </FormGroup>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── CATEGORIES ────────────────────────────────────────────────
function PageCategories() {
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', emoji: '', status: 'active' });
  const [editingId, setEditingId] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

  const fetchCategories = async () => {
    try {
      const res = await fetch(API_BASE + '/api/categories');
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to load categories');
      setCategories(body.categories || []);
    } catch (err) {
      console.error('fetchCategories error', err);
      setCategories([]);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => { setEditingId(null); setForm({ name: '', emoji: '', status: 'active' }); setShowModal(true); };
  const openEdit = (cat) => { setEditingId(cat._id); setForm({ name: cat.name || '', emoji: cat.emoji || '', status: cat.status || 'active' }); setShowModal(true); };

  const saveCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      const opts = { headers: { 'Content-Type': 'application/json' } };
      if (token) opts.headers.Authorization = `Bearer ${token}`;
      const url = editingId ? `${API_BASE}/api/categories/${editingId}` : `${API_BASE}/api/categories`;
      const method = editingId ? 'PATCH' : 'POST';
      const safePayload = { name: form.name || '', emoji: form.emoji || '', status: form.status || 'active' };
      const res = await fetch(url, { method, headers: opts.headers, body: JSON.stringify(safePayload) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to save category');
      setShowModal(false);
      fetchCategories();
      showToast(editingId ? 'Category updated' : 'Category created', 'success');
    } catch (err) {
      console.error('saveCategory error', err);
        showToast(err.message || 'Failed to save category', 'error');
    }
  };

  const deleteCategory = async (id) => {
    // use global confirm modal
    window.dispatchEvent(new CustomEvent('app-confirm', { detail: {
      message: 'Delete this category?',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(API_BASE + `/api/categories/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.message || 'Failed to delete category');
          fetchCategories();
          showToast('Category deleted', 'success');
        } catch (err) {
          console.error('deleteCategory error', err);
          showToast(err.message || 'Failed to delete category', 'error');
        }
      }
    } }));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Category Management</div>
        <Btn size="sm" variant="primary" onClick={openAdd}><FiPlus size={13} />Add Category</Btn>
      </div>
      <Panel>
        <DataTable
          columns={[
            { key: 'name', label: 'Category', render: v => <span style={{ fontWeight: 500 }}>{v}</span> },
            { key: 'emoji', label: 'Icon' },
            { key: 'products', label: 'Products' },
            { key: 'status', label: 'Status', render: v => <Badge status={v} /> },
          ]}
          rows={categories.map(c => ({ ...c, products: c.products || 0 }))}
          onRowAction={row => (
            <div style={{ display: 'flex', gap: 5 }}>
              <Btn size="sm" onClick={() => openEdit(row)}><FiEdit2 size={12} /></Btn>
              <Btn size="sm" variant="danger" onClick={() => deleteCategory(row._id)}><FiTrash2 size={12} /></Btn>
            </div>
          )}
        />
      </Panel>
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Category' : 'Add Category'}
        footer={<><Btn size="sm" onClick={() => setShowModal(false)}>Cancel</Btn><Btn size="sm" variant="primary" onClick={saveCategory}>Save</Btn></>}
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <FormGroup label="Category Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Electronics" /></FormGroup>
          <FormGroup label="Icon (emoji)"><Input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} placeholder="🎮" /></FormGroup>
          <FormGroup label="Status"><Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></Select></FormGroup>
        </div>
      </Modal>
    </div>
  );
}

// ── INVENTORY ─────────────────────────────────────────────────
function PageInventory({ products = [], setProducts }) {
  const lowStock = (products || []).filter(p => (p.stock || 0) <= (p.threshold || 0));
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState('');

  const updateStock = async () => {
    if (!selectedProduct) return showToast('Select a product', 'error');
    const id = selectedProduct._id || selectedProduct.id;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token?{ Authorization: `Bearer ${token}` }:{}) },
        body: JSON.stringify({ stock: Number(newStock) }),
      });
      const data = await safeParseResponse(res);
      if (!res.ok) throw new Error(data.message || data._text || 'Failed to update');
      // optimistic update
      if (typeof setProducts === 'function') {
        setProducts(prev => (prev || []).map(p => ((p._id||p.id) === id ? { ...p, stock: Number(newStock) } : p)));
      }
      showToast('Stock updated', 'success');
      setShowUpdateModal(false);
      setSelectedProduct(null);
      setNewStock('');
    } catch (e) {
      showToast(e.message || 'Update failed', 'error');
    }
  };
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:500 }}>Inventory Management</div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn size="sm" onClick={() => exportProducts(products)}><FiDownload size={12} />Export Report</Btn>
          <Btn size="sm" variant="primary" onClick={() => setShowUpdateModal(true)}><FiRefreshCw size={12} />Update Stock</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Products" value="613"  color="blue"  icon={<FiBox />} />
        <StatCard label="In Stock"       value="595"  color="green" icon={<FiCheck />} />
        <StatCard label="Low Stock"      value="15"   color="amber" icon={<FiAlertTriangle />} />
        <StatCard label="Out of Stock"   value="3"    color="red"   icon={<FiX />} />
      </div>

      <Panel title="Low Stock & Critical Items" icon={<FiAlertTriangle />}>
        <DataTable
          columns={[
            { key:"name",      label:"Product",   render:v => <span style={{ fontWeight:500 }}>{v}</span> },
            { key:"sku",       label:"SKU",       render:v => <span style={{ color:"var(--txt3)" }}>{v}</span> },
            { key:"category",  label:"Category"  },
            { key:"stock",        label:"Stock",     render:(v,r) => <span style={{ color:v<=r.threshold?COLORS.red.solid:v<=r.threshold*1.5?COLORS.amber.solid:"var(--txt)", fontWeight:500 }}>{v}</span> },
            { key:"threshold",    label:"Min",       render:v => <span style={{ color:"var(--txt3)" }}>{v}</span> },
            { key:"stock_level",  label:"Level",     render:(_v,r) => <StockBar stock={r.stock} threshold={r.threshold} /> },
          ]}
          rows={products}
          onRowAction={row => (
            <Btn size="sm" variant={row.stock <= row.threshold ? "primary" : "secondary"}>
              {row.stock <= row.threshold ? "Restock" : "Update"}
            </Btn>
          )}
        />
      </Panel>

      <Panel title="Stock Movement History" icon={<FiActivity />}>
        <DataTable
          columns={[
            { key:"product",  label:"Product" },
            { key:"type",     label:"Type",   render:v => <Badge status={v === "Restock" ? "paid" : "ready"} /> },
            { key:"change",   label:"Change", render:v => <span style={{ color:v > 0 ? COLORS.green.solid : COLORS.red.solid, fontWeight:500 }}>{v > 0 ? `+${v}` : v}</span> },
            { key:"newStock", label:"New Stock" },
            { key:"by",       label:"By" },
            { key:"date",     label:"Date",   render:v => <span style={{ color:"var(--txt3)" }}>{v}</span> },
          ]}
          rows={[]}
        />
      </Panel>
    </div>
  );
}

// ── PAYMENTS ──────────────────────────────────────────────────
function PagePayments({ orders = [] }) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  // derive simple payments list from orders
  const payments = (orders || []).map(o => ({ txn: o._id || o.id, order: o._id || o.id, customer: o.user?.name || o.customer || (o.user && o.user.name) || 'Guest', amount: o.totalAmount || o.amount || 0, method: o.paymentMethod || o.payment || '—', status: o.paymentStatus || (o.status === 'collected' ? 'success' : 'pending'), date: o.createdAt || o.date || '' }));
  const filtered = useMemo(() => payments.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = (p.txn || '').toLowerCase().includes(q) || (p.customer || '').toLowerCase().includes(q);
    const matchMethod = methodFilter === "all" || p.method === methodFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchMethod && matchStatus;
  }), [search, methodFilter, statusFilter, orders]);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:500 }}>Payment Management</div>
        <Btn size="sm" onClick={() => exportOrders(orders)}><FiDownload size={12} />Export Transactions</Btn>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Revenue" value="RWF 48.2M" color="green"  icon={<FiBarChart2 />} />
        <StatCard label="Successful"    value="1,241"      color="blue"   icon={<FiCheck />} />
        <StatCard label="Failed"        value="18"         color="red"    icon={<FiX />} />
        <StatCard label="Refunded"      value="7"          color="amber"  icon={<FiRefreshCw />} />
      </div>
      <Panel>
        <FilterRow>
          <SearchInput placeholder="Search transactions…" value={search} onChange={e => setSearch(e.target.value)} />
          <Select style={{ maxWidth:150 }} value={methodFilter} onChange={e => setMethodFilter(e.target.value)}>
            <option value="all">All Methods</option>
            {["MTN MoMo","Visa","Mastercard","Amex"].map(m => <option key={m}>{m}</option>)}
          </Select>
          <Select style={{ maxWidth:150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            {["success","failed","refunded"].map(s => <option key={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </Select>
        </FilterRow>
        <DataTable
          columns={[
            { key:"txn",      label:"Txn ID",    render:v => <span style={{ color:"var(--txt3)", fontSize:11 }}>{v}</span> },
            { key:"order",    label:"Order",     render:v => <span style={{ color:COLORS.blue.solid }}>#{v}</span> },
            { key:"customer", label:"Customer"  },
            { key:"amount",   label:"Amount",   render:v => `RWF ${v.toLocaleString()}` },
            { key:"method",   label:"Method"   },
            { key:"status",   label:"Status",   render:v => <Badge status={v} /> },
            { key:"date",     label:"Date",     render:v => <span style={{ color:"var(--txt3)" }}>{v}</span> },
          ]}
          rows={filtered}
        />
      </Panel>
    </div>
  );
}

// ── QR CODES ──────────────────────────────────────────────────
function PageQRCodes({ orders = [] }) {
  const qrOrders = (orders || []).filter(o => o.qrCode).map(o => ({
    _id: o._id,
    order: o._id, // fallback: show id if no order number
    customer: o.user?.name || (o.customer || 'Guest'),
    scanned: !!o.qrScanned,
    issued: o.qrScannedAt ? new Date(o.qrScannedAt).toLocaleString() : new Date(o.createdAt).toLocaleString(),
    status: o.status || (o.qrScanned ? 'collected' : 'ready'),
    qrCode: o.qrCode,
  }));

  const totalGenerated = qrOrders.length;
  const active = qrOrders.filter(q => !q.scanned).length;
  const scannedToday = qrOrders.filter(q => q.scanned && new Date(q.issued).toDateString() === new Date().toDateString()).length;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:500 }}>QR Code Management</div>
        <Btn size="sm" variant="primary"><MdQrCode2 size={14} />Generate QR</Btn>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Generated" value={String(totalGenerated || '—')} color="blue"  icon={<MdQrCode2 />} />
        <StatCard label="Active"          value={String(active || '—')} color="teal"  icon={<FiCheck />} />
        <StatCard label="Scanned Today"   value={String(scannedToday || '—')} color="green" icon={<FiEye />} />
        <StatCard label="Expired"         value="—"   color="red"   icon={<FiX />} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
        {qrOrders.slice(0,8).map((q, i) => (
          <div key={q._id || i} style={{ background:"var(--bg2)", border:"0.5px solid var(--brd)", borderRadius:12, padding:14, textAlign:"center" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}>
              {q.qrCode ? (
                <img alt="qr" src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(q.qrCode)}`} style={{ width:120, height:120, objectFit:'contain' }} />
              ) : (
                <div style={{ width:120, height:120, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg3)', borderRadius:8 }}>No QR</div>
              )}
            </div>
            <div style={{ fontSize:12, fontWeight:500, color:"var(--txt)" }}>{q.qrCode?.slice(0,8) || ('#' + q.order)}</div>
            <div style={{ fontSize:10, color:"var(--txt3)", margin:"2px 0" }}>{q.customer}</div>
            <div style={{ marginTop:4 }}><Badge status={q.status} /></div>
          </div>
        ))}
      </div>

      <Panel title="QR Scan History" icon={<FiActivity />}>
        <DataTable
          columns={[
            { key:"order",    label:"Order",     render:v => <span style={{ color:COLORS.blue.solid }}>#{v.toString().slice(0,8)}</span> },
            { key:"customer", label:"Customer"  },
            { key:"scanned",   label:"Result",    render:v => <Badge status={v ? "collected" : "valid"} /> },
            { key:"issued",   label:"Time",      render:v => <span style={{ color:"var(--txt3)" }}>{v}</span> },
          ]}
          rows={qrOrders}
        />
      </Panel>
    </div>
  );
}

// ── COLLECTION ────────────────────────────────────────────────
function PageCollection({ orders = [], setOrders }) {
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const scanInterval = useRef(null);

  const readyQueue = (orders || []).filter(o => ['ready','preparing','paid'].includes(o.status));

  useEffect(() => {
    const handler = (e) => { if (e && e.detail && e.detail.token) { setQrInput(e.detail.token); } };
    window.addEventListener('qrTokenCopied', handler);
    return () => window.removeEventListener('qrTokenCopied', handler);
  }, []);

  useEffect(() => {
    return () => { if (scanInterval.current) { clearInterval(scanInterval.current); scanInterval.current = null; } };
  }, []);

  const verifyQR = async () => {
    if (!qrInput) return showToast('Enter QR token', 'error');
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const code = (qrInput||'').trim();
      const res = await fetch(`${API_BASE}/api/orders/scan`, { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}) }, body: JSON.stringify({ qrCode: code }) });
      const data = await safeParseResponse(res);
      if (!res.ok) throw new Error(data.message || data._text || 'Scan failed');
      showToast(data.message || 'Scanned', 'success');
      // update local orders state to reflect scanned change
      if (setOrders && data.order) setOrders(prev => (prev || []).map(o => o._id === data.order._id ? data.order : o));
      setQrInput('');
      // navigate to orders and show full order details in modal
      window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'orders' } }));
      // allow the orders page to mount, then send the scanned order for display
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('orderScanned', { detail: { order: data.order } }));
      }, 180);
    } catch (err) {
      showToast(err.message || 'Failed to verify QR', 'error');
    } finally { setLoading(false); }
  };

  const startScan = async () => {
    if (!('mediaDevices' in navigator)) return showToast('Camera not supported', 'error');
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      if (window.BarcodeDetector) {
        const bd = new BarcodeDetector({ formats: ['qr_code'] });
        scanInterval.current = setInterval(async () => {
          try {
            const results = await bd.detect(videoRef.current);
              if (results && results.length) {
              const token = results[0].rawValue;
              showToast('QR detected', 'success');
              setQrInput(token);
              window.dispatchEvent(new CustomEvent('qrTokenCopied', { detail: { token } }));
              window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'collection' } }));
              stopScan();
            }
          } catch (e) { /* ignore */ }
        }, 500);
      } else {
        showToast('BarcodeDetector not supported', 'error');
      }
    } catch (e) {
      showToast('Camera permission denied', 'error');
      setScanning(false);
    }
  };

  const stopScan = () => {
    setScanning(false);
    if (scanInterval.current) { clearInterval(scanInterval.current); scanInterval.current = null; }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:500 }}>Product Collection</div>
        <div style={{ display:'flex', gap:8 }}>
          <input placeholder="Enter QR token" value={qrInput} onChange={e => setQrInput(e.target.value)} style={{ padding:'6px 8px', borderRadius:8, border:'1px solid var(--brd)' }} />
          <Btn size="sm" onClick={async () => {
              try {
              const text = await navigator.clipboard.readText();
              if (text) { setQrInput(text.trim()); showToast('Pasted from clipboard', 'info'); }
              else showToast('Clipboard empty', 'error');
            } catch (e) { showToast('Clipboard read failed', 'error'); }
          }}>Paste</Btn>
          <Btn size="sm" onClick={() => { if (!scanning) startScan(); else stopScan(); }}>{scanning ? 'Stop' : 'Scan'}</Btn>
          <Btn size="sm" variant="primary" onClick={verifyQR} disabled={loading}><MdQrCode2 size={14} />Verify QR</Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Ready for Pickup"   value={String(readyQueue.length || '—')}    color="teal"  icon={<FiPackage />} />
        <StatCard label="Collected Today"    value="—"    color="green" icon={<FiCheck />} />
        <StatCard label="Total Collections"  value={String((orders || []).filter(o => o.qrScanned).length || '—')}   color="blue"  icon={<FiBarChart2 />} />
        <StatCard label="Avg Wait Time"      value="—" color="amber" icon={<FiClock />} />
      </div>

      <Panel title="Ready for Pickup Queue" icon={<FiPackage />}>
        <DataTable
          columns={[
            { key:"order",    label:"Order",   render:v => <span style={{ color:COLORS.blue.solid, fontWeight:500 }}>#{v.toString().slice(0,8)}</span> },
            { key:"customer", label:"Customer" },
            { key:"items",    label:"Items",   render:(v,r) => `${(r.items||[]).length} item(s)` },
            { key:"wait",     label:"Waiting", render:(v,r) => <span style={{ color:r.waitColor, fontWeight:500 }}>{v || '—'}</span> },
          ]}
          rows={readyQueue.map(o => ({ order: o._id, customer: o.user?.name || 'Guest', items: o.items, wait: '' }))}
          onRowAction={() => <Btn size="sm" variant="primary">Confirm</Btn>}
        />
      </Panel>

      <Panel title="Collection Log — Today" icon={<FiCheck />}>
        <DataTable
          columns={[
            { key:"order",    label:"Order",        render:v => <span style={{ color:COLORS.blue.solid }}>#{v.toString().slice(0,8)}</span> },
            { key:"customer", label:"Customer"     },
            { key:"items",    label:"Verified By",  render:() => "Staff" },
            { key:"wait",     label:"Collected At", render:(v,r) => r.qrScannedAt ? new Date(r.qrScannedAt).toLocaleString() : '—' },
            { key:"status",   label:"Status",       render:(v,r) => <Badge status={r.status || (r.qrScanned ? 'collected' : 'ready')} /> },
          ]}
          rows={(orders || []).filter(o => o.qrScanned).map(o => ({ order: o._id, customer: o.user?.name || 'Guest', items: o.items, qrScannedAt: o.qrScannedAt, status: o.status }))}
        />
      </Panel>
    </div>
  );
}

// ── CUSTOMERS ─────────────────────────────────────────────────
function PageCustomers({ orders = [] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const colors = ["blue","purple","teal","amber","green","coral"];
  // derive customers from orders
  const customers = useMemo(() => {
    const map = {};
    (orders || []).forEach(o => {
      const email = o.user?.email || o.customer || 'unknown';
      if (!map[email]) map[email] = { id: email, name: o.user?.name || o.customer || 'Guest', email, orders: 0, spent: 0, joined: o.createdAt || '', status: 'active' };
      map[email].orders += (o.items || []).length || 1;
      map[email].spent += o.totalAmount || o.amount || 0;
    });
    return Object.values(map);
  }, [orders]);

  const filtered = useMemo(() => customers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  }), [search, statusFilter, customers]);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:500 }}>Customer Management</div>
        <Btn size="sm" onClick={() => {
          const rows = filtered.map(c => ({ id: c.id, name: c.name, email: c.email, orders: c.orders, spent: c.spent, joined: c.joined, status: c.status }));
          const csv = arrayToCSV(rows, ['id','name','email','orders','spent','joined','status']);
          downloadCSV(`customers-${new Date().toISOString().slice(0,10)}.csv`, csv);
        }}><FiDownload size={12} />Export</Btn>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Customers"   value="2,847" color="blue"  icon={<FiUsers />} />
        <StatCard label="Active"            value="2,614" color="green" icon={<FiCheck />} />
        <StatCard label="New This Month"    value="143"   color="amber" icon={<FiUser />} />
        <StatCard label="Suspended"         value="12"    color="red"   icon={<FiX />} />
      </div>
      <Panel>
        <FilterRow>
          <SearchInput placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
          <Select style={{ maxWidth:150 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
        </FilterRow>
        <DataTable
          columns={[
            { key:"name",   label:"Customer",  render:(v,r) => <div style={{ display:"flex", alignItems:"center", gap:8 }}><Avatar name={v} color={colors[r.id % colors.length]} /><span style={{ fontWeight:500 }}>{v}</span></div> },
            { key:"email",  label:"Email",     render:v => <span style={{ color:"var(--txt3)" }}>{v}</span> },
            { key:"orders", label:"Orders"    },
            { key:"spent",  label:"Total Spent", render:v => `RWF ${v.toLocaleString()}` },
            { key:"joined", label:"Joined",    render:v => <span style={{ color:"var(--txt3)" }}>{v}</span> },
            { key:"status", label:"Status",    render:v => <Badge status={v} /> },
          ]}
          rows={filtered}
          onRowAction={() => <Btn size="sm">View</Btn>}
        />
      </Panel>
    </div>
  );
}

// ── STAFF ─────────────────────────────────────────────────────
function PageStaff() {
  const [showModal, setShowModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', role: 'Staff', password: '' });
  const [selected, setSelected] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_BASE || 'http://localhost:5000') + '/api/auth/users', { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Failed to fetch users');
      setStaffList(body.users || []);
    } catch (err) {
      console.error('fetchStaff error', err);
      showToast(err.message || 'Failed to load staff', 'error');
    }
  };

  const toggleSelect = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const deleteSelected = async () => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    if (ids.length === 0) return showToast('No staff selected', 'error');
    window.dispatchEvent(new CustomEvent('app-confirm', { detail: {
      message: `Delete ${ids.length} user(s)?`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          for (const id of ids) {
            await fetch((import.meta.env.VITE_API_BASE || 'http://localhost:5000') + `/api/auth/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
          }
          showToast('Deleted selected users', 'success');
          setSelected({});
          fetchStaff();
        } catch (err) {
          console.error('deleteSelected', err);
          showToast('Failed to delete selected users', 'error');
        }
      }
    } }));
  };
  const selectAll = () => {
    const all = {};
    staffList.forEach(s => { all[s._id] = true; });
    setSelected(all);
  };
  const clearSelection = () => setSelected({});

  const handleAddStaff = async (e) => {
    e.preventDefault();
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('You must be signed in as an admin to add staff.', 'error');
      return;
    }

    // Map UI roles to backend roles. Default 'Staff' -> 'cashier'.
    const role = (staffForm.role === 'Admin') ? 'admin' : (staffForm.role === 'Cashier' ? 'cashier' : 'cashier');
    const password = staffForm.password || `Temp!${Date.now().toString().slice(-6)}`;

    try {
      const res = await fetch((import.meta.env.VITE_API_BASE || 'http://localhost:5000') + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: staffForm.name || 'Unnamed', email: staffForm.email, password, role }),
      });
      const body = await res.json();
      if (!res.ok) {
        const msg = body && body.message ? body.message : 'Failed to create staff';
        showToast(msg, 'error');
        return;
      }

      const created = body.user;
      const newStaff = {
        _id: created._id || Date.now().toString(),
        name: created.name || staffForm.name || 'Unnamed',
        email: created.email || staffForm.email || '',
        role: created.role || role,
        lastLogin: '',
        status: 'active',
      };
      setStaffList(prev => [newStaff, ...prev]);
      setShowModal(false);
      setStaffForm({ name: '', email: '', role: 'Staff', password: '' });
      console.log('Created staff', newStaff);
      // If we auto-generated a password, show it so admin can share it with the new user
      if (!staffForm.password) {
        try { await navigator.clipboard.writeText(password); } catch (e) { /* ignore */ }
        showToast(`Created ${created.email} — temporary password copied to clipboard`, 'success');
      }
    } catch (err) {
      console.error('Add staff error', err);
      showToast(err.message || 'Failed to add staff', 'error');
    }
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:500 }}>Staff Management</div>
        <Btn size="sm" variant="primary" onClick={() => setShowModal(true)}><FiPlus size={13} />Add Staff</Btn>
      </div>
      <Panel title="Team Members" icon={<FiShield />}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <div style={{ display:'flex', gap:8 }}>
            <Btn size="sm" onClick={() => fetchStaff()}>Refresh</Btn>
            <Btn size="sm" onClick={selectAll}>Select All</Btn>
            <Btn size="sm" onClick={clearSelection}>Clear</Btn>
            <Btn size="sm" variant="danger" onClick={deleteSelected}>Delete Selected</Btn>
          </div>
          <div style={{ fontSize:13, color:'var(--txt3)' }}>{Object.keys(selected).filter(k=>selected[k]).length} selected</div>
        </div>
        <DataTable
          columns={[
            { key:"select", label:"", render:(v,r) => <input type="checkbox" checked={!!selected[r._id]} onChange={() => toggleSelect(r._id)} /> },
            { key:"name",      label:"Name",       render:v => <div style={{ display:"flex", alignItems:"center", gap:8 }}><Avatar name={v} color="purple" /><span style={{ fontWeight:500 }}>{v}</span></div> },
            { key:"email",     label:"Email",      render:v => <span style={{ color:"var(--txt3)" }}>{v}</span> },
            { key:"role",      label:"Role",       render:v => <Badge status={v} /> },
            { key:"lastLogin", label:"Last Login", render:v => <span style={{ color:"var(--txt3)" }}>{v}</span> },
            { key:"status",    label:"Status",     render:v => <Badge status={v} /> },
          ]}
          rows={staffList}
          onRowAction={(row) => <Btn size="sm" onClick={() => { setEditUser(row); setShowEditModal(true); }}>Edit</Btn>}
        />
      </Panel>
      <Panel title="Login History" icon={<FiActivity />}>
        <DataTable
          columns={[
            { key:"name",      label:"User"    },
            { key:"role",      label:"Action", render:() => <Badge status="active" /> },
            { key:"email",     label:"IP",     render:() => <span style={{ color:"var(--txt3)" }}>197.239.4.52</span> },
            { key:"lastLogin", label:"Time",   render:v => <span style={{ color:"var(--txt3)" }}>{v}</span> },
          ]}
          rows={staffList}
        />
      </Panel>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Staff Member">
        <form onSubmit={handleAddStaff}>
          <div style={{ display:"grid", gap:14 }}>
            <FormGroup label="Full Name">
              <Input placeholder="Jean Paul" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} />
            </FormGroup>
            <FormGroup label="Email">
              <Input type="email" placeholder="staff@quickcollect.rw" value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} />
            </FormGroup>
            <FormGroup label="Role">
              <Select value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                <option>Staff</option>
                <option>Cashier</option>
                <option>Admin</option>
              </Select>
            </FormGroup>
            <FormGroup label="Temporary Password">
              <Input type="password" placeholder="Min 8 characters" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} />
            </FormGroup>

            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:6 }}>
              <Btn size="sm" type="button" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn size="sm" variant="primary" type="submit">Add Staff</Btn>
            </div>
          </div>
        </form>
      </Modal>
      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditUser(null); }} title="Edit Staff Member">
        {editUser ? (
          <form onSubmit={async (e) => {
            e.preventDefault();
              try {
              const token = localStorage.getItem('token');
              if (!token) return showToast('Not authenticated', 'error');
              const id = editUser._id || editUser.id;
              const payload = { name: editUser.name, email: editUser.email, role: editUser.role };
              const res = await fetch((import.meta.env.VITE_API_BASE || 'http://localhost:5000') + `/api/auth/users/${id}`, {
                method: 'PATCH', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
              });
              const body = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(body.message || 'Failed to update user');
              // update local list
              setStaffList(prev => (prev || []).map(u => ((u._id||u.id) === (body.user._id||body.user.id) ? body.user : u)));
              setShowEditModal(false);
              setEditUser(null);
              showToast('User updated', 'success');
            } catch (err) {
              console.error('update user error', err);
              showToast(err.message || 'Failed to update user', 'error');
            }
          }}>
            <div style={{ display:'grid', gap:10 }}>
              <FormGroup label="Full Name"><Input value={editUser.name || ''} onChange={e => setEditUser({...editUser, name: e.target.value})} /></FormGroup>
              <FormGroup label="Email"><Input type="email" value={editUser.email || ''} onChange={e => setEditUser({...editUser, email: e.target.value})} /></FormGroup>
              <FormGroup label="Role">
                <Select value={editUser.role || 'cashier'} onChange={e => setEditUser({...editUser, role: e.target.value})}>
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="customer">Customer</option>
                </Select>
              </FormGroup>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <Btn size="sm" type="button" onClick={() => { setShowEditModal(false); setEditUser(null); }}>Cancel</Btn>
                <Btn size="sm" variant="primary" type="submit">Save</Btn>
              </div>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

// ── REPORTS ───────────────────────────────────────────────────
function PageReports({ orders = [] }) {
  const [period, setPeriod] = useState("month");
  const totalOrders = (orders || []).length;
  const successful = (orders || []).filter(o => o.paymentStatus === 'paid').length;
  const failed = (orders || []).filter(o => o.paymentStatus === 'failed' || o.paymentStatus === 'refunded').length;
  const revenue = (orders || []).reduce((s,o) => s + (o.paymentStatus === 'paid' ? (o.totalAmount || o.amount || 0) : 0), 0);
  const avg = totalOrders ? Math.round(revenue / totalOrders) : 0;
  const collectionRate = totalOrders ? Math.round(((orders || []).filter(o => o.status === 'collected').length / totalOrders) * 100) : 0;
  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:500 }}>Reports & Analytics</div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn size="sm" onClick={() => exportOrders(orders)}><FiDownload size={12} />PDF</Btn>
          <Btn size="sm" onClick={() => exportAll([], orders)}><FiDownload size={12} />Excel</Btn>
          <Btn size="sm" variant="primary"><FiPrinter size={12} />Print</Btn>
        </div>
      </div>
      <FilterRow>
        <Select style={{ maxWidth:160 }} value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </Select>
        <Select style={{ maxWidth:160 }}>
          <option>All Reports</option>
          <option>Sales</option>
          <option>Products</option>
          <option>Customers</option>
          <option>Inventory</option>
        </Select>
      </FilterRow>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Revenue"   value={revenue ? `RWF ${revenue.toLocaleString()}` : 'No data available'} color="green" icon={<FiBarChart2 />} />
        <StatCard label="Successful"     value={successful || 'No data available'} color="blue"  icon={<FiCheck />} />
        <StatCard label="Failed"         value={failed || 'No data available'} color="red"   icon={<FiX />} />
        <StatCard label="Avg Order Value" value={avg ? `RWF ${avg.toLocaleString()}` : 'No data available'} color="amber" icon={<FiCreditCard />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div style={{ background:"var(--bg2)", border:"0.5px solid var(--brd)", borderRadius:12, padding:16 }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:12, display:"flex", alignItems:"center", gap:6 }}><FiBarChart2 size={15} style={{ color:"var(--txt2)" }} />Monthly Revenue Trend</div>
          {(MONTHLY_TREND || []).length === 0 ? (
            <div style={{ padding:16, color:'var(--txt3)' }}>No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MONTHLY_TREND}>
                <XAxis dataKey="month" tick={{ fontSize:10, fill:"#888780" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:"#888780" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}M`} />
                <Tooltip formatter={v => [`RWF ${v}M`, "Revenue"]} contentStyle={{ fontSize:12, borderRadius:8 }} />
                <Line type="monotone" dataKey="revenue" stroke={COLORS.amber.solid} strokeWidth={2} dot={{ r:4, fill:COLORS.amber.solid }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ background:"var(--bg2)", border:"0.5px solid var(--brd)", borderRadius:12, padding:16 }}>
          <div style={{ fontSize:13, fontWeight:500, marginBottom:12, display:"flex", alignItems:"center", gap:6 }}><FiBarChart2 size={15} style={{ color:"var(--txt2)" }} />Revenue by Category</div>
          {(CAT_REVENUE || []).length === 0 ? (
            <div style={{ padding:16, color:'var(--txt3)' }}>No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={CAT_REVENUE} layout="vertical" barCategoryGap="25%">
                <XAxis type="number" tick={{ fontSize:10, fill:"#888780" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:"#888780" }} axisLine={false} tickLine={false} width={75} />
                <Tooltip formatter={v => [`${v}%`, "Revenue share"]} contentStyle={{ fontSize:12, borderRadius:8 }} />
                <Bar dataKey="pct" fill={COLORS.blue.solid} radius={[0,4,4,0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <Panel title="Summary Report" icon={<FiBarChart2 />}>
        <DataTable
          columns={[
            { key:"period",        label:"Period",       render:v => <span style={{ fontWeight:500 }}>{v}</span> },
            { key:"orders",        label:"Orders"       },
            { key:"revenue",       label:"Revenue"      },
            { key:"collections",   label:"Collections"  },
            { key:"cancellations", label:"Cancelled"    },
            { key:"refunds",       label:"Refunds"      },
          ]}
          rows={(MONTHLY_REPORT || []).length === 0 ? [] : MONTHLY_REPORT}
        />
      </Panel>
    </div>
  );
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
function PageNotifications({ promotions = [], setPromotions }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', content:'', image:'', published: false });

  const refresh = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/promotions/all`, { headers: { ...(token?{ Authorization:`Bearer ${token}` }:{}) } });
      const data = await safeParseResponse(res);
      if (res.ok) setPromotions(data.promotions || []);
      else showToast(data.message || data._text || 'Failed to load promotions', 'error');
    } catch (e) { /* ignore */ }
  };

  const save = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE}/api/promotions`;
      const safePromo = { title: form.title || '', content: form.content || '', image: form.image || '', published: !!form.published };
      console.log('DEBUG: POST promotions ->', url, safePromo, 'token?', !!token);
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}) }, body: JSON.stringify(safePromo) });
      const data = await safeParseResponse(res);
      if (!res.ok) throw new Error(data.message || data._text || 'Failed');
      setShowModal(false);
      refresh();
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
  };

  const togglePublish = async (p) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/promotions/${p._id}`, { method: 'PATCH', headers: { 'Content-Type':'application/json', ...(token?{ Authorization:`Bearer ${token}` }:{}) }, body: JSON.stringify({ published: !p.published }) });
      const data = await safeParseResponse(res);
      if (res.ok) refresh();
      else showToast(data.message || data._text || 'Failed to update', 'error');
    } catch (e) { /* ignore */ }
  };

  const remove = async (p) => {
    window.dispatchEvent(new CustomEvent('app-confirm', { detail: { message: 'Delete this promotion?', onConfirm: async () => {
      try {
        const token = localStorage.getItem('token');
        const id = p._id || p.id;
        const res = await fetch(`${API_BASE}/api/promotions/${id}`, { method: 'DELETE', headers: { ...(token?{ Authorization:`Bearer ${token}` }:{}) } });
        if (!res.ok) throw new Error('Failed to delete');
        setPromotions(prev => prev.filter(x => (x._id||x.id) !== id));
        showToast('Promotion deleted', 'success');
      } catch (e) { showToast(e.message || 'Failed to delete', 'error'); }
    } } }));
    return;
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:500 }}>Promotions & Notifications</div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn size="sm" onClick={() => refresh()}>Refresh</Btn>
          <Btn size="sm" variant="primary" onClick={() => setShowModal(true)}>New Promotion</Btn>
        </div>
      </div>
      <Panel>
        {(promotions || []).map((p, i) => (
          <div key={p._id || i} style={{ display:"flex", gap:10, padding:"12px 0", borderBottom:"0.5px solid var(--brd)" }}>
            <div style={{ width:60, height:60, borderRadius:8, background:'#fafafa', display:"flex", alignItems:"center", justifyContent:"center", overflow:'hidden', flexShrink:0 }}>
              {p.image ? <img src={p.image} alt="promo" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <FiBell size={28} />}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:"var(--txt)" }}>{p.title}</div>
                  <div style={{ fontSize:11, color:"var(--txt3)", marginTop:2 }}>{p.content}</div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <Btn size="sm" onClick={() => togglePublish(p)}>{p.published ? 'Unpublish' : 'Publish'}</Btn>
                  <Btn size="sm" variant="danger" onClick={() => remove(p)}>Delete</Btn>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Panel>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Promotion"
        footer={<><Btn size="sm" onClick={() => setShowModal(false)}>Cancel</Btn><Btn size="sm" variant="primary" onClick={save}>Create</Btn></>}
      >
        <div style={{ display:'grid', gap:10 }}>
          <FormGroup label="Title"><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></FormGroup>
          <FormGroup label="Content"><Textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} /></FormGroup>
          <FormGroup label="Image URL"><Input value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="https://..." /></FormGroup>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}><input type="checkbox" checked={form.published} onChange={e => setForm({...form, published: e.target.checked})} /> Publish immediately</label>
        </div>
      </Modal>
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────
function PageSettings() {
  const sections = [
    {
      title:"Company Information", icon:<FiSettings />,
      fields:[
        { label:"Company Name",    type:"text",     value:"QuickCollect Kigali"    },
        { label:"Email",           type:"email",    value:"admin@quickcollect.rw"  },
        { label:"Phone",           type:"text",     value:"+250 788 000 000"       },
        { label:"Address",         type:"text",     value:"KG 11 Ave, Kigali"      },
        { label:"Currency",        type:"select",   options:["RWF","USD","EUR"],  value:"RWF" },
      ],
    },
    {
      title:"QR Code Settings", icon:<MdQrCode2 />,
      fields:[
        { label:"QR Expiry (hours)",       type:"number", value:"24" },
        { label:"Prevent Duplicate Scan",  type:"select", options:["Enabled","Disabled"], value:"Enabled" },
        { label:"Auto-generate on payment",type:"select", options:["Yes","No"], value:"Yes" },
        { label:"QR Code Size",            type:"select", options:["200×200","300×300","400×400"], value:"300×300" },
      ],
    },
    {
      title:"Payment Gateway", icon:<FiCreditCard />,
      fields:[
        { label:"MTN MoMo API Key",       type:"password", value:"••••••••••" },
        { label:"Visa/Mastercard API Key", type:"password", value:"••••••••••" },
        { label:"Mode",                    type:"select", options:["Live","Test"], value:"Live" },
      ],
    },
    {
      title:"Security", icon:<FiShield />,
      fields:[
        { label:"JWT Session Expiry",   type:"select", options:["1 hour","8 hours","24 hours"], value:"8 hours" },
        { label:"Login Attempt Limit",  type:"number", value:"5" },
        { label:"Audit Logs",           type:"select", options:["Enabled","Disabled"], value:"Enabled" },
        { label:"2FA for Admins",       type:"select", options:["Required","Optional"], value:"Required" },
        { label:"Email Notifications",  type:"select", options:["Enabled","Disabled"], value:"Enabled" },
      ],
    },
  ];

  return (
    <div>
      <div style={{ fontSize:18, fontWeight:500, marginBottom:16 }}>System Settings</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(section => (
          <Panel key={section.title} title={section.title} icon={section.icon}>
            <div style={{ display:"grid", gap:12 }}>
              {section.fields.map(f => (
                <FormGroup key={f.label} label={f.label}>
                  {f.type === "select" ? (
                    <Select defaultValue={f.value}>{f.options.map(o => <option key={o}>{o}</option>)}</Select>
                  ) : (
                    <Input type={f.type} defaultValue={f.value} />
                  )}
                </FormGroup>
              ))}
              <Btn size="sm" variant="primary" style={{ marginTop:4 }}>Save Changes</Btn>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [page, setPage] = useState("overview");
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  // use global app toasts via App.jsx; remove local toast state

  // CSS variables via inline style on root
  const themeVars = dark ? {
    "--bg": "#1a1a18", "--bg2": "#23231f", "--bg3": "#2c2c2a",
    "--txt": "#f1efe8", "--txt2": "#b4b2a9", "--txt3": "#888780",
    "--brd": "rgba(255,255,255,0.09)", "--brd2": "rgba(255,255,255,0.15)",
  } : {
    "--bg": "#f8f8f7", "--bg2": "#ffffff", "--bg3": "#f0efeb",
    "--txt": "#1a1a18", "--txt2": "#5f5e5a", "--txt3": "#888780",
    "--brd": "rgba(0,0,0,0.09)", "--brd2": "rgba(0,0,0,0.15)",
  };

  const PAGES = {
    overview:      ({ products, orders, promotions }) => <PageOverview setPage={setPage} products={products} orders={orders} promotions={promotions} />,
    orders:        ({ orders }) => <PageOrders orders={orders} />,
    payments:      ({ orders }) => <PagePayments orders={orders} />,
    qrcodes:       ({ orders }) => <PageQRCodes orders={orders} />,
    collection:    ({ orders, setOrders }) => <PageCollection orders={orders} setOrders={setOrders} />,
    products:      ({ products, setProducts }) => <PageProducts products={products} setProducts={setProducts} />,
    categories:    ({}) => <PageCategories />,
    inventory:     ({ products, setProducts }) => <PageInventory products={products} setProducts={setProducts} />,
    customers:     ({ orders }) => <PageCustomers orders={orders} />,
    staff:         ({}) => <PageStaff />,
    reports:       ({ orders }) => <PageReports orders={orders} />,
    notifications: ({ promotions, setPromotions }) => <PageNotifications promotions={promotions} setPromotions={setPromotions} />,
    settings:      ({}) => <PageSettings />,
  };

  const pageTitles = {
    overview:"Dashboard", orders:"Orders", payments:"Payments",
    qrcodes:"QR Codes", collection:"Collection", products:"Products",
    categories:"Categories", inventory:"Inventory", customers:"Customers",
    staff:"Staff", reports:"Reports", notifications:"Notifications",
    settings:"Settings",
  };

  // global listeners for navigation and confirmations (toasts handled by App)
  useEffect(() => {
    const nav = (e) => { if (e && e.detail && e.detail.page) setPage(e.detail.page); };
    const confirmHandler = (e) => {
      const d = e.detail || {};
      setConfirmState({ open: true, message: d.message || 'Are you sure?', onConfirm: typeof d.onConfirm === 'function' ? d.onConfirm : null });
    };
    window.addEventListener('navigate', nav);
    window.addEventListener('app-confirm', confirmHandler);
    return () => { window.removeEventListener('navigate', nav); window.removeEventListener('app-confirm', confirmHandler); };
  }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", fontFamily:"system-ui,sans-serif", fontSize:14, lineHeight:1.5, background:"var(--bg)", color:"var(--txt)", ...themeVars }}>

      {/* Toasts are handled globally by App.jsx */}

      {/* Global confirm modal (non-blocking replacement for confirm()) */}
      <Modal open={confirmState.open} onClose={() => setConfirmState({ open: false, message: '', onConfirm: null })} title="Confirm">
        <div style={{ padding:8 }}>{confirmState.message}</div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn size="sm" onClick={() => setConfirmState({ open: false, message: '', onConfirm: null })}>Cancel</Btn>
          <Btn size="sm" variant="primary" onClick={() => { try { confirmState.onConfirm && confirmState.onConfirm(); } catch(e){} setConfirmState({ open: false, message: '', onConfirm: null }); }}>Confirm</Btn>
        </div>
      </Modal>

      {/* TOP BAR */}
      <div style={{ height:52, background:"var(--bg2)", borderBottom:"0.5px solid var(--brd)", display:"flex", alignItems:"center", gap:10, padding:"0 16px", flexShrink:0, zIndex:50 }}>
        <button onClick={() => {
            try {
              if (window.innerWidth <= 768) {
                setMobileOpen(v => !v);
              } else setCollapsed(v => !v);
            } catch(e) { setCollapsed(v => !v); }
          }} style={{ background:"none", border:"none", color:"var(--txt2)", cursor:"pointer", fontSize:18, padding:4, display:"flex" }} aria-label="Toggle sidebar">
          <FiMenu />
        </button>
        <button onClick={() => setMobileOpen(v => !v)} className="sm:hidden" style={{ background:"none", border:"none", color:"var(--txt2)", cursor:"pointer", fontSize:18, padding:6, display:"flex" }} aria-label="Open mobile menu">
          <FiMoreVertical />
        </button>
        <div style={{ fontWeight:500, fontSize:15, flex:1 }}>
          QuickCollect <span style={{ color:"var(--txt3)", fontWeight:400, fontSize:13 }}>— {pageTitles[page]}</span>
        </div>
        <div onClick={() => setSearchOpen(true)}
          style={{ display:"flex", alignItems:"center", gap:8, background:"var(--bg3)", border:"0.5px solid var(--brd)", borderRadius:8, padding:"5px 10px", fontSize:13, color:"var(--txt2)", cursor:'pointer' }}>
          <FiSearch size={13} /><span style={{ fontSize:12 }}>Search anything…</span>
        </div>

        <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="Search admin">
          <div style={{ display:'grid', gap:10 }}>
            <FormGroup label="Query">
              <Input autoFocus value={searchText} onChange={e => setSearchText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (searchText && searchText.trim()) { window.dispatchEvent(new CustomEvent('admin-search', { detail: { query: searchText.trim() } })); setPage('orders'); setSearchOpen(false); setSearchText(''); } else { showToast('Enter search query', 'error'); } } }} placeholder="Search orders, products..." />
            </FormGroup>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <Btn size="sm" onClick={() => { setSearchOpen(false); setSearchText(''); }}>Cancel</Btn>
              <Btn size="sm" variant="primary" onClick={() => {
                if (searchText && searchText.trim()) { window.dispatchEvent(new CustomEvent('admin-search', { detail: { query: searchText.trim() } })); setPage('orders'); setSearchOpen(false); setSearchText(''); }
                else { showToast('Enter search query', 'error'); }
              }}>Search</Btn>
            </div>
          </div>
        </Modal>
        <button onClick={() => setDark(!dark)} style={{ width:32, height:32, borderRadius:8, border:"0.5px solid var(--brd)", background:"var(--bg2)", color:"var(--txt2)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }} aria-label="Toggle dark mode">
          {dark ? <FiSun size={16} /> : <FiMoon size={16} />}
        </button>
        <button onClick={() => setPage("notifications")} style={{ width:32, height:32, borderRadius:8, border:"0.5px solid var(--brd)", background:"var(--bg2)", color:"var(--txt2)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", position:"relative" }} aria-label="Notifications">
          <FiBell size={16} />
          <div style={{ position:"absolute", top:5, right:5, width:7, height:7, background:"#e24b4a", borderRadius:"50%", border:`1.5px solid ${dark ? "#23231f" : "#fff"}` }} />
        </button>
        <div onClick={() => setPage("staff")} style={{ width:32, height:32, borderRadius:"50%", background:COLORS.amber.bg, color:COLORS.amber.txt, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:500, cursor:"pointer", flexShrink:0 }} aria-label="Admin profile">
          AD
        </div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* SIDEBAR */}
        <nav className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={{ width: collapsed ? 52 : 220, background:"var(--bg2)", borderRight:"0.5px solid var(--brd)", display:"flex", flexDirection:"column", overflowY:"auto", flexShrink:0, transition:"width .2s" }} aria-label="Admin navigation">
          {/* Brand */}
          <div style={{ padding:"14px 16px", borderBottom:"0.5px solid var(--brd)", display:"flex", alignItems:"center", gap:10, minHeight:52 }}>
            <div style={{ width:28, height:28, background:COLORS.amber.solid, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#fff", fontSize:15 }}>
              <MdQrCode2 />
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontWeight:500, fontSize:13, color:"var(--txt)", whiteSpace:"nowrap" }}>QuickCollect</div>
                <div style={{ fontSize:10, color:"var(--txt3)" }}>Admin v2.0</div>
              </div>
            )}
          </div>

          {/* Nav items */}
          {NAV.map(section => (
            <div key={section.section} style={{ padding:"8px 0" }}>
              {!collapsed && (
                <div style={{ fontSize:10, fontWeight:500, textTransform:"uppercase", letterSpacing:".07em", color:"var(--txt3)", padding:"4px 16px 2px" }}>
                  {section.section}
                </div>
              )}
                {section.items.map(item => {
                const isActive = page === item.id;
                return (
                  <button key={item.id} onClick={() => { setPage(item.id); if (mobileOpen) setMobileOpen(false); }} style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding: collapsed ? "8px 14px" : "7px 16px",
                    cursor:"pointer", color: isActive ? COLORS.amber.solid : "var(--txt2)",
                    fontSize:13, background: isActive ? COLORS.amber.bg : "none",
                    border:"none", width:"100%", textAlign:"left", fontFamily:"inherit",
                    fontWeight: isActive ? 500 : 400, whiteSpace:"nowrap", overflow:"hidden",
                  }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "var(--bg3)"; e.currentTarget.style.color = "var(--txt)"; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--txt2)"; } }}
                    title={collapsed ? item.label : ""}
                  >
                    <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
                    {!collapsed && <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis" }}>{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span style={{ background:COLORS.red.bg, color:COLORS.red.txt, fontSize:10, fontWeight:500, padding:"1px 6px", borderRadius:10 }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Logout */}
          {!collapsed && (() => {
            const { logout } = useAuth();
            return (
              <div style={{ marginTop:"auto", padding:12, borderTop:"0.5px solid var(--brd)" }}>
                <button onClick={() => {
                    window.dispatchEvent(new CustomEvent('app-confirm', { detail: {
                      message: 'Sign out — are you sure you want to logout?',
                      onConfirm: () => {
                        try { logout(); navigate('/'); }
                        catch (e) { /* ignore */ }
                      }
                    } }));
                    if (mobileOpen) setMobileOpen(false);
                  }} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"7px 8px", borderRadius:8, border:"none", background:"none", color:"var(--txt2)", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                  <FiLogOut size={15} /> Sign out
                </button>
              </div>
            );
          })()}
        </nav>

        {/* overlay for mobile drawer */}
        {mobileOpen && (
          <div className="admin-drawer-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
        )}

        {/* MAIN CONTENT */}
        <main style={{ flex:1, overflowY:"auto", padding:20 }}>
          <AdminLoader>
            {({ loading, products, orders, promotions, setProducts, setOrders, setPromotions }) => (
              loading ? <div>Loading admin data…</div> : (PAGES[page] ? PAGES[page]({ products, orders, promotions, setProducts, setOrders, setPromotions }) : <PageOverview setPage={setPage} />)
            )}
          </AdminLoader>
        </main>

      </div>
    </div>
  );
}

// Clipboard helper: use navigator.clipboard when available, fallback to textarea
async function copyText(text) {
  if (!text) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // fallthrough to legacy
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.left='-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch (e) {
    return false;
  }
}

// Safe response parser: if response is JSON parse it, otherwise return text under _text
async function safeParseResponse(res) {
  if (!res || !res.headers) return {};
  const ct = res.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) return await res.json();
    const txt = await res.text();
    return { _text: txt };
  } catch (e) {
    return { _text: 'Failed to parse response' };
  }
}

// ─────────────────────────────────────────────────────────────
// EXPORT / DOWNLOAD HELPERS
// ─────────────────────────────────────────────────────────────
function arrayToCSV(rows, cols) {
  if (!rows || rows.length === 0) return '';
  const keys = cols && cols.length ? cols : Object.keys(rows[0]);
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('\n') || s.includes('"')) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const header = keys.join(',');
  const body = rows.map(r => keys.map(k => esc(r[k])).join(',')).join('\n');
  return header + '\n' + body;
}

function downloadCSV(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportOrders(orders = []) {
  const rows = (orders || []).map(o => ({
    id: o._id || o.id || '',
    customer: o.user?.name || o.customer || '',
    amount: o.totalAmount ?? o.amount ?? 0,
    status: o.status || '',
    paymentStatus: o.paymentStatus || o.paymentMethod || '',
    date: o.createdAt || o.date || '',
  }));
  const csv = arrayToCSV(rows, ['id','customer','amount','status','paymentStatus','date']);
  downloadCSV(`orders-${new Date().toISOString().slice(0,10)}.csv`, csv);
}

function exportProducts(products = []) {
  const rows = (products || []).map(p => ({
    id: p._id || p.id || '',
    name: p.name || '',
    sku: p.sku || '',
    category: p.category || '',
    price: p.price || 0,
    stock: p.stock || 0,
    status: p.status || '',
  }));
  const csv = arrayToCSV(rows, ['id','name','sku','category','price','stock','status']);
  downloadCSV(`products-${new Date().toISOString().slice(0,10)}.csv`, csv);
}

function exportAll(products = [], orders = [], promotions = []) {
  // create a small combined export (orders first, products second)
  if ((orders || []).length > 0) { exportOrders(orders); }
  if ((products || []).length > 0) { exportProducts(products); }
  if ((promotions || []).length > 0) {
    const rows = (promotions || []).map(p => ({ id: p._id||p.id||'', title: p.title||p.name||'', active: p.active||p.status||'', starts: p.startsAt||'', ends: p.endsAt||'' }));
    const csv = arrayToCSV(rows, ['id','title','active','starts','ends']);
    downloadCSV(`promotions-${new Date().toISOString().slice(0,10)}.csv`, csv);
  }
}
