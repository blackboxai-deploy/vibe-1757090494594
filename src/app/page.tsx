"use client";

import { useState } from 'react';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addToLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setDebugLog(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  const analyzeVideo = async () => {
    if (!url.trim()) {
      setError('Please enter a video URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setDebugLog([]);

    try {
      addToLog('Starting video analysis...');
      addToLog(`URL: ${url}`);

      // Step 1: Get video info
      addToLog('Step 1: Fetching video metadata...');
      const infoResponse = await fetch('/api/video-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      addToLog(`Video info response status: ${infoResponse.status}`);

      if (!infoResponse.ok) {
        const errorData = await infoResponse.json();
        throw new Error(`Video info failed: ${errorData.error || 'Unknown error'}`);
      }

      const { data: metadata } = await infoResponse.json();
      addToLog(`Video metadata received: ${metadata.title}`);
      addToLog(`Platform: ${metadata.platform}, Duration: ${metadata.duration}s`);

      // Step 2: Analyze with AI
      addToLog('Step 2: Starting AI analysis...');
      const analysisResponse = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, metadata })
      });

      addToLog(`AI analysis response status: ${analysisResponse.status}`);

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(`AI analysis failed: ${errorData.error || 'Unknown error'}`);
      }

      const { data: analysisResult } = await analysisResponse.json();
      addToLog(`AI analysis completed in ${analysisResult.processingTime}s`);
      
      setResult(analysisResult);
      addToLog('Analysis completed successfully!');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      addToLog(`ERROR: ${errorMessage}`);
      setError(errorMessage);
      console.error('Analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearDebugLog = () => {
    setDebugLog([]);
    setError(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#f1f5f9' }}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Video Analyzer - Debug Version
          </h1>
          <p className="text-gray-600">
            Enhanced with detailed error logging and debugging information
          </p>
        </div>

        {/* Input Section */}
        <div className="card mb-8">
          <div className="card-body">
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Video URL (YouTube or Instagram Reel)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="form-input"
                  disabled={loading}
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={analyzeVideo}
                  disabled={loading || !url.trim()}
                  className="btn btn-primary"
                >
                  {loading ? 'Analyzing...' : 'Analyze Video'}
                </button>
                
                <button
                  onClick={clearDebugLog}
                  className="btn btn-secondary"
                >
                  Clear Debug Log
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Log */}
        {debugLog.length > 0 && (
          <div className="debug-log mb-8">
            <h3 className="text-lg font-bold mb-2 text-green-300">Debug Log:</h3>
            <div className="max-h-64 overflow-y-auto">
              {debugLog.map((log, index) => (
                <div key={index} style={{ marginBottom: '0.25rem' }}>{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-box">
            <h3 className="font-bold">Error:</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="card">
            <div className="card-body">
              <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <img 
                    src={result.videoMetadata.thumbnail}
                    alt={result.videoMetadata.title}
                    className="w-full rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{result.videoMetadata.title}</h3>
                  <p className="text-gray-600">by {result.videoMetadata.author}</p>
                  <p className="text-gray-600">{result.videoMetadata.platform} • {result.processingTime}s processing time</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold">AI Analysis:</h3>
                <div className="prose">
                  <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg" style={{ fontSize: '0.875rem' }}>
                    {result.analysis}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Buttons */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-bold mb-4">Quick Tests:</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => setUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
              className="btn btn-red"
            >
              Test YouTube
            </button>
            <button
              onClick={() => setUrl('https://youtu.be/dQw4w9WgXcQ')}
              className="btn btn-red"
            >
              Test YouTube Short URL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}