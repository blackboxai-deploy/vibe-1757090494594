import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] video-info called');
    const { url } = await request.json();
    console.log('[API] URL received:', url);

    if (!url) {
      console.log('[API] No URL provided');
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Simple URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/reel\/.+$/;
    
    if (!youtubeRegex.test(url) && !instagramRegex.test(url)) {
      console.log('[API] Invalid URL format:', url);
      return NextResponse.json(
        { success: false, error: 'URL must be a valid YouTube video or Instagram reel link' },
        { status: 400 }
      );
    }

    let videoId = '';
    let platform = '';

    if (youtubeRegex.test(url)) {
      platform = 'youtube';
      // Extract video ID
      const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          videoId = match[1];
          break;
        }
      }
      
      if (!videoId) {
        console.log('[API] Could not extract YouTube video ID');
        return NextResponse.json(
          { success: false, error: 'Invalid YouTube video URL format' },
          { status: 400 }
        );
      }
    } else if (instagramRegex.test(url)) {
      platform = 'instagram';
      const match = url.match(/\/reel\/([a-zA-Z0-9_-]+)/);
      videoId = match ? match[1] : 'unknown';
    }

    console.log('[API] Platform:', platform, 'Video ID:', videoId);

    // Try to get YouTube metadata
    let metadata = {
      title: platform === 'youtube' ? 'YouTube Video' : 'Instagram Reel',
      description: 'Video content will be analyzed by AI.',
      duration: 0,
      thumbnail: platform === 'youtube' 
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : 'https://storage.googleapis.com/workspace-prod-default/image/b89c7296-6b18-4f23-9c45-aa65e8709f2b_fd9bb5b8-6a89-4b1f-88c5-4e7d624c1e63.webp',
      platform: platform as 'youtube' | 'instagram',
      videoId,
      author: platform === 'youtube' ? 'YouTube Creator' : 'Instagram User',
      viewCount: undefined,
      uploadDate: new Date().toISOString(),
    };

    // Try YouTube oEmbed API for better metadata
    if (platform === 'youtube') {
      try {
        console.log('[API] Attempting YouTube oEmbed API...');
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oembedUrl, { 
          headers: {
            'User-Agent': 'VideoAnalyzer/1.0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[API] oEmbed success:', data.title);
          metadata.title = data.title || metadata.title;
          metadata.author = data.author_name || metadata.author;
        } else {
          console.log('[API] oEmbed failed:', response.status);
        }
      } catch (error) {
        console.log('[API] oEmbed error:', error);
      }
    }

    console.log('[API] Returning metadata:', metadata.title);
    return NextResponse.json({
      success: true,
      data: metadata
    });

  } catch (error) {
    console.error('[API] video-info error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to extract video information'
      },
      { status: 500 }
    );
  }
}