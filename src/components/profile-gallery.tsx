"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Upload, 
  Trash2, 
  Loader2, 
  Plus, 
  Image as ImageIcon,
  X,
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileImage {
  id: string;
  url: string;
  file_name: string;
  created_at: string;
}

interface ProfileGalleryProps {
  profileId: string;
}

export default function ProfileGallery({ profileId }: ProfileGalleryProps) {
  const [images, setImages] = useState<ProfileImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profile_images")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load gallery");
    } else if (data) {
      setImages(data);
    }
    setIsLoading(false);
  }, [profileId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `gallery/${profileId}/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from("profile_images")
          .insert({
            profile_id: profileId,
            url: publicUrl,
            file_name: file.name
          });

        if (dbError) throw dbError;
        return true;
      } catch (error: any) {
        console.error("Upload error:", error);
        return false;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successCount = results.filter(Boolean).length;

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} image(s)`);
      fetchImages();
    } else {
      toast.error("All uploads failed");
    }
    setIsUploading(false);
  };

  const handleDelete = async (id: string, url: string) => {
    try {
      // 1. Delete from storage (need to extract path from URL)
      // Usually URL is like .../storage/v1/object/public/avatars/gallery/...
      const pathPart = url.split('/avatars/')[1];
      if (pathPart) {
        await supabase.storage.from("avatars").remove([pathPart]);
      }

      // 2. Delete from DB
      const { error } = await supabase
        .from("profile_images")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.id !== id));
      toast.success("Image removed from gallery");
    } catch (error: any) {
      toast.error("Failed to delete image");
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <ImageIcon className="w-2.5 h-2.5 text-blue-600" />
            Persona Gallery
          </h4>
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            id="gallery-upload"
            multiple 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => handleUpload(e.target.files)}
            disabled={isUploading}
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => document.getElementById('gallery-upload')?.click()}
            className="text-blue-600 hover:bg-blue-50 border-blue-300 h-10 px-4 font-bold text-[10px] uppercase rounded-sm shadow-none"
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Plus className="w-3 h-3 mr-2" />}
            Upload Images
          </Button>
        </div>
      </div>

      {/* Dropzone */}
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "border-2 border-dashed rounded-sm p-12 transition-all flex flex-col items-center justify-center space-y-4",
          dragActive ? "border-blue-500 bg-blue-50/50" : "border-gray-200 bg-gray-50/30 hover:bg-gray-50/50 hover:border-gray-300"
        )}
      >
        <div className="w-12 h-12 rounded-sm bg-white border border-gray-200 flex items-center justify-center shadow-none text-gray-400">
            <Upload className="w-6 h-6" />
        </div>
        <div className="text-center">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Drag and drop images here</p>
            <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-tighter">or click the upload button above</p>
        </div>
      </div>

      {/* Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div 
              key={image.id} 
              className="group relative aspect-square bg-gray-100 border border-gray-300 rounded-sm overflow-hidden"
            >
              <img 
                src={image.url} 
                alt={image.file_name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(image.id, image.url)}
                    className="h-8 w-8 text-white hover:text-red-500 hover:bg-white rounded-sm shadow-none"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
                <a href={image.url} target="_blank" rel="noreferrer">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-white hover:text-blue-500 hover:bg-white rounded-sm shadow-none"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-gray-300 rounded-sm bg-gray-50/30 text-gray-400 shadow-none">
            <div className="bg-white w-16 h-16 rounded-sm border border-gray-300 flex items-center justify-center mx-auto mb-6 shadow-none">
              <ImageIcon className="w-8 h-8 opacity-20" />
            </div>
            <h4 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-1">
              Your gallery is empty
            </h4>
            <p className="text-[10px] font-medium text-gray-400 max-w-[200px] mx-auto leading-relaxed">
              Drag and drop images to start building this persona's reference gallery.
            </p>
        </div>
      )}
    </div>
  );
}
