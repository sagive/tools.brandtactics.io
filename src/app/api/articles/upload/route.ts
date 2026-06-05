import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase service configuration is missing in environment.');
      return NextResponse.json({ error: 'Server database configuration error' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || 'general';

    const formData = await request.formData();
    const uploadedFiles: File[] = [];

    for (const [_, value] of formData.entries()) {
      if (value instanceof File) {
        uploadedFiles.push(value);
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const urls: string[] = [];

    for (const file of uploadedFiles) {
      const fileExt = file.name.split('.').pop() || 'png';
      const cleanFileName = file.name
        .replace(/\.[^/.]+$/, "") // strip extension
        .replace(/[^a-zA-Z0-9_-]/g, "_"); // sanitize name
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const fileName = `${cleanFileName}_${uniqueId}.${fileExt}`;
      const filePath = `${clientId}/editor/${fileName}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabaseAdmin.storage
        .from('client-assets')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload image to storage', details: uploadError.message }, { status: 500 });
      }

      const { data } = supabaseAdmin.storage
        .from('client-assets')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        urls.push(data.publicUrl);
      }
    }

    return NextResponse.json({
      success: true,
      files: urls
    });

  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
