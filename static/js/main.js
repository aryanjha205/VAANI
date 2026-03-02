const socket = io();

// Theme Handling
socket.on('theme_change', (data) => {
    document.body.className = ''; // Reset
    document.body.removeAttribute('style'); // Clear inline styles

    if (data.theme !== 'default') {
        document.body.classList.add('theme-' + data.theme);

        // Custom Theme Handling
        if (data.theme === 'custom' && data.colors) {
            document.body.style.setProperty('--custom-gradient-start', data.colors.start);
            document.body.style.setProperty('--custom-gradient-end', data.colors.end);
        }

        // Special clean up for dark theme collision
        if (data.theme === 'cyberpunk') {
            darkMode = true; // Sync logic
        } else {
            darkMode = false;
        }
    }
    console.log('Theme updated:', data.theme);
});


// Global Announcements
socket.on('global_announcement', (data) => {
    // Create popup
    const modalHtml = `
    <div class="modal fade" id="announcementModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg" style="background: linear-gradient(135deg, #FF9966, #FF5E62); color: white;">
                <div class="modal-body text-center p-5">
                    <i class="fas fa-bullhorn fa-3x mb-3 animate__animated animate__tada infinite"></i>
                    <h2 class="fw-bold mb-3">${data.title}</h2>
                    <p class="fs-5">${data.message}</p>
                    <button class="btn btn-light rounded-pill px-4 mt-3 fw-bold" data-bs-dismiss="modal">Got it!</button>
                </div>
            </div>
        </div>
    </div>`;

    // Remove old if exists
    const old = document.getElementById('announcementModal');
    if (old) old.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('announcementModal'));
    modal.show();
});

// Wallpaper Handling
socket.on('wallpaper_change', (data) => {
    document.documentElement.style.setProperty('--chat-wallpaper', data.wallpaper);
});

// Screen Shake
socket.on('screen_shake', () => {
    document.body.classList.add('shake-animation');
    setTimeout(() => {
        document.body.classList.remove('shake-animation');
    }, 500);
});

// Feature: Confetti
socket.on('trigger_effect', (data) => {
    if (data.type === 'confetti') {
        launchConfetti();
    }
});

function launchConfetti() {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548'];
    for (let i = 0; i < 50; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.animationDuration = (Math.random() * 3 + 2) + 's';
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 5000);
    }
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
            .then(reg => console.log('SW Registered', reg))
            .catch(err => console.log('SW Failed', err));
    });
}

let currentReceiverId = null;
const currentUserId = document.getElementById('current-user-id')?.value;
const currentUsername = document.getElementById('current-username')?.value;
let typingTimeout = null;
let darkMode = false;
let isRecording = false;
let selectedVoiceFilter = 'none';
const recognition = window.webkitSpeechRecognition ? new webkitSpeechRecognition() : null;

function formatChatTime(isoString, type = 'short') {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Fallback for non-ISO strings (like temp timestamps already formatted)
    if (isNaN(date.getTime())) return isoString;

    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

    if (type === 'long') {
        const now = new Date();
        const diff = now - date;
        const oneDay = 24 * 60 * 60 * 1000;

        if (date.toDateString() === now.toDateString()) {
            return `today at ${timeStr}`;
        } else {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            if (date.toDateString() === yesterday.toDateString()) {
                return `yesterday at ${timeStr}`;
            }
            return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' at ' + timeStr;
        }
    }
    return timeStr;
}

if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
        updateSendButtonVisibility();
    };

    recognition.onend = () => {
        isRecording = false;
        micBtn.classList.remove('recording-glow');
    };
}

// DOM Elements
const contactItems = document.querySelectorAll('.contact-item');
const chatWindow = document.getElementById('chat-window');
const noChatSelected = document.getElementById('no-chat-selected');
const activeChat = document.getElementById('active-chat');
const messageList = document.getElementById('message-list');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const fileInput = document.getElementById('file-input');
const chatUserName = document.getElementById('chat-user-name');
const chatUserPic = document.getElementById('chat-user-pic');
const chatUserStatus = document.getElementById('chat-user-status');
const backToListBtn = document.getElementById('back-to-list');
const openProfileBtn = document.getElementById('open-profile');
const closeProfileBtn = document.getElementById('close-profile');
const profileSidebar = document.getElementById('profile-sidebar');
const myProfilePic = document.getElementById('my-profile-pic');
const profilePicInput = document.getElementById('profile-pic-input');
const profileNameInput = document.getElementById('profile-name-input');
const profileAboutInput = document.getElementById('profile-about-input');
const saveProfileBtn = document.getElementById('save-profile');
const micBtn = document.getElementById('mic-btn');
const sidebar = document.querySelector('.sidebar');
const pinBtns = document.querySelectorAll('.pin-btn');
const toggleChatSearchBtn = document.getElementById('toggle-chat-search');
const chatSearchContainer = document.getElementById('chat-search-container');
const chatSearchInput = document.getElementById('chat-search-input');
const tabMap = document.getElementById('tab-map');
const mapView = document.getElementById('map-view');
const contactProfileSidebar = document.getElementById('contact-profile-sidebar');
const closeContactProfileBtn = document.getElementById('close-contact-profile');
const chatHeaderUserInfo = document.getElementById('chat-header-user-info');
const contactProfilePicLarge = document.getElementById('contact-profile-pic-large');
const contactProfileName = document.getElementById('contact-profile-name');
const contactProfileStatusText = document.getElementById('contact-profile-status-text');
const contactProfileAbout = document.getElementById('contact-profile-about');

// Tabs & Global Chat
const tabChats = document.getElementById('tab-chats');
const tabGlobal = document.getElementById('tab-global');
// const sidebarSearch = document.getElementById('sidebar-search'); // Removed duplicate
// variables noChatSelected and activeChat already declared above
const globalChat = document.getElementById('global-chat');
const globalMessageList = document.getElementById('global-message-list');
const globalInput = document.getElementById('global-input');
const globalSendBtn = document.getElementById('global-send-btn');
const backToListGlobal = document.getElementById('back-to-list-global');

let isGlobalChatActive = false;

// --- Socket Events ---
socket.on('new_global_message', (data) => {
    appendGlobalMessage(data);
    if (!isGlobalChatActive) {
        // Show red dot
        tabGlobal.querySelector('.badge').classList.remove('d-none');
    }
});
// --------------------

if (tabChats && tabGlobal) {
    tabChats.addEventListener('click', () => {
        isGlobalChatActive = false;
        tabChats.classList.add('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
        tabChats.classList.remove('text-muted');

        tabGlobal.classList.remove('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
        tabGlobal.classList.add('text-muted');

        if (tabMap) {
            tabMap.classList.remove('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
            tabMap.classList.add('text-muted');
        }

        // Hide global view & Map view, show no-chat or active-chat
        globalChat.classList.add('d-none');
        if (mapView) mapView.classList.add('d-none'); // Hide Map

        if (currentReceiverId) {
            activeChat.classList.remove('d-none');
            noChatSelected.classList.add('d-none');
        } else {
            activeChat.classList.add('d-none');
            noChatSelected.classList.remove('d-none');
        }
    });

    tabGlobal.addEventListener('click', () => {
        isGlobalChatActive = true;
        tabGlobal.classList.add('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
        tabGlobal.classList.remove('text-muted');

        tabChats.classList.remove('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
        tabChats.classList.add('text-muted');

        if (tabMap) {
            tabMap.classList.remove('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
            tabMap.classList.add('text-muted');
        }

        activeChat.classList.add('d-none');
        noChatSelected.classList.add('d-none');
        if (mapView) mapView.classList.add('d-none');
        globalChat.classList.remove('d-none');
        tabGlobal.querySelector('.badge').classList.add('d-none');
        loadGlobalMessages();
        if (window.innerWidth <= 768) sidebar.classList.add('hidden');
    });

    tabMap?.addEventListener('click', () => {
        isGlobalChatActive = false;
        tabMap.classList.add('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
        tabMap.classList.remove('text-muted');

        tabChats.classList.remove('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
        tabChats.classList.add('text-muted');

        tabGlobal.classList.remove('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
        tabGlobal.classList.add('text-muted');

        activeChat.classList.add('d-none');
        noChatSelected.classList.add('d-none');
        globalChat.classList.add('d-none');
        if (mapView) {
            mapView.classList.remove('d-none');
            if (typeof initMap === 'function' && !window.map) initMap();
        }

        if (window.innerWidth <= 768) sidebar.classList.add('hidden');
    });
}
if (backToListGlobal) {
    backToListGlobal.addEventListener('click', () => {
        sidebar.classList.remove('hidden');
    });
}
if (document.getElementById('back-to-list-map-mobile')) {
    document.getElementById('back-to-list-map-mobile').addEventListener('click', () => {
        sidebar.classList.remove('hidden');
    });
}

async function loadGlobalMessages() {
    if (globalMessageList.innerHTML.trim() !== "") return; // Already loaded

    globalMessageList.innerHTML = '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"></div></div>';
    try {
        const response = await fetch('/get_global_messages');
        const messages = await response.json();
        globalMessageList.innerHTML = '';
        messages.forEach(msg => appendGlobalMessage(msg));
        globalMessageList.scrollTop = globalMessageList.scrollHeight;
    } catch (err) { console.error(err); }
}

function appendGlobalMessage(data) {
    const isMe = data.sender_id === currentUserId;
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isMe ? 'sent' : 'received'}`;
    msgDiv.setAttribute('data-id', data._id);

    let content = '';
    if (!isMe) {
        content += `<small class="d-block text-primary fw-bold mb-1" style="font-size: 0.75rem;">${data.sender_name}</small>`;
    }
    content += `<div>${data.message}</div>`;
    content += `<span class="message-time">${formatChatTime(data.timestamp)}</span>`;

    msgDiv.innerHTML = content;

    // Add Connect Button Context Menu for others
    if (!isMe) {
        msgDiv.style.cursor = 'pointer';
        msgDiv.title = 'Click to connect';
        msgDiv.addEventListener('click', () => {
            // Open search modal with this user pre-filled or just show simple confirm
            if (confirm(`Send connection request to ${data.sender_name}?`)) {
                const formData = new FormData();
                formData.append('target_id', data.sender_id);
                fetch('/send_request', { method: 'POST', body: formData })
                    .then(r => r.json())
                    .then(d => alert('Request sent!'))
                    .catch(e => console.error(e));
            }
        });
    }

    globalMessageList.appendChild(msgDiv);
    globalMessageList.scrollTop = globalMessageList.scrollHeight;
}

if (globalSendBtn) {
    globalSendBtn.addEventListener('click', () => {
        const msg = globalInput.value.trim();
        if (!msg) return;
        socket.emit('global_message', { message: msg });
        globalInput.value = '';
        updateGlobalSendButtonVisibility();
    });

    globalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') globalSendBtn.click();
    });

    globalInput.addEventListener('input', updateGlobalSendButtonVisibility);
}

// Global Emoji Picker
if (document.getElementById('global-emoji-picker')) {
    document.querySelectorAll('#global-emoji-picker span').forEach(span => {
        span.style.cursor = 'pointer';
        span.style.padding = '5px';
        span.addEventListener('click', () => {
            globalInput.value += span.innerText;
            globalInput.focus();
            updateGlobalSendButtonVisibility();
        });
    });
}

function updateGlobalSendButtonVisibility() {
    // Only proceed if globalInput exists to avoid errors on some pages
    if (!globalInput || !globalSendBtn) return;

    if (globalInput.value.trim() !== "") {
        globalSendBtn.classList.remove('d-none');
    } else {
        globalSendBtn.classList.add('d-none');
    }
}

// --- Socket Events ---

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('new_private_message', (data) => {
    // 1. Resolve Temporary Messages (Clean up "Sending..." placeholders)
    if (data.temp_id) {
        const tempMsg = document.querySelector(`.message[data-id="${data.temp_id}"]`);
        if (tempMsg) {
            tempMsg.remove();
        }
    } else if (data.file_type === 'audio' && data.sender_id === currentUserId) {
        // Fallback: If it's an audio from me, clean up ANY stuck "Sending..." messages
        document.querySelectorAll('.message').forEach(m => {
            if (m.innerHTML.includes('Sending voice message...') || m.getAttribute('data-id')?.startsWith('temp_voice_')) {
                m.remove();
            }
        });
    }

    const isFromCurrentReceiver = data.sender_id === currentReceiverId;
    const isSentToCurrentReceiver = data.sender_id === currentUserId && data.receiver_id === currentReceiverId;
    const isAI = currentReceiverId === 'vaani_ai_bot' && (data.sender_id === 'vaani_ai_bot' || data.receiver_id === 'vaani_ai_bot');

    // Only show message if it's relevant to the current active chat
    if (isFromCurrentReceiver || isSentToCurrentReceiver || isAI) {
        appendMessage(data);
        scrollToBottom();
    } else {
        // Handle notifications for other chats
        const contactId = data.sender_id === currentUserId ? data.receiver_id : data.sender_id;
        const contactItem = document.querySelector(`.contact-item[data-id="${contactId}"]`);
        if (contactItem) {
            contactItem.classList.add('unread');
            // Update last message preview
            const lastMsg = contactItem.querySelector('.contact-last-msg');
            if (lastMsg) lastMsg.innerText = data.file_url ? 'Sent a file' : data.message;
        }
    }
});

socket.on('user_status', (data) => {
    // Update Global Online Count
    const globalCount = document.getElementById('global-online-count');
    if (globalCount && data.online_count !== undefined) {
        globalCount.innerText = `${data.online_count} Online`;
        globalCount.classList.toggle('bg-success', data.online_count > 0);
    }

    const indicator = document.getElementById(`status-${data.user_id}`);
    if (indicator) {
        if (data.status === 'online') {
            indicator.classList.remove('status-offline');
            indicator.classList.add('status-online');
        } else {
            indicator.classList.remove('status-online');
            indicator.classList.add('status-offline');
        }
    }

    if (currentReceiverId === data.user_id) {
        if (data.status === 'online') {
            chatUserStatus.innerText = 'online';
            chatUserStatus.classList.remove('text-primary'); // Removed typing color if any
        }
        // Offline state is handled by update_last_seen for better formatting
    }
});

// Status updates are now handled in display_typing/hide_typing

socket.on('messages_read', (data) => {
    if (data.reader_id === currentReceiverId) {
        // Update all my sent messages to show double blue ticks
        document.querySelectorAll('.message.sent .status-ticks i').forEach(tick => {
            tick.classList.remove('fa-check');
            if (tick.classList.contains('fa-check-double')) return;
            tick.classList.add('fa-check-double', 'blue-tick');
        });
    }
});

socket.on('update_last_seen', (data) => {
    if (data.user_id === currentReceiverId) {
        chatUserStatus.innerText = `last seen ${formatChatTime(data.last_seen, 'long')}`;
        chatUserStatus.classList.remove('text-primary');
    }
});

socket.on('message_deleted', (data) => {
    const msgDiv = document.querySelector(`.message[data-id="${data.message_id}"]`);
    if (msgDiv) {
        msgDiv.innerHTML = '<i class="small text-muted">This message was deleted</i>';
        msgDiv.classList.add('deleted');
    }
});

socket.on('reaction_update', (data) => {
    const msgDiv = document.querySelector(`.message[data-id="${data.message_id}"]`);
    if (msgDiv) {
        let reactionContainer = msgDiv.querySelector('.reaction-container');
        if (!reactionContainer) {
            reactionContainer = document.createElement('div');
            reactionContainer.className = 'reaction-container';
            msgDiv.appendChild(reactionContainer);
        }

        let emojiSpan = reactionContainer.querySelector(`.reaction[data-emoji="${data.emoji}"]`);
        if (!emojiSpan) {
            emojiSpan = document.createElement('span');
            emojiSpan.className = 'reaction';
            emojiSpan.setAttribute('data-emoji', data.emoji);
            emojiSpan.innerText = data.emoji;
            reactionContainer.appendChild(emojiSpan);
        }

        // Count update logic could be added here for production
    }
});

// Browser Notifications
if ("Notification" in window) {
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

// --- UI Logic ---

contactItems.forEach(item => {
    item.addEventListener('click', () => {
        // Update UI
        contactItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        item.classList.remove('unread');

        const receiverId = item.getAttribute('data-id');
        const username = item.getAttribute('data-username');
        const pic = item.getAttribute('data-pic');
        const about = item.getAttribute('data-about');
        const status = document.getElementById(`status-${receiverId}`).classList.contains('status-online') ? 'online' : 'offline';

        loadChat(receiverId, username, pic, status, about);

        // Mobile visibility
        if (window.innerWidth <= 768) {
            sidebar.classList.add('hidden');
        }
    });
});

backToListBtn?.addEventListener('click', () => {
    sidebar.classList.remove('hidden');
});

// Pin/Unpin Logic
pinBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const contactId = btn.getAttribute('data-id');
        const formData = new FormData();
        formData.append('contact_id', contactId);

        try {
            const response = await fetch('/toggle_pin', { method: 'POST', body: formData });
            const data = await response.json();
            if (data.success) {
                btn.classList.toggle('pinned');
                location.reload();
            }
        } catch (err) { console.error('Pin failed:', err); }
    });
});

// Chat Search Toggle
toggleChatSearchBtn?.addEventListener('click', () => {
    chatSearchContainer.classList.toggle('d-none');
    if (!chatSearchContainer.classList.contains('d-none')) {
        chatSearchInput.focus();
    }
});

// Chat Search Input Logic
chatSearchInput?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => {
        const text = msg.innerText.toLowerCase();
        if (text.includes(term)) {
            msg.style.display = 'block';
            msg.style.opacity = '1';
        } else {
            msg.style.opacity = '0.3';
        }
    });
});

// Profile Sidebar Toggle
document.querySelectorAll('.btn-open-profile').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        profileSidebar.classList.remove('d-none');
    });
});

closeProfileBtn?.addEventListener('click', () => {
    profileSidebar.classList.add('d-none');
});

// Profile Picture Upload
profilePicInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/update_profile_pic', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            myProfilePic.src = data.profile_pic;
            // Also update the small avatar in sidebar
            const topAvatar = document.querySelector('.user-avatar.ripple');
            if (topAvatar) topAvatar.src = data.profile_pic;
            alert('Profile picture updated!');
        }
    } catch (err) {
        console.error('Failed to update profile pic:', err);
    }
});

// Save Profile Info
saveProfileBtn?.addEventListener('click', async () => {
    const username = profileNameInput.value.trim();
    const about = profileAboutInput.value.trim();
    const moodEmoji = document.getElementById('profile-mood-emoji').value;
    const mood = document.getElementById('profile-mood-text').value.trim();

    const formData = new FormData();
    formData.append('username', username);
    formData.append('about', about);

    try {
        // Save mood
        const moodData = new FormData();
        moodData.append('mood', mood);
        moodData.append('mood_emoji', moodEmoji);
        await fetch('/update_mood', { method: 'POST', body: moodData });

        const response = await fetch('/profile', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.success) {
            // Update UI
            document.querySelector('.sidebar-header h5').innerText = username;
            alert('Profile updated successfully!');
            profileSidebar.classList.add('d-none');
        } else {
            alert(data.message || 'Update failed');
        }
    } catch (err) {
        console.error('Failed to update profile:', err);
    }
});

// --- Contact Profile Logic ---
chatHeaderUserInfo?.addEventListener('click', () => {
    if (!currentReceiverId || isGlobalChatActive) return;

    // Find info from active contact item or header
    const activeItem = document.querySelector('.contact-item.active');

    // Extract info
    let username = chatUserName.innerText;
    let pic = chatUserPic.src;
    let about = 'No info available';
    let status = chatUserStatus.innerText;

    if (activeItem) {
        about = activeItem.getAttribute('data-about') || 'No info available';
    }

    // Populate Sidebar
    contactProfilePicLarge.src = pic;
    contactProfileName.innerText = username;
    contactProfileStatusText.innerText = status;
    contactProfileAbout.innerText = about;

    // Fallback for missing large pic
    contactProfilePicLarge.onerror = function () {
        this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff&size=256`;
    };

    contactProfileSidebar.classList.remove('d-none');
});

closeContactProfileBtn?.addEventListener('click', () => {
    contactProfileSidebar.classList.add('d-none');
});

document.getElementById('block-user-btn')?.addEventListener('click', () => {
    alert('User has been reported and blocked. 🚫');
    contactProfileSidebar.classList.add('d-none');
});

document.querySelector('#contact-profile-sidebar .btn-light')?.addEventListener('click', () => {
    const name = contactProfileName.innerText;
    alert(`Contact card for ${name} copied to clipboard! 📋`);
});

async function loadChat(receiverId, username, pic, status, about) {
    currentReceiverId = receiverId;

    // Switch views - Force switch to Private tab view
    if (globalChat) globalChat.classList.add('d-none');
    if (mapView) mapView.classList.add('d-none');
    noChatSelected.classList.add('d-none');
    activeChat.classList.remove('d-none');

    // Update Tabs UI
    if (tabChats && tabGlobal) {
        isGlobalChatActive = false;
        tabChats.classList.add('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
        tabChats.classList.remove('text-muted');

        tabGlobal.classList.remove('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
        tabGlobal.classList.add('text-muted');

        if (tabMap) {
            tabMap.classList.remove('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
            tabMap.classList.add('text-muted');
        }
    }

    // Set Header
    chatUserName.innerText = username;
    chatUserPic.src = pic;
    chatUserPic.onerror = function () {
        this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff`;
    };
    chatUserStatus.innerText = status === 'online' ? 'online' : (about || 'offline');

    // Notify server that I read these messages
    socket.emit('mark_read', { sender_id: receiverId });

    // Clear & Load Messages
    messageInput.value = '';
    updateSendButtonVisibility();
    messageList.innerHTML = '<div class="text-center my-4"><div class="spinner-border text-primary" role="status"></div></div>';

    try {
        const response = await fetch(`/get_messages/${receiverId}`);
        const messages = await response.json();

        messageList.innerHTML = '';
        messages.forEach(msg => appendMessage(msg));
        scrollToBottom();
    } catch (err) {
        console.error('Error loading messages:', err);
        messageList.innerHTML = '<p class="text-center text-danger">Failed to load chat history.</p>';
    }
}

function appendMessage(data) {
    const isMe = data.sender_id === currentUserId;
    const isAI = data.sender_id === 'vaani_ai_bot';

    // Remove typing indicator if we receive a real message from that sender
    if (data.sender_id === currentReceiverId || isAI) {
        const container = document.getElementById('message-list');
        const existing = container.querySelector('.typing-indicator');
        if (existing) existing.remove();
    }

    // Check for duplicate temp messages
    if (data._id && document.querySelector(`.message[data-id="${data._id}"]`)) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isMe ? 'sent' : 'received'} ${isAI ? 'ai-message' : ''}`;
    msgDiv.setAttribute('data-id', data._id);

    // Context menu for deletion
    if (isMe) {
        msgDiv.title = "Double click to unsend";
        msgDiv.addEventListener('dblclick', () => {
            if (confirm('Unsend this message?')) {
                socket.emit('delete_message', { message_id: data._id, receiver_id: currentReceiverId });
            }
        });
    }

    let content = '';

    if (data.file_url) {
        if (data.file_type === 'image') {
            content += `<img src="${data.file_url}" class="message-file" onclick="window.open(this.src)">`;
        } else if (data.file_type === 'audio') {
            content += `
                <div class="audio-player d-flex align-items-center gap-2">
                    <button class="btn btn-sm btn-light rounded-circle play-audio-btn" onclick="this.nextElementSibling.play()">
                        <i class="fas fa-play"></i>
                    </button>
                    <audio src="${data.file_url}" class="d-none" onended="this.previousElementSibling.innerHTML='<i class=\'fas fa-play\'></i>'"></audio>
                    <div class="small ${isMe ? 'text-white-50' : 'text-muted'}">
                        ${isMe ? 'Voice Message' : (data.sender_name || 'Voice Message')}
                    </div>
                </div>
            `;
            // Add play/pause logic improvement
            setTimeout(() => {
                const audio = msgDiv.querySelector('audio');
                const btn = msgDiv.querySelector('.play-audio-btn');
                if (audio && btn) {
                    audio.onplay = () => btn.innerHTML = '<i class="fas fa-pause"></i>';
                    audio.onpause = () => btn.innerHTML = '<i class="fas fa-play"></i>';
                    btn.onclick = () => audio.paused ? audio.play() : audio.pause();
                }
            }, 0);
        } else {
            content += `<a href="${data.file_url}" target="_blank" class="d-block mb-2 text-decoration-none">
                <i class="fas fa-file-alt"></i> ${data.message || 'File'}
            </a>`;
        }
    }

    if (data.message && !data.file_url) {
        content += `<div class="text">${data.message}</div>`;
    } else if (data.message && data.file_url && data.file_type === 'image') {
        content += `<div class="text small">${data.message}</div>`;
    }

    let ticks = '';
    if (isMe) {
        ticks = data.read
            ? '<span class="status-ticks"><i class="fas fa-check-double blue-tick"></i></span>'
            : '<span class="status-ticks"><i class="fas fa-check"></i></span>';
    }

    content += `<div class="d-flex justify-content-end align-items-center">
        <span class="message-time">${formatChatTime(data.timestamp)}</span>
        ${ticks}
    </div>`;

    msgDiv.innerHTML = content;

    // Add Reaction Picker UI
    const reactBtn = document.createElement('button');
    reactBtn.className = 'react-btn';
    reactBtn.innerHTML = '<i class="far fa-smile"></i>';

    const picker = document.createElement('div');
    picker.className = 'reaction-picker';
    ['❤️', '👍', '😂', '😮', '😢', '🔥'].forEach(emoji => {
        const span = document.createElement('span');
        span.innerText = emoji;
        span.onclick = () => {
            socket.emit('add_reaction', { message_id: data._id, emoji: emoji, receiver_id: currentReceiverId });
            picker.classList.remove('show');
        };
        picker.appendChild(span);
    });

    reactBtn.onclick = (e) => {
        e.stopPropagation();
        picker.classList.toggle('show');
    };

    msgDiv.appendChild(reactBtn);
    msgDiv.appendChild(picker);

    // Initial reactions if any
    if (data.reactions) {
        const container = document.createElement('div');
        container.className = 'reaction-container';
        Object.keys(data.reactions).forEach(emoji => {
            const span = document.createElement('span');
            span.className = 'reaction';
            span.innerText = emoji;
            container.appendChild(span);
        });
        msgDiv.appendChild(container);
    }

    messageList.appendChild(msgDiv);
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (!message && !fileInput.files[0]) return;

    if (fileInput.files[0]) {
        uploadAndSend(message);
    } else {
        // Appending locally for immediate feedback
        const msgData = {
            _id: 'temp_' + Date.now(),
            message: message,
            sender_id: currentUserId,
            timestamp: new Date().toISOString(),
            read: false
        };

        appendMessage(msgData);
        scrollToBottom();

        socket.emit('private_message', {
            receiver_id: currentReceiverId,
            message: message,
            temp_id: msgData._id
        });

        // If sending to AI, show typing indicator immediately
        if (currentReceiverId === 'vaani_ai_bot') {
            const container = document.getElementById('message-list');
            const indicator = document.createElement('div');
            indicator.className = 'message received typing-indicator ai-typing mb-2';
            indicator.innerHTML = `<small class="text-muted"><i class="fas fa-robot animate__animated animate__pulse infinite"></i> VAANI is thinking...</small>`;
            container.appendChild(indicator);
            scrollToBottom();
        }

        messageInput.value = '';
        updateSendButtonVisibility();
    }
}

async function uploadAndSend(message) {
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.url) {
            const fileType = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('audio/') ? 'audio' : 'file');
            const temp_id = 'temp_' + Date.now();

            // Appending locally for immediate feedback
            const msgData = {
                _id: temp_id,
                message: message,
                file_url: data.url,
                file_type: fileType,
                sender_id: currentUserId,
                timestamp: new Date().toISOString(),
                read: false
            };
            appendMessage(msgData);
            scrollToBottom();

            socket.emit('private_message', {
                receiver_id: currentReceiverId,
                message: message,
                file_url: data.url,
                file_type: fileType,
                temp_id: temp_id
            });

            // Reset
            fileInput.value = '';
            messageInput.value = '';
        }
    } catch (err) {
        console.error('Upload failed:', err);
        alert('File upload failed');
    }
}

// Event Listeners
sendBtn?.addEventListener('click', sendMessage);
messageInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// --- Sidebar Search ---
const sidebarSearch = document.getElementById('sidebar-search');
const toggleSidebarSearchBtn = document.getElementById('toggle-sidebar-search');
const sidebarSearchContainer = document.getElementById('sidebar-search-container');

sidebarSearch?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.contact-item').forEach(item => {
        const name = (item.getAttribute('data-username') || '').toLowerCase();
        if (name.includes(term)) {
            item.classList.remove('d-none');
            if (term.length > 0) {
                item.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
            } else {
                item.style.backgroundColor = '';
            }
        } else {
            item.classList.add('d-none');
        }
    });
});

toggleSidebarSearchBtn?.addEventListener('click', () => {
    sidebarSearchContainer.classList.toggle('mobile-search-active');
    if (sidebarSearchContainer.classList.contains('mobile-search-active')) {
        sidebarSearch.focus();
    }
});

messageInput?.addEventListener('input', () => {
    updateSendButtonVisibility();
    // Private chat typing logic is now handled by the global setup below
});

// --- Typing Indicator ---
let typingTimer; // Renamed to avoid conflict if any
const TYPING_TIMER_LENGTH = 1000; // 1s

function setupTyping(inputId, room) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('input', () => {
        socket.emit('typing', { room: room });
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            socket.emit('stop_typing', { room: room });
        }, TYPING_TIMER_LENGTH);
    });
}

// Global Typing
setupTyping('global-input', 'global_lounge');

socket.on('display_typing', (data) => {
    // Determine where to show
    let container = null;
    let text = `${data.username} is typing...`;

    if (data.room === 'global_lounge' && isGlobalChatActive) {
        container = document.getElementById('global-message-list');
    } else if (data.sender_id === currentReceiverId && !isGlobalChatActive) {
        container = document.getElementById('message-list');
    }

    if (container) {
        // Remove existing indicator first
        const existing = container.querySelector('.typing-indicator');
        if (existing) existing.remove();

        const indicator = document.createElement('div');
        indicator.className = 'message received typing-indicator mb-2';
        indicator.innerHTML = `<small class="text-muted"><i class="fas fa-ellipsis-h animate__animated animate__flash infinite"></i> ${text}</small>`;
        container.appendChild(indicator);
        container.scrollTop = container.scrollHeight;
    }

    // Update Header Status
    if (data.sender_id === currentReceiverId && !isGlobalChatActive) {
        chatUserStatus.innerText = 'typing...';
        chatUserStatus.classList.add('text-primary');
    }
});

socket.on('hide_typing', (data) => {
    let container = null;
    if (data.room === 'global_lounge') {
        container = document.getElementById('global-message-list');
    } else if (data.sender_id === currentReceiverId) {
        container = document.getElementById('message-list');
    }

    if (container) {
        const existing = container.querySelector('.typing-indicator');
        if (existing) existing.remove();
    }

    // Restore Header Status
    if (data.sender_id === currentReceiverId && !isGlobalChatActive) {
        const item = document.querySelector(`.contact-item[data-id="${data.sender_id}"]`);
        const isOnline = document.getElementById(`status-${data.sender_id}`).classList.contains('status-online');
        chatUserStatus.innerText = isOnline ? 'online' : (item.getAttribute('data-about') || 'offline');
        chatUserStatus.classList.remove('text-primary');
    }
});


// --- Emojis (Simple) ---
document.querySelectorAll('#emoji-picker span, #global-emoji-picker span').forEach(span => {
    span.style.cursor = 'pointer';
    span.style.fontSize = '1.5rem';
    span.style.margin = '5px';

    span.addEventListener('click', function () {
        const emoji = this.innerText;
        const inputId = this.parentElement.id === 'global-emoji-picker' ? 'global-input' : 'message-input';
        const input = document.getElementById(inputId);
        input.value += emoji;
        input.focus();
    });
});

// Private Chat Typing Logic
document.getElementById('message-input').addEventListener('input', () => {
    if (currentReceiverId) {
        socket.emit('typing', { room: currentReceiverId });
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            socket.emit('stop_typing', { room: currentReceiverId });
        }, TYPING_TIMER_LENGTH);
    }
});

// Voice Recording Logic
let mediaRecorder;
let audioChunks = [];
// let isRecording = false; // Declared at top of file


micBtn?.addEventListener('click', async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio recording.');
        return;
    }

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                if (!currentReceiverId) {
                    alert('Please select a chat first.');
                    return;
                }

                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });

                // Show temporary uploading message
                const tempId = 'temp_voice_' + Date.now();
                appendMessage({
                    _id: tempId,
                    sender_id: currentUserId,
                    message: '<i>Sending voice message...</i>',
                    timestamp: new Date().toISOString(),
                    read: false
                });

                // Set a safety timeout: if it's still there in 20s, remove it
                setTimeout(() => {
                    const stuckMsg = document.querySelector(`.message[data-id="${tempId}"]`);
                    if (stuckMsg) stuckMsg.remove();
                }, 20000);

                // Upload
                const formData = new FormData();
                formData.append('file', audioBlob, `voice_note_${Date.now()}.wav`);
                formData.append('voice_filter', selectedVoiceFilter);

                try {
                    const response = await fetch('/upload', { method: 'POST', body: formData });
                    const data = await response.json();

                    if (data.url) {
                        socket.emit('private_message', {
                            receiver_id: currentReceiverId,
                            message: '',
                            file_url: data.url,
                            file_type: 'audio',
                            temp_id: tempId // Use this to resolve any existing UI if needed
                        });
                    }
                } catch (e) {
                    console.error(e);
                    alert('Failed to send voice message.');
                }

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecording = true;
            micBtn.classList.add('recording-glow');
            messageInput.placeholder = 'Recording... Click mic to stop & send.';
            micBtn.innerHTML = '<i class="fas fa-stop"></i>';
            micBtn.classList.add('text-danger');
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone.');
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        micBtn.classList.remove('recording-glow');
        messageInput.placeholder = 'Type a message...';
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        micBtn.classList.remove('text-danger');
    }
});

// Voice Filter Menu Listeners
document.querySelectorAll('.voice-filter-menu .dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.voice-filter-menu .dropdown-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        selectedVoiceFilter = item.getAttribute('data-voice');

        const icon = document.getElementById('voice-filter-btn').querySelector('i');
        if (selectedVoiceFilter !== 'none') {
            document.getElementById('voice-filter-btn').classList.add('text-primary');
            icon.className = 'fas fa-magic animate__animated animate__pulse infinite';
        } else {
            document.getElementById('voice-filter-btn').classList.remove('text-primary');
            icon.className = 'fas fa-magic';
        }
    });
});

fileInput?.addEventListener('change', () => {
    updateSendButtonVisibility();
});

function updateSendButtonVisibility() {
    const hasText = messageInput.value.trim() !== "";
    const hasFile = fileInput.files.length > 0;

    if (hasText || hasFile) {
        sendBtn.classList.remove('d-none');
        micBtn.classList.add('d-none');
    } else {
        sendBtn.classList.add('d-none');
        micBtn.classList.remove('d-none');
    }
}

// Add Clear Chat listener
document.getElementById('clear-chat-btn')?.addEventListener('click', async () => {
    if (!currentReceiverId) return;
    if (confirm('Are you sure you want to permanently clear this chat? This cannot be undone.')) {
        try {
            const response = await fetch(`/clear_chat/${currentReceiverId}`, { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                document.getElementById('message-list').innerHTML = '';
            }
        } catch (err) {
            console.error('Failed to clear chat:', err);
            alert('Failed to clear chat on server.');
        }
    }
});

// Dark Mode Toggle
document.querySelectorAll('.btn-dark-mode').forEach(btn => {
    btn.addEventListener('click', () => {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('dark_mode', darkMode);
    });
});

// Initialize Dark Mode from localStorage
if (localStorage.getItem('dark_mode') === 'true') {
    darkMode = true;
    document.body.classList.add('dark-theme');
} else {
    darkMode = false;
    document.body.classList.remove('dark-theme');
}

function scrollToBottom() {
    messageList.scrollTop = messageList.scrollHeight;
}

// Simple Emoji Picker Handler
// Simple Emoji Picker Handler
document.querySelectorAll('#emoji-picker span').forEach(span => {
    span.style.cursor = 'pointer';
    span.style.padding = '5px';
    span.addEventListener('click', () => {
        messageInput.value += span.innerText;
        messageInput.focus();
    });
});

// --- Search & Connect Logic ---

const btnOpenSearches = document.querySelectorAll('.btn-open-search');
const userSearchInput = document.getElementById('user-search-input');
const searchResults = document.getElementById('search-results');
// Initialize Bootstrap Modals safely
const searchModalEl = document.getElementById('searchModal');
const searchModal = searchModalEl ? new bootstrap.Modal(searchModalEl) : null;

if (btnOpenSearches.length > 0 && searchModal) {
    btnOpenSearches.forEach(btn => {
        btn.addEventListener('click', () => {
            searchModal.show();
            setTimeout(() => userSearchInput.focus(), 500);
        });
    });
}

if (userSearchInput) {
    userSearchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            searchResults.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/search_users?q=${encodeURIComponent(query)}`);
            const users = await response.json();

            searchResults.innerHTML = '';
            if (users.length === 0) {
                searchResults.innerHTML = '<div class="text-center text-muted p-3">No users found</div>';
                return;
            }

            users.forEach(user => {
                const item = document.createElement('div');
                item.className = 'user-result-item d-flex justify-content-between align-items-center shadow-sm';

                let actionBtn = '';
                if (user.status === 'connected') {
                    actionBtn = '<span class="badge bg-success rounded-pill px-3 py-2"><i class="fas fa-check-circle me-1"></i>Connected</span>';
                } else if (user.status === 'pending_sent') {
                    actionBtn = '<span class="badge bg-secondary rounded-pill px-3 py-2"><i class="fas fa-clock me-1"></i>Pending</span>';
                } else if (user.status === 'pending_received') {
                    actionBtn = '<span class="badge bg-warning text-dark rounded-pill px-3 py-2"><i class="fas fa-user-plus me-1"></i>Request Received</span>';
                } else {
                    actionBtn = `<button class="btn btn-sm btn-primary rounded-pill px-4 connect-btn fw-bold ripple" data-id="${user.id}">Connect</button>`;
                }

                item.innerHTML = `
                    <div class="d-flex align-items-center user-result-info">
                        <img src="${user.profile_pic}" class="user-result-avatar me-3">
                        <div>
                            <h6 class="mb-0 text-dark-emphasis">${user.username}</h6>
                            <small class="d-block text-truncate" style="max-width: 180px;">${user.about || 'Available'}</small>
                        </div>
                    </div>
                    ${actionBtn}
                `;
                searchResults.appendChild(item);
            });

            document.querySelectorAll('.connect-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const targetId = e.target.getAttribute('data-id');
                    const formData = new FormData();
                    formData.append('target_id', targetId);

                    try {
                        const res = await fetch('/send_request', { method: 'POST', body: formData });
                        const data = await res.json();
                        if (data.success) {
                            e.target.replaceWith(document.createRange().createContextualFragment('<span class="badge bg-secondary">Pending</span>'));
                        }
                    } catch (err) { console.error(err); }
                });
            });

        } catch (err) { console.error(err); }
    }, 300));
}

// --- Requests Logic ---

const btnOpenRequests = document.querySelectorAll('.btn-open-requests');
const requestsModalEl = document.getElementById('requestsModal');
const requestsModal = requestsModalEl ? new bootstrap.Modal(requestsModalEl) : null;
const requestsList = document.getElementById('requests-list');

if (btnOpenRequests.length > 0 && requestsModal) {
    btnOpenRequests.forEach(btn => {
        btn.addEventListener('click', async () => {
            requestsModal.show();
            loadRequests();
        });
    });
}

async function loadRequests() {
    if (!requestsList) return;
    requestsList.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-primary" role="status"></div></div>';

    try {
        const response = await fetch('/get_requests');
        const users = await response.json();

        requestsList.innerHTML = '';
        if (users.length === 0) {
            requestsList.innerHTML = '<div class="text-center text-muted p-3">No pending requests</div>';
            return;
        }

        users.forEach(user => {
            const item = document.createElement('div');
            item.className = 'user-result-item d-flex justify-content-between align-items-center mb-3 shadow-sm';
            item.innerHTML = `
                <div class="d-flex align-items-center user-result-info">
                    <img src="${user.profile_pic}" class="user-result-avatar me-3">
                    <div>
                        <h6 class="mb-0 text-dark-emphasis">${user.username}</h6>
                        <small class="text-muted">Wants to connect with you</small>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-success rounded-circle accept-btn shadow-sm" data-id="${user.id}" title="Accept" style="width: 36px; height: 36px;">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger rounded-circle reject-btn shadow-sm" data-id="${user.id}" title="Reject" style="width: 36px; height: 36px;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            requestsList.appendChild(item);
        });

        document.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetId = e.target.getAttribute('data-id');
                const formData = new FormData();
                formData.append('target_id', targetId);
                await fetch('/accept_request', { method: 'POST', body: formData });
                loadRequests(); // Reload list
                location.reload(); // To update sidebar contacts
            });
        });

        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetId = e.target.getAttribute('data-id');
                const formData = new FormData();
                formData.append('target_id', targetId);
                await fetch('/reject_request', { method: 'POST', body: formData });
                loadRequests();
            });
        });

    } catch (err) { console.error(err); }
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// --- Map & Location Logic ---

const backToListMap = document.getElementById('back-to-list-map');
const shareLocationToggle = document.getElementById('share-location-toggle');
const ghostModeToggle = document.getElementById('ghost-mode-toggle');
const locationStatus = document.getElementById('location-status');

let map = null;
let myMarker = null;
let friendsMarkers = {}; // { user_id: marker }
let watchId = null;
let isSharing = false;
let isGhostMode = false;

// Initialize Map Tab
if (tabMap) {
    tabMap.addEventListener('click', () => {
        // UI Tabs Update
        if (tabChats) {
            tabChats.classList.remove('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
            tabChats.classList.add('text-muted');
        }
        if (tabGlobal) {
            tabGlobal.classList.remove('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
            tabGlobal.classList.add('text-muted');
        }
        tabMap.classList.add('rounded-pill', 'bg-white', 'shadow-sm', 'text-primary');
        tabMap.classList.remove('text-muted');

        // View Update
        [activeChat, noChatSelected, globalChat].forEach(v => {
            if (v) v.classList.add('d-none');
        });
        if (mapView) mapView.classList.remove('d-none');

        // Initialize Map if not ready
        if (!map) {
            // Slight delay to ensure visibility
            setTimeout(initMap, 100);
        } else {
            setTimeout(() => map.invalidateSize(), 100);
        }

        // Fetch active friends
        socket.emit('request_active_locations');
        socket.emit('request_map_stories');

        // Mobile Sidebar
        if (window.innerWidth <= 768 && sidebar) {
            sidebar.classList.add('hidden');
        }
    });
}

const backToListMapMobile = document.getElementById('back-to-list-map-mobile');

[backToListMap, backToListMapMobile].forEach(btn => {
    if (btn) {
        btn.addEventListener('click', () => {
            if (sidebar) sidebar.classList.remove('hidden');
        });
    }
});

function initMap() {
    // Check if container exists
    if (!document.getElementById('map')) return;

    // Default view
    // We initiate the map object but we don't set layers yet
    map = L.map('map').setView([20.5937, 78.9629], 5);

    // Define Base Layers
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
    });

    // Add default layer
    streetLayer.addTo(map);

    // Wire up custom buttons
    const btnStreet = document.getElementById('btn-street');
    const btnSatellite = document.getElementById('btn-satellite');

    if (btnStreet && btnSatellite) {
        btnStreet.addEventListener('click', () => {
            map.removeLayer(satelliteLayer);
            streetLayer.addTo(map);
            btnStreet.classList.add('active');
            btnSatellite.classList.remove('active');
        });

        btnSatellite.addEventListener('click', () => {
            map.removeLayer(streetLayer);
            satelliteLayer.addTo(map);
            btnSatellite.classList.add('active');
            btnStreet.classList.remove('active');
        });
    }

    // Locate Me Button Logic
    const locateBtn = document.getElementById('locate-me-btn');
    if (locateBtn) {
        locateBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                locateBtn.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div>';
                navigator.geolocation.getCurrentPosition(pos => {
                    const { latitude, longitude } = pos.coords;
                    map.setView([latitude, longitude], 17); // Zoom in closer
                    updateMyMarker(latitude, longitude);
                    locateBtn.innerHTML = '<i class="fas fa-crosshairs fa-lg text-primary"></i>';
                }, err => {
                    alert("Could not get your location.");
                    locateBtn.innerHTML = '<i class="fas fa-crosshairs fa-lg text-primary"></i>';
                });
            }
        });
    }

    // Try to get initial location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            map.setView([latitude, longitude], 15);
            updateMyMarker(latitude, longitude);
        }, err => {
            console.error("Location init error:", err);
            if (locationStatus) locationStatus.innerHTML = '<span class="badge bg-danger">GPS Error</span>';
        });
    }
}

function updateMyMarker(lat, lng) {
    if (!map) return;

    // Get current user avatar
    const myAvatarSrc = document.querySelector('.user-avatar')?.src || 'https://ui-avatars.com/api/?name=Me';

    if (!myMarker) {
        const myIcon = L.divIcon({
            className: 'custom-map-icon',
            html: `<div style="background-image: url('${myAvatarSrc}'); width: 40px; height: 40px; background-size: cover; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
        myMarker = L.marker([lat, lng], { icon: myIcon }).addTo(map).bindPopup("You");
    } else {
        myMarker.setLatLng([lat, lng]);
    }
}

// Location Sharing Toggle
shareLocationToggle?.addEventListener('change', (e) => {
    isSharing = e.target.checked;

    if (isSharing) {
        startTracking();
        updateLocationStatus();
        socket.emit('start_sharing_location');
    } else {
        stopTracking();
        updateLocationStatus();
        socket.emit('stop_sharing_location');
    }
});

// Ghost Mode Toggle
ghostModeToggle?.addEventListener('change', (e) => {
    isGhostMode = e.target.checked;
    updateLocationStatus();

    if (isGhostMode) {
        socket.emit('stop_sharing_location');
    } else {
        // If sharing was active, we resume emission (tracking loop handles this)
        if (isSharing) socket.emit('start_sharing_location');
    }
});

function updateLocationStatus() {
    if (!locationStatus) return;

    const dot = locationStatus.querySelector('.status-dot');
    const text = locationStatus.querySelector('.status-text');

    if (isGhostMode) {
        dot.style.background = '#6366f1';
        dot.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.2)';
        text.innerText = '👻 Ghost Mode';
    } else if (isSharing) {
        dot.style.background = '#22c55e';
        dot.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.2)';
        text.innerText = 'Sharing Live';
        dot.classList.add('animate__animated', 'animate__pulse', 'infinite');
    } else {
        dot.style.background = '#94a3b8';
        dot.style.boxShadow = '0 0 0 3px rgba(148, 163, 184, 0.2)';
        text.innerText = 'Location Hidden';
        dot.classList.remove('animate__animated', 'animate__pulse', 'infinite');
    }
}

function startTracking() {
    if (watchId) return;

    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    watchId = navigator.geolocation.watchPosition((pos) => {
        const { latitude, longitude } = pos.coords;

        // Update local marker regardless of sharing
        updateMyMarker(latitude, longitude);

        // Emit if sharing and NOT in ghost mode
        if (isSharing && !isGhostMode) {
            socket.emit('update_location', {
                lat: latitude,
                lng: longitude
            });
        }

    }, (err) => {
        console.error("Tracking error:", err);
    }, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
    });
}

function stopTracking() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

// Socket Listeners for Friends
socket.on('friend_location_update', (data) => {
    // Only process if map is somewhat initialized or intended
    if (!document.getElementById('map')) return;

    // console.log("Friend update:", data);

    const { user_id, username, profile_pic, lat, lng } = data;

    if (user_id === currentUserId) return;

    if (!map) return;

    // Calculate Distance
    let distanceStr = '';
    if (myMarker) {
        const myLoc = myMarker.getLatLng();
        const friendLoc = L.latLng(lat, lng);
        const dist = myLoc.distanceTo(friendLoc); // Meters
        if (dist > 1000) {
            distanceStr = `<br><small class="text-warning"><i class="fas fa-ruler-horizontal"></i> ${(dist / 1000).toFixed(1)} km away</small>`;
        } else {
            distanceStr = `<br><small class="text-warning"><i class="fas fa-ruler-horizontal"></i> ${Math.round(dist)} m away</small>`;
        }
    }

    if (friendsMarkers[user_id]) {
        friendsMarkers[user_id].setLatLng([lat, lng]);
        friendsMarkers[user_id].setPopupContent(`<b>${username}</b><br>Live${distanceStr}`);
    } else {
        const friendIcon = L.divIcon({
            className: 'custom-map-icon',
            html: `<div style="background-image: url('${profile_pic}'); width: 40px; height: 40px; background-size: cover; border-radius: 50%; border: 3px solid #0d6efd; box-shadow: 0 0 10px rgba(13, 110, 253, 0.4);"></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const marker = L.marker([lat, lng], { icon: friendIcon })
            .addTo(map)
            .bindPopup(`<b>${username}</b><br>Live${distanceStr}`);

        friendsMarkers[user_id] = marker;
    }
});

let meetupMarker = null;

socket.on('meetup_set', (data) => {
    if (!map) return;
    const { lat, lng, set_by } = data;

    // Remove if existing
    if (meetupMarker) map.removeLayer(meetupMarker);

    // Custom Flag Icon - using FontAwesome
    const flagIcon = L.divIcon({
        className: 'custom-flag-icon',
        html: '<div style="font-size: 30px; color: #dc3545; filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.5));"><i class="fas fa-flag-checkered"></i></div>',
        iconSize: [30, 30],
        iconAnchor: [5, 28],
        popupAnchor: [10, -30]
    });

    meetupMarker = L.marker([lat, lng], { icon: flagIcon })
        .addTo(map)
        .bindPopup(`<b>🏁 Meetup Point</b><br>Set by ${set_by}`)
        .openPopup();
});

// Periodic check to attach double-click listener if map gets re-initialized
setInterval(() => {
    if (map && !map._meetupListenerAttached) {
        map.on('dblclick', (e) => {
            if (confirm("Set this location as Meetup Point for all friends?")) {
                const { lat, lng } = e.latlng;
                socket.emit('set_meetup', { lat, lng });
            }
        });
        map._meetupListenerAttached = true;
    }
}, 2000);

socket.on('friend_stopped_sharing', (data) => {
    const { user_id } = data;
    if (friendsMarkers && friendsMarkers[user_id]) {
        if (map) map.removeLayer(friendsMarkers[user_id]);
        delete friendsMarkers[user_id];
    }
});

// Map Story Logic
window.postMapStory = function () {
    const text = document.getElementById('map-story-text').value;
    let visibility = 'public';
    if (document.getElementById('vis-friends').checked) visibility = 'friends';

    if (!text.trim()) {
        alert("Please enter a story message.");
        return;
    }

    if (!navigator.geolocation) {
        alert("Geolocation needed to post a story.");
        return;
    }

    // Get current location
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;

        socket.emit('add_map_story', {
            content: text,
            visibility: visibility,
            lat: latitude,
            lng: longitude
        });

        // Close Modal
        const modalEl = document.getElementById('addStoryModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
        document.getElementById('map-story-text').value = '';

    }, err => {
        alert("Could not get location.");
    });
};

socket.on('new_map_story', (data) => {
    if (!map) return;

    // console.log("New Story:", data);
    const { story_id, username, profile_pic, content, lat, lng, visibility, timestamp } = data;

    const isPublic = visibility === 'public';

    // Custom Icon with Badge
    const iconHtml = `<div style="position: relative; width: 50px; height: 50px;">
                        <div style="background-image: url('${profile_pic}'); width: 45px; height: 45px; background-size: cover; border-radius: 50%; border: 3px solid ${isPublic ? '#0d6efd' : '#198754'}; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>
                        <span class="badge rounded-pill ${isPublic ? 'bg-primary' : 'bg-success'}" style="position: absolute; bottom: 0; right: 0; font-size: 0.6rem;">
                            ${isPublic ? '<i class="fas fa-globe"></i>' : '<i class="fas fa-user-friends"></i>'}
                        </span>
                      </div>`;

    const storyIcon = L.divIcon({
        className: 'story-icon-custom',
        html: iconHtml,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -25]
    });

    const marker = L.marker([lat, lng], { icon: storyIcon })
        .addTo(map)
        .bindPopup(`
            <div class="premium-map-popup">
                <div class="popup-header d-flex align-items-center mb-3">
                    <div class="popup-avatar-wrapper me-3">
                        <img src="${profile_pic}" class="rounded-circle border border-2 border-white shadow-sm" width="50" height="50">
                        <div class="active-pulse"></div>
                    </div>
                    <div class="popup-user-info">
                        <h6 class="mb-0 fw-bold" style="color: #1e293b;">${username}</h6>
                        <span class="badge ${isPublic ? 'bg-primary' : 'bg-success'} rounded-pill" style="font-size: 0.65rem; padding: 4px 10px;">
                            ${isPublic ? '<i class="fas fa-globe me-1"></i> Public' : '<i class="fas fa-user-friends me-1"></i> Friends'}
                        </span>
                    </div>
                </div>
                <div class="popup-body">
                    <p class="mb-3 lead fs-6 fst-italic shadow-text" style="color: #475569; font-weight: 500;">"${content}"</p>
                </div>
                <div class="popup-footer d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                    <small class="text-muted"><i class="far fa-clock me-1"></i> ${new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    <button class="btn btn-sm btn-link p-0 text-decoration-none fw-bold" style="font-size: 0.75rem;">Reply</button>
                </div>
            </div>
        `);
});

/* Toggle Map Controls View */
function toggleMapControls() { const overlay = document.getElementById('map-controls-overlay'); const openBtn = document.getElementById('btn-open-map-ctrl'); if (overlay.classList.contains('d-none')) { overlay.classList.remove('d-none'); openBtn.classList.add('d-none'); } else { overlay.classList.add('d-none'); openBtn.classList.remove('d-none'); } }


// Map Style Selection
document.getElementById('btn-street')?.addEventListener('click', function () {
    this.classList.add('active');
    document.getElementById('btn-satellite')?.classList.remove('active');
    if (map) {
        map.removeLayer(satelliteLayer);
        map.addLayer(streetLayer);
    }
});

document.getElementById('btn-satellite')?.addEventListener('click', function () {
    this.classList.add('active');
    document.getElementById('btn-street')?.classList.remove('active');
    if (map) {
        map.removeLayer(streetLayer);
        map.addLayer(satelliteLayer);
    }
});
