import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  HardDrive,
  Upload,
  FileText,
  Folder as FolderIcon,
  FolderPlus,
  FilePlus,
  ChevronRight,
  CloudDownload,
  CloudUpload,
  Bot,
  Trash2,
} from "lucide-react";
import Loader from "../components/Loader";
import DriveFolderPickerModal from "../components/DriveFolderPickerModal";
import InputDialogModal from "../components/InputDialogModal";
import { useToast } from "../context/ToastContext";
import apiClient from "../services/apiClient";

export default function MyStorage() {
  const navigate = useNavigate();
  const toast = useToast();

  // Unified Storage State
  const [items, setItems] = useState([]);
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  // Folder Navigation State
  const [currentFolder, setCurrentFolder] = useState({ id: null, name: "My Storage" });
  const [folderHistory, setFolderHistory] = useState([]);

  // UI States
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, file: null });

  // Floating Google Drive Folder Picker Modal State
  const [drivePickerModal, setDrivePickerModal] = useState({
    isOpen: false,
    item: null,
    type: 'file',
  });

  // Reusable Dialog Modal State (for Folder, File, Rename, Delete)
  const [inputModal, setInputModal] = useState({
    isOpen: false,
    title: '',
    description: '',
    placeholder: '',
    defaultValue: '',
    confirmText: 'Confirm',
    icon: null,
    iconColor: 'text-blue-400',
    isDestructive: false,
    isPromptOnly: false,
    onSubmit: null,
  });

  const uploadMenuRef = useRef(null);

  useEffect(() => {
    fetchData(currentFolder.id);

    const handleClickOutside = (e) => {
      setContextMenu({ visible: false, x: 0, y: 0, file: null });
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target)) {
        setShowUploadMenu(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [currentFolder]);

  const fetchData = async (parentId = null) => {
    const endpoint = parentId ? `/dochub?parentId=${parentId}` : `/dochub?parentId=null`;
    setLoading(true);

    try {
      const res = await apiClient.get(endpoint);
      const data = res.data || [];
      setItems(data);

      if (parentId === null) {
        const total = data.reduce((acc, f) => acc + (f.size || 0), 0);
        setUsed(total);
      }
    } catch (error) {
      console.error("Error fetching storage data:", error);
      toast.error("Failed to load workspace files.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = () => {
    setInputModal({
      isOpen: true,
      title: "Create New Folder",
      description: "Organize files inside your 100 MB workspace",
      placeholder: "Folder name (e.g., Invoices, Docs)",
      defaultValue: "",
      confirmText: "Create Folder",
      icon: FolderPlus,
      iconColor: "text-emerald-400",
      isDestructive: false,
      isPromptOnly: false,
      onSubmit: async (name) => {
        try {
          await apiClient.post("/folders", {
            name,
            parent: currentFolder.id,
          });
          toast.success(`Folder "${name}" created successfully!`);
          fetchData(currentFolder.id);
        } catch (err) {
          console.error("Error creating folder:", err);
          toast.error(err.response?.data?.message || "Failed to create folder");
        }
      },
    });
  };

  const handleCreateFile = () => {
    setInputModal({
      isOpen: true,
      title: "Create New File",
      description: "Create an empty document in this directory",
      placeholder: "File name (e.g., notes.txt, memo.md)",
      defaultValue: "",
      confirmText: "Create File",
      icon: FilePlus,
      iconColor: "text-blue-400",
      isDestructive: false,
      isPromptOnly: false,
      onSubmit: async (name) => {
        try {
          await apiClient.post("/dochub/file", {
            filename: name,
            content: "",
            parentId: currentFolder.id,
          });
          toast.success(`File "${name}" created successfully!`);
          fetchData(currentFolder.id);
        } catch (err) {
          console.error("Error creating file:", err);
          toast.error(err.response?.data?.message || "Failed to create file");
        }
      },
    });
  };

  const handleUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles.length) return;

    let successCount = 0;
    for (let i = 0; i < selectedFiles.length; i++) {
      const formData = new FormData();
      if (currentFolder.id) formData.append("parentId", currentFolder.id);
      formData.append("file", selectedFiles[i]);

      try {
        await apiClient.post("/dochub/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        successCount++;
      } catch (err) {
        console.error("Upload error:", err);
        toast.error(err.response?.data?.message || `Failed to upload ${selectedFiles[i].name}`);
      }
    }

    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} file(s) successfully!`);
    }
    fetchData(currentFolder.id);
    setShowUploadMenu(false);
  };

  const pushToCloud = (item, type, provider = "google") => {
    if (provider !== "google") {
      toast.warning(`${provider} export not supported. Google Drive is connected.`);
      return;
    }

    setDrivePickerModal({
      isOpen: true,
      item,
      type,
    });
  };

  const handleConfirmDriveSync = async (driveFolderId, folderName) => {
    if (!drivePickerModal.item) return;

    const res = await apiClient.post("/cloud/google/upload-local", {
      itemId: drivePickerModal.item._id,
      type: drivePickerModal.type,
      driveFolderId,
    });

    toast.success(
      res.data?.message ||
        `Successfully synced "${drivePickerModal.item.filename}" to Google Drive (${folderName})!`
    );
  };

  const sendToBuddyBot = (file) => {
    navigate("/buddybot", { state: { importedFile: file } });
  };

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, file });
  };

  const handleRename = () => {
    if (!contextMenu.file) return;
    const targetFile = contextMenu.file;

    setInputModal({
      isOpen: true,
      title: "Rename Item",
      description: "Change name for this file or folder",
      placeholder: "New name",
      defaultValue: targetFile.filename,
      confirmText: "Save Name",
      icon: FileText,
      iconColor: "text-amber-400",
      isDestructive: false,
      isPromptOnly: false,
      onSubmit: async (newName) => {
        try {
          await apiClient.put(`/dochub/${targetFile._id}`, {
            name: newName,
          });
          toast.success(`Renamed to "${newName}"`);
          fetchData(currentFolder.id);
        } catch (err) {
          console.error(err);
          toast.error("Failed to rename item");
        }
      },
    });
  };

  const handleDownload = () => {
    if (!contextMenu.file) return;
    if (contextMenu.file.content) {
      const blob = new Blob([contextMenu.file.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = contextMenu.file.filename;
      a.click();
      toast.success(`Downloading "${contextMenu.file.filename}"`);
    } else {
      toast.warning("File content unavailable for direct text download.");
    }
  };

  const handleDelete = () => {
    if (!contextMenu.file) return;
    const targetFile = contextMenu.file;

    setInputModal({
      isOpen: true,
      title: "Move to Trash?",
      description: `Are you sure you want to move "${targetFile.filename}" to trash?`,
      confirmText: "Move to Trash",
      icon: Trash2,
      iconColor: "text-rose-400",
      isDestructive: true,
      isPromptOnly: true,
      onSubmit: async () => {
        try {
          await apiClient.delete(`/dochub/${targetFile._id}`);
          toast.info(`"${targetFile.filename}" moved to Trash`);
          fetchData(currentFolder.id);
        } catch (err) {
          console.error(err);
          toast.error("Failed to delete item");
        }
      },
    });
  };

  const openFolder = (folder) => {
    setFolderHistory((prev) => [...prev, currentFolder]);
    setCurrentFolder({ id: folder._id, name: folder.filename });
  };

  const navigateToBreadcrumb = (index) => {
    if (index === -1) {
      setCurrentFolder({ id: null, name: "My Storage" });
      setFolderHistory([]);
    } else {
      const targetFolder = folderHistory[index];
      setFolderHistory((prev) => prev.slice(0, index));
      setCurrentFolder(targetFolder);
    }
  };

  const openFile = (file) => {
    navigate(`/doceditor/${file._id}`);
  };

  const LOCAL_STORAGE_LIMIT = 100 * 1024 * 1024; // 100 MB Local Storage Quota
  const percent = Math.min((used / LOCAL_STORAGE_LIMIT) * 100, 100);

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 rounded hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <HardDrive className="text-blue-400" /> My Storage
        </h1>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>{(used / (1024 * 1024)).toFixed(1)} MB used</span>
          <span className="text-gray-400">100 MB Limit</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="flex flex-wrap gap-4 mb-6 relative">
        <button
          onClick={handleCreateFolder}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded flex items-center gap-2 transition shadow-lg text-sm"
        >
          <FolderPlus size={16} /> New Folder
        </button>
        <button
          onClick={handleCreateFile}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded flex items-center gap-2 transition text-sm"
        >
          <FilePlus size={16} /> New File
        </button>

        {/* Upload Button */}
        <div className="relative" ref={uploadMenuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowUploadMenu(!showUploadMenu);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2 transition shadow-lg text-sm"
          >
            <Upload size={16} /> Upload{" "}
            <ChevronRight
              size={16}
              className={`transform transition ${showUploadMenu ? "rotate-90" : ""}`}
            />
          </button>

          {showUploadMenu && (
            <div className="absolute top-full mt-2 left-0 w-56 bg-[#1a2235] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="p-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                From Device
              </div>
              <label className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 cursor-pointer text-sm">
                <FileText size={16} className="text-blue-400" /> File(s)
                <input type="file" multiple hidden onChange={handleUpload} />
              </label>

              <div className="border-t border-white/10 my-1"></div>

              <div className="p-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Cloud
              </div>
              <button
                onClick={() => {
                  setShowUploadMenu(false);
                  navigate("/cloudhub/google");
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-left text-green-400"
              >
                <CloudDownload size={16} /> Google Drive
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BREADCRUMBS */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
        <button onClick={() => navigateToBreadcrumb(-1)} className="hover:text-white transition">
          Root
        </button>
        {folderHistory.map((folder, index) => (
          <div key={folder.id} className="flex items-center gap-2">
            <ChevronRight size={14} />
            <button
              onClick={() => navigateToBreadcrumb(index)}
              className="hover:text-white transition"
            >
              {folder.name}
            </button>
          </div>
        ))}
        {currentFolder.id && (
          <div className="flex items-center gap-2">
            <ChevronRight size={14} />
            <span className="text-white font-medium">{currentFolder.name}</span>
          </div>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-4 border-b border-white/10 pb-2">
        Files & Folders
      </h2>

      {/* GRID */}
      {loading ? (
        <Loader variant="section" size="lg" text="Loading files and folders..." />
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white/5 rounded-2xl border border-white/10">
          Folder is empty. Create a folder or upload a file above.
        </div>
      ) : (
        <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Folders */}
          {items
            .filter((f) => f.type === "folder")
            .map((folder) => (
              <div
                key={folder._id}
                onContextMenu={(e) => handleContextMenu(e, folder)}
                className="p-4 rounded-xl bg-white/5 border border-transparent hover:border-emerald-500/50 hover:bg-white/10 transition flex flex-col justify-between relative group"
              >
                <div onClick={() => openFolder(folder)} className="cursor-pointer">
                  <FolderIcon
                    className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform"
                    size={24}
                    fill="currentColor"
                  />
                  <p className="text-sm font-medium truncate">{folder.filename}</p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    pushToCloud(folder, "folder", "google");
                  }}
                  className="mt-3 text-xs text-emerald-400 text-left hover:text-emerald-300 transition flex items-center gap-1 opacity-0 group-hover:opacity-100"
                >
                  <CloudUpload size={14} /> Sync to Drive
                </button>
              </div>
            ))}

          {/* Files */}
          {items
            .filter((f) => f.type !== "folder")
            .map((file) => (
              <div
                key={file._id}
                onContextMenu={(e) => handleContextMenu(e, file)}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition flex flex-col justify-between relative group"
              >
                <div onClick={() => openFile(file)} className="cursor-pointer">
                  <FileText className="text-blue-400 mb-2" size={24} />
                  <p className="text-sm font-medium truncate">{file.filename}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {((file.size || 0) / 1024).toFixed(1)} KB
                  </p>
                </div>

                <div className="mt-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      pushToCloud(file, "file", "google");
                    }}
                    className="text-xs text-blue-400 text-left hover:text-blue-300 transition flex items-center gap-1"
                  >
                    <CloudUpload size={14} /> Sync to Drive
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sendToBuddyBot(file);
                    }}
                    className="text-xs text-purple-400 text-left hover:text-purple-300 transition flex items-center gap-1"
                  >
                    <Bot size={14} /> Send to AI Assistant
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* CONTEXT MENU */}
      {contextMenu.visible && (
        <div
          className="fixed bg-[#1a2235] border border-white/10 rounded-lg shadow-xl z-50 py-1 w-44"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          <button
            onClick={handleRename}
            className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm flex items-center gap-2"
          >
            Rename
          </button>
          {contextMenu.file?.type !== "folder" && (
            <button
              onClick={handleDownload}
              className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm flex items-center gap-2"
            >
              Download
            </button>
          )}
          <button
            onClick={handleDelete}
            className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm text-red-400 flex items-center gap-2"
          >
            Delete
          </button>
        </div>
      )}

      {/* FLOATING GOOGLE DRIVE FOLDER PICKER MODAL */}
      <DriveFolderPickerModal
        isOpen={drivePickerModal.isOpen}
        onClose={() => setDrivePickerModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDriveSync}
        item={drivePickerModal.item}
      />

      {/* REUSABLE INPUT / CONFIRMATION MODAL */}
      <InputDialogModal
        isOpen={inputModal.isOpen}
        onClose={() => setInputModal((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={inputModal.onSubmit}
        title={inputModal.title}
        description={inputModal.description}
        placeholder={inputModal.placeholder}
        defaultValue={inputModal.defaultValue}
        confirmText={inputModal.confirmText}
        icon={inputModal.icon}
        iconColor={inputModal.iconColor}
        isDestructive={inputModal.isDestructive}
        isPromptOnly={inputModal.isPromptOnly}
      />
    </div>
  );
}
