document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  const sidebar = document.getElementById('sidebar');
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
  const newChatBtn = document.getElementById('new-chat-btn');
  const conversationsList = document.getElementById('conversations-list');
  const currentChatTitle = document.getElementById('current-chat-title');
  const welcomeScreen = document.getElementById('welcome-screen');
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const stopBtn = document.getElementById('stop-btn');
  const clearCurrentChatBtn = document.getElementById('clear-current-chat-btn');
  const apiWarningBanner = document.getElementById('api-warning-banner');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');
  const themeText = document.getElementById('theme-text');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const clearAllHistoryBtn = document.getElementById('clear-all-history-btn');
  const serverStatusIndicator = document.getElementById('server-status-indicator');
  const serverStatusText = document.getElementById('server-status-text');

  let conversations = JSON.parse(localStorage.getItem('groq_conversations') || '[]');
  let currentConversationId = localStorage.getItem('groq_current_conversation_id') || null;
  let isGenerating = false;
  let abortController = null;

  marked.setOptions({
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (__) {}
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
  });

  const savedTheme = localStorage.getItem('groq_theme') || 'dark';
  document.documentElement.className = savedTheme;
  updateThemeUI(savedTheme);

  checkServerHealth();

  if (conversations.length === 0) {
    createNewConversation(false);
  } else {
    if (!currentConversationId || !conversations.find(c => c.id === currentConversationId)) {
      currentConversationId = conversations[0].id;
    }
    renderConversationsList();
    loadCurrentConversation();
  }

  sidebarToggleBtn.addEventListener('click', toggleSidebar);
  mobileSidebarToggle.addEventListener('click', toggleMobileSidebar);
  newChatBtn.addEventListener('click', () => createNewConversation(true));
  clearCurrentChatBtn.addEventListener('click', clearCurrentConversation);

  themeToggleBtn.addEventListener('click', toggleTheme);
  settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
  closeModalBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
  clearAllHistoryBtn.addEventListener('click', clearAllHistory);

  userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = `${Math.min(userInput.scrollHeight, 150)}px`;
    sendBtn.disabled = !userInput.value.trim() && !isGenerating;
  });

  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && userInput.value.trim()) {
        handleSendMessage();
      }
    }
  });

  sendBtn.addEventListener('click', () => {
    if (!isGenerating && userInput.value.trim()) {
      handleSendMessage();
    }
  });

  stopBtn.addEventListener('click', stopGeneration);

  document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      const promptText = card.getAttribute('data-prompt');
      if (promptText) {
        userInput.value = promptText;
        userInput.style.height = 'auto';
        userInput.style.height = `${Math.min(userInput.scrollHeight, 150)}px`;
        sendBtn.disabled = false;
        handleSendMessage();
      }
    });
  });

  async function checkServerHealth() {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.configured) {
        apiWarningBanner.classList.add('hidden');
        serverStatusIndicator.className = 'status-badge success';
        serverStatusText.textContent = `Connected (${data.model})`;
      } else {
        apiWarningBanner.classList.remove('hidden');
        serverStatusIndicator.className = 'status-badge error';
        serverStatusText.textContent = 'GROQ_API_KEY missing on server';
      }
    } catch (err) {
      console.error('Health check failed:', err);
      apiWarningBanner.classList.remove('hidden');
      serverStatusIndicator.className = 'status-badge error';
      serverStatusText.textContent = 'Server connection failed';
    }
  }

  function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
  }

  function toggleMobileSidebar() {
    sidebar.classList.toggle('open');
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.className;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.className = newTheme;
    localStorage.setItem('groq_theme', newTheme);
    updateThemeUI(newTheme);
  }

  function updateThemeUI(theme) {
    if (theme === 'dark') {
      themeIcon.setAttribute('data-lucide', 'sun');
      themeText.textContent = 'Light Mode';
      document.getElementById('hljs-style').href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
    } else {
      themeIcon.setAttribute('data-lucide', 'moon');
      themeText.textContent = 'Dark Mode';
      document.getElementById('hljs-style').href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-default.min.css';
    }
    lucide.createIcons();
  }

  function createNewConversation() {
    const newConv = {
      id: 'conv_' + Date.now(),
      title: 'New Conversation',
      messages: []
    };
    conversations.unshift(newConv);
    currentConversationId = newConv.id;
    saveConversations();
    renderConversationsList();
    loadCurrentConversation();
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('open');
    }
  }

  function saveConversations() {
    localStorage.setItem('groq_conversations', JSON.stringify(conversations));
    localStorage.setItem('groq_current_conversation_id', currentConversationId);
  }

  function renderConversationsList() {
    conversationsList.innerHTML = '';
    conversations.forEach(conv => {
      const item = document.createElement('div');
      item.className = `conversation-item ${conv.id === currentConversationId ? 'active' : ''}`;

      const titleSpan = document.createElement('span');
      titleSpan.className = 'conversation-title';
      titleSpan.textContent = conv.title;
      titleSpan.addEventListener('click', () => {
        currentConversationId = conv.id;
        saveConversations();
        renderConversationsList();
        loadCurrentConversation();
        if (window.innerWidth <= 768) sidebar.classList.remove('open');
      });

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'conversation-actions';

      const renameBtn = document.createElement('button');
      renameBtn.className = 'conversation-action-btn';
      renameBtn.innerHTML = '<i data-lucide="edit-2" style="width:14px;height:14px;"></i>';
      renameBtn.title = 'Rename';
      renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newTitle = prompt('Enter new conversation title:', conv.title);
        if (newTitle && newTitle.trim()) {
          conv.title = newTitle.trim();
          saveConversations();
          renderConversationsList();
          if (conv.id === currentConversationId) {
            currentChatTitle.textContent = conv.title;
          }
        }
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'conversation-action-btn';
      deleteBtn.innerHTML = '<i data-lucide="trash" style="width:14px;height:14px;"></i>';
      deleteBtn.title = 'Delete';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this conversation?')) {
          conversations = conversations.filter(c => c.id !== conv.id);
          if (conversations.length === 0) {
            createNewConversation();
          } else if (currentConversationId === conv.id) {
            currentConversationId = conversations[0].id;
          }
          saveConversations();
          renderConversationsList();
          loadCurrentConversation();
        }
      });

      actionsDiv.appendChild(renameBtn);
      actionsDiv.appendChild(deleteBtn);

      item.appendChild(titleSpan);
      item.appendChild(actionsDiv);
      conversationsList.appendChild(item);
    });
    lucide.createIcons();
  }

  function loadCurrentConversation() {
    const conv = conversations.find(c => c.id === currentConversationId);
    if (!conv) return;

    currentChatTitle.textContent = conv.title;
    chatMessages.innerHTML = '';

    if (conv.messages.length === 0) {
      welcomeScreen.classList.remove('hidden');
      chatMessages.classList.add('hidden');
    } else {
      welcomeScreen.classList.add('hidden');
      chatMessages.classList.remove('hidden');
      conv.messages.forEach(msg => appendMessageElement(msg.role, msg.content, false));
    }
    scrollToBottom();
  }

  function clearCurrentConversation() {
    const conv = conversations.find(c => c.id === currentConversationId);
    if (conv) {
      conv.messages = [];
      conv.title = 'New Conversation';
      saveConversations();
      renderConversationsList();
      loadCurrentConversation();
    }
  }

  function clearAllHistory() {
    if (confirm('Are you sure you want to delete all chat history?')) {
      localStorage.removeItem('groq_conversations');
      localStorage.removeItem('groq_current_conversation_id');
      conversations = [];
      settingsModal.classList.add('hidden');
      createNewConversation();
    }
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function handleSendMessage() {
    const text = userInput.value.trim();
    if (!text || isGenerating) return;

    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    welcomeScreen.classList.add('hidden');
    chatMessages.classList.remove('hidden');

    const conv = conversations.find(c => c.id === currentConversationId);
    if (!conv) return;

    if (conv.messages.length === 0) {
      conv.title = text.length > 30 ? text.substring(0, 30) + '...' : text;
      currentChatTitle.textContent = conv.title;
      renderConversationsList();
    }

    const userMsg = { role: 'user', content: text };
    conv.messages.push(userMsg);
    appendMessageElement('user', text, true);
    saveConversations();

    const assistantMsg = { role: 'assistant', content: '' };
    conv.messages.push(assistantMsg);
    const assistantMsgElement = appendMessageElement('assistant', '', true);
    const contentDiv = assistantMsgElement.querySelector('.message-content');

    isGenerating = true;
    stopBtn.classList.remove('hidden');
    sendBtn.classList.add('hidden');

    abortController = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conv.messages.slice(0, -1),
          stream: true
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.content) {
                accumulatedContent += parsed.content;
                assistantMsg.content = accumulatedContent;
                contentDiv.innerHTML = DOMPurify.sanitize(marked.parse(accumulatedContent));
                addCodeCopyButtons(contentDiv);
                scrollToBottom();
              }
            } catch (e) {}
          }
        }
      }

      saveConversations();
    } catch (error) {
      if (error.name === 'AbortError') {
        assistantMsg.content += '\n\n*[Generation stopped by user]*';
      } else {
        console.error('Chat request error:', error);
        assistantMsg.content = `⚠️ **Error:** ${error.message || 'Failed to generate response.'}`;
      }
      contentDiv.innerHTML = DOMPurify.sanitize(marked.parse(assistantMsg.content));
      saveConversations();
    } finally {
      isGenerating = false;
      stopBtn.classList.add('hidden');
      sendBtn.classList.remove('hidden');
      sendBtn.disabled = !userInput.value.trim();
      addMessageActions(assistantMsgElement, assistantMsg);
      lucide.createIcons();
    }
  }

  function stopGeneration() {
    if (abortController) {
      abortController.abort();
    }
  }

  function appendMessageElement(role, content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = role === 'user' ? '<i data-lucide="user" style="width:18px;height:18px;"></i>' : '<i data-lucide="bot" style="width:18px;height:18px;"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (role === 'assistant') {
      contentDiv.innerHTML = DOMPurify.sanitize(marked.parse(content || '...'));
      addCodeCopyButtons(contentDiv);
    } else {
      contentDiv.textContent = content;
    }

    msgDiv.appendChild(avatarDiv);
    msgDiv.appendChild(contentDiv);
    chatMessages.appendChild(msgDiv);

    if (role === 'assistant' && content) {
      const conv = conversations.find(c => c.id === currentConversationId);
      const msgObj = conv?.messages.find(m => m.content === content && m.role === 'assistant');
      if (msgObj) addMessageActions(msgDiv, msgObj);
    }

    lucide.createIcons();
    scrollToBottom();
    return msgDiv;
  }

  function addCodeCopyButtons(container) {
    container.querySelectorAll('pre').forEach(pre => {
      if (pre.querySelector('.copy-code-btn')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-code-btn';
      copyBtn.innerHTML = '<i data-lucide="copy" style="width:12px;height:12px;"></i> Copy';
      copyBtn.addEventListener('click', () => {
        const codeText = pre.querySelector('code')?.textContent || pre.textContent;
        navigator.clipboard.writeText(codeText).then(() => {
          copyBtn.innerHTML = '<i data-lucide="check" style="width:12px;height:12px;"></i> Copied!';
          setTimeout(() => {
            copyBtn.innerHTML = '<i data-lucide="copy" style="width:12px;height:12px;"></i> Copy';
            lucide.createIcons();
          }, 2000);
          lucide.createIcons();
        });
      });
      wrapper.appendChild(copyBtn);
    });
    lucide.createIcons();
  }

  function addMessageActions(msgElement, messageObj) {
    if (msgElement.querySelector('.message-actions')) return;

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'message-action-btn';
    copyBtn.innerHTML = '<i data-lucide="copy" style="width:14px;height:14px;"></i> Copy';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(messageObj.content).then(() => {
        copyBtn.innerHTML = '<i data-lucide="check" style="width:14px;height:14px;"></i> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = '<i data-lucide="copy" style="width:14px;height:14px;"></i> Copy';
          lucide.createIcons();
        }, 2000);
        lucide.createIcons();
      });
    });

    actionsDiv.appendChild(copyBtn);

    if (messageObj.role === 'assistant') {
      const regenerateBtn = document.createElement('button');
      regenerateBtn.className = 'message-action-btn';
      regenerateBtn.innerHTML = '<i data-lucide="rotate-cw" style="width:14px;height:14px;"></i> Regenerate';
      regenerateBtn.addEventListener('click', () => {
        const conv = conversations.find(c => c.id === currentConversationId);
        if (!conv || isGenerating) return;
        conv.messages.pop();
        loadCurrentConversation();
        handleSendMessage();
      });
      actionsDiv.appendChild(regenerateBtn);
    }

    msgElement.querySelector('.message-content').appendChild(actionsDiv);
    lucide.createIcons();
  }
});