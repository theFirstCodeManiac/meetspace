import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import { WhiteboardStroke } from '../../types';
import {
  X,
  Pen,
  Highlighter,
  Minus,
  Square,
  Circle,
  Eraser,
  Trash2,
  Download,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  Sparkles,
  Users
} from 'lucide-react';

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ToolType = 'pen' | 'highlighter' | 'line' | 'rectangle' | 'circle' | 'eraser';

const COLOR_PALETTE = [
  '#ffffff', // White
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Rose
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#94a3b8', // Gray
];

const STROKE_WIDTHS = [2, 4, 8, 14];

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({ isOpen, onClose }) => {
  const { whiteboardStrokes, addWhiteboardStroke, clearWhiteboard, isHost } = useWebRTC();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#6366f1');
  const [currentWidth, setCurrentWidth] = useState<number>(4);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);
  const [historyUndo, setHistoryUndo] = useState<WhiteboardStroke[]>([]);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Redraw all strokes from context onto canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with dark background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 32;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Render strokes
    whiteboardStrokes.forEach(stroke => {
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
      } else if (stroke.tool === 'eraser') {
        ctx.strokeStyle = '#090d16';
      } else {
        ctx.globalAlpha = 1.0;
      }

      if (stroke.points.length === 0) {
        ctx.restore();
        return;
      }

      if (stroke.tool === 'pen' || stroke.tool === 'highlighter' || stroke.tool === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      } else if (stroke.tool === 'line') {
        const p1 = stroke.points[0];
        const p2 = stroke.points[stroke.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      } else if (stroke.tool === 'rectangle') {
        const p1 = stroke.points[0];
        const p2 = stroke.points[stroke.points.length - 1];
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      } else if (stroke.tool === 'circle') {
        const p1 = stroke.points[0];
        const p2 = stroke.points[stroke.points.length - 1];
        const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [whiteboardStrokes]);

  // Resize canvas to match container
  useEffect(() => {
    if (!isOpen) return;

    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        redrawCanvas();
      }
    };

    const timer = setTimeout(resize, 100);
    window.addEventListener('resize', resize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', resize);
    };
  }, [isOpen, redrawCanvas, isMaximized]);

  useEffect(() => {
    if (isOpen) {
      redrawCanvas();
    }
  }, [isOpen, whiteboardStrokes, redrawCanvas]);

  if (!isOpen) return null;

  // Pointer/Mouse handlers
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const pos = getCoordinates(e);
    setIsDrawing(true);
    setStartPos(pos);
    setCurrentPath([pos]);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return;
    const pos = getCoordinates(e);
    setCurrentPath(prev => [...prev, pos]);

    // Live preview for line/rect/circle
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (currentTool === 'pen' || currentTool === 'highlighter' || currentTool === 'eraser') {
      redrawCanvas();
      ctx.save();
      ctx.strokeStyle = currentTool === 'eraser' ? '#090d16' : currentColor;
      ctx.lineWidth = currentTool === 'highlighter' ? currentWidth * 3 : currentWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (currentTool === 'highlighter') ctx.globalAlpha = 0.35;

      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      currentPath.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.restore();
    } else {
      redrawCanvas();
      ctx.save();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentWidth;
      ctx.lineCap = 'round';

      if (currentTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (currentTool === 'rectangle') {
        ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      } else if (currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing || !startPos) return;
    setIsDrawing(false);

    if (currentPath.length > 0) {
      const strokeWidth = currentTool === 'highlighter' ? currentWidth * 3 : currentWidth;
      const stroke: WhiteboardStroke = {
        id: `str_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        points: currentPath,
        color: currentTool === 'eraser' ? '#090d16' : currentColor,
        width: strokeWidth,
        tool: currentTool,
      };

      addWhiteboardStroke(stroke);
      setHistoryUndo(prev => [...prev, stroke]);
    }

    setStartPos(null);
    setCurrentPath([]);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `meetspace-whiteboard-${Date.now()}.png`;
    a.click();
  };

  const handleClearAll = () => {
    if (confirm('Clear the entire collaborative whiteboard for all participants?')) {
      clearWhiteboard();
      setHistoryUndo([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full ${
          isMaximized ? 'h-[96vh] max-w-[98vw]' : 'h-[85vh] max-w-6xl'
        } bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200`}
      >
        {/* Header Bar */}
        <div className="px-4 py-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">Collaborative Whiteboard</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-medium flex items-center gap-1">
                  <Users className="w-3 h-3" /> Live Mesh Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-400">All participants can draw and brainstorm in real-time</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Download PNG snapshot"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleClearAll}
              className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors cursor-pointer"
              title="Clear Whiteboard"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isMaximized ? 'Restore size' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Whiteboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Canvas Container */}
        <div className="flex-1 relative flex overflow-hidden">
          
          {/* Floating Left Vertical Tool Palette */}
          <div className="absolute top-4 left-4 z-20 p-2 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-slate-800 shadow-2xl flex flex-col gap-2">
            
            {/* Tool Selection */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setCurrentTool('pen')}
                className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                  currentTool === 'pen'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Pen"
              >
                <Pen className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentTool('highlighter')}
                className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                  currentTool === 'highlighter'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Highlighter"
              >
                <Highlighter className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentTool('line')}
                className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                  currentTool === 'line'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Straight Line"
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentTool('rectangle')}
                className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                  currentTool === 'rectangle'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Rectangle"
              >
                <Square className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentTool('circle')}
                className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                  currentTool === 'circle'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Circle"
              >
                <Circle className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentTool('eraser')}
                className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                  currentTool === 'eraser'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full h-px bg-slate-800 my-1" />

            {/* Colors */}
            <div className="grid grid-cols-2 gap-1.5 p-1">
              {COLOR_PALETTE.map(color => (
                <button
                  key={color}
                  onClick={() => setCurrentColor(color)}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer border ${
                    currentColor === color
                      ? 'scale-125 border-white ring-2 ring-indigo-500'
                      : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            <div className="w-full h-px bg-slate-800 my-1" />

            {/* Stroke Widths */}
            <div className="flex flex-col gap-1 items-center">
              {STROKE_WIDTHS.map(w => (
                <button
                  key={w}
                  onClick={() => setCurrentWidth(w)}
                  className={`w-full py-1.5 flex items-center justify-center rounded-lg cursor-pointer transition-all ${
                    currentWidth === w ? 'bg-slate-800 text-indigo-400' : 'hover:bg-slate-800/60'
                  }`}
                  title={`${w}px width`}
                >
                  <span
                    className="rounded-full bg-slate-300"
                    style={{ width: `${w * 1.5 + 2}px`, height: `${w * 1.5 + 2}px` }}
                  />
                </button>
              ))}
            </div>

          </div>

          {/* Canvas Area */}
          <div ref={containerRef} className="flex-1 h-full w-full bg-[#090d16] relative cursor-crosshair">
            <canvas
              ref={canvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              className="w-full h-full block touch-none"
            />
          </div>

        </div>

      </div>
    </div>
  );
};
