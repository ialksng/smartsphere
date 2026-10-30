import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Folder,
  FolderOpen,
  ChevronRight,
  X,
  Search,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import apiClient from '../services/apiClient';
import Loader from './Loader';
import { useToast } from '../context/ToastContext';

export default function DriveFolderPickerModal({
  isOpen,
  onClose,
  onConfirm,
  item,
}) {
  const toast = useToast();

  const [currentFolder, setCurrentFolder] = useState({ id: 'root', name: 'My Drive' });
  const [folderHistory, setFolderHistory] = useState([]);
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState({ id: 'root', name: 'My Drive (Root)' });
  const [searchFilter, setSearchFilter] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentFolder({ id: 'root', name: 'My Drive' });
      setFolderHistory([]);
      setSelectedDestination({ id: 'root', name: 'My Drive (Root)' });
      setSearchFilter('');
      fetchDriveFolders('root');
    }
  }, [isOpen]);

  const fetchDriveFolders = async (folderId = 'root') => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.get(`/cloud/google/files?folderId=${encodeURIComponent(folderId)}`);
      const allFiles = Array.isArray(res.data) ? res.data : [];
      // Only keep folders
      const folderList = allFiles.filter((f) => f.mimeType?.includes('folder'));
      setFolders(folderList);
    } catch (err) {
      console.error('Failed to load drive folders:', err);
      const msg = err.response?.data?.message || 'Google Drive not connected or failed to load.';
      setErrorMsg(msg);
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSubfolder = (folder) => {
    setFolderHistory((prev) => [...prev, currentFolder]);
    setCurrentFolder({ id: folder.id, name: folder.name });
    setSelectedDestination({ id: folder.id, name: folder.name });
    fetchDriveFolders(folder.id);
  };

  const handleNavigateBreadcrumb = (index) => {
    if (index === -1) {
      setFolderHistory([]);
      setCurrentFolder({ id: 'root', name: 'My Drive' });
      setSelectedDestination({ id: 'root', name: 'My Drive (Root)' });
      fetchDriveFolders('root');
      return;
    }

    const targetFolder = folderHistory[index];
    const newHistory = folderHistory.slice(0, index);
    setFolderHistory(newHistory);
    setCurrentFolder(targetFolder);
    setSelectedDestination({ id: targetFolder.id, name: targetFolder.name });
    fetchDriveFolders(targetFolder.id);
  };

  const handleSelectFolder = (folder) => {
    setSelectedDestination({ id: folder.id, name: folder.name });
  };

  const handleSelectRoot = () => {
    setSelectedDestination({ id: 'root', name: 'My Drive (Root)' });
  };

  const handleConfirmSync = async () => {
    if (!item) return;
    setIsSubmitting(true);

    try {
      await onConfirm(selectedDestination.id, selectedDestination.name);
      onClose();
    } catch (err) {
      console.error('Sync error:', err);
      toast.error(err.response?.data?.message || 'Failed to sync to Google Drive.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0e1628] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Cloud size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Select Google Drive Destination</h3>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                Syncing: <span className="text-blue-300 font-medium">{item?.filename || 'Item'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* BREADCRUMB & ROOT SELECTOR */}
        <div className="px-5 py-3 bg-black/30 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => handleNavigateBreadcrumb(-1)}
              className={`hover:text-blue-400 transition font-medium ${
                currentFolder.id === 'root' ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              My Drive
            </button>
            {folderHistory.map((f, i) => (
              <React.Fragment key={f.id + i}>
                <ChevronRight size={12} className="text-gray-500" />
                <button
                  onClick={() => handleNavigateBreadcrumb(i)}
                  className="hover:text-blue-400 transition text-gray-400"
                >
                  {f.name}
                </button>
              </React.Fragment>
            ))}
            {currentFolder.id !== 'root' && (
              <>
                <ChevronRight size={12} className="text-gray-500" />
                <span className="text-white font-medium">{currentFolder.name}</span>
              </>
            )}
          </div>

          <button
            onClick={handleSelectRoot}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition ${
              selectedDestination.id === 'root'
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            Select Root
          </button>
        </div>

        {/* SEARCH FILTER */}
        <div className="p-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search folders in this directory..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-transparent outline-none w-full placeholder-gray-500 text-xs"
            />
          </div>
        </div>

        {/* FOLDERS LIST */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-[220px]">
          {isLoading ? (
            <Loader variant="section" size="md" text="Reading Google Drive folders..." />
          ) : errorMsg ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <AlertCircle size={36} className="text-amber-400 mb-2 opacity-80" />
              <p className="text-xs text-gray-300 mb-3">{errorMsg}</p>
              <a
                href="/work/projects/smartsphere/app/cloudhub/google"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition inline-flex items-center gap-1.5 shadow-lg"
              >
                Connect Google Drive <ExternalLink size={12} />
              </a>
            </div>
          ) : (
            <>
              {/* Option to select the currently opened folder directly */}
              <div
                onClick={() =>
                  setSelectedDestination({
                    id: currentFolder.id,
                    name: currentFolder.id === 'root' ? 'My Drive (Root)' : currentFolder.name,
                  })
                }
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  selectedDestination.id === currentFolder.id
                    ? 'bg-blue-500/20 border-blue-500/60 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FolderOpen
                    size={18}
                    className={
                      selectedDestination.id === currentFolder.id
                        ? 'text-blue-400'
                        : 'text-gray-400'
                    }
                  />
                  <div>
                    <p className="text-xs font-semibold">
                      Current Directory: {currentFolder.id === 'root' ? 'My Drive' : currentFolder.name}
                    </p>
                    <p className="text-[11px] text-gray-400">Save directly inside this folder</p>
                  </div>
                </div>

                {selectedDestination.id === currentFolder.id && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30">
                    <Check size={12} /> Selected
                  </span>
                )}
              </div>

              {/* Subfolders in this folder */}
              {filteredFolders.length > 0 ? (
                <div className="space-y-1.5 mt-2">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 pt-1">
                    Subfolders ({filteredFolders.length})
                  </p>
                  {filteredFolders.map((folder) => {
                    const isSelected = selectedDestination.id === folder.id;
                    return (
                      <div
                        key={folder.id}
                        className={`p-2.5 rounded-xl border transition flex items-center justify-between group ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500/60 text-white'
                            : 'bg-white/5 border-white/5 hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        <div
                          onClick={() => handleSelectFolder(folder)}
                          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                        >
                          <Folder
                            size={16}
                            className={isSelected ? 'text-emerald-400' : 'text-blue-400'}
                          />
                          <span className="text-xs truncate font-medium">{folder.name}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleSelectFolder(folder)}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>

                          <button
                            onClick={() => handleOpenSubfolder(folder)}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition"
                            title="Open subfolder"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-6 text-xs">
                  {searchFilter ? 'No matching folders found' : 'No subfolders in this directory'}
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-400 truncate max-w-xs self-start sm:self-auto">
            Destination: <span className="text-white font-medium">{selectedDestination.name}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs text-gray-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSync}
              disabled={isSubmitting || !!errorMsg}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? (
                <Loader variant="button" size="xs" text="Syncing..." />
              ) : (
                <>
                  <Cloud size={14} />
                  <span>Sync to this Folder</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
