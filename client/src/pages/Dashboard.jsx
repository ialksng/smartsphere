import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Cloud, Bot, Loader2, Plus, Search, Star, DownloadCloud } from 'lucide-react';
import apiClient from '../services/apiClient';

export default function Dashboard() {
  const navigate = useNavigate();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [importingFileId, setImportingFileId] = useState(null);

  const [stats, setStats] = useState({
    docs: 0,
    favorites: 0,
    chats: 0,
    storage: "0 MB"
  });

  useEffect(() => {
    fetchDocs();
    fetchStats();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const delay = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      
      try {
        const res = await apiClient.get(`/dochub/search?q=${encodeURIComponent(search)}`);
        setSearchResults(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [search]);

  const fetchDocs = async () => {
    try {
      const res = await apiClient.get(`/dochub`);
      if (Array.isArray(res.data)) {
        setDocs(res.data.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await apiClient.post('/ai/upload', formData);
      fetchDocs();
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectResult = async (doc) => {
    if (!doc.isExternal) {
      setShowDropdown(false);
      setSearch("");
      navigate('/editor', { state: { docId: doc._id } });
      return;
    }

    setImportingFileId(doc._id);
    
    try {
      const endpoint = doc.source === 'google_drive_live' 
        ? '/cloud/google/import'
        : '/cloud/microsoft/import';

      const res = await apiClient.post(endpoint, {
        fileId: doc._id,
        fileName: doc.filename,
        mimeType: doc.mimeType
      });
      
      if (res.data.insight) {
        setShowDropdown(false);
        setSearch("");
        navigate('/editor', { state: { docId: res.data.insight._id } });
      } else {
        alert(res.data.message || "Failed to import file");
      }
    } catch (err) {
      console.error("Import error:", err);
      alert("Error importing cloud file");
    } finally {
      setImportingFileId(null);
    }
  };

  return (
    <div
      className="min-h-screen p-8 text-white space-y-8"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{
        background: "radial-gradient(circle at top, #0f172a, #020617)"
      }}
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back 👋</h1>
          <p className="text-gray-400 text-sm">
            SmartSphere AI Workspace
          </p>
        </div>

        <button
          onClick={() => navigate('/dochub')}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl"
        >
          <Plus size={16} />
          New Document
        </button>
      </div>

      <div className="relative z-50">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search global workspace (Local, Google Drive, OneDrive)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 p-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-white/30 relative z-50"
        />

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-80 flex flex-col">
            {isSearching && searchResults.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                Scanning Local & Cloud Drives...
              </div>
            ) : searchResults.length > 0 ? (
              <ul className="overflow-y-auto">
                {searchResults.map(doc => (
                  <li
                    key={doc._id}
                    onClick={() => handleSelectResult(doc)}
                    className={`p-4 hover:bg-white/10 cursor-pointer flex flex-col gap-1 border-b border-white/5 last:border-0 transition-colors ${importingFileId === doc._id ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium w-full">
                        {(doc.source === 'google_drive_live' || doc.source === 'onedrive_live') ? (
                          <Cloud size={16} className="text-blue-400 flex-shrink-0" />
                        ) : (
                          <FileText size={16} className="text-white flex-shrink-0" />
                        )}
                        <span className="truncate">{doc.filename}</span>
                      </div>
                      
                      {importingFileId === doc._id && (
                        <Loader2 size={14} className="animate-spin text-gray-400 ml-2" />
                      )}
                    </div>
                    
                    <div className="pl-6 text-xs text-gray-400 truncate flex items-center">
                      <span className={`uppercase text-[10px] px-1.5 py-0.5 rounded mr-2 ${doc.isExternal ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10'}`}>
                        {doc.source.replace('_live', '')}
                      </span>
                      {doc.isExternal ? (
                        <span className="flex items-center gap-1"><DownloadCloud size={10} /> Click to import to DocHub</span>
                      ) : (
                        doc.summary || "Imported Document"
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-400 text-sm">
                No results found for "{search}"
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <StatCard title="Documents" value={stats.docs || 0} icon={<FileText />} />
        <StatCard title="Favorites" value={stats.favorites || 0} icon={<Star />} />
        <StatCard title="AI Chats" value={stats.chats || 0} icon={<Bot />} />
        <StatCard title="Storage" value={stats.storage || "0 MB"} icon={<Cloud />} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <ActionCard
          icon={<Cloud />}
          title="CloudHub"
          desc="Import from Google Drive"
          onClick={() => navigate('/cloudhub')}
        />

        <ActionCard
          icon={<FileText />}
          title="Open DocHub"
          desc="Manage your documents"
          onClick={() => navigate('/dochub')}
        />

        <ActionCard
          icon={<Bot />}
          title="BuddyBot"
          desc="Chat with your files"
          onClick={() => navigate('/buddybot')}
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Documents</h2>

          <button
            onClick={() => navigate('/dochub')}
            className="text-sm text-gray-400 hover:text-white"
          >
            View all →
          </button>
        </div>

        {loading ? (
          <Loader2 className="animate-spin mx-auto mt-4" />
        ) : docs.length === 0 ? (
          <p className="text-gray-400 text-center mt-4">No documents yet</p>
        ) : (
          <div className="space-y-3 mt-4">
            {docs.map(doc => (
              <div
                key={doc._id}
                onClick={() =>
                  navigate('/editor', { state: { docId: doc._id } })
                }
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/10 transition-colors"
              >
                <p className="font-medium">{doc.filename}</p>
                <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                  {doc.summary || "No summary available"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center transition-all hover:bg-white/10">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h2 className="text-xl font-semibold mt-1">{value}</h2>
      </div>
      <div className="text-gray-400">
        {icon}
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick }) {
  return (
    <div
      onClick={onClick}
      className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all hover:-translate-y-1"
    >
      <div className="mb-3 text-white">{icon}</div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
  );
}