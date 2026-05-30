/**
 * Status Manager - Handles status display, viewing, and management
 * Implements Instagram-style story features
 */

class StatusManager {
  constructor() {
    this.apiBase = '/api/status';
    this.currentUser = null;
    this.statuses = [];
    this.init();
  }

  async init() {
    // Get current user from session/auth
    const response = await fetch('/api/auth/me');
    if (response.ok) {
      const data = await response.json();
      this.currentUser = data.user;
    }
  }

  /**
   * Create a new status
   * @param {Object} options - Status creation options
   * @param {string} options.content - Text content
   * @param {File} options.media - Media file (image/video)
   * @param {string} options.backgroundColor - Color for text-only status
   */
  async createStatus(options) {
    try {
      const formData = new FormData();
      
      if (options.content) {
        formData.append('content', options.content);
      }
      
      if (options.media) {
        formData.append('media', options.media);
      }
      
      if (options.backgroundColor && !options.media) {
        formData.append('backgroundColor', options.backgroundColor);
      }

      const response = await fetch(this.apiBase, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to create status');
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Error creating status:', error);
      throw error;
    }
  }

  /**
   * Get user's active statuses
   * @param {string} userId - User ID
   */
  async getUserStatuses(userId) {
    try {
      const response = await fetch(`${this.apiBase}/user/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to get user statuses');
      }

      const data = await response.json();
      return data.statuses || [];
    } catch (error) {
      console.error('Error fetching user statuses:', error);
      return [];
    }
  }

  /**
   * Get status feed from following
   */
  async getStatusFeed() {
    try {
      const response = await fetch(`${this.apiBase}/feed`);
      if (!response.ok) {
        throw new Error('Failed to get status feed');
      }

      const data = await response.json();
      this.statuses = data.statuses || [];
      return this.statuses;
    } catch (error) {
      console.error('Error fetching status feed:', error);
      return [];
    }
  }

  /**
   * Mark a status as viewed
   * @param {string} statusId - Status ID
   */
  async viewStatus(statusId) {
    try {
      const response = await fetch(`${this.apiBase}/${statusId}/view`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to mark status as viewed');
      }

      const data = await response.json();
      return data.viewCount;
    } catch (error) {
      console.error('Error viewing status:', error);
      throw error;
    }
  }

  /**
   * Get status viewers
   * @param {string} statusId - Status ID
   */
  async getStatusViewers(statusId) {
    try {
      const response = await fetch(`${this.apiBase}/${statusId}/viewers`);
      if (!response.ok) {
        throw new Error('Failed to get viewers');
      }

      const data = await response.json();
      return {
        count: data.viewCount,
        viewers: data.viewers
      };
    } catch (error) {
      console.error('Error fetching viewers:', error);
      return { count: 0, viewers: [] };
    }
  }

  /**
   * Delete a status
   * @param {string} statusId - Status ID
   */
  async deleteStatus(statusId) {
    try {
      const response = await fetch(`${this.apiBase}/${statusId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete status');
      }

      // Remove from local state
      this.statuses = this.statuses.filter(s => s._id !== statusId);
      return true;
    } catch (error) {
      console.error('Error deleting status:', error);
      throw error;
    }
  }

  /**
   * Render status with border on profile picture
   * @param {HTMLElement} profileContainer - Container with profile picture
   * @param {Object} userStatus - User status data
   */
  renderStatusBorder(profileContainer, hasStatus = false) {
    const img = profileContainer.querySelector('img');
    if (!img) return;

    // Remove existing border if present
    profileContainer.classList.remove('status-indicator');

    if (hasStatus) {
      profileContainer.classList.add('status-indicator');
    }
  }

  /**
   * Show status viewer modal
   * @param {Array} statuses - Array of statuses to view
   * @param {number} startIndex - Starting index in array
   */
  showStatusViewer(statuses, startIndex = 0) {
    const modal = document.createElement('div');
    modal.className = 'status-viewer-modal';
    modal.innerHTML = `
      <div class="status-viewer-container">
        <button class="status-close" aria-label="Close">&times;</button>
        <button class="status-prev" aria-label="Previous">&lt;</button>
        <div class="status-content"></div>
        <button class="status-next" aria-label="Next">&gt;</button>
        <div class="status-info">
          <div class="user-info"></div>
          <div class="view-count">👁️ <span class="count">0</span> views</div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    let currentIndex = startIndex;
    const loadStatus = async (index) => {
      const status = statuses[index];
      const contentDiv = modal.querySelector('.status-content');
      const userInfo = modal.querySelector('.user-info');
      const viewCountSpan = modal.querySelector('.view-count .count');

      // Mark as viewed
      const viewCount = await this.viewStatus(status._id);
      viewCountSpan.textContent = viewCount;

      // Clear content
      contentDiv.innerHTML = '';

      // Render content based on media type
      if (status.mediaType === 'image' && status.mediaUrl) {
        const img = document.createElement('img');
        img.src = status.mediaUrl;
        contentDiv.appendChild(img);
      } else if (status.mediaType === 'video' && status.mediaUrl) {
        const video = document.createElement('video');
        video.src = status.mediaUrl;
        video.controls = true;
        video.autoplay = true;
        contentDiv.appendChild(video);
      } else {
        // Text-only status
        const textDiv = document.createElement('div');
        textDiv.className = 'status-text';
        textDiv.style.backgroundColor = status.backgroundColor || '#6366F1';
        textDiv.innerHTML = `<p>${this.escapeHtml(status.content)}</p>`;
        contentDiv.appendChild(textDiv);
      }

      // Update user info
      const author = status.author;
      userInfo.innerHTML = `
        <div class="author-header">
          <img src="${author.profilePicture}" alt="${author.username}" class="author-pic">
          <div>
            <p class="author-name">${author.firstName} ${author.lastName}</p>
            <p class="author-username">@${author.username}</p>
          </div>
        </div>
      `;

      // Update button states
      const prevBtn = modal.querySelector('.status-prev');
      const nextBtn = modal.querySelector('.status-next');
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === statuses.length - 1;
    };

    // Event listeners
    modal.querySelector('.status-close').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('.status-prev').addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        loadStatus(currentIndex);
      }
    });

    modal.querySelector('.status-next').addEventListener('click', () => {
      if (currentIndex < statuses.length - 1) {
        currentIndex++;
        loadStatus(currentIndex);
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!document.contains(modal)) return;
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        currentIndex--;
        loadStatus(currentIndex);
      } else if (e.key === 'ArrowRight' && currentIndex < statuses.length - 1) {
        currentIndex++;
        loadStatus(currentIndex);
      } else if (e.key === 'Escape') {
        modal.remove();
      }
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Load first status
    loadStatus(currentIndex);
  }

  /**
   * Create status upload form
   */
  createStatusUploadForm() {
    const form = document.createElement('div');
    form.className = 'status-upload-form';
    form.innerHTML = `
      <div class="upload-modal-overlay"></div>
      <div class="upload-modal">
        <div class="modal-header">
          <h2>Add Status</h2>
          <button class="modal-close" aria-label="Close">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="upload-area" id="uploadArea">
            <svg class="upload-icon" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            <p>Click to upload or drag and drop</p>
            <p class="text-muted">PNG, JPG, GIF, MP4 up to 10MB</p>
            <input type="file" id="mediaInput" accept="image/*,video/*" style="display:none">
          </div>
          
          <textarea 
            id="statusContent" 
            class="status-content-input" 
            placeholder="Add caption (optional)"
            rows="3"
          ></textarea>
          
          <div class="color-picker-group" id="colorPickerGroup" style="display:none">
            <label>Background Color</label>
            <div class="color-options">
              <button class="color-btn" style="background-color: #6366F1" data-color="#6366F1"></button>
              <button class="color-btn" style="background-color: #EC4899" data-color="#EC4899"></button>
              <button class="color-btn" style="background-color: #F59E0B" data-color="#F59E0B"></button>
              <button class="color-btn" style="background-color: #10B981" data-color="#10B981"></button>
              <button class="color-btn" style="background-color: #3B82F6" data-color="#3B82F6"></button>
              <button class="color-btn" style="background-color: #8B5CF6" data-color="#8B5CF6"></button>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel">Cancel</button>
          <button class="btn-upload">Post Status</button>
        </div>
      </div>
    `;

    let selectedColor = '#6366F1';
    let selectedMedia = null;

    // File upload handling
    const uploadArea = form.querySelector('#uploadArea');
    const mediaInput = form.querySelector('#mediaInput');
    const contentInput = form.querySelector('#statusContent');
    const colorGroup = form.querySelector('#colorPickerGroup');

    uploadArea.addEventListener('click', () => mediaInput.click());

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        mediaInput.files = files;
        this.handleMediaSelect(mediaInput.files[0], uploadArea, colorGroup);
      }
    });

    mediaInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleMediaSelect(e.target.files[0], uploadArea, colorGroup);
        selectedMedia = e.target.files[0];
      }
    });

    // Color picker
    form.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        form.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedColor = btn.dataset.color;
      });
    });

    // Upload button
    form.querySelector('.btn-upload').addEventListener('click', async () => {
      const content = contentInput.value.trim();
      
      if (!selectedMedia && !content) {
        alert('Please add content or a photo/video');
        return;
      }

      try {
        const status = await this.createStatus({
          content,
          media: selectedMedia,
          backgroundColor: selectedColor
        });

        alert('Status posted!');
        form.remove();
      } catch (error) {
        alert('Failed to post status: ' + error.message);
      }
    });

    // Cancel button
    form.querySelector('.btn-cancel').addEventListener('click', () => {
      form.remove();
    });

    // Close on overlay click
    form.querySelector('.upload-modal-overlay').addEventListener('click', () => {
      form.remove();
    });

    return form;
  }

  handleMediaSelect(file, uploadArea, colorGroup) {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadArea.innerHTML = '';
      
      if (file.type.startsWith('image')) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '300px';
        uploadArea.appendChild(img);
        colorGroup.style.display = 'none';
      } else if (file.type.startsWith('video')) {
        const video = document.createElement('video');
        video.src = e.target.result;
        video.controls = true;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '300px';
        uploadArea.appendChild(video);
        colorGroup.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);

    if (!file.type.startsWith('image') && !file.type.startsWith('video')) {
      colorGroup.style.display = 'block';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StatusManager;
}