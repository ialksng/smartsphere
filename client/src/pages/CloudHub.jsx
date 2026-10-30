import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cloud, HardDrive, ArrowRight, CheckCircle2 } from "lucide-react";
import apiClient from "../services/apiClient";

export default function CloudHub() {
  const navigate = useNavigate();
  const [googleStorage, setGoogleStorage] = useState(null);

  useEffect(() => {
    fetchStorage();
  }, []);

  const fetchStorage = async () => {
    try {
      const res = await apiClient.get('/cloud/google/storage');
      setGoogleStorage(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatGB = (bytes) => {
    if (!bytes) return "0.00";
    return (bytes / (1024 ** 3)).toFixed(2);
  };

  const totalUsed = googleStorage?.used || 0;
  const totalLimit = googleStorage?.total || (15 * 1024 ** 3);
  const isConnected = googleStorage?.connected;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">CloudHub</h1>

      <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <HardDrive className="text-emerald-400" />
          <h2 className="text-lg font-medium">Cloud Storage Quota</h2>
        </div>

        <p className="text-sm text-gray-400 mb-2">
          {isConnected ? "Connected to Google Drive" : "Connect Google Drive to sync and backup your documents"}
        </p>

        <p className="text-xl font-semibold">
          {formatGB(totalUsed)} GB / {formatGB(totalLimit)} GB
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div
          onClick={() => navigate('/cloudhub/google')}
          className="p-6 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 bg-blue-500/10 transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <Cloud className="text-blue-400" size={28} />
            {isConnected ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 size={12} /> Connected
              </span>
            ) : (
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                Not Connected
              </span>
            )}
          </div>
          <h2 className="text-lg font-medium text-white group-hover:text-blue-400 transition">Google Drive</h2>

          {googleStorage ? (
            <p className="text-sm text-gray-400 mt-2">
              {formatGB(googleStorage.used)} / {formatGB(googleStorage.total)} GB used
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-2">Loading status...</p>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-blue-400 font-medium">
            Manage files & imports <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => navigate('/mystorage')}
          className="p-6 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 bg-emerald-500/10 transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <HardDrive className="text-emerald-400" size={28} />
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Active
            </span>
          </div>
          <h2 className="text-lg font-medium text-white group-hover:text-emerald-400 transition">Local MyStorage (MERN)</h2>
          <p className="text-sm text-gray-400 mt-2">
            Organize personal documents, create folders, and sync to Cloud
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 font-medium">
            Open MyStorage <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
