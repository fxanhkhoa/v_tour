import React, { useState, useRef } from 'react';
import { Language } from '../lib/translations';

interface TourImageUploaderProps {
  imageUrl: string;
  onChange: (newImageUrl: string) => void;
  language?: Language;
  label?: string;
  required?: boolean;
}

const PRESET_SAMPLE_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
    title: 'Hanoi Old Quarter & Street Food',
    category: 'Food'
  },
  {
    url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80',
    title: 'Halong Bay & Karst Islands',
    category: 'Nature'
  },
  {
    url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1000&q=80',
    title: 'Hoi An Ancient Town Lanterns',
    category: 'Heritage'
  },
  {
    url: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1000&q=80',
    title: 'Saigon Notre Dame & Vespa Tour',
    category: 'City'
  },
  {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    title: 'Da Nang & My Khe Beach',
    category: 'Beach'
  },
  {
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1000&q=80',
    title: 'Ninh Binh & Tam Coc River',
    category: 'Adventure'
  },
  {
    url: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1000&q=80',
    title: 'Mekong Delta Floating Market',
    category: 'River'
  },
  {
    url: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1000&q=80',
    title: 'Hue Imperial City & Pagodas',
    category: 'History'
  }
];

export const TourImageUploader: React.FC<TourImageUploaderProps> = ({
  imageUrl,
  onChange,
  language = 'en',
  label,
  required = true
}) => {
  const isVi = language === 'vi';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [fileSizeText, setFileSizeText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showSampleGallery, setShowSampleGallery] = useState(false);

  // Helper to compress and optimize image to WebP/JPEG base64 for fast rendering
  const processAndOptimizeImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage(
        isVi
          ? 'Tệp đã chọn không phải hình ảnh hợp lệ. Vui lòng chọn tệp JPG, PNG, WEBP hoặc GIF.'
          : 'Selected file is not an image. Please choose a JPG, PNG, WEBP, or GIF file.'
      );
      return;
    }

    // Limit initial file size check to 25MB
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage(
        isVi
          ? 'Kích thước tệp quá lớn (>25MB). Vui lòng chọn tệp ảnh nhỏ hơn.'
          : 'File size is too large (>25MB). Please choose a smaller photo.'
      );
      return;
    }

    setErrorMessage('');
    setIsProcessing(true);
    setUploadedFileName(file.name);

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    setFileSizeText(formatSize(file.size));

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        setIsProcessing(false);
        return;
      }

      // Optimize image via Canvas to prevent huge payload while maintaining HD crispness
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1600;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Try to export as image/jpeg with 0.88 quality
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          onChange(optimizedDataUrl);
        } else {
          onChange(result);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        onChange(result);
        setIsProcessing(false);
      };
      img.src = result;
    };
    reader.onerror = () => {
      setErrorMessage(
        isVi ? 'Không thể đọc tệp ảnh. Vui lòng thử lại.' : 'Failed to read image file. Please try again.'
      );
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndOptimizeImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndOptimizeImage(file);
    }
  };

  const handleClearImage = () => {
    onChange('');
    setUploadedFileName('');
    setFileSizeText('');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {/* Label and Upload Controls */}
      <div className="flex items-center justify-between">
        <label className="block font-bold text-slate-800 text-xs">
          {label || (isVi ? 'Tải Ảnh Bìa Tour Từ Máy Tính / Thiết Bị' : 'Upload Tour Cover Image From Machine')}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>

        <div className="flex items-center space-x-2">
          {/* Sample gallery toggle button */}
          <button
            type="button"
            onClick={() => setShowSampleGallery(!showSampleGallery)}
            className="text-[11px] font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
          >
            <span className="material-symbols-outlined text-xs">collections</span>
            <span>{showSampleGallery ? (isVi ? 'Đóng kho ảnh mẫu' : 'Hide sample gallery') : (isVi ? 'Chọn ảnh mẫu đẹp' : 'Sample photos')}</span>
          </button>
        </div>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/avif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Upload Dropzone or Preview */}
      {imageUrl ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-teal-500/40 bg-slate-900 group shadow-md transition-all">
          {/* Cover Preview Image */}
          <div className="relative h-44 sm:h-52 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
            <img
              src={imageUrl}
              alt="Tour cover preview"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80';
              }}
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-black/30 pointer-events-none"></div>

            {/* Status Badge */}
            <div className="absolute top-3 left-3 flex items-center space-x-2 z-10">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center space-x-1 shadow-md">
                <span className="material-symbols-outlined text-xs">check_circle</span>
                <span>{isVi ? 'Ảnh Bìa Đã Sẵn Sàng' : 'Cover Image Ready'}</span>
              </span>
              {uploadedFileName && (
                <span className="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white font-mono text-[10px] truncate max-w-[180px] border border-white/10 hidden sm:inline-block">
                  📷 {uploadedFileName} {fileSizeText ? `(${fileSizeText})` : ''}
                </span>
              )}
            </div>

            {/* Action Buttons inside Overlay */}
            <div className="absolute bottom-3 right-3 flex items-center space-x-2 z-10">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-3.5 py-2 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-xs font-black shadow-lg cursor-pointer transition-all flex items-center space-x-1.5 active:scale-95 border border-white"
              >
                <span className="material-symbols-outlined text-sm text-teal-600">upload_file</span>
                <span>{isVi ? 'Tải Ảnh Khác Từ Máy' : 'Upload New Photo From Device'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearImage}
                className="p-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold shadow-lg cursor-pointer transition-all active:scale-95 border border-rose-400/30"
                title={isVi ? 'Xóa ảnh' : 'Remove photo'}
              >
                <span className="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload State - Large Interactive Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
            isDragging
              ? 'border-teal-500 bg-teal-50/80 scale-[1.01]'
              : 'border-slate-300 hover:border-teal-500 bg-slate-50/80 hover:bg-teal-50/30'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
          </div>

          <div className="space-y-1 max-w-sm">
            <p className="font-extrabold text-sm text-slate-900">
              {isVi ? 'Bấm để tải ảnh từ máy tính hoặc kéo thả ảnh vào đây' : 'Click to upload image from your computer or drag & drop'}
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {isVi
                ? 'Hỗ trợ định dạng JPG, PNG, WEBP, GIF. Tự động tối ưu độ phân giải cao (HD) cho trang bìa tour.'
                : 'Supports JPG, PNG, WEBP, GIF. Automatically optimized in high-definition (HD) for your tour listing.'}
            </p>
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow cursor-pointer transition-all flex items-center space-x-1.5 pointer-events-none"
          >
            <span className="material-symbols-outlined text-base">upload</span>
            <span>{isVi ? 'Chọn Tệp Ảnh Từ Thiết Bị' : 'Choose Photo From Machine'}</span>
          </button>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center space-x-2 text-teal-800 text-xs font-bold animate-pulse">
          <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
          <span>{isVi ? 'Đang đọc và tối ưu hóa ảnh đại diện...' : 'Processing and optimizing image for tour listing...'}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs font-bold">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Optional Preset Sample Gallery (collapsible for convenience) */}
      {showSampleGallery && (
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
              {isVi ? 'Kho Ảnh Phong Cảnh Việt Nam Gợi Ý (Hoặc tải từ máy)' : 'Curated Vietnam Sample Photos (Or upload from your machine)'}
            </span>
            <span className="text-[10px] text-slate-400">{PRESET_SAMPLE_IMAGES.length} photos</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_SAMPLE_IMAGES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(preset.url);
                  setUploadedFileName(preset.title);
                  setFileSizeText('HD Sample');
                  setErrorMessage('');
                  setShowSampleGallery(false);
                }}
                className={`relative rounded-xl overflow-hidden group border-2 text-left transition-all cursor-pointer h-20 ${
                  imageUrl === preset.url ? 'border-teal-600 ring-2 ring-teal-400/50' : 'border-transparent hover:border-teal-400'
                }`}
              >
                <img src={preset.url} alt={preset.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                  <p className="text-[10px] font-bold text-white leading-tight truncate">{preset.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
