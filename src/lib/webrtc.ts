// Simple peer-to-peer WebRTC for video chat (no backend required)
// Uses BroadcastChannel for signaling within same origin

export class SimpleWebRTC {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private signalChannel: BroadcastChannel | null = null;
  private peerId: string = '';
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;

  constructor(roomId: string) {
    this.peerId = `peer_${Date.now()}_${Math.random()}`;
    this.signalChannel = new BroadcastChannel(`webrtc_${roomId}`);
    this.setupSignaling();
  }

  private setupSignaling() {
    if (!this.signalChannel) return;

    this.signalChannel.onmessage = async (event) => {
      const { type, from, data } = event.data;

      // Ignore own messages
      if (from === this.peerId) return;

      console.log('📡 Received signal:', type, 'from:', from);

      if (type === 'offer') {
        await this.handleOffer(data);
      } else if (type === 'answer') {
        await this.handleAnswer(data);
      } else if (type === 'ice-candidate') {
        await this.handleIceCandidate(data);
      }
    };
  }

  async initialize(enableVideo: boolean, enableAudio: boolean) {
    try {
      // Get local media stream
      if (enableVideo || enableAudio) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: enableVideo,
          audio: enableAudio,
        });
        console.log('✅ Got local stream');
      }

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      // Add local tracks to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        console.log('📹 Received remote track');
        if (this.onRemoteStreamCallback && event.streams[0]) {
          this.onRemoteStreamCallback(event.streams[0]);
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignal('ice-candidate', event.candidate);
        }
      };

      return this.localStream;
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      throw error;
    }
  }

  async createOffer() {
    if (!this.peerConnection) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      this.sendSignal('offer', offer);
      console.log('📤 Sent offer');
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.sendSignal('answer', answer);
      console.log('📤 Sent answer');
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Connection established');
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  private sendSignal(type: string, data: any) {
    if (!this.signalChannel) return;

    this.signalChannel.postMessage({
      type,
      from: this.peerId,
      data,
    });
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  getLocalStream() {
    return this.localStream;
  }

  disconnect() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    if (this.signalChannel) {
      this.signalChannel.close();
    }
  }
}
