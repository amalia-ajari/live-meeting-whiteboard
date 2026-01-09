import { DrawOperation, Point, StrokeOperation, TextOperation } from '../types';

export class WhiteboardRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.setupCanvas();
  }

  private setupCanvas() {
    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  clear() {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, rect.width, rect.height);
  }

  render(operations: DrawOperation[]) {
    this.clear();
    operations.forEach(op => this.renderOperation(op));
  }

  renderOperation(operation: DrawOperation) {
    if (operation.type === 'stroke') {
      this.renderStroke(operation);
    } else if (operation.type === 'text') {
      this.renderText(operation);
    }
  }

  private renderStroke(stroke: StrokeOperation) {
    if (stroke.points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
    this.ctx.lineWidth = stroke.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    this.ctx.stroke();
  }

  private renderText(text: TextOperation) {
    this.ctx.font = `${text.fontSize}px sans-serif`;
    this.ctx.fillStyle = text.color;
    this.ctx.fillText(text.text, text.position.x, text.position.y);
  }

  drawPreviewStroke(points: Point[], color: string, width: number, tool: 'pen' | 'eraser') {
    if (points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.stroke();
  }

  resize() {
    this.setupCanvas();
  }
}
