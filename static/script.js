document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const homePage = document.getElementById('home-page');
    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    
    // Action Buttons
    const uploadBtn = document.getElementById('upload-btn');
    const imageUpload = document.getElementById('image-upload');
    const cameraBtn = document.getElementById('camera-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const searchToggleBtn = document.getElementById('search-toggle-btn');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const desktopIconsContainer = document.querySelector('.desktop-icons');

    // Modals
    const settingsModal = document.getElementById('settings-modal');
    const cameraModal = document.getElementById('camera-modal');
    const cropperModal = document.getElementById('cropper-modal');
    const lightboxModal = document.getElementById('lightbox-modal');

    // Settings Elements
    const languageSelect = document.getElementById('response-language');
    const subjectSelect = document.getElementById('subject');
    const wordsLimitSlider = document.getElementById('words-limit');
    const wordsLimitValue = document.getElementById('words-limit-value');

    // Camera, Cropper, Lightbox Elements
    const video = document.getElementById('camera-stream');
    const canvas = document.getElementById('camera-canvas');
    const captureBtn = document.getElementById('capture-btn');
    const imageToCrop = document.getElementById('image-to-crop');
    const cropConfirmBtn = document.getElementById('crop-confirm-btn');
    let stream, cropper;

    // --- State ---
    let messages = [];
    let attachedImages = [];
    let isChatActive = false;
    let isSearchEnabled = false;
    let userSettings = { language: 'English', subject: 'General', words_limit: 100 };
    
    // --- Utility Functions ---
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
    
    const openModal = (modal) => modal.classList.add('show');
    const closeModal = (modal) => modal.classList.remove('show');

    // Auto-resize textarea function for mobile
    function autoResizeTextarea() {
        const textarea = messageInput;
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Reset height to auto to get the correct scrollHeight
            textarea.style.height = 'auto';
            
            // Calculate the new height based on content
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 100; // Max height in pixels for mobile
            const minHeight = 20; // Min height in pixels
            
            // Set height within bounds
            const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
            textarea.style.height = newHeight + 'px';
            
            // Show scrollbar only if content exceeds max height
            textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
        }
    }

    function activateChatView() {
        if (!isChatActive) {
            homePage.classList.add('hidden');
            chatContainer.classList.remove('hidden');
            isChatActive = true;
        }
    }

    function appendMessage(role, content, isThinking = false) {
        activateChatView();
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${role}-message`);
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('content');

        if (isThinking) {
            contentDiv.innerHTML = `<div class="thinking-bubble"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>`;
        } else if (typeof content === 'string') {
            contentDiv.innerHTML = marked.parse(content);
        } else {
            let htmlContent = '';
            content.forEach(part => {
                if (part.type === 'text') htmlContent += `<p>${part.text}</p>`;
                else if (part.type === 'image_url') htmlContent += `<img src="${part.image_url.url}" alt="user image" class="inline-image">`;
            });
            contentDiv.innerHTML = htmlContent;
        }
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageDiv;
    }

    // --- Event Listeners ---
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
    
    // Auto-resize textarea on mobile
    messageInput.addEventListener('input', autoResizeTextarea);
    
    // Handle window resize for mobile orientation changes
    window.addEventListener('resize', () => {
        autoResizeTextarea();
    });
    
    uploadBtn.addEventListener('click', () => imageUpload.click());
    imageUpload.addEventListener('change', async (e) => { if (e.target.files[0]) addPreviewImage(await toBase64(e.target.files[0])); imageUpload.value = ''; });
    cameraBtn.addEventListener('click', startCamera);
    settingsBtn.addEventListener('click', () => openModal(settingsModal));
    searchToggleBtn.addEventListener('click', () => { isSearchEnabled = !isSearchEnabled; searchToggleBtn.classList.toggle('active', isSearchEnabled); });
    
    // Words limit slider event listener
    wordsLimitSlider.addEventListener('input', () => {
        wordsLimitValue.textContent = wordsLimitSlider.value;
    });

    mobileMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); desktopIconsContainer.classList.toggle('mobile-active'); });
    document.body.addEventListener('click', () => desktopIconsContainer.classList.remove('mobile-active'));

    document.querySelectorAll('.modal-overlay .close-btn, #save-settings-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            if (modal) {
                if (modal === cameraModal) stopCamera();
                if (modal === cropperModal && cropper) cropper.destroy();
                if (btn.id === 'save-settings-btn') { 
                    userSettings.language = languageSelect.value; 
                    userSettings.subject = subjectSelect.value; 
                    userSettings.words_limit = parseInt(wordsLimitSlider.value);
                }
                closeModal(modal);
            }
        });
    });

    // --- Core Logic (Camera, Cropper, Send) ---
    async function startCamera() {
        openModal(cameraModal);
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
        } catch (err) { closeModal(cameraModal); alert("Could not access camera."); }
    }
    function stopCamera() { if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; } }

    captureBtn.addEventListener('click', () => {
        if (!video.srcObject || video.videoWidth === 0) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        stopCamera();
        closeModal(cameraModal);

        imageToCrop.src = canvas.toDataURL('image/jpeg');
        openModal(cropperModal);

        if (cropper) cropper.destroy();
        imageToCrop.onload = () => {
            cropper = new Cropper(imageToCrop, { aspectRatio: 0, viewMode: 1, background: false });
        };
    });
    
    cropConfirmBtn.addEventListener('click', () => {
        if (!cropper || typeof cropper.getCroppedCanvas !== 'function') return;
        const croppedCanvas = cropper.getCroppedCanvas();
        if (croppedCanvas) addPreviewImage(croppedCanvas.toDataURL('image/jpeg'));
        cropper.destroy();
        cropper = null;
        closeModal(cropperModal);
    });

    function addPreviewImage(base64) {
        attachedImages.push(base64);
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.innerHTML = `<img src="${base64}" alt="preview"><button class="remove-image-btn">&times;</button>`;
        preview.querySelector('.remove-image-btn').addEventListener('click', () => {
            attachedImages.splice(attachedImages.indexOf(base64), 1);
            preview.remove();
        });
        imagePreviewContainer.appendChild(preview);
    }

    async function sendMessage() {
        const text = messageInput.value.trim();
        if (text.length === 0 && attachedImages.length === 0) return;
        
        let userContent = [];
        if (text) userContent.push({ type: 'text', text: text });
        attachedImages.forEach(imgBase64 => userContent.push({ type: 'image_url', image_url: { url: imgBase64 } }));

        messages.push({ role: 'user', content: userContent });
        appendMessage('user', userContent);
        
        messageInput.value = '';
        messageInput.style.height = 'auto'; // Reset height
        imagePreviewContainer.innerHTML = '';
        attachedImages = [];

        const assistantMsgDiv = appendMessage('assistant', '', true);
        const assistantContentDiv = assistantMsgDiv.querySelector('.content');

        // Send settings as a separate object in the request body
        const requestBody = {
            messages: messages,
            prompt_settings: userSettings,
            command: isSearchEnabled ? "search" : null
        };
        
        try {
            const response = await fetch('/api/chat/stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';
            let isFirstChunk = true;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const lines = decoder.decode(value, { stream: true }).split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.error) throw new Error(data.error);
                            if (data.finished) continue;
                            if (data.content) {
                                if (isFirstChunk) { assistantContentDiv.innerHTML = ''; isFirstChunk = false; }
                                fullResponse += data.content;
                                assistantContentDiv.innerHTML = marked.parse(fullResponse + ' ▌');
                            }
                        } catch (e) { /* Ignore */ }
                    }
                }
            }
            assistantContentDiv.innerHTML = marked.parse(fullResponse);
            messages.push({ role: 'assistant', content: fullResponse });

        } catch (error) {
            assistantContentDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }
});