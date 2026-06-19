"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import {
  FolderOpen, Folder, FileText, Image, Film, Archive, Plus,
  Search, Grid3x3, List, Download, Trash2, Upload, ChevronRight,
  File, Music, MoreHorizontal, RefreshCw, X,
} from "lucide-react";
import { toJalali } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FileType = "folder" | "image" | "video" | "document" | "archive" | "audio" | "other";

interface FileItem {
  id: string; name: string; type: string; size: number;
  folderId: string | null; createdAt: string; url: string;
}

interface Folder { id: string; name: string; parentId: string | null; }

const FILE_ICONS: Record<FileType, { icon: typeof File; color: string }> = {
  folder:   { icon: Folder,   color: "text-amber-400" },
  image:    { icon: Image,    color: "text-blue-400" },
  video:    { icon: Film,     color: "text-purple-400" },
  document: { icon: FileText, color: "text-emerald-400" },
  archive:  { icon: Archive,  color: "text-orange-400" },
  audio:    { icon: Music,    color: "text-pink-400" },
  other:    { icon: File,     color: "text-muted-foreground" },
};

function getFileType(mimeType: string): FileType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("document") || mimeType.includes("text")) return "document";
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar") || mimeType.includes("7z")) return "archive";
  return "other";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null); // null = root
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [filesRes, foldersRes] = await Promise.all([
        apiClient.get(`/file-items${activeFolder ? `?folderId=${activeFolder}` : "?folderId=root"}`),
        apiClient.get("/file-folders"),
      ]);
      setFiles(filesRes.data?.data ?? []);
      setFolders(foldersRes.data?.data ?? []);
    } catch { toast.error("خطا در بارگذاری فایل‌ها"); }
    finally { setLoading(false); }
  }, [activeFolder]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentSubFolders = folders.filter((f) =>
    activeFolder === null ? f.parentId === null : f.parentId === activeFolder
  );

  const currentFolder = folders.find((f) => f.id === activeFolder);

  const filteredFiles = search
    ? files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  const totalSize = files.reduce((s, f) => s + (f.size ?? 0), 0);

  const toggleSelect = (id: string) => setSelected((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (activeFolder) fd.append("folderId", activeFolder);
      await apiClient.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("فایل آپلود شد");
      fetchData();
    } catch { toast.error("خطا در آپلود"); }
    finally { setUploading(false); if (uploadRef.current) uploadRef.current.value = ""; }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این فایل مطمئن هستید؟")) return;
    try {
      await apiClient.delete(`/file-items/${id}`);
      setFiles((p) => p.filter((f) => f.id !== id));
      setSelected((p) => p.filter((i) => i !== id));
      toast.success("فایل حذف شد");
    } catch { toast.error("خطا در حذف"); }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`آیا از حذف ${selected.length} فایل مطمئن هستید؟`)) return;
    for (const id of selected) {
      await apiClient.delete(`/file-items/${id}`).catch((err) => console.error(err));
    }
    setFiles((p) => p.filter((f) => !selected.includes(f.id)));
    setSelected([]);
    toast.success(`${selected.length} فایل حذف شد`);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await apiClient.post("/file-folders", { name: newFolderName.trim(), parentId: activeFolder });
      setFolders((p) => [...p, res.data]);
      setNewFolderName("");
      setShowNewFolder(false);
      toast.success("پوشه ایجاد شد");
    } catch { toast.error("خطا در ایجاد پوشه"); }
  };

  return (
    <div className="space-y-5 h-full">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary" />مدیریت فایل‌ها
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{formatFileSize(totalSize)} فضای مصرفی · {files.length} فایل</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading}
            className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground disabled:opacity-50">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <label className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm hover:bg-muted/80 transition-colors cursor-pointer", uploading && "opacity-60 cursor-wait")}>
            <Upload className="w-4 h-4" />{uploading ? "در حال آپلود..." : "آپلود"}
            <input ref={uploadRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          <button onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow">
            <Plus className="w-4 h-4" />پوشه جدید
          </button>
        </div>
      </motion.div>

      {/* New folder modal */}
      {showNewFolder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNewFolder(false)}>
          <div className="w-80 bg-card border border-border rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">پوشه جدید</h3>
              <button onClick={() => setShowNewFolder(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus placeholder="نام پوشه..."
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <div className="flex gap-3">
              <button onClick={() => setShowNewFolder(false)} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
              <button onClick={handleCreateFolder} className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm">ایجاد</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Sidebar */}
        <div className="w-52 shrink-0 rounded-2xl bg-card border border-border p-3 overflow-y-auto">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-2 mb-2">پوشه‌ها</p>
          <button onClick={() => setActiveFolder(null)}
            className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all text-right",
              activeFolder === null ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
            <FolderOpen className="w-3.5 h-3.5 shrink-0" />همه فایل‌ها
          </button>
          {folders.filter((f) => f.parentId === null).map((folder) => {
            const children = folders.filter((c) => c.parentId === folder.id);
            return (
              <div key={folder.id}>
                <button onClick={() => setActiveFolder(folder.id)}
                  className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all text-right mt-0.5",
                    activeFolder === folder.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                  {activeFolder === folder.id ? <FolderOpen className="w-3.5 h-3.5 shrink-0" /> : <Folder className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{folder.name}</span>
                </button>
                {children.map((child) => (
                  <button key={child.id} onClick={() => setActiveFolder(child.id)}
                    className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ms-3 text-right",
                      activeFolder === child.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                    <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
                    <span className="truncate">{child.name}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی فایل..."
                className="w-full pe-9 ps-3 py-2 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            {selected.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{selected.length} انتخاب شده</span>
                <button onClick={handleDeleteSelected} className="p-2 rounded-lg bg-muted hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelected([])} className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-muted">
              <button onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-lg transition-all", viewMode === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-lg transition-all", viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <button onClick={() => setActiveFolder(null)} className="hover:text-foreground transition-colors">همه فایل‌ها</button>
            {currentFolder && (<><ChevronRight className="w-3 h-3" /><span className="text-foreground">{currentFolder.name}</span></>)}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-card border border-border animate-pulse" />)}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {currentSubFolders.map((folder) => (
                  <motion.button key={folder.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveFolder(folder.id)}
                    className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 text-center transition-all group">
                    <Folder className="w-10 h-10 text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-medium text-foreground truncate">{folder.name}</p>
                  </motion.button>
                ))}
                {filteredFiles.map((file) => {
                  const fileType = getFileType(file.type);
                  const { icon: Icon, color } = FILE_ICONS[fileType];
                  const isSelected = selected.includes(file.id);
                  return (
                    <motion.div key={file.id} whileHover={{ scale: 1.02 }}
                      className={cn("p-4 rounded-xl border cursor-pointer transition-all group relative",
                        isSelected ? "bg-primary/10 border-primary/40" : "bg-card border-border hover:border-primary/30")}>
                      <div className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                        <button onClick={(e) => { e.stopPropagation(); toggleSelect(file.id); }}
                          className="p-0.5 rounded bg-card/80 text-muted-foreground hover:text-foreground">
                          {isSelected ? <span className="text-primary text-xs">✓</span> : <MoreHorizontal className="w-3 h-3" />}
                        </button>
                        <a href={file.url} download target="_blank" rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-0.5 rounded bg-card/80 text-muted-foreground hover:text-foreground">
                          <Download className="w-3 h-3" />
                        </a>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                          className="p-0.5 rounded bg-card/80 text-muted-foreground hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {fileType === "image" && file.url ? (
                        <img src={file.url} alt={file.name} className="w-10 h-10 mx-auto mb-2 object-cover rounded" />
                      ) : (
                        <Icon className={cn("w-10 h-10 mx-auto mb-2", color)} />
                      )}
                      <p className="text-xs font-medium text-foreground truncate text-center" title={file.name}>{file.name}</p>
                      <p className="text-[10px] text-muted-foreground text-center mt-1">{formatFileSize(file.size ?? 0)}</p>
                    </motion.div>
                  );
                })}
                {filteredFiles.length === 0 && currentSubFolders.length === 0 && (
                  <div className="col-span-5 py-20 text-center text-muted-foreground">
                    <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{search ? "فایلی یافت نشد" : "این پوشه خالی است"}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["نام", "نوع", "حجم", "تاریخ", ""].map((h, i) => (
                        <th key={i} className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentSubFolders.map((folder) => (
                      <tr key={folder.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setActiveFolder(folder.id)}>
                        <td className="px-4 py-2.5 font-medium text-foreground flex items-center gap-2">
                          <Folder className="w-4 h-4 text-amber-400" />{folder.name}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">پوشه</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">—</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">—</td>
                        <td className="px-4 py-2.5" />
                      </tr>
                    ))}
                    {filteredFiles.map((file) => {
                      const fileType = getFileType(file.type);
                      const { icon: Icon, color } = FILE_ICONS[fileType];
                      return (
                        <tr key={file.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                          <td className="px-4 py-2.5 font-medium text-foreground">
                            <span className="flex items-center gap-2"><Icon className={cn("w-4 h-4 shrink-0", color)} />{file.name}</span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground capitalize">{fileType}</td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums">{formatFileSize(file.size ?? 0)}</td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">{toJalali(file.createdAt)}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a href={file.url} download target="_blank" rel="noreferrer"
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              <button onClick={() => handleDelete(file.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredFiles.length === 0 && currentSubFolders.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                        <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        {search ? "فایلی یافت نشد" : "این پوشه خالی است"}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
