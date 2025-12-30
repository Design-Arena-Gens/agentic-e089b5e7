'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'

interface VideoRequest {
  id: string
  prompt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  response?: string
  error?: string
}

export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [prompt, setPrompt] = useState('')
  const [autoMode, setAutoMode] = useState(false)
  const [interval, setInterval] = useState(60)
  const [requests, setRequests] = useState<VideoRequest[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('videoRequests')
    if (stored) {
      setRequests(JSON.parse(stored))
    }

    const storedKey = localStorage.getItem('grokApiKey')
    if (storedKey) {
      setApiKey(storedKey)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('videoRequests', JSON.stringify(requests))
  }, [requests])

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('grokApiKey', apiKey)
    }
  }, [apiKey])

  const submitRequest = useCallback(async () => {
    if (!apiKey || !prompt) return

    const newRequest: VideoRequest = {
      id: Date.now().toString(),
      prompt,
      status: 'processing',
      createdAt: new Date().toISOString()
    }

    setRequests(prev => [newRequest, ...prev])
    setLoading(true)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          prompt
        })
      })

      const data = await response.json()

      setRequests(prev => prev.map(req =>
        req.id === newRequest.id
          ? {
              ...req,
              status: data.error ? 'failed' : 'completed',
              response: data.response,
              error: data.error
            }
          : req
      ))
    } catch (error) {
      setRequests(prev => prev.map(req =>
        req.id === newRequest.id
          ? {
              ...req,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : req
      ))
    } finally {
      setLoading(false)
    }
  }, [apiKey, prompt])

  useEffect(() => {
    if (!autoMode || !apiKey || !prompt) return

    const intervalId = setInterval(() => {
      submitRequest()
    }, interval * 1000)

    return () => clearInterval(intervalId)
  }, [autoMode, interval, apiKey, prompt, submitRequest])

  const clearHistory = () => {
    setRequests([])
    localStorage.removeItem('videoRequests')
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Grok Video Automation
        </h1>
        <p className="text-gray-400 mb-8">Automate video creation requests with Grok AI</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Grok API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="xai-..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">Get your API key from x.ai</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Video Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Create a video about..."
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium">Auto Mode</label>
                  <p className="text-xs text-gray-400">Automatically submit requests</p>
                </div>
                <button
                  onClick={() => setAutoMode(!autoMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoMode ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {autoMode && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Interval (seconds): {interval}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    value={interval}
                    onChange={(e) => setInterval(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}

              <button
                onClick={submitRequest}
                disabled={loading || !apiKey || !prompt}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold transition-all duration-200 shadow-lg"
              >
                {loading ? 'Generating...' : 'Generate Video Now'}
              </button>
            </div>
          </div>

          {/* History Panel */}
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-blue-400">Request History</h2>
              <button
                onClick={clearHistory}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
              >
                Clear History
              </button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {requests.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No requests yet</p>
              ) : (
                requests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        req.status === 'completed' ? 'bg-green-600' :
                        req.status === 'failed' ? 'bg-red-600' :
                        req.status === 'processing' ? 'bg-yellow-600' :
                        'bg-gray-600'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(req.createdAt), 'MMM d, h:mm:ss a')}
                      </span>
                    </div>

                    <p className="text-sm text-gray-300 mb-2">{req.prompt}</p>

                    {req.response && (
                      <div className="mt-2 p-2 bg-gray-800 rounded text-sm text-gray-300">
                        {req.response}
                      </div>
                    )}

                    {req.error && (
                      <div className="mt-2 p-2 bg-red-900/30 rounded text-sm text-red-300">
                        Error: {req.error}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">{requests.length}</div>
            <div className="text-sm text-gray-400">Total Requests</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-green-400">
              {requests.filter(r => r.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-400">Completed</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-yellow-400">
              {requests.filter(r => r.status === 'processing').length}
            </div>
            <div className="text-sm text-gray-400">Processing</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="text-2xl font-bold text-red-400">
              {requests.filter(r => r.status === 'failed').length}
            </div>
            <div className="text-sm text-gray-400">Failed</div>
          </div>
        </div>
      </div>
    </main>
  )
}
