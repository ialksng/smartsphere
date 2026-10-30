import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Save, ArrowLeft, CloudUpload, Bot, X, Send } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Loader from "../components/Loader";
import { useToast } from "../context/ToastContext";
import apiClient from "../services/apiClient";

const DocEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  // Extract the document ID directly from the URL (e.g., /doceditor/12345)
  const { id } = useParams();

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isBotOpen, setIsBotOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-full text-black leading-relaxed",
      },
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  useEffect(() => {
    // Look for the ID in the URL first, fallback to hidden location state if missing
    const docId = id || location.state?.docId;

    if (!docId) {
      navigate("/dochub");
      return;
    }

    const fetchFile = async () => {
      try {
        const res = await apiClient.get(`/dochub/${docId}`);
        const data = res.data;

        if (data && data._id) {
          setSelectedFile(data);
          setChatHistory([
            {
              role: "ai",
              text: `**Document Summary:**\n${
                data.summary || "No summary available for this file."
              }\n\nI'm ready! Ask me anything about this document.`,
            },
          ]);
        } else {
          toast.error("Could not load file content.");
          navigate("/dochub");
        }
      } catch (err) {
        console.error("Failed to load document", err);
        toast.error("Failed to load document.");
        navigate("/dochub");
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [id, location.state, navigate]);

  useEffect(() => {
    if (editor && selectedFile && selectedFile.content !== undefined) {
      const contentToSet = selectedFile.content?.includes("<")
        ? selectedFile.content
        : `<p>${(selectedFile.content || '').replace(/\n/g, "<br>")}</p>`;

      editor.commands.setContent(contentToSet);
    }
  }, [selectedFile, editor]);

  const saveFile = async () => {
    if (!selectedFile || !editor) return;
    setSaving(true);
    try {
      await apiClient.put(`/dochub/${selectedFile._id}`, {
        content: editor.getHTML(),
      });
      toast.success("Saved document locally!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const syncToCloud = async () => {
    if (!selectedFile) return;
    try {
      await apiClient.post("/cloud/google/upload-dochub", {
        fileId: selectedFile._id,
        fileName: selectedFile.filename,
        content: editor?.getHTML() || selectedFile.content,
      });
      toast.success("Synced edits to Google Drive successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to sync to cloud.");
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);

    try {
      const hiddenContext = `[Context Document Name: "${selectedFile.filename}". Document Text: ${
        selectedFile.content ? selectedFile.content.substring(0, 3000) : "No text content"
      }]\n\nUser Question: `;

      const res = await apiClient.post("/ai/chat", {
        message: hiddenContext + userMsg,
        history: chatHistory.map((h) => ({ role: h.role, text: h.text })),
      });

      const reply = res.data?.reply || "Sorry, I couldn't process that.";
      setChatHistory((prev) => [...prev, { role: "ai", text: reply }]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", text: "Error connecting to AI Assistant." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <Loader variant="full" size="lg" text="Loading Document..." subtext="Syncing content with workspace" />
      </div>
    );
  }

  if (!selectedFile) return null;

  const isEditable = selectedFile.contentType === "text" || !selectedFile.contentType;

  return (
    <div className="p-6 bg-[#0b0f19] text-white h-screen flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold truncate max-w-md">{selectedFile.filename}</h2>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsBotOpen(!isBotOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              isBotOpen
                ? "bg-indigo-600 text-white"
                : "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40"
            }`}
          >
            <Bot size={16} /> {isBotOpen ? "Close AI Assistant" : "Ask AI Assistant"}
          </button>

          {(selectedFile.source === "google_drive" ||
            selectedFile.cloudProvider === "google" ||
            selectedFile.externalId) && (
            <button
              onClick={syncToCloud}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <CloudUpload size={16} /> Sync to Drive
            </button>
          )}

          {isEditable && (
            <button
              onClick={saveFile}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-4 py-2 rounded-lg transition-colors text-sm"
            >
              {saving ? <Loader variant="button" size="sm" text="Saving..." /> : <><Save size={16} /> Save</>}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 relative">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden relative flex flex-col min-w-0 shadow-lg">
          {selectedFile.contentType === "pdf" && selectedFile.fileUrl ? (
            <iframe
              src={selectedFile.fileUrl?.replace(/\/view.*$/, "/preview") || ''}
              className="w-full h-full bg-white border-0"
              title="PDF Preview"
            />
          ) : selectedFile.contentType === "image" && selectedFile.fileUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-black/40 p-4 overflow-hidden">
              <img
                src={selectedFile.fileUrl}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
                alt={selectedFile.filename}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto bg-black/20 p-4 sm:p-8">
              <div className="w-full max-w-4xl mx-auto bg-white min-h-full shadow-2xl rounded-lg p-8 sm:p-12 text-black">
                <EditorContent
                  editor={editor}
                  className="prose prose-slate max-w-none focus:outline-none min-h-full"
                />
              </div>
            </div>
          )}
        </div>

        {isBotOpen && (
          <div className="w-[400px] bg-[#131b2f] border border-white/10 rounded-xl flex flex-col shrink-0 shadow-2xl h-full overflow-hidden z-10 transition-all duration-300">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-indigo-600/10 shrink-0">
              <h3 className="font-semibold flex items-center gap-2 text-indigo-400">
                <Bot size={18} /> AI Assistant Context
              </h3>
              <button
                onClick={() => setIsBotOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`p-3 rounded-xl max-w-[85%] text-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none shadow-md"
                        : "bg-white/10 text-gray-200 rounded-bl-none shadow-md"
                    }`}
                  >
                    {msg.role === "ai" ? (
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => <p className="mb-1.5 last:mb-0 leading-relaxed" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-semibold text-blue-300" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                          li: ({ node, ...props }) => <li className="text-gray-200" {...props} />,
                          code: ({ node, inline, ...props }) =>
                            inline ? (
                              <code className="bg-black/40 text-blue-300 px-1 py-0.5 rounded text-xs" {...props} />
                            ) : (
                              <code className="block bg-black/40 p-2 rounded text-xs overflow-x-auto text-blue-200 font-mono" {...props} />
                            ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 p-3 rounded-xl rounded-bl-none text-gray-400 text-sm">
                    <Loader variant="inline" size="xs" text="Analyzing Document..." />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-white/10 bg-black/20 flex gap-2 shrink-0"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about this document..."
                className="flex-1 bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 px-3 py-2 rounded-lg transition-colors flex items-center justify-center text-white"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocEditor;
