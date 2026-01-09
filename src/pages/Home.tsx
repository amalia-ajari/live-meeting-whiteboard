import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Role } from '../lib/types';
import {
  getSavedLiveKitUrl,
  getSavedLiveKitToken,
  saveLiveKitUrl,
  saveLiveKitToken,
  generateLiveKitToken,
  canAutoGenerateTokens,
} from '../lib/livekit';

export default function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('trainer');
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState<'simple' | 'livekit'>('simple');
  const [livekitUrl, setLivekitUrl] = useState(getSavedLiveKitUrl());
  const [livekitToken, setLivekitToken] = useState(getSavedLiveKitToken());
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  const canAutoGenerate = canAutoGenerateTokens();

  const generateRoomId = () => {
    const id = `room-${Date.now()}`;
    setRoomId(id);
  };

  const handleJoin = async () => {
    if (!roomId.trim()) {
      alert('Please enter a Room ID');
      return;
    }

    // Simple mode - no token needed
    if (mode === 'simple') {
      navigate(`/room-simple/${roomId}?role=${role}`);
      return;
    }

    // LiveKit mode - requires token
    if (!livekitUrl.trim()) {
      alert('Please enter LiveKit URL');
      return;
    }

    let token = livekitToken;

    // Auto-generate token if credentials are available
    if (canAutoGenerate && !token) {
      console.log('🔄 Auto-generating token for:', { roomId, role });
      setIsGeneratingToken(true);
      try {
        const participantName = `${role}_${Date.now()}`;
        token = await generateLiveKitToken(roomId, participantName);
        setLivekitToken(token);
        console.log('✅ Token generated and saved');
      } catch (error) {
        console.error('❌ Failed to generate token:', error);
        alert('Failed to generate token. Please check your API credentials.');
        setIsGeneratingToken(false);
        return;
      }
      setIsGeneratingToken(false);
    }

    if (!token) {
      alert('Please enter LiveKit Token or configure API credentials in .env');
      return;
    }

    console.log('📍 Joining room with:', {
      roomId,
      role,
      livekitUrl,
      tokenLength: token.length,
    });

    // Save to localStorage
    saveLiveKitUrl(livekitUrl);
    saveLiveKitToken(token);

    // Navigate to room
    navigate(`/room/${roomId}?role=${role}`);
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <h1>Training Meeting Whiteboard</h1>
        <p className="subtitle">Video chat + collaborative whiteboard</p>

        <div className="form-section">
          <h2>Video Mode</h2>
          <div className="mode-selector">
            <button
              className={`mode-btn ${mode === 'simple' ? 'active' : ''}`}
              onClick={() => setMode('simple')}
            >
              <span className="mode-icon">🎥</span>
              <span className="mode-title">Simple WebRTC</span>
              <span className="mode-desc">No backend, works instantly</span>
            </button>
            <button
              className={`mode-btn ${mode === 'livekit' ? 'active' : ''}`}
              onClick={() => setMode('livekit')}
            >
              <span className="mode-icon">🚀</span>
              <span className="mode-title">LiveKit (Advanced)</span>
              <span className="mode-desc">Requires API credentials</span>
            </button>
          </div>
        </div>

        <div className="form-section">
          <h2>Select Role</h2>
          <div className="role-selector">
            <button
              className={`role-btn ${role === 'trainer' ? 'active' : ''}`}
              onClick={() => setRole('trainer')}
            >
              <span className="role-icon">👨‍🏫</span>
              <span>Trainer</span>
              <span className="role-desc">Host, draw on whiteboard</span>
            </button>
            <button
              className={`role-btn ${role === 'trainee' ? 'active' : ''}`}
              onClick={() => setRole('trainee')}
            >
              <span className="role-icon">👨‍🎓</span>
              <span>Trainee</span>
              <span className="role-desc">View-only, see trainer video</span>
            </button>
          </div>
        </div>

        <div className="form-section">
          <h2>Room Configuration</h2>
          <div className="input-group">
            <label>Room ID</label>
            <div className="input-with-btn">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g., room-123"
              />
              <button onClick={generateRoomId} className="btn-secondary">
                Generate
              </button>
            </div>
          </div>
        </div>

        {mode === 'livekit' && (
          <div className="form-section">
            <h2>LiveKit Configuration</h2>
          
          {canAutoGenerate && (
            <div className="success-banner">
              ✅ Auto-token generation enabled! Tokens will be generated automatically using your API credentials.
            </div>
          )}
          
          <div className="input-group">
            <label>LiveKit URL</label>
            <input
              type="text"
              value={livekitUrl}
              onChange={(e) => setLivekitUrl(e.target.value)}
              placeholder="wss://your-server.livekit.cloud"
            />
          </div>
          
          {!canAutoGenerate && (
            <div className="input-group">
              <label>LiveKit Token (Manual)</label>
              <textarea
                value={livekitToken}
                onChange={(e) => setLivekitToken(e.target.value)}
                placeholder="Paste your LiveKit token here..."
                rows={3}
              />
              <small className="help-text">
                Generate tokens from LiveKit dashboard or CLI, or add VITE_LIVEKIT_API_KEY and VITE_LIVEKIT_API_SECRET to .env for auto-generation
              </small>
            </div>
          )}
          
          {canAutoGenerate && (
            <div className="input-group">
              <label>LiveKit Token (Optional Override)</label>
              <textarea
                value={livekitToken}
                onChange={(e) => setLivekitToken(e.target.value)}
                placeholder="Leave empty to auto-generate, or paste a token to override..."
                rows={2}
              />
              <small className="help-text">
                Token will be auto-generated if left empty
              </small>
            </div>
          )}
          </div>
        )}

        <button 
          onClick={handleJoin} 
          className="btn-primary btn-large"
          disabled={isGeneratingToken}
        >
          {isGeneratingToken 
            ? 'Generating Token...' 
            : `Join Room as ${role === 'trainer' ? 'Trainer' : 'Trainee'} (${mode === 'simple' ? 'Simple' : 'LiveKit'})`
          }
        </button>

        <div className="info-box">
          <h3>Quick Start Guide</h3>
          {mode === 'simple' ? (
            <ol>
              <li>✅ <strong>Recommended:</strong> Simple mode works immediately!</li>
              <li>Select your role (Trainer or Trainee)</li>
              <li>Enter or generate a Room ID</li>
              <li>Click "Join Room"</li>
              <li>Open another tab/window with a different role to test</li>
              <li>🎥 Video + 🎨 Whiteboard work instantly via WebRTC</li>
            </ol>
          ) : (
            <ol>
              <li>Select your role (Trainer or Trainee)</li>
              <li>Enter or generate a Room ID</li>
              {canAutoGenerate ? (
                <li>Token will be auto-generated using your .env credentials ✨</li>
              ) : (
                <li>Paste your LiveKit token (or add API credentials to .env)</li>
              )}
              <li>Click "Join Room"</li>
              <li>
                Open another tab/window with a different role to test collaboration
              </li>
            </ol>
          )}
          
          {!canAutoGenerate && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3cd', borderRadius: '6px' }}>
              <strong>💡 Tip:</strong> Add these to your <code>.env</code> file for auto-token generation:
              <pre style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                VITE_LIVEKIT_API_KEY=your_api_key{'\n'}
                VITE_LIVEKIT_API_SECRET=your_api_secret
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
