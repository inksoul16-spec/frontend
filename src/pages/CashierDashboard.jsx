import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../App";
import { startScanner, stopScanner } from "../lib/qrScanner";
import { showToast } from "../lib/toast";
import { safeParseResponse } from "../lib/safeResponse";
import { FiBarChart2, FiPackage, FiCamera, FiClock, FiUsers, FiSearch, FiZap, FiDownload, FiMenu, FiX } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: <FiBarChart2 /> },
  { key: "pickup", label: "Ready for Pickup", icon: <FiPackage /> },
  { key: "scan", label: "Scan QR", icon: <FiCamera /> },
  { key: "history", label: "Collection History", icon: <FiClock /> },
  { key: "customers", label: "Customer Search", icon: <FiUsers /> },
];

const STATUS_STYLES = {
  pending: "bg-gray-700 text-gray-300",
  paid: "bg-blue-950 text-blue-300 border border-blue-800",
  preparing: "bg-amber-950 text-amber-300 border border-amber-800",
  ready: "bg-emerald-950 text-emerald-300 border border-emerald-800",
  collected: "bg-gray-800 text-gray-400 border border-gray-700",
  cancelled: "bg-red-950 text-red-300 border border-red-800",
};

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[status] || "bg-gray-700 text-gray-300"}`}>
      {status}
    </span>
  );
}

function authHeaders(token, json = false) {
  const headers = { Authorization: `Bearer ${token}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

export default function CashierDashboard() {
  const { user, logout } = useAuth();
  const token = localStorage.getItem("token");

  const [tab, setTab] = useState("overview");
  const [pickupOrders, setPickupOrders] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(true);

  const [qrInput, setQrInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { type, text }
  const videoRef = useRef(null);

  const [historyResults, setHistoryResults] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");

  const [customerQuery, setCustomerQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // ---- data fetching ----

  const fetchPickupOrders = useCallback(async () => {
    setPickupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/pickup`, { headers: authHeaders(token) });
      const body = await safeParseResponse(res);
      if (!res.ok) {
        showToast(body.message || "Failed to load pickup orders.", "error");
        setPickupOrders([]);
      } else {
        setPickupOrders(body.orders || []);
      }
    } catch {
      showToast("Network error loading pickup orders.", "error");
      setPickupOrders([]);
    } finally {
      setPickupLoading(false);
    }
  }, [token]);

  const fetchHistory = useCallback(
    async (page = 1) => {
      setHistoryLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "15" });
        if (historyQuery) params.set("q", historyQuery);
        if (historyFrom) params.set("from", historyFrom);
        if (historyTo) params.set("to", historyTo);

        const res = await fetch(`${API_BASE}/api/orders/collections?${params}`, { headers: authHeaders(token) });
        const body = await safeParseResponse(res);
        if (!res.ok) {
          showToast(body.message || "Failed to load history.", "error");
        } else {
          setHistoryResults(body.results || []);
          setHistoryPage(body.page || page);
          setHistoryTotalPages(body.totalPages || 1);
          setHistoryTotal(body.total || 0);
        }
      } catch {
        showToast("Network error loading history.", "error");
      } finally {
        setHistoryLoading(false);
      }
    },
    [token, historyQuery, historyFrom, historyTo]
  );

  useEffect(() => {
    fetchPickupOrders();
  }, [fetchPickupOrders]);

  useEffect(() => {
    if (tab === "history") fetchHistory(1);
  }, [tab, fetchHistory]);

  useEffect(() => () => stopScanner(), []);

  // ---- actions ----

  const submitScan = async (code) => {
    const value = (code || "").trim();
    if (!value) {
      setScanResult({ type: "error", text: "Enter or scan a QR code first." });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/orders/scan`, {
        method: "POST",
        headers: authHeaders(token, true),
        body: JSON.stringify({ qrCode: value }),
      });
      const body = await safeParseResponse(res);
      if (!res.ok) {
        setScanResult({ type: "error", text: body.message || "Scan failed." });
        showToast(body.message || "Scan failed.", "error");
        return;
      }
      setScanResult({ type: "success", text: body.message || "Order collected." });
      showToast(body.message || "Order collected.", "success");
      setQrInput("");
      fetchPickupOrders();
      if (tab === "history") fetchHistory(historyPage);
    } catch {
      setScanResult({ type: "error", text: "Network error during scan." });
      showToast("Network error during scan.", "error");
    }
  };

  const toggleCamera = async () => {
    if (scanning) {
      stopScanner();
      setScanning(false);
      return;
    }
    try {
      await startScanner(videoRef.current, (data) => {
        setQrInput(data);
        submitScan(data);
      });
      setScanning(true);
    } catch (err) {
      showToast(err.message || "Camera access denied.", "error");
    }
  };

  const handleManualCollect = async (codeOrId) => {
    const value = (codeOrId || "").trim();
    if (!value) {
      showToast('Enter an order ID or QR code', 'error');
      return;
    }
    // Heuristic: if value looks like a short id (<=36) treat as orderId, otherwise treat as QR token and call scan endpoint
    try {
      if (value.length <= 48 && !value.includes(' ')) {
        // treat as order id
        const res = await fetch(`${API_BASE}/api/orders/${value}/status`, {
          method: "PATCH",
          headers: authHeaders(token, true),
          body: JSON.stringify({ status: "collected" }),
        });
        const body = await safeParseResponse(res);
        if (!res.ok) {
          showToast(body.message || "Failed to update order.", "error");
          return;
        }
        showToast("Order marked as collected.", "success");
      } else {
        // treat as QR payload/token
        const res = await fetch(`${API_BASE}/api/orders/scan`, {
          method: "POST",
          headers: authHeaders(token, true),
          body: JSON.stringify({ qrCode: value }),
        });
        const body = await safeParseResponse(res);
        if (!res.ok) {
          showToast(body.message || "Scan failed.", "error");
          return;
        }
        showToast(body.message || 'Order collected.', 'success');
      }
      setQrInput('');
      fetchPickupOrders();
      if (tab === "history") fetchHistory(historyPage);
    } catch (e) {
      showToast(e.message || "Network error during collect.", "error");
    }
  };

  const downloadInvoice = async (orderId) => {
    setDownloadingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/invoice`, { headers: authHeaders(token) });
      if (!res.ok) {
        const body = await safeParseResponse(res);
        showToast(body.message || "Failed to download invoice.", "error");
        return;
      }
      const blob = await res.blob();
      // If server returned an error page or JSON instead of a PDF, surface that message
      if (blob.type && !blob.type.includes('pdf')) {
        try {
          const txt = await blob.text();
          // try parse json
          let msg = txt;
          try { const j = JSON.parse(txt); msg = j.message || j.error || txt; } catch(e){}
          showToast(msg || 'Failed to generate invoice.', 'error');
        } catch (e) {
          showToast('Failed to generate invoice.', 'error');
        }
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Invoice downloaded.", "success");
    } catch {
      showToast("Network error downloading invoice.", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleLogout = () => {
    stopScanner();
    logout();
    window.location.href = "/login";
  };

  const filteredCustomers = pickupOrders.filter((o) => {
    if (!customerQuery) return true;
    const needle = customerQuery.toLowerCase();
    return (o.user?.name || "").toLowerCase().includes(needle) || (o.user?.email || "").toLowerCase().includes(needle);
  });

  // ---- render ----

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* Sidebar (hidden on small screens) */}
      <aside className="hidden md:flex w-60 border-r border-gray-200 flex-col bg-white">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-200">
          <FiZap className="text-2xl text-indigo-400" />
          <span className="font-bold tracking-tight">QuickCollect</span>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                tab === item.key ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
              {item.key === "pickup" && pickupOrders.length > 0 && (
                <span className="ml-auto bg-gray-100 text-xs font-bold px-2 py-0.5 rounded-full text-gray-800">
                  {pickupOrders.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">Cashier</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen((s) => !s)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
            </button>
            <h1 className="text-lg font-bold">{NAV_ITEMS.find((n) => n.key === tab)?.label}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Connected
          </div>
        </header>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div className="md:hidden fixed inset-x-0 top-16 bg-white border-b border-gray-200 shadow z-30">
            <nav className="p-3 flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setTab(item.key); setMobileNavOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    tab === item.key ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        <div className="p-8 max-w-5xl">
          {tab === "overview" && (
            <OverviewTab pickupCount={pickupOrders.length} pickupLoading={pickupLoading} onGoToPickup={() => setTab("pickup")} onGoToScan={() => setTab("scan")} />
          )}

          {tab === "pickup" && (
            <PickupTab
                orders={pickupOrders}
                loading={pickupLoading}
                onRefresh={fetchPickupOrders}
                onMarkCollected={handleManualCollect}
                onDownload={downloadInvoice}
                downloadingId={downloadingId}
              />
          )}

          {tab === "scan" && (
            <ScanTab
                videoRef={videoRef}
                scanning={scanning}
                onToggleCamera={toggleCamera}
                qrInput={qrInput}
                setQrInput={setQrInput}
                onSubmit={() => submitScan(qrInput)}
                onManualCollect={(code) => handleManualCollect(code)}
                scanResult={scanResult}
              />
          )}

          {tab === "history" && (
            <HistoryTab
              results={historyResults}
              loading={historyLoading}
              page={historyPage}
              totalPages={historyTotalPages}
              total={historyTotal}
              query={historyQuery}
              setQuery={setHistoryQuery}
              from={historyFrom}
              setFrom={setHistoryFrom}
              to={historyTo}
              setTo={setHistoryTo}
              onApply={() => fetchHistory(1)}
              onPageChange={fetchHistory}
              onDownload={downloadInvoice}
              downloadingId={downloadingId}
            />
          )}

          {tab === "customers" && (
            <CustomersTab query={customerQuery} setQuery={setCustomerQuery} results={filteredCustomers} />
          )}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-1">
      <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-3xl font-bold ${accent || "text-gray-900"}`}>{value}</span>
    </div>
  );
}

function OverviewTab({ pickupCount, pickupLoading, onGoToPickup, onGoToScan }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StatCard label="Awaiting pickup" value={pickupLoading ? "…" : pickupCount} accent="text-amber-400" />
        <StatCard label="Shift status" value="Active" accent="text-emerald-400" />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="font-semibold mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onGoToScan}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            Scan a customer's QR
          </button>
          <button
            onClick={onGoToPickup}
            className="bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-200 transition-colors"
          >
            View pickup queue
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-sm text-gray-600 leading-relaxed">
        Orders move from <span className="text-amber-600 font-medium">preparing</span> to{" "}
        <span className="text-emerald-600 font-medium">collected</span> once you scan the customer's QR code or mark
        them collected manually from the pickup queue. Each paid order generates exactly one QR code, so a scan can
        only be used once.
      </div>
    </div>
  );
}

function OrderItemsLine({ items }) {
  return <p className="text-xs text-gray-500 truncate">{(items || []).map((i) => `${i.name} ×${i.qty}`).join(", ")}</p>;
}

function PickupTab({ orders, loading, onRefresh, onMarkCollected, onDownload, downloadingId }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Paid orders waiting to be collected, oldest first.</p>
        <button
          onClick={onRefresh}
          className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-600 py-10 text-center">Loading pickup queue…</div>
      ) : orders.length === 0 ? (
        <div className="text-sm text-gray-600 py-16 text-center bg-white border border-gray-200 rounded-2xl">
          No orders waiting for pickup right now.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <div key={o._id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-500">#{o._id.slice(-6)}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="font-medium text-gray-900 truncate">{o.user?.name || "Customer"}</p>
                <OrderItemsLine items={o.items} />
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900 mb-2">RWF {Number(o.totalAmount || 0).toLocaleString()}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onDownload(o._id)}
                    disabled={downloadingId === o._id}
                    className="text-xs font-semibold border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {downloadingId === o._id ? "Downloading…" : (<><FiDownload className="text-sm" /> Receipt</>)}
                  </button>
                  <button
                    onClick={() => onMarkCollected(o._id)}
                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Mark collected
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScanTab({ videoRef, scanning, onToggleCamera, qrInput, setQrInput, onSubmit, onManualCollect, scanResult }) {
  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="relative bg-black aspect-video flex items-center justify-center">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
              Camera is off
            </div>
          )}
        </div>
        <div className="p-4">
          <button
            onClick={onToggleCamera}
            className={`w-full font-semibold py-2.5 rounded-xl transition-colors text-sm ${
              scanning ? "bg-red-600 hover:bg-red-500 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {scanning ? "Stop camera" : "Start camera scan"}
          </button>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <label className="text-sm text-gray-600 font-medium block mb-2">Or enter the code manually</label>
        <div className="flex gap-2">
          <input
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            placeholder="Paste QR token"
            className="flex-1 bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm font-mono"
          />
          <button
            onClick={onSubmit}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Verify
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onManualCollect(qrInput)}
            disabled={!qrInput}
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            Mark as collected
          </button>
          <button
            onClick={() => setQrInput('')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {scanResult && (
        <div
          className={`text-sm px-4 py-3 rounded-xl border ${
            scanResult.type === "error"
              ? "bg-red-950 border-red-800 text-red-300"
              : "bg-emerald-950 border-emerald-800 text-emerald-300"
          }`}
        >
          {scanResult.text}
        </div>
      )}
    </div>
  );
}

function HistoryTab({ results, loading, page, totalPages, total, query, setQuery, from, setFrom, to, setTo, onApply, onPageChange, onDownload, downloadingId }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-gray-600 font-medium block mb-1">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order ID or customer"
            className="w-full bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 font-medium block mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-900 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 font-medium block mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-900 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={onApply}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Apply
        </button>
      </div>

      <p className="text-xs text-gray-600">{total} collected order{total === 1 ? "" : "s"} found</p>

      {loading ? (
        <div className="text-sm text-gray-600 py-10 text-center">Loading history…</div>
      ) : results.length === 0 ? (
        <div className="text-sm text-gray-600 py-16 text-center bg-white border border-gray-200 rounded-2xl">
          No collection history matches these filters.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {results.map((o) => (
            <div key={o._id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-500">#{o._id.slice(-6)}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="font-medium text-gray-900 truncate">{o.user?.name}</p>
                <p className="text-xs text-gray-500">{o.user?.email}</p>
                {o.qrScannedAt && (
                  <p className="text-xs text-gray-600 mt-1">Collected {new Date(o.qrScannedAt).toLocaleString()}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900 mb-2">RWF {Number(o.totalAmount || 0).toLocaleString()}</p>
                <button
                  onClick={() => onDownload(o._id)}
                  disabled={downloadingId === o._id}
                  className="text-xs font-semibold border border-gray-200 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {downloadingId === o._id ? "Downloading…" : (<><FiDownload className="text-sm" /> Receipt</>)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersTab({ query, setQuery, results }) {
  return (
    <div className="flex flex-col gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <label className="text-xs text-gray-600 font-medium block mb-1">Search within today's pickup queue</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Customer name or email"
              className="w-full bg-white border border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {results.length === 0 ? (
            <div className="text-sm text-gray-600 py-16 text-center bg-white border border-gray-200 rounded-2xl">
              No matching customers in the current pickup queue.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {results.map((o) => (
                <div key={o._id} className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="font-medium text-gray-900">{o.user?.name}</p>
                  <p className="text-xs text-gray-600 mb-2">{o.user?.email}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500">#{o._id.slice(-6)}</span>
                    <StatusBadge status={o.status} />
                    <span className="text-xs text-gray-500">RWF {Number(o.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
    </div>
  );
}