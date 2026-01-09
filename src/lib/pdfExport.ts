import jsPDF from 'jspdf';
import { WhiteboardPage, DrawOperation } from './types';

export async function exportWhiteboardToPDF(
  pages: WhiteboardPage[],
  roomId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 600],
      });

      // Create offscreen canvas for rendering
      const canvas = document.createElement('canvas');
      const width = 800;
      const height = 600;
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      pages.forEach((page, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        // Clear and fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Render all operations on this page
        page.operations.forEach((operation) => {
          renderOperation(ctx, operation);
        });

        // Convert canvas to image and add to PDF
        try {
          const imgData = canvas.toDataURL('image/png', 1.0);
          if (!imgData || imgData === 'data:,') {
            throw new Error('Canvas toDataURL returned empty data');
          }
          pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        } catch (err) {
          console.error('Failed to convert canvas to image:', err);
          throw err;
        }
      });

      // Download PDF
      pdf.save(`whiteboard-${roomId}.pdf`);
      resolve();
    } catch (error) {
      console.error('PDF export failed', error);
      reject(error);
    }
  });
}

function renderOperation(ctx: CanvasRenderingContext2D, operation: DrawOperation) {
  if (operation.type === 'stroke') {
    if (operation.points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = operation.tool === 'eraser' ? '#ffffff' : operation.color;
    ctx.lineWidth = operation.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.moveTo(operation.points[0].x, operation.points[0].y);
    for (let i = 1; i < operation.points.length; i++) {
      ctx.lineTo(operation.points[i].x, operation.points[i].y);
    }
    ctx.stroke();
  } else if (operation.type === 'text') {
    ctx.font = `${operation.fontSize}px sans-serif`;
    ctx.fillStyle = operation.color;
    ctx.fillText(operation.text, operation.position.x, operation.position.y);
  }
}
