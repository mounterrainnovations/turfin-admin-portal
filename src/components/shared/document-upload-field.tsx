import { useState, useRef } from "react";
import { CloudArrowUp, CheckCircle, ClockCountdown, X } from "@phosphor-icons/react";
import { useSecureUpload } from "@/hooks/use-secure-upload";
import { storageApi } from "@/domains/storage/api";
import { toast } from "react-hot-toast";

interface DocumentUploadFieldProps {
  label: string;
  module: "kyc" | "turf";
  moduleId: string;
  fieldKey: string;
  currentUrl?: string;
  onUploadComplete: (path: string) => void;
}

export function DocumentUploadField({
  label,
  module,
  moduleId,
  fieldKey,
  currentUrl,
  onUploadComplete,
}: DocumentUploadFieldProps) {
  const { upload, isUploading } = useSecureUpload({ module, moduleId });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    
    // Simple validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large (max 5MB)");
      return;
    }

    const path = await upload(file, fieldKey);
    if (path) {
      onUploadComplete(path);
      toast.success(`${label} uploaded`);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      
      <div
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
        className={`relative group h-14 border-2 border-dashed rounded-xl transition-all flex items-center px-4 gap-3 ${
          dragActive 
            ? "border-[#8a9e60] bg-[#8a9e60]/5" 
            : currentUrl 
              ? "border-[#8a9e60]/30 bg-white" 
              : "border-gray-100 bg-gray-50 hover:border-gray-200"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={onFileChange}
          accept="image/*,.pdf"
        />

        {isUploading ? (
          <div className="flex items-center gap-2 text-[#8a9e60]">
            <ClockCountdown size={18} className="animate-spin" />
            <span className="text-xs font-bold uppercase tracking-wider">Uploading...</span>
          </div>
        ) : currentUrl ? (
          <>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle size={18} weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-800 uppercase tracking-tight truncate">Document Provided</p>
              <button 
                onClick={async () => {
                  if (currentUrl.startsWith("http")) {
                    window.open(currentUrl, "_blank");
                  } else {
                    try {
                      const signedUrl = await storageApi.getViewUrl(currentUrl);
                      window.open(signedUrl, "_blank");
                    } catch (error) {
                      toast.error("Failed to generate view link");
                    }
                  }
                }}
                className="text-[9px] font-bold text-[#8a9e60] hover:underline text-left block"
              >
                VIEW CURRENT
              </button>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <CloudArrowUp size={16} />
            </button>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
              <CloudArrowUp size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Drop file or click to upload</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[9px] font-black text-[#8a9e60] hover:underline"
            >
              SELECT
            </button>
          </>
        )}
      </div>
    </div>
  );
}
