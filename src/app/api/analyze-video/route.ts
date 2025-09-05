import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[API] analyze-video called');
    const { url, metadata, systemPrompt } = await request.json();
    
    console.log('[API] Request data:', {
      url: url?.substring(0, 50) + '...',
      hasMetadata: !!metadata,
      hasSystemPrompt: !!systemPrompt
    });

    if (!url || !metadata) {
      console.log('[API] Missing required data');
      return NextResponse.json(
        { success: false, error: 'URL and metadata are required' },
        { status: 400 }
      );
    }

    // AI API Configuration
    const AI_ENDPOINT = 'https://oi-server.onrender.com/chat/completions';
    const AI_MODEL = 'openrouter/anthropic/claude-sonnet-4';
    const AI_HEADERS = {
      'customerId': 'cus_Szde3rnRXMofEO',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer xxx'
    };

    console.log('[API] Starting AI analysis...');
    console.log('[API] Video title:', metadata.title);
    console.log('[API] Platform:', metadata.platform);

    // Create system prompt
    const defaultSystemPrompt = `You are an expert video analyst. Analyze the provided video information and generate a comprehensive, detailed description of what's happening in the video.

Focus on:
1. **Main Content**: What is the primary focus or subject of the video?
2. **Visual Elements**: Describe the setting, objects, people, and visual style
3. **Activities**: What activities or actions are taking place?
4. **Context & Narrative**: What story or message is being conveyed?
5. **Technical Aspects**: Describe the video style and production quality

Provide a structured, detailed analysis that someone who hasn't seen the video could understand.`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt || defaultSystemPrompt
      },
      {
        role: 'user',
        content: `Please analyze this video:

**Video Details:**
- Title: ${metadata.title}
- Platform: ${metadata.platform}
- Author: ${metadata.author}
- Video ID: ${metadata.videoId}
- Duration: ${metadata.duration ? Math.floor(metadata.duration / 60) + 'm ' + (metadata.duration % 60) + 's' : 'Unknown'}
- Description: ${metadata.description || 'No description available'}

Provide a comprehensive analysis of what this video likely contains and what viewers would experience.`
      }
    ];

    const aiRequestBody = {
      model: AI_MODEL,
      messages,
      max_tokens: 2000,
      temperature: 0.7
    };

    console.log('[API] Making AI request...');
    console.log('[API] AI Endpoint:', AI_ENDPOINT);
    console.log('[API] AI Model:', AI_MODEL);

    // Make AI request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const aiResponse = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: AI_HEADERS,
        body: JSON.stringify(aiRequestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('[API] AI response status:', aiResponse.status);

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('[API] AI request failed:', errorText);
        throw new Error(`AI API failed with status ${aiResponse.status}: ${errorText}`);
      }

      const aiData = await aiResponse.json();
      console.log('[API] AI response received, choices:', aiData.choices?.length);

      if (!aiData.choices || aiData.choices.length === 0) {
        throw new Error('No response generated from AI model');
      }

      const analysis = aiData.choices[0].message.content;
      console.log('[API] Analysis length:', analysis?.length, 'characters');

      // Generate summary (first sentence)
      const sentences = analysis.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
      let summary = sentences[0]?.trim() || '';
      if (sentences.length > 1 && summary.length < 100) {
        summary += '. ' + sentences[1]?.trim();
      }
      if (summary.length > 200) {
        summary = summary.substring(0, 197) + '...';
      }

      const processingTime = Math.round((Date.now() - startTime) / 1000);
      
      const result = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        videoMetadata: metadata,
        analysis,
        scenes: [], // Could be enhanced later
        summary: summary + '.',
        timestamp: new Date(),
        processingTime
      };

      console.log('[API] Analysis completed successfully in', processingTime, 'seconds');

      return NextResponse.json({
        success: true,
        data: result
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[API] AI request timeout');
        throw new Error('AI analysis timed out. Please try again.');
      }
      
      throw fetchError;
    }

  } catch (error) {
    const processingTime = Math.round((Date.now() - startTime) / 1000);
    console.error('[API] analyze-video error after', processingTime, 'seconds:', error);
    
    let errorMessage = 'AI analysis failed. Please try again.';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('[API] Error stack:', error.stack);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        processingTime
      },
      { status: 500 }
    );
  }
}