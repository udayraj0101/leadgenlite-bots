(function() {
  const WIDGET_API = 'http://localhost:3000/api/chat';
  
  const styles = `
    #leadgen-widget-container * { box-sizing: border-box; }
    #leadgen-widget-container { position: fixed; bottom: 20px; right: 20px; z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #leadgen-chat-button { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #1F4279 0%, #245CD4 100%); border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
    #leadgen-chat-button:hover { transform: scale(1.1); }
    #leadgen-chat-button svg { width: 28px; height: 28px; fill: white; }
    #leadgen-chat-window { display: none; position: fixed; bottom: 90px; right: 20px; width: 380px; height: 550px; background: white; border-radius: 12px; box-shadow: 0 5px 40px rgba(0,0,0,0.16); flex-direction: column; overflow: hidden; }
    #leadgen-chat-window.open { display: flex; animation: slideUp 0.3s ease; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    #leadgen-chat-header { background: linear-gradient(135deg, #1F4279 0%, #245CD4 100%); color: white; padding: 16px; display: flex; justify-content: space-between; align-items: center; }
    #leadgen-chat-header h3 { margin: 0; font-size: 16px; }
    #leadgen-close-btn { background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 24px; height: 24px; line-height: 20px; }
    #leadgen-chat-messages { flex: 1; padding: 16px; overflow-y: auto; background: #f5f5f5; }
    .leadgen-message { margin-bottom: 12px; display: flex; animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .leadgen-message.user { justify-content: flex-end; }
    .leadgen-message-content { max-width: 75%; padding: 10px 14px; border-radius: 16px; word-wrap: break-word; font-size: 14px; line-height: 1.4; }
    .leadgen-message.user .leadgen-message-content { background: #245CD4; color: white; border-bottom-right-radius: 4px; }
    .leadgen-message.assistant .leadgen-message-content { background: white; color: #333; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    #leadgen-chat-input-area { padding: 12px; background: white; border-top: 1px solid #e0e0e0; display: flex; gap: 8px; }
    #leadgen-chat-input { flex: 1; padding: 10px 12px; border: 1px solid #ddd; border-radius: 20px; font-size: 14px; outline: none; }
    #leadgen-chat-input:focus { border-color: #245CD4; }
    #leadgen-send-btn { padding: 10px 20px; background: #245CD4; color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: 600; font-size: 14px; }
    #leadgen-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .leadgen-typing { display: none; padding: 10px 14px; background: white; border-radius: 16px; width: fit-content; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .leadgen-typing.active { display: block; }
    .leadgen-typing span { display: inline-block; width: 6px; height: 6px; background: #245CD4; border-radius: 50%; margin: 0 2px; animation: typing 1.4s infinite; }
    .leadgen-typing span:nth-child(2) { animation-delay: 0.2s; }
    .leadgen-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typing { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-8px); } }
  `;

  const html = `
    <div id="leadgen-widget-container">
      <button id="leadgen-chat-button" aria-label="Open chat">
        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      </button>
      <div id="leadgen-chat-window">
        <div id="leadgen-chat-header">
          <h3>💬 Chat with us</h3>
          <button id="leadgen-close-btn" aria-label="Close chat">&times;</button>
        </div>
        <div id="leadgen-chat-messages">
          <div class="leadgen-message assistant">
            <div class="leadgen-message-content">👋 Hi! How can I help you today?</div>
          </div>
        </div>
        <div id="leadgen-chat-input-area">
          <input type="text" id="leadgen-chat-input" placeholder="Type a message..." autocomplete="off">
          <button id="leadgen-send-btn">Send</button>
        </div>
      </div>
    </div>
  `;

  function init() {
    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    const chatButton = document.getElementById('leadgen-chat-button');
    const chatWindow = document.getElementById('leadgen-chat-window');
    const closeBtn = document.getElementById('leadgen-close-btn');
    const sendBtn = document.getElementById('leadgen-send-btn');
    const input = document.getElementById('leadgen-chat-input');
    const messagesContainer = document.getElementById('leadgen-chat-messages');

    let userId = localStorage.getItem('leadgen_user_id') || 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('leadgen_user_id', userId);

    chatButton.addEventListener('click', () => {
      chatWindow.classList.add('open');
      input.focus();
    });

    closeBtn.addEventListener('click', () => {
      chatWindow.classList.remove('open');
    });

    function addMessage(role, content) {
      const msgDiv = document.createElement('div');
      msgDiv.className = `leadgen-message ${role}`;
      msgDiv.innerHTML = `<div class="leadgen-message-content">${content}</div>`;
      messagesContainer.appendChild(msgDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTyping() {
      const typing = document.createElement('div');
      typing.className = 'leadgen-message assistant';
      typing.id = 'leadgen-typing-indicator';
      typing.innerHTML = '<div class="leadgen-typing active"><span></span><span></span><span></span></div>';
      messagesContainer.appendChild(typing);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideTyping() {
      const typing = document.getElementById('leadgen-typing-indicator');
      if (typing) typing.remove();
    }

    async function sendMessage() {
      const message = input.value.trim();
      if (!message) return;

      addMessage('user', message);
      input.value = '';
      sendBtn.disabled = true;
      showTyping();

      try {
        const platformData = {
          screen: {
            width: window.screen.width,
            height: window.screen.height,
            colorDepth: window.screen.colorDepth
          },
          page_url: window.location.href,
          page_title: document.title,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        };

        const response = await fetch(WIDGET_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: userId, 
            message, 
            platform: 'web',
            platform_data: platformData
          })
        });

        const data = await response.json();
        hideTyping();

        if (response.ok) {
          addMessage('assistant', data.response);
        } else {
          addMessage('assistant', '❌ Sorry, something went wrong. Please try again.');
        }
      } catch (error) {
        hideTyping();
        addMessage('assistant', '❌ Connection error. Please try again later.');
        console.error('Widget error:', error);
      }

      sendBtn.disabled = false;
      input.focus();
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
