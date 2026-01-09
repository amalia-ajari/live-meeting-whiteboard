import { RealtimeMessage } from './types';

type MessageHandler = (message: RealtimeMessage) => void;

class RealtimeSync {
  private channel: BroadcastChannel | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private fallbackEnabled = false;
  private roomId: string = '';

  constructor() {
    // Check BroadcastChannel support
    if (typeof BroadcastChannel !== 'undefined') {
      // Will initialize per room
    } else {
      console.warn('BroadcastChannel not supported, falling back to localStorage');
      this.fallbackEnabled = true;
      this.setupStorageFallback();
    }
  }

  initialize(roomId: string) {
    this.roomId = roomId;
    
    if (!this.fallbackEnabled && typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(`whiteboard_${roomId}`);
      this.channel.onmessage = (event) => {
        this.notifyHandlers(event.data);
      };
    }
  }

  private setupStorageFallback() {
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith('wb_msg_') && event.newValue) {
        try {
          const message: RealtimeMessage = JSON.parse(event.newValue);
          this.notifyHandlers(message);
        } catch (e) {
          console.error('Failed to parse storage message', e);
        }
      }
    });
  }

  subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  send(message: Omit<RealtimeMessage, 'senderId' | 'timestamp'>) {
    const fullMessage: RealtimeMessage = {
      ...message,
      senderId: this.generateSenderId(),
      timestamp: Date.now(),
    };

    if (this.channel) {
      this.channel.postMessage(fullMessage);
    } else if (this.fallbackEnabled) {
      // Use localStorage with unique key
      const key = `wb_msg_${fullMessage.timestamp}_${Math.random()}`;
      localStorage.setItem(key, JSON.stringify(fullMessage));
      // Clean up old messages
      setTimeout(() => localStorage.removeItem(key), 1000);
    }

    // Also notify local handlers (for same-tab updates)
    this.notifyHandlers(fullMessage);
  }

  private notifyHandlers(message: RealtimeMessage) {
    // Don't process own messages
    if (message.senderId === this.generateSenderId()) {
      return;
    }
    
    this.handlers.forEach(handler => {
      try {
        handler(message);
      } catch (e) {
        console.error('Handler error', e);
      }
    });
  }

  private generateSenderId(): string {
    // Simple sender ID based on session
    if (!sessionStorage.getItem('sender_id')) {
      sessionStorage.setItem('sender_id', `sender_${Date.now()}_${Math.random()}`);
    }
    return sessionStorage.getItem('sender_id')!;
  }

  disconnect() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.handlers.clear();
  }
}

export const realtimeSync = new RealtimeSync();
