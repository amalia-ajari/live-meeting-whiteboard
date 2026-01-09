import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference, useParticipants } from '@livekit/components-react';
import { getSavedLiveKitUrl, getSavedLiveKitToken } from '../lib/livekit';
import { realtimeSync } from '../lib/realtime';
import {
  Role,
  ClassStatus,
  WhiteboardPage,
  WhiteboardState,
  Point,
  ToastMessage,
  RealtimeMessage,
} from '../lib/types';
import {
  createEmptyPage,
  createStroke,
  createText,
  addOperationToPage,
  clearPage,
} from '../lib/whiteboard/operations';
import { WhiteboardRenderer } from '../lib/whiteboard/renderer';
import { HistoryManager } from '../lib/whiteboard/history';
import { exportWhiteboardToPDF } from '../lib/pdfExport';
import Toast from '../components/Toast';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = (searchParams.get('role') || 'trainee') as Role;

  const [livekitUrl, setLivekitUrl] = useState(getSavedLiveKitUrl());
  const [livekitToken, setLivekitToken] = useState(getSavedLiveKitToken());
  const [showTokenInput, setShowTokenInput] = useState(false);

  const [pages, setPages] = useState<WhiteboardPage[]>([createEmptyPage()]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [classStatus, setClassStatus] = useState<ClassStatus>('NOT_STARTED');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Drawing state
  const [tool, setTool] = useState<'pen' | 'eraser' | 'text'>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WhiteboardRenderer | null>(null);
  const historyRef = useRef<HistoryManager>(new HistoryManager());

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    // Initialize realtime sync
    realtimeSync.initialize(roomId);

    // Load persisted state
    loadPersistedState();

    // Add toast
    addToast(`Joined room: ${roomId}`, 'success');

    // Request state from trainer if trainee
    if (role === 'trainee') {
      setTimeout(() => {
        realtimeSync.send({ type: 'request_state', payload: null });
      }, 500);
    }

    // Subscribe to realtime messages
    const unsubscribe = realtimeSync.subscribe(handleRealtimeMessage);

    return () => {
      unsubscribe();
      realtimeSync.disconnect();
    };
  }, [roomId, role]);

  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new WhiteboardRenderer(canvasRef.current);
    }

    if (rendererRef.current) {
      rendererRef.current.render(pages[currentPageIndex].operations);
    }
  }, [pages, currentPageIndex]);

  const loadPersistedState = () => {
    const key = `whiteboard_${roomId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const state: WhiteboardState = JSON.parse(stored);
        setPages(state.pages.length > 0 ? state.pages : [createEmptyPage()]);
        setCurrentPageIndex(state.currentPageIndex || 0);
        setClassStatus(state.classStatus || 'NOT_STARTED');
      } catch (e) {
        console.error('Failed to load state', e);
      }
    }
  };

  const persistState = useCallback(() => {
    const key = `whiteboard_${roomId}`;
    const state: WhiteboardState = {
      pages,
      currentPageIndex,
      classStatus,
    };
    localStorage.setItem(key, JSON.stringify(state));
  }, [roomId, pages, currentPageIndex, classStatus]);

  useEffect(() => {
    persistState();
  }, [persistState]);

  const handleRealtimeMessage = (message: RealtimeMessage) => {
    switch (message.type) {
      case 'request_state':
        if (role === 'trainer') {
          realtimeSync.send({
            type: 'state_snapshot',
            payload: { pages, currentPageIndex, classStatus },
          });
        }
        break;

      case 'state_snapshot':
        setPages(message.payload.pages);
        setCurrentPageIndex(message.payload.currentPageIndex);
        setClassStatus(message.payload.classStatus);
        addToast('Received whiteboard state', 'info');
        break;

      case 'stroke_end':
        setPages((prev) => {
          const newPages = [...prev];
          const stroke = createStroke(
            message.payload.points,
            message.payload.color,
            message.payload.width,
            message.payload.tool
          );
          newPages[currentPageIndex] = addOperationToPage(newPages[currentPageIndex], stroke);
          return newPages;
        });
        break;

      case 'add_text':
        setPages((prev) => {
          const newPages = [...prev];
          const text = createText(
            message.payload.position,
            message.payload.text,
            message.payload.color,
            message.payload.fontSize
          );
          newPages[currentPageIndex] = addOperationToPage(newPages[currentPageIndex], text);
          return newPages;
        });
        break;

      case 'clear_page':
        setPages((prev) => {
          const newPages = [...prev];
          newPages[currentPageIndex] = clearPage(newPages[currentPageIndex]);
          return newPages;
        });
        break;

      case 'add_page':
        setPages((prev) => [...prev, createEmptyPage()]);
        setCurrentPageIndex((prev) => prev + 1);
        break;

      case 'set_page':
        setCurrentPageIndex(message.payload.index);
        break;

      case 'undo':
      case 'redo':
        setPages(message.payload.pages);
        break;

      case 'class_status_changed':
        setClassStatus(message.payload.status);
        addToast(
          `Class ${message.payload.status === 'LIVE' ? 'started' : 'ended'}`,
          'info'
        );
        break;
    }
  };

  const addToast = (message: string, type: ToastMessage['type']) => {
    const toast: ToastMessage = {
      id: `${Date.now()}_${Math.random()}`,
      message,
      type,
    };
    setToasts((prev) => [...prev, toast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (role !== 'trainer' || classStatus !== 'LIVE') return;

    if (tool === 'text') {
      const point = getCanvasPoint(e);
      const text = prompt('Enter text:');
      if (text) {
        const textOp = createText(point, text, color, 24);
        setPages((prev) => {
          const newPages = [...prev];
          newPages[currentPageIndex] = addOperationToPage(newPages[currentPageIndex], textOp);
          return newPages;
        });
        historyRef.current.pushState(pages);
        realtimeSync.send({
          type: 'add_text',
          payload: { position: point, text, color, fontSize: 24 },
        });
      }
      return;
    }

    setIsDrawing(true);
    const point = getCanvasPoint(e);
    setCurrentStroke([point]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || role !== 'trainer' || tool === 'text') return;

    const point = getCanvasPoint(e);
    setCurrentStroke((prev) => {
      const newStroke = [...prev, point];
      if (rendererRef.current && (tool === 'pen' || tool === 'eraser')) {
        rendererRef.current.render(pages[currentPageIndex].operations);
        rendererRef.current.drawPreviewStroke(newStroke, color, lineWidth, tool);
      }
      return newStroke;
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || role !== 'trainer' || tool === 'text') return;

    setIsDrawing(false);
    if (currentStroke.length > 1 && (tool === 'pen' || tool === 'eraser')) {
      const stroke = createStroke(currentStroke, color, lineWidth, tool);
      setPages((prev) => {
        const newPages = [...prev];
        newPages[currentPageIndex] = addOperationToPage(newPages[currentPageIndex], stroke);
        return newPages;
      });
      historyRef.current.pushState(pages);
      realtimeSync.send({
        type: 'stroke_end',
        payload: { points: currentStroke, color, width: lineWidth, tool },
      });
    }
    setCurrentStroke([]);
  };

  const handleStartClass = () => {
    setClassStatus('LIVE');
    historyRef.current.clear();
    realtimeSync.send({ type: 'class_status_changed', payload: { status: 'LIVE' } });
    addToast('Class started', 'success');
  };

  const handleEndClass = () => {
    setClassStatus('ENDED');
    realtimeSync.send({ type: 'class_status_changed', payload: { status: 'ENDED' } });
    addToast('Class ended. You can now export PDF.', 'success');
  };

  const handleClear = () => {
    setPages((prev) => {
      const newPages = [...prev];
      newPages[currentPageIndex] = clearPage(newPages[currentPageIndex]);
      return newPages;
    });
    historyRef.current.pushState(pages);
    realtimeSync.send({ type: 'clear_page', payload: null });
  };

  const handleUndo = () => {
    const prevState = historyRef.current.undo(pages);
    if (prevState) {
      setPages(prevState);
      realtimeSync.send({ type: 'undo', payload: { pages: prevState } });
    }
  };

  const handleRedo = () => {
    const nextState = historyRef.current.redo();
    if (nextState) {
      setPages(nextState);
      realtimeSync.send({ type: 'redo', payload: { pages: nextState } });
    }
  };

  const handleAddPage = () => {
    setPages((prev) => [...prev, createEmptyPage()]);
    setCurrentPageIndex(pages.length);
    realtimeSync.send({ type: 'add_page', payload: null });
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      const newIndex = currentPageIndex - 1;
      setCurrentPageIndex(newIndex);
      realtimeSync.send({ type: 'set_page', payload: { index: newIndex } });
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      const newIndex = currentPageIndex + 1;
      setCurrentPageIndex(newIndex);
      realtimeSync.send({ type: 'set_page', payload: { index: newIndex } });
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportWhiteboardToPDF(pages, roomId!);
      addToast('PDF exported successfully', 'success');
    } catch (error) {
      addToast('PDF export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReconnect = () => {
    setShowTokenInput(false);
    window.location.reload();
  };

  if (!livekitUrl || !livekitToken) {
    return (
      <div className="room-page">
        <div className="error-container">
          <h2>LiveKit Configuration Missing</h2>
          <p>Please provide LiveKit URL and Token</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-page">
      <div className="room-header">
        <div className="room-info">
          <h2>Room: {roomId}</h2>
          <span className={`role-badge role-${role}`}>{role}</span>
          <span className={`status-badge status-${classStatus.toLowerCase()}`}>
            {classStatus.replace('_', ' ')}
          </span>
        </div>
        <div className="room-actions">
          {role === 'trainer' && (
            <>
              {classStatus === 'NOT_STARTED' && (
                <button onClick={handleStartClass} className="btn-success">
                  Start Class
                </button>
              )}
              {classStatus === 'LIVE' && (
                <button onClick={handleEndClass} className="btn-danger">
                  End Class
                </button>
              )}
              {classStatus === 'ENDED' && (
                <button
                  onClick={handleExportPDF}
                  className="btn-primary"
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export PDF'}
                </button>
              )}
            </>
          )}
          <button onClick={() => navigate('/')} className="btn-secondary">
            Leave Room
          </button>
        </div>
      </div>

      <div className="room-content">
        <div className="video-panel">
          <LiveKitRoom
            serverUrl={livekitUrl}
            token={livekitToken}
            connect={true}
            audio={role === 'trainer'}
            video={role === 'trainer'}
            onError={(error) => {
              console.error('❌ LiveKit connection error:', {
                error,
                errorMessage: error.message,
                serverUrl: livekitUrl,
                tokenLength: livekitToken?.length,
                tokenPreview: livekitToken?.substring(0, 50) + '...',
              });
              addToast(`LiveKit error: ${error.message}`, 'error');
              setShowTokenInput(true);
            }}
            onConnected={() => {
              console.log('✅ LiveKit connected successfully');
              addToast('LiveKit connected', 'success');
            }}
            onDisconnected={() => {
              console.log('⚠️ LiveKit disconnected');
              addToast('LiveKit disconnected', 'warning');
            }}
          >
            <div className="video-container">
              <VideoConference />
              <ParticipantCount />
            </div>
          </LiveKitRoom>

          {showTokenInput && (
            <div className="token-reconnect">
              <h3>Reconnect LiveKit</h3>
              <input
                type="text"
                value={livekitUrl}
                onChange={(e) => setLivekitUrl(e.target.value)}
                placeholder="LiveKit URL"
              />
              <textarea
                value={livekitToken}
                onChange={(e) => setLivekitToken(e.target.value)}
                placeholder="Paste new token"
                rows={2}
              />
              <button onClick={handleReconnect} className="btn-primary">
                Reconnect
              </button>
            </div>
          )}
        </div>

        <div className="whiteboard-panel">
          {role === 'trainer' && classStatus === 'LIVE' && (
            <div className="whiteboard-toolbar">
              <div className="tool-group">
                <button
                  className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
                  onClick={() => setTool('pen')}
                  title="Pen"
                >
                  ✏️
                </button>
                <button
                  className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
                  onClick={() => setTool('eraser')}
                  title="Eraser"
                >
                  🧹
                </button>
                <button
                  className={`tool-btn ${tool === 'text' ? 'active' : ''}`}
                  onClick={() => setTool('text')}
                  title="Text"
                >
                  T
                </button>
              </div>

              <div className="tool-group">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  title="Color"
                />
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  title="Line Width"
                />
                <span className="line-width-label">{lineWidth}px</span>
              </div>

              <div className="tool-group">
                <button
                  onClick={handleUndo}
                  disabled={!historyRef.current.canUndo()}
                  title="Undo"
                >
                  ↶
                </button>
                <button
                  onClick={handleRedo}
                  disabled={!historyRef.current.canRedo()}
                  title="Redo"
                >
                  ↷
                </button>
                <button onClick={handleClear} title="Clear Page">
                  🗑️
                </button>
              </div>

              <div className="tool-group">
                <button onClick={handlePrevPage} disabled={currentPageIndex === 0}>
                  ← Prev
                </button>
                <span className="page-indicator">
                  Page {currentPageIndex + 1} / {pages.length}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPageIndex === pages.length - 1}
                >
                  Next →
                </button>
                <button onClick={handleAddPage}>+ Add Page</button>
              </div>
            </div>
          )}

          {role === 'trainee' && (
            <div className="trainee-banner">
              👁️ View-only mode - Watching trainer's whiteboard
            </div>
          )}

          {role === 'trainer' && classStatus === 'NOT_STARTED' && (
            <div className="trainee-banner">
              Click "Start Class" to begin drawing
            </div>
          )}

          {classStatus === 'ENDED' && (
            <div className="trainee-banner">
              Class ended - Whiteboard is frozen
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="whiteboard-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {role !== 'trainer' && (
            <div className="page-indicator-bottom">
              Page {currentPageIndex + 1} / {pages.length}
            </div>
          )}
        </div>
      </div>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function ParticipantCount() {
  const participants = useParticipants();
  return (
    <div className="participant-count">
      👥 {participants.length} participant{participants.length !== 1 ? 's' : ''}
    </div>
  );
}
