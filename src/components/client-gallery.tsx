"use client";

import React, { useState, useEffect } from "react";
import { Plus, Download, Trash2, ImageIcon, Loader2, Maximize2, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Asset {
  id: string;
  client_id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  created_at: string;
}

export default function ClientGallery({ clientId }: { clientId: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);

  useEffect(() => {
    fetchAssets();
  }, [clientId]);

  async function fetchAssets() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("client_assets")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching assets:", error);
    } else {
      setAssets(data || []);
    }
    setIsLoading(false);
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${clientId}/${fileName}`;

    try {
      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from("client-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Save to Database
      const { error: dbError } = await supabase
        .from("client_assets")
        .insert([{
          client_id: clientId,
          storage_path: filePath,
          file_name: file.name,
          file_type: file.type
        }]);

      if (dbError) throw dbError;

      toast.success("Image uploaded successfully");
      fetchAssets();
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (asset: Asset) => {
    try {
      // 1. Delete from Storage
      const { error: storageError } = await supabase.storage
        .from("client-assets")
        .remove([asset.storage_path]);

      if (storageError) throw storageError;

      // 2. Delete from Database
      const { error: dbError } = await supabase
        .from("client_assets")
        .delete()
        .eq("id", asset.id);

      if (dbError) throw dbError;

      toast.success("Image deleted");
      fetchAssets();
      if (selectedImage?.id === asset.id) setSelectedImage(null);
    } catch (error: any) {
      toast.error("Delete failed: " + error.message);
    }
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("client-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDownload = (asset: Asset) => {
    const url = getPublicUrl(asset.storage_path);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Gallery</h3>
        <div className="relative">
          <input
            type="file"
            id="gallery-upload"
            className="hidden"
            accept="image/*"
            onChange={handleUpload}
            disabled={isUploading}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => document.getElementById('gallery-upload')?.click()}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 font-bold text-xs uppercase"
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
            Add Image
          </Button>
        </div>
      </div>

      <div className={cn(
        "rounded-lg border border-gray-100 p-2 bg-gray-50/30",
        assets.length === 0 && "py-10 flex flex-col items-center justify-center border-dashed"
      )}>
        {isLoading ? (
          <div className="text-xs text-gray-400 py-4 w-full text-center">Loading gallery...</div>
        ) : assets.length === 0 ? (
          <>
            <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
            <span className="text-xs font-medium text-gray-400">No images yet</span>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {assets.map((asset) => (
              <div key={asset.id} className="group relative aspect-square rounded-md overflow-hidden bg-white border border-gray-200/50 shadow-sm">
                <img 
                  src={getPublicUrl(asset.storage_path)} 
                  alt={asset.file_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setSelectedImage(asset)}>
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => handleDownload(asset)}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-400/20" onClick={() => handleDelete(asset)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox / Zoom */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-6 right-6 text-white hover:bg-white/20 bg-black/20 backdrop-blur-sm rounded-full h-12 w-12 z-[10000]" 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            <X className="w-8 h-8" />
          </Button>
          <img 
            src={getPublicUrl(selectedImage.storage_path)} 
            alt={selectedImage.file_name}
            className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-6 left-6 text-white font-medium text-sm bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
            {selectedImage.file_name}
          </div>
        </div>
      )}
    </div>
  );
}
