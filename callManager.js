/**
 * Call Manager - Handles video and audio calls
 * Uses Twilio for media, Socket.IO for signaling
 */

class CallManager {
  constructor(socket) {
    this.socket = socket;
    this.apiBase = '/api/calls';
    this.activeCall = null;
    this.incomingCall = null;
    this.room = null;
    this.participants = [];
    this.localTracks = [];

    this.setupSocketListeners();
  }

  setupSocketListeners() {
    // Incoming call notification
    this.socket.on('incomingCall', (data) => {
      this.handleIncomingCall(data);
    });

    // Call answered
    this.socket.on('callAnswered', (data) => {
      this.handleCallAnswered(data);
    });

    // Call declined
    this.socket.on('callDeclined', (data) => {
      this.handleCallDeclined(data);
    });

    // Call ended
    this.socket.on('callEnded', (data) => {
      this.handleCallEnded(data);
    });

    // Participant connected
    this.socket.on('participantConnected', (participantData) => {
      this.handleParticipantConnected(participantData);
    });

    // Participant disconnected
    this.socket.on('participantDisconnected', (participantData) => {
      this.handleParticipantDisconnected(participantData);
    });
  }

  /**
   * Initiate a call
   * @param {string} recipientId - User ID to call
   * @param {string} callType - 'audio' or 'video'
   */
  async initiateCall(recipientId, callType = 'video') {
    try {
      const response = await fetch(`${this.apiBase}/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId,
          callType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate call');
      }

      const data = await response.json();
      this.activeCall = data.call;

      // Connect to Twilio room
      const { Twilio } = window;
      this.room = await Twilio.Video.connect(data.roomName, {
        name: data.roomName,
        audio: callType === 'audio' || callType === 'video',
        video: callType === 'video' ? { width: 640 } : false,
        token: data.callerToken
      });

      this.setupRoomListeners();
      this.displayLocalVideo();

      return data.call;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  /**
   * Answer an incoming call
   * @param {string} callId - Call ID
   */
  async answerCall(callId) {
    try {
      const response = await fetch(`${this.apiBase}/${callId}/answer`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to answer call');
      }

      const data = await response.json();
      this.activeCall = data.call;

      // Connect to Twilio room
      const { Twilio } = window;
      this.room = await Twilio.Video.connect(this.activeCall.twilioRoomSid, {
        name: this.activeCall.twilioRoomSid,
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        },
        video: this.activeCall.callType === 'video' ? { width: 640 } : false,
        token: data.recipientToken
      });

      this.setupRoomListeners();
      this.displayLocalVideo();

      return data.call;
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  /**
   * Decline an incoming call
   * @param {string} callId - Call ID
   */
  async declineCall(callId) {
    try {
      const response = await fetch(`${this.apiBase}/${callId}/decline`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to decline call');
      }

      this.incomingCall = null;
      return true;
    } catch (error) {
      console.error('Error declining call:', error);
      throw error;
    }
  }

  /**
   * End the active call
   */
  async endCall() {
    try {
      if (this.activeCall) {
        const response = await fetch(`${this.apiBase}/${this.activeCall._id}/end`, {
          method: 'POST'
        });

        if (!response.ok) {
          throw new Error('Failed to end call');
        }

        const data = await response.json();
        
        // Cleanup Twilio room
        if (this.room) {
          this.room.localParticipant.tracks.forEach(track => {
            track.stop();
          });
          this.room.disconnect();
          this.room = null;
        }

        this.activeCall = null;
        this.participants = [];
        this.localTracks = [];

        return data.call;
      }
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  setupRoomListeners() {
    if (!this.room) return;

    // Handle existing participants (in case of late join)
    this.room.participants.forEach(participant => {
      this.handleParticipantConnected(participant);
    });

    // Handle new participants
    this.room.on('participantConnected', (participant) => {
      this.handleParticipantConnected(participant);
    });

    // Handle disconnected participants
    this.room.on('participantDisconnected', (participant) => {
      this.handleParticipantDisconnected(participant);
    });

    // Handle disconnection
    this.room.on('disconnected', () => {
      this.handleRoomDisconnected();
    });
  }

  handleParticipantConnected(participant) {
    console.log('Participant connected:', participant.sid);
    
    this.participants.push(participant);
    
    // Subscribe to participant's tracks
    participant.on('trackSubscribed', track => {
      this.attachTrackToElement(track, participant);
    });

    participant.on('trackUnsubscribed', track => {
      this.detachTrackFromElement(track);
    });

    // Emit event for UI update
    this.emitEvent('participantConnected', { participant });
  }

  handleParticipantDisconnected(participant) {
    console.log('Participant disconnected:', participant.sid);
    
    this.participants = this.participants.filter(p => p.sid !== participant.sid);
    
    // Emit event for UI update
    this.emitEvent('participantDisconnected', { participant });
  }

  handleRoomDisconnected() {
    console.log('Disconnected from room');
    this.activeCall = null;
    this.participants = [];
    this.room = null;
    
    this.emitEvent('roomDisconnected', {});
  }

  displayLocalVideo() {
    if (!this.room) return;

    const videoContainer = document.getElementById('local-video-container');
    if (!videoContainer) return;

    videoContainer.innerHTML = '';

    this.room.localParticipant.videoTracks.forEach(track => {
      const element = document.createElement('div');
      element.setAttribute('data-participant', this.room.localParticipant.sid);
      element.appendChild(track.attach());
      videoContainer.appendChild(element);
    });

    // Add audio element for local audio
    const audioElements = this.room.localParticipant.audioTracks.map(track => {
      return track.attach();
    });
    audioElements.forEach(element => {
      element.muted = true;
      document.body.appendChild(element);
    });
  }

  attachTrackToElement(track, participant) {
    const videoContainer = document.getElementById('remote-video-container');
    if (!videoContainer) return;

    const element = track.attach();
    element.setAttribute('data-participant', participant.sid);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'participant-video';
    wrapper.setAttribute('data-participant', participant.sid);
    wrapper.appendChild(element);

    videoContainer.appendChild(wrapper);
  }

  detachTrackFromElement(track) {
    const elements = document.querySelectorAll(`[data-participant="${track.sid}"]`);
    elements.forEach(element => {
      const detached = track.detach();
      detached.forEach(el => el.remove());
    });
  }

  /**
   * Toggle audio
   */
  toggleAudio(enabled) {
    if (this.room) {
      this.room.localParticipant.audioTracks.forEach(track => {
        enabled ? track.enable() : track.disable();
      });
    }
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled) {
    if (this.room) {
      this.room.localParticipant.videoTracks.forEach(track => {
        enabled ? track.enable() : track.disable();
      });
    }
  }

  /**
   * Switch camera
   */
  async switchCamera() {
    if (!this.room) return;

    const videoTrack = this.room.localParticipant.videoTracks.values().next().value;
    if (!videoTrack) return;

    try {
      await videoTrack.restart({
        facingMode: this.currentFacingMode === 'user' ? 'environment' : 'user'
      });
      this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  }

  handleIncomingCall(data) {
    this.incomingCall = data;
    this.emitEvent('incomingCall', data);

    // Show incoming call UI
    this.showIncomingCallUI(data);
  }

  handleCallAnswered(data) {
    this.activeCall = data.call;
    this.connect(data.recipientToken);
    this.emitEvent('callAnswered', data);
  }

  handleCallDeclined(data) {
    this.incomingCall = null;
    this.emitEvent('callDeclined', data);
  }

  handleCallEnded(data) {
    this.cleanup();
    this.emitEvent('callEnded', data);
  }

  async connect(token) {
    if (!this.room && this.activeCall) {
      const { Twilio } = window;
      this.room = await Twilio.Video.connect(this.activeCall.twilioRoomSid, {
        name: this.activeCall.twilioRoomSid,
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        },
        video: this.activeCall.callType === 'video' ? { width: 640 } : false,
        token
      });

      this.setupRoomListeners();
      this.displayLocalVideo();
    }
  }

  showIncomingCallUI(data) {
    const modal = document.createElement('div');
    modal.className = 'incoming-call-modal';
    modal.innerHTML = `
      <div class="incoming-call-content">
        <div class="caller-info">
          <img src="${data.caller.profilePicture}" alt="${data.caller.username}">
          <h2>${data.caller.firstName} ${data.caller.lastName}</h2>
          <p>Incoming ${data.callType} call...</p>
        </div>
        
        <div class="call-controls">
          <button class="btn-decline">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
          </button>
          <button class="btn-accept">
            <svg viewBox="0 0 24 24"><path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm4.5-4H7V4h8v14z"/></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.btn-decline').addEventListener('click', async () => {
      await this.declineCall(data.callId);
      modal.remove();
    });

    modal.querySelector('.btn-accept').addEventListener('click', async () => {
      await this.answerCall(data.callId);
      modal.remove();
    });
  }

  cleanup() {
    if (this.room) {
      this.room.localParticipant.tracks.forEach(track => {
        track.stop();
      });
      this.room.disconnect();
      this.room = null;
    }

    this.activeCall = null;
    this.participants = [];
    this.localTracks = [];
  }

  emitEvent(eventName, data) {
    const event = new CustomEvent(`call:${eventName}`, { detail: data });
    document.dispatchEvent(event);
  }

  getActiveCall() {
    return this.activeCall;
  }

  getParticipants() {
    return this.participants;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CallManager;
}