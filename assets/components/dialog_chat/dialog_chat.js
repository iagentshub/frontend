// dialog_chat.js — Chat SSE con countdown timer
'use strict';

function _fmtTok(n) {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
}

class AgentChatDialog {
    constructor(agent) {
        this.agent = agent;
        this.messages = this._loadHistory();
        this._sessionTok = this._sumHistoryTok();
        this._timerInterval = null;
        this._timerSecs = 0;
        this._timerRemaining = 0;
        this._el = null;
    }

    _sumHistoryTok() {
        return this.messages.reduce(function (acc, m) {
            if (m.tokens) {
                acc.in += m.tokens.in || 0;
                acc.out += m.tokens.out || 0;
            }
            return acc;
        }, { in: 0, out: 0 });
    }

    open() {
        if (document.getElementById('ga-chat-modal')) return;
        const el = document.createElement('div');
        el.id = 'ga-chat-modal';
        el.className = 'chat-modal-bg';
        const name = this.agent.name || 'Agente';
        const initials = name.charAt(0).toUpperCase();
        const hasTimeout = this.agent.timeout > 0;
        el.innerHTML = `
        <div class="chat-box" id="ga-chat-box">
            <div class="chat-header">
                <div class="chat-header-avatar">${esc(initials)}</div>
                <div class="chat-header-info">
                    <div class="chat-header-name">${esc(name)}</div>
                    <div class="chat-header-sub">
                        ${esc(this.agent.model || '')}
                        <span class="chat-tok-counter" id="ga-tok-counter" style="display:none">
                            · ↑ <span id="ga-tok-in">0</span> ↓ <span id="ga-tok-out">0</span> tok
                        </span>
                    </div>
                </div>
                <div class="chat-header-actions">
                    ${hasTimeout ? `
                    <div class="chat-countdown" id="ga-chat-countdown">
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="11" fill="none" stroke="var(--surface-3)" stroke-width="2"/>
                            <circle class="ccd-ring" id="ga-ccd-ring" cx="12" cy="12" r="11" stroke-width="2"/>
                        </svg>
                        <span id="ga-ccd-label">—</span>
                    </div>` : ''}
                    <button class="modal-close" id="ga-chat-close" type="button" title="${t('agents.chat.close')}">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="chat-messages" id="ga-chat-msgs"></div>
            <div class="chat-input-bar">
                <textarea class="chat-input" id="ga-chat-input" placeholder="${t('agents.chat.placeholder')}" rows="1"></textarea>
                <button class="chat-send-btn" id="ga-chat-send" title="${t('actions.send')}">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 14L14 8 2 2v4l8 2-8 2v4z" fill="currentColor"/>
                    </svg>
                </button>
            </div>
        </div>`;
        document.body.appendChild(el);
        this._el = el;
        this._bindClose();
        this._bindSend();
        this._autoResizeInput();
        this._renderMessages();
        document.getElementById('ga-chat-input').focus();
    }

    _bindClose() {
        document.getElementById('ga-chat-close')?.addEventListener('click', () => this.close());
        this._el.addEventListener('click', e => { if (e.target === this._el) this.close(); });
        document.addEventListener('keydown', this._onKeydown = (e) => {
            if (e.key === 'Escape') this.close();
        });
    }

    _updateSessionTok() {
        var counter = document.getElementById('ga-tok-counter');
        var inEl = document.getElementById('ga-tok-in');
        var outEl = document.getElementById('ga-tok-out');
        if (!counter) return;
        counter.style.display = '';
        if (inEl) inEl.textContent = _fmtTok(this._sessionTok.in);
        if (outEl) outEl.textContent = _fmtTok(this._sessionTok.out);
    }

    _bindSend() {
        const sendBtn = document.getElementById('ga-chat-send');
        const input = document.getElementById('ga-chat-input');
        sendBtn.addEventListener('click', () => this._send());
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._send(); }
        });
    }

    _loadHistory() {
        try {
            const raw = localStorage.getItem(`chat_history_${this.agent.id}`);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }

    _saveHistory() {
        try {
            localStorage.setItem(`chat_history_${this.agent.id}`, JSON.stringify(this.messages));
        } catch { /* storage lleno o no disponible */ }
    }

    _autoResizeInput() {
        const input = document.getElementById('ga-chat-input');
        if (!input) return;
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });
    }

    async _send() {
        const input = document.getElementById('ga-chat-input');
        const text = input?.value.trim();
        if (!text) return;
        input.value = '';
        input.style.height = 'auto';
        this._setLoading(true);
        var now = new Date();
        this.messages.push({ role: 'user', content: text, ts: now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0') });
        this._saveHistory();
        this._renderMessages();
        this._appendTyping();
        this._startTimer();
        try {
            const resp = await fetch(`/api/agents/${encodeURIComponent(this.agent.id)}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: this.messages.map(function (m) { return { role: m.role, content: m.content }; }) }),
            });
            if (!resp.ok) throw new Error(`Error ${resp.status}`);
            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buf = '';
            let reply = '';
            let tokens = null;
            let serverError = null;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split('\n');
                buf = lines.pop();
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const ev = JSON.parse(line.slice(6));
                        if (ev.type === 'token') { reply += ev.token; }
                        if (ev.type === 'done') {
                            reply = ev.reply || reply;
                            tokens = (ev.tokens && (ev.tokens.in || ev.tokens.out)) ? ev.tokens : null;
                        }
                        if (ev.type === 'error') { serverError = ev.message || 'Error desconocido'; }
                    } catch { /* ignorar líneas no-json */ }
                }
            }
            this._stopTimer();
            this._removeTyping();
            if (serverError) throw new Error(serverError);
            var replyTs = new Date();
            var replyTime = replyTs.getHours() + ':' + String(replyTs.getMinutes()).padStart(2, '0');
            this.messages.push({ role: 'assistant', content: reply, ts: replyTime, tokens: tokens });
            if (tokens) {
                this._sessionTok.in += tokens.in || 0;
                this._sessionTok.out += tokens.out || 0;
                this._updateSessionTok();
            }
            this._saveHistory();
            this._renderMessages();
        } catch (e) {
            this._stopTimer();
            this._removeTyping();
            toast(e.message, 'error');
        } finally {
            this._setLoading(false);
        }
    }

    _renderMessages() {
        const cont = document.getElementById('ga-chat-msgs');
        if (!cont) return;
        const initials = this.agent.name?.charAt(0)?.toUpperCase() || '?';
        cont.innerHTML = this.messages.map(m => {
            const tokBadge = (m.role === 'assistant' && m.tokens)
                ? `<div class="msg-tok">↑ ${_fmtTok(m.tokens.in)} ↓ ${_fmtTok(m.tokens.out)} tok</div>`
                : '';
            const time = m.ts ? `<span class="msg-time">${esc(m.ts)}</span>` : '';
            return `
            <div class="msg-wrap ${m.role}">
                <div class="msg-avatar">${m.role === 'assistant' ? esc(initials) : '👤'}</div>
                <div class="msg-body">
                    <div class="msg-bubble">${esc(m.content)}</div>
                    <div class="msg-meta">${time}${tokBadge}</div>
                </div>
            </div>`;
        }).join('');
        cont.scrollTop = cont.scrollHeight;
        if (this._sessionTok.in || this._sessionTok.out) this._updateSessionTok();
    }

    _appendTyping() {
        const cont = document.getElementById('ga-chat-msgs');
        if (!cont) return;
        const el = document.createElement('div');
        el.id = 'ga-typing';
        el.className = 'msg-wrap assistant';
        el.innerHTML = `
            <div class="msg-avatar">${esc(this.agent.name?.charAt(0)?.toUpperCase() || '?')}</div>
            <div class="msg-bubble">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>`;
        cont.appendChild(el);
        cont.scrollTop = cont.scrollHeight;
    }

    _removeTyping() {
        document.getElementById('ga-typing')?.remove();
    }

    _setLoading(on) {
        const btn = document.getElementById('ga-chat-send');
        const input = document.getElementById('ga-chat-input');
        if (btn) btn.disabled = on;
        if (input) input.disabled = on;
    }

    _startTimer() {
        const secs = Number(this.agent.timeout) || 0;
        if (!secs) return;
        this._timerSecs = secs;
        this._timerRemaining = secs;
        const cdEl = document.getElementById('ga-chat-countdown');
        const ring = document.getElementById('ga-ccd-ring');
        const label = document.getElementById('ga-ccd-label');
        const circ = 69.115; // 2π×11

        if (!cdEl) return;
        cdEl.classList.add('active');

        const update = () => {
            if (!label || !ring) return;
            const frac = this._timerRemaining / this._timerSecs;
            const offset = circ * (1 - frac);
            ring.style.strokeDashoffset = offset;
            const m = Math.floor(this._timerRemaining / 60);
            const s = this._timerRemaining % 60;
            label.textContent = m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
            cdEl.classList.toggle('expiring', frac <= 0.2 && frac > 0);
            cdEl.classList.toggle('expired', frac <= 0);
        };

        update();
        this._timerInterval = setInterval(() => {
            this._timerRemaining = Math.max(0, this._timerRemaining - 1);
            update();
            if (this._timerRemaining === 0) this._stopTimer();
        }, 1000);
    }

    _stopTimer() {
        clearInterval(this._timerInterval);
        this._timerInterval = null;
        const cdEl = document.getElementById('ga-chat-countdown');
        cdEl?.classList.remove('active', 'expiring', 'expired');
    }

    close() {
        this._stopTimer();
        if (this._onKeydown) document.removeEventListener('keydown', this._onKeydown);
        this._el?.remove();
        this._el = null;
    }
}

if (!window._chatInstances) window._chatInstances = new Map();

window.openChat = function (agent) {
    let dlg = window._chatInstances.get(agent.id);
    if (!dlg) {
        dlg = new AgentChatDialog(agent);
        window._chatInstances.set(agent.id, dlg);
    }
    dlg.open();
};
