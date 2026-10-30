import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Loader2,
  FileText,
  FileUp,
  HardDrive,
  Cloud,
  X,
  ChevronRight,
  Folder,
} from 'lucide-react';
import apiClient from '../services/apiClient';

export default function ChatInterface({ onInsightAdded, initialFile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Holds the hidden text of the currently active document to pass to the AI
  const [activeContext, setActiveContext] = useState('');

  // Menu States
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCloudMenu, setShowCloudMenu] = useState(false);

  // My Storage Modal States
  const [isMyStorageModalOpen, setIsMyStorageModalOpen] = useState(false);
  const [myStorageFiles, setMyStorageFiles] = useState([]);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [currentStorageFolder, setCurrentStorageFolder] = useState({
    id: null,
    name: 'My Storage',
  });
  const [storageFolderHistory, setStorageFolderHistory] = useState([]);

  // Google Drive Modal States
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [currentDriveFolder, setCurrentDriveFolder] = useState({
    id: 'root',
    name: 'My Drive',
  });
  const [driveFolderHistory, setDriveFolderHistory] = useState([]);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // --- FETCH CHAT HISTORY ON LOAD ---
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get('/ai/chat/history');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setMessages(res.data);
        }
      } catch (err) {
        console.error('Failed to load chat history', err);
      }
    };
    fetchHistory();
  }, []);

  // --- AUTO-LOAD PASSED INITIAL FILE ---
  useEffect(() => {
    if (initialFile) {
      const fileName = initialFile.filename || initialFile.name;
      const content = initialFile.content || '';
      const summary = initialFile.summary || '';

      setActiveContext(
        `[Context Document Name: "${fileName}". Document Text: ${
          content ? content.substring(0, 3000) : 'No text content'
        }]\n\n`
      );

      setMessages((prev) => {
        const alreadyAdded = prev.some(
          (msg) => msg.type === 'file' && msg.fileName === fileName
        );
        if (alreadyAdded) return prev;

        return [
          ...prev,
          {
            role: 'user',
            type: 'file',
            fileName: fileName,
            text: `Attached from Storage: ${fileName}`,
            isSystem: true,
          },
          {
            role: 'ai',
            text: `**Document Analyzed:** ${fileName}\n\n${
              summary ? '**Summary:**\n' + summary + '\n\n' : ''
            }I'm ready! Ask me anything about this document.`,
          },
        ];
      });
    }
  }, [initialFile]);

  // --- AUTO-SCROLL ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- CHAT LOGIC ---
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const cleanHistory = newHistory.filter((msg) => !msg.isSystem).slice(-15);
      const contextPrefix = activeContext ? activeContext + 'User Question: ' : '';

      const res = await apiClient.post('/ai/chat', {
        message: contextPrefix + input,
        history: cleanHistory,
      });

      if (res.data?.reply) {
        setMessages([...newHistory, { role: 'ai', text: res.data.reply }]);
      } else {
        setMessages([
          ...newHistory,
          { role: 'ai', text: `Notice: ${res.data.message || 'No response.'}`, isSystem: true },
        ]);
      }
    } catch (error) {
      setMessages([
        ...newHistory,
        { role: 'ai', text: 'Connection error occurred.', isSystem: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 1. LOCAL FILE UPLOAD ---
  const handleLocalUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setShowAttachMenu(false);
    setShowCloudMenu(false);

    const uploadMsg = {
      role: 'user',
      type: 'file',
      fileName: file.name,
      text: `Uploading ${file.name}...`,
      isSystem: true,
    };
    setMessages((prev) => [...prev, uploadMsg]);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post('/ai/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = res.data;

      if (data) {
        setActiveContext(
          `[Context Document Name: "${file.name}". Document Text: ${
            data.text ? data.text.substring(0, 3000) : data.summary
          }]\n\n`
        );

        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: 'user',
            type: 'file',
            fileName: file.name,
            text: `Attached: ${file.name}`,
            isSystem: true,
          },
          {
            role: 'ai',
            text: `I've successfully read **${file.name}**. Here is a quick summary:\n\n${
              data.summary || 'Document ready.'
            }\n\nYou can now ask me follow-up questions about this document.`,
          },
        ]);
        if (onInsightAdded) onInsightAdded();
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'ai', text: 'Failed to upload file.', isSystem: true },
      ]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- 2. MY STORAGE LOGIC ---
  const openMyStorageModal = () => {
    setShowAttachMenu(false);
    setShowCloudMenu(false);
    setIsMyStorageModalOpen(true);
    setStorageFolderHistory([]);
    setCurrentStorageFolder({ id: null, name: 'My Storage' });
    fetchMyStorageData(null);
  };

  const fetchMyStorageData = async (parentId = null) => {
    setIsLoadingStorage(true);
    try {
      const url = parentId ? `/dochub?parentId=${parentId}` : `/dochub?parentId=null`;
      const res = await apiClient.get(url);
      setMyStorageFiles(res.data || []);
    } catch (err) {
      console.error('Failed to load MyStorage', err);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  const handleStorageFolderClick = (id, name) => {
    setStorageFolderHistory((prev) => [...prev, currentStorageFolder]);
    setCurrentStorageFolder({ id, name });
    fetchMyStorageData(id);
  };

  const handleStorageBreadcrumbClick = (index) => {
    const newHistory = storageFolderHistory.slice(0, index);
    const folder = storageFolderHistory[index];
    setStorageFolderHistory(newHistory);
    setCurrentStorageFolder(folder);
    fetchMyStorageData(folder.id);
  };

  const handleSelectMyStorageFile = async (file) => {
    setIsMyStorageModalOpen(false);
    setIsLoading(true);

    try {
      const res = await apiClient.get(`/dochub/${file._id}`);
      const fullFile = res.data;

      const content = fullFile.content || '';
      const summary = fullFile.summary || '';

      setActiveContext(
        `[Context Document Name: "${fullFile.filename}". Document Text: ${
          content ? content.substring(0, 3000) : 'No text content'
        }]\n\n`
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          type: 'file',
          fileName: fullFile.filename,
          text: `Attached from Storage: ${fullFile.filename}`,
          isSystem: true,
        },
        {
          role: 'ai',
          text: `**Document Analyzed:** ${fullFile.filename}\n\n${
            summary ? '**Summary:**\n' + summary + '\n\n' : ''
          }I'm ready! Ask me anything about this document.`,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Failed to load document content.', isSystem: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. GOOGLE DRIVE LOGIC ---
  const openDriveModal = () => {
    setShowAttachMenu(false);
    setShowCloudMenu(false);
    setIsDriveModalOpen(true);
    setDriveFolderHistory([]);
    setCurrentDriveFolder({ id: 'root', name: 'My Drive' });
    fetchDriveData('root');
  };

  const fetchDriveData = async (folderId) => {
    setIsLoadingDrive(true);
    try {
      const res = await apiClient.get(`/cloud/google/files?folderId=${folderId}`);
      setDriveFiles(res.data || []);
    } catch (err) {
      console.error('Failed to load Drive files', err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleDriveFolderClick = (id, name) => {
    setDriveFolderHistory((prev) => [...prev, currentDriveFolder]);
    setCurrentDriveFolder({ id, name });
    fetchDriveData(id);
  };

  const handleDriveBreadcrumbClick = (index) => {
    const newHistory = driveFolderHistory.slice(0, index);
    const folder = driveFolderHistory[index];
    setDriveFolderHistory(newHistory);
    setCurrentDriveFolder(folder);
    fetchDriveData(folder.id);
  };

  const handleSelectDriveFile = async (file) => {
    setIsDriveModalOpen(false);
    setIsUploading(true);

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        type: 'file',
        fileName: file.name,
        text: `Importing ${file.name} from Google Drive...`,
        isSystem: true,
      },
    ]);

    try {
      const res = await apiClient.post('/cloud/google/import', {
        fileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType,
      });

      const data = res.data;

      if (data) {
        const insight = data.insight || data.file || {};
        const content = insight.content || '';
        const summary = insight.summary || '';

        setActiveContext(
          `[Context Document Name: "${file.name}". Document Text: ${
            content ? content.substring(0, 3000) : 'No text content'
          }]\n\n`
        );

        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: 'user',
            type: 'file',
            fileName: file.name,
            text: `Attached from Drive: ${file.name}`,
            isSystem: true,
          },
          {
            role: 'ai',
            text: `I've successfully imported and analyzed **${file.name}**.\n\nSummary:\n${
              summary || 'File is ready for discussion.'
            }`,
          },
        ]);
        if (onInsightAdded) onInsightAdded();
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'ai',
          text: error.response?.data?.message || 'Failed to import from Google Drive.',
          isSystem: true,
        },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleAttachMenu = () => {
    setShowAttachMenu(!showAttachMenu);
    setShowCloudMenu(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white relative">
      {/* --- MY STORAGE MODAL --- */}
      {isMyStorageModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="font-semibold flex items-center gap-2">
                <HardDrive size={18} className="text-emerald-400" /> My Storage
              </h3>
              <button
                onClick={() => setIsMyStorageModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Storage Breadcrumbs */}
            <div className="px-4 py-3 bg-black/40 border-b border-white/10 flex items-center gap-2 text-xs text-gray-400 overflow-x-auto">
              <button
                onClick={() => {
                  setCurrentStorageFolder({ id: null, name: 'My Storage' });
                  setStorageFolderHistory([]);
                  fetchMyStorageData(null);
                }}
                className="hover:text-white whitespace-nowrap"
              >
                My Storage
              </button>
              {storageFolderHistory.map((f, i) => (
                <div key={f.id} className="flex items-center gap-2 whitespace-nowrap">
                  <ChevronRight size={12} />
                  <button
                    onClick={() => handleStorageBreadcrumbClick(i)}
                    className="hover:text-white"
                  >
                    {f.name}
                  </button>
                </div>
              ))}
              {currentStorageFolder.id && (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <ChevronRight size={12} />
                  <span className="text-white font-medium">{currentStorageFolder.name}</span>
                </div>
              )}
            </div>

            {/* Storage File List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoadingStorage ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-blue-400" size={24} />
                </div>
              ) : myStorageFiles.length === 0 ? (
                <div className="text-center text-gray-500 py-10">Folder is empty</div>
              ) : (
                <>
                  {myStorageFiles
                    .filter((f) => f.type === 'folder')
                    .map((folder) => (
                      <button
                        key={folder._id}
                        onClick={() =>
                          handleStorageFolderClick(folder._id, folder.filename || folder.name)
                        }
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition border border-transparent hover:border-white/10 text-left"
                      >
                        <Folder className="text-emerald-400" size={18} />
                        <span className="text-sm truncate flex-1">
                          {folder.filename || folder.name}
                        </span>
                        <ChevronRight size={16} className="text-gray-500" />
                      </button>
                    ))}
                  {myStorageFiles
                    .filter((f) => f.type !== 'folder')
                    .map((file) => (
                      <button
                        key={file._id}
                        onClick={() => handleSelectMyStorageFile(file)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-blue-600/20 transition border border-transparent hover:border-blue-500/30 text-left"
                      >
                        <FileText className="text-blue-400" size={18} />
                        <span className="text-sm truncate flex-1">{file.filename}</span>
                      </button>
                    ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- GOOGLE DRIVE MODAL --- */}
      {isDriveModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="font-semibold flex items-center gap-2">
                <Cloud size={18} className="text-blue-400" /> Google Drive
              </h3>
              <button
                onClick={() => setIsDriveModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drive Breadcrumbs */}
            <div className="px-4 py-3 bg-black/40 border-b border-white/10 flex items-center gap-2 text-xs text-gray-400 overflow-x-auto">
              <button
                onClick={() => {
                  setCurrentDriveFolder({ id: 'root', name: 'My Drive' });
                  setDriveFolderHistory([]);
                  fetchDriveData('root');
                }}
                className="hover:text-white whitespace-nowrap"
              >
                My Drive
              </button>
              {driveFolderHistory.map((f, i) => (
                <div key={f.id} className="flex items-center gap-2 whitespace-nowrap">
                  <ChevronRight size={12} />
                  <button
                    onClick={() => handleDriveBreadcrumbClick(i)}
                    className="hover:text-white"
                  >
                    {f.name}
                  </button>
                </div>
              ))}
              <ChevronRight size={12} />
              <span className="text-white whitespace-nowrap">{currentDriveFolder.name}</span>
            </div>

            {/* Drive File List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoadingDrive ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-amber-400" size={24} />
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="text-center text-gray-500 py-10">Folder is empty</div>
              ) : (
                <>
                  {driveFiles
                    .filter((f) => f.mimeType?.includes('folder'))
                    .map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleDriveFolderClick(folder.id, folder.name)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition border border-transparent hover:border-white/10 text-left"
                      >
                        <Folder className="text-emerald-400" size={18} />
                        <span className="text-sm truncate flex-1">{folder.name}</span>
                        <ChevronRight size={16} className="text-gray-500" />
                      </button>
                    ))}
                  {driveFiles
                    .filter((f) => !f.mimeType?.includes('folder'))
                    .map((file) => (
                      <button
                        key={file.id}
                        onClick={() => handleSelectDriveFile(file)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-blue-600/20 transition border border-transparent hover:border-blue-500/30 text-left"
                      >
                        <FileText className="text-blue-400" size={18} />
                        <span className="text-sm truncate flex-1">{file.name}</span>
                      </button>
                    ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Header */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">AI Assistant (Groq)</h2>
          <p className="text-xs text-gray-400">Context-Aware Document Analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-emerald-400 font-medium">Online</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 relative z-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm text-center">
            <FileText size={48} className="mb-4 text-white/20" />
            <p>Ask a question or upload a file to begin.</p>
            <p className="text-xs mt-2 opacity-60">I can read PDFs, DOCX, TXT, and MD files.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-3.5 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 border border-blue-500 rounded-tr-sm text-white'
                  : 'bg-white/10 border border-white/10 rounded-tl-sm text-gray-200'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 bg-white/10 border border-white/10 rounded-2xl text-sm flex items-center gap-2 text-gray-400">
              <Loader2 className="animate-spin text-blue-400" size={16} /> Thinking with Groq...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-white/5 flex items-center gap-3 relative z-10">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleLocalUpload}
          className="hidden"
          accept=".pdf,.docx,.txt,.md"
        />

        <div className="relative">
          <button
            onClick={toggleAttachMenu}
            disabled={isUploading || isLoading}
            className={`p-2 rounded-full transition disabled:opacity-50 ${
              showAttachMenu
                ? 'bg-white/20 text-white'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {showAttachMenu ? <X size={20} /> : <Paperclip size={20} />}
          </button>

          {showAttachMenu && (
            <div className="absolute bottom-12 left-0 w-56 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <button
                onClick={() => {
                  setShowAttachMenu(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-sm text-left transition text-gray-200 hover:text-white"
              >
                <FileUp size={18} className="text-gray-400" />
                Device File
              </button>

              <button
                onClick={openMyStorageModal}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-sm text-left transition border-t border-white/10 text-gray-200 hover:text-white"
              >
                <HardDrive size={18} className="text-emerald-400" />
                MyStorage
              </button>

              <button
                onClick={() => setShowCloudMenu(!showCloudMenu)}
                className={`flex items-center justify-between px-4 py-3 text-sm text-left transition border-t border-white/10 text-gray-200 hover:text-white ${
                  showCloudMenu ? 'bg-white/10' : 'hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Cloud size={18} className="text-blue-400" />
                  Cloud Storage
                </div>
                <ChevronRight
                  size={16}
                  className={`transition-transform duration-200 ${
                    showCloudMenu ? 'rotate-90 text-white' : 'text-gray-500'
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-black/40 ${
                  showCloudMenu ? 'max-h-40 border-t border-white/10' : 'max-h-0'
                }`}
              >
                <button
                  onClick={openDriveModal}
                  className="flex items-center w-full gap-3 px-8 py-2.5 hover:bg-white/10 text-xs text-left transition text-gray-300 hover:text-white"
                >
                  <Cloud size={14} className="text-blue-400" />
                  Google Drive
                </button>
              </div>
            </div>
          )}
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading || isUploading}
          placeholder="Ask AI Assistant a question..."
          className="flex-1 bg-black/30 border border-white/10 rounded-full px-5 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition placeholder-gray-500"
        />

        <button
          onClick={handleSend}
          disabled={isLoading || isUploading || !input.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-full transition flex items-center justify-center text-white shadow-lg"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
