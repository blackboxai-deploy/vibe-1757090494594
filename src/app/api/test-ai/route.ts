import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('Testing AI API endpoint...');
    
    const ENDPOINT = 'https://oi-server.onrender.com/chat/completions';
    const MODEL = 'openrouter/anthropic/claude-sonnet-4';
    
    const HEADERS = {
      'customerId': 'cus_Szde3rnRXMofEO',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer xxx'
    };

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: 'Say hello and confirm you are working.'
      }
    ];

    const requestBody = {
      model: MODEL,
      messages,
      max_tokens: 100,
      temperature: 0.7
    };

    console.log('Making request to AI API...');
    console.log('Endpoint:', ENDPOINT);
    console.log('Headers:', HEADERS);
    console.log('Body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `AI API request failed: ${response.status} ${response.statusText}`,
          details: errorText
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('AI API response:', data);

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Test AI API failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}