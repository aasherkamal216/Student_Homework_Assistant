const messagesEl = document.getElementById('messages');
const formEl = document.getElementById('chat-form');
const inputEl = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const statusEl = document.getElementById('status');
const commandEl = document.getElementById('command');
const imageInput = document.getElementById('image-input');
const addImageBtn = document.getElementById('add-image-btn');
const clearImagesBtn = document.getElementById('clear-images-btn');
const imagePreviews = document.getElementById('image-previews');

// Conversation state
let conversation = [];
let pendingImages = []; // data URLs

function renderMessage(message, isStreaming = false) {
  const wrapper = document.createElement('div');
  wrapper.className = `message role-${message.role}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = message.role === 'user' ? 'U' : 'A';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (isStreaming) bubble.classList.add('assistant-streaming');
  // Text
  let text = '';
  if (typeof message.content === 'string') {
    text = message.content;
  } else if (Array.isArray(message.content)) {
    const textPart = message.content.find(p => p.type === 'text');
    text = textPart?.text || '';
  }
  const textNode = document.createElement('div');
  textNode.innerText = text;
  bubble.appendChild(textNode);

  // Images
  if (Array.isArray(message.content)) {
    const images = message.content.filter(p => p.type === 'image_url');
    if (images.length) {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'bubble-images';
      for (const img of images) {
        const el = document.createElement('img');
        el.src = img.image_url?.url || '';
        imgWrap.appendChild(el);
      }
      bubble.appendChild(imgWrap);
    }
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble; // return bubble for incremental updates
}

function setBusy(busy) {
  sendBtn.disabled = busy;
  statusEl.textContent = busy ? 'Thinking…' : 'Ready';
}

function buildRequestPayload(command) {
  return {
    messages: conversation,
    settings: {
      temperature: 1.0,
      top_p: 0.8,
      reasoning_effort: 'low'
    },
    command: command || null
  };
}

async function sendChat(command) {
  setBusy(true);
  const userMsg = conversation[conversation.length - 1];
  renderMessage(userMsg);
  const assistantMsg = { role: 'assistant', content: '' };
  const assistantBubble = renderMessage(assistantMsg, true);

  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestPayload(command))
    });

    if (!res.ok || !res.body) {
      throw new Error(`Request failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

      // SSE-style lines: data: {json}\n\n
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const jsonStr = line.replace('data: ', '');
        if (!jsonStr) continue;
        try {
          const data = JSON.parse(jsonStr);
          if (data.error) {
            throw new Error(data.error);
          }
          if (data.content) {
            assistantText += data.content;
            assistantBubble.firstChild.innerText = assistantText;
          }
          if (data.reasoning_content) {
            // Optionally, we could display reasoning in a muted style
          }
          if (data.finished) {
            assistantBubble.classList.remove('assistant-streaming');
            // Push final assistant message to history
            conversation.push({ role: 'assistant', content: assistantText });
          }
        } catch (e) {
          // non-JSON line, ignore
        }
      }
    }
  } catch (err) {
    assistantBubble.classList.remove('assistant-streaming');
    assistantBubble.firstChild.innerText = `Error: ${err.message}`;
    assistantBubble.classList.add('error');
  } finally {
    setBusy(false);
    try { localStorage.setItem('sha_conversation', JSON.stringify(conversation)); } catch {}
  }
}

formEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  const command = commandEl.value;
  if (!text && pendingImages.length === 0) return;

  const contentParts = [];
  if (text) contentParts.push({ type: 'text', text });
  for (const url of pendingImages) {
    contentParts.push({ type: 'image_url', image_url: { url } });
  }

  const userMsg = contentParts.length === 1 && text
    ? { role: 'user', content: text }
    : { role: 'user', content: contentParts };

  conversation.push(userMsg);

  inputEl.value = '';
  clearPendingImages();
  sendChat(command);
});

// Auto-resize textarea
inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
});

// Focus input on load and restore session
window.addEventListener('load', () => {
  inputEl.focus();
  try {
    const saved = localStorage.getItem('sha_conversation');
    if (saved) {
      conversation = JSON.parse(saved);
      messagesEl.innerHTML = '';
      for (const msg of conversation) {
        renderMessage(msg);
      }
    }
  } catch {}
});

// Image handling
addImageBtn.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []);
  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    pendingImages.push(dataUrl);
  }
  renderPendingImages();
  imageInput.value = '';
});

clearImagesBtn.addEventListener('click', () => {
  pendingImages = [];
  renderPendingImages();
});

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderPendingImages() {
  imagePreviews.innerHTML = '';
  pendingImages.forEach((url, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'image-preview';
    const img = document.createElement('img');
    img.src = url;
    const btn = document.createElement('button');
    btn.className = 'remove';
    btn.type = 'button';
    btn.textContent = '×';
    btn.addEventListener('click', () => {
      pendingImages.splice(idx, 1);
      renderPendingImages();
    });
    wrap.appendChild(img);
    wrap.appendChild(btn);
    imagePreviews.appendChild(wrap);
  });
}

function clearPendingImages() {
  pendingImages = [];
  renderPendingImages();
}



