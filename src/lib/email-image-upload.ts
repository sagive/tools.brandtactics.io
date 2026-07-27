import { supabase } from "@/lib/supabase";

/**
 * Converts a base64 image data URL to a low-weight WebP Blob using HTML5 Canvas
 */
export async function convertBase64ToWebpBlob(base64DataUrl: string, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Max width/height 1600px for optimal email rendering
      const maxDim = 1600;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Draw white background for transparent PNGs
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert image to WebP"));
          }
        },
        "image/webp",
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load base64 image"));
    img.src = base64DataUrl;
  });
}

/**
 * Finds all <img src="data:image/..."> in htmlContent, converts them to lightweight WebP,
 * uploads them to Supabase Storage bucket 'client-assets', and replaces base64 URIs with public CDN URLs.
 */
export async function processAndUploadEmailImages(htmlContent: string, clientId: string = "general"): Promise<string> {
  if (!htmlContent || typeof htmlContent !== "string") return htmlContent || "";
  if (!htmlContent.includes("data:image/")) return htmlContent;

  const base64Regex = /<img[^>]*src=["'](data:image\/[^"']+)["'][^>]*>/gi;
  let matches = [...htmlContent.matchAll(base64Regex)];

  if (matches.length === 0) return htmlContent;

  let updatedHtml = htmlContent;

  for (const match of matches) {
    const fullImgTag = match[0];
    const base64Src = match[1];

    try {
      // 1. Convert to low-weight WebP Blob
      const webpBlob = await convertBase64ToWebpBlob(base64Src, 0.8);

      // 2. Generate path in storage bucket
      const randomId = Math.random().toString(36).substring(2, 10);
      const filePath = `email-images/${clientId}/${Date.now()}-${randomId}.webp`;

      // 3. Upload to Supabase Storage bucket 'client-assets'
      const { error: uploadError } = await supabase.storage
        .from("client-assets")
        .upload(filePath, webpBlob, {
          contentType: "image/webp",
          upsert: true
        });

      if (uploadError) {
        console.error("Failed to upload WebP image to Supabase Storage:", uploadError);
        continue;
      }

      // 4. Get public URL
      const { data } = supabase.storage.from("client-assets").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // 5. Replace src in original img tag
      const newImgTag = fullImgTag.replace(base64Src, publicUrl);
      updatedHtml = updatedHtml.replace(fullImgTag, newImgTag);
    } catch (err) {
      console.error("Error converting base64 image to WebP:", err);
    }
  }

  return updatedHtml;
}
