(function() {
    'use strict';
    
    console.clear();
    
    const BANNER = "REVIN'S LOGGER v7.0";
    const realLog = console.log;
    const realWarn = console.warn;
    const realError = console.error;
    
    const eventLog = [];
    const maxLogSize = 500;
    
    const EventTypes = {
        COINS: ['coins', 'currency', 'reward'],
        QUIZ: ['quiz', 'question', 'answer', 'correct', 'wrong'],
        PROGRESS: ['finish', 'complete', 'progress', 'star', 'trophy'],
        AUTH: ['login', 'logout', 'session', 'token'],
        GAME: ['game', 'play', 'score'],
        ERROR: ['error', 'fail', 'debug'],
        LESSON: ['lesson', 'module', 'chapter']
    };
    
    function categorizeEvent(eventName) {
        const lower = eventName.toLowerCase();
        for (const [category, keywords] of Object.entries(EventTypes)) {
            if (keywords.some(kw => lower.includes(kw))) return category;
        }
        return 'OTHER';
    }
    
    function getColorForCategory(category) {
        const colors = {
            COINS: '#00ff00',
            QUIZ: '#00ff88',
            PROGRESS: '#00ffcc',
            AUTH: '#00ffff',
            GAME: '#00dd00',
            ERROR: '#ff0000',
            LESSON: '#00aa00',
            OTHER: '#008800'
        };
        return colors[category] || '#00ff00';
    }
    
    function formatTimestamp() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    }
    
    function logEvent(direction, eventName, data) {
        const timestamp = formatTimestamp();
        const category = categorizeEvent(eventName);
        const color = getColorForCategory(category);
        const arrow = direction === 'OUT' ? '→' : '←';
        
        eventLog.push({
            timestamp,
            direction,
            event: eventName,
            category,
            data: JSON.parse(JSON.stringify(data))
        });
        
        if (eventLog.length > maxLogSize) eventLog.shift();
        
        realLog(
            `%c[${timestamp}] %c[${direction}] ${arrow} %c[${category}] %c${eventName}`,
            'color: #004d00; font-weight: bold;',
            direction === 'OUT' ? 'color: #00ff00; font-weight: bold;' : 'color: #00ffaa; font-weight: bold;',
            `color: ${color}; font-weight: bold; background: #001a00; padding: 2px 4px; border-radius: 3px;`,
            'color: #00ff00;',
            data
        );
    }
    
    if (window.log && log.log) {
        const originalLog = log.log;
        log.log = function(data) {
            if (data && data.event) {
                logEvent('OUT', data.event, data);
            }
            return originalLog.apply(this, arguments);
        };
    }
    
    if (window.log && log.onEvent) {
        const originalOnEvent = log.onEvent;
        log.onEvent = function(data) {
            if (data && data.event) {
                logEvent('IN', data.event, data);
            } else {
                logEvent('IN', 'UNKNOWN', data);
            }
            return originalOnEvent.apply(this, arguments);
        };
    }
    
    if (window.XMLHttpRequest) {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url) {
            this._method = method;
            this._url = url;
            return originalOpen.apply(this, arguments);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            const xhr = this;
            
            if (this._url && this._url.includes('anton')) {
                realLog(`%c[XHR] → ${this._method} ${this._url}`, 'color: #00ff00; font-style: italic;', data);
            }
            
            const originalOnLoad = this.onload;
            this.onload = function() {
                if (xhr._url && xhr._url.includes('anton') && xhr.responseText) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        realLog(`%c[XHR] ← Response from ${xhr._url}`, 'color: #00ffaa; font-style: italic;', response);
                    } catch(e) {
                        realLog(`%c[XHR] ← Response from ${xhr._url}`, 'color: #00ffaa; font-style: italic;', xhr.responseText);
                    }
                }
                if (originalOnLoad) return originalOnLoad.apply(this, arguments);
            };
            
            return originalSend.apply(this, arguments);
        };
    }
    
    if (window.fetch) {
        const originalFetch = window.fetch;
        window.fetch = function() {
            const url = arguments[0];
            const options = arguments[1] || {};
            
            if (typeof url === 'string' && url.includes('anton')) {
                realLog(`%c[FETCH] → ${options.method || 'GET'} ${url}`, 'color: #00ff00; font-style: italic;', options.body);
            }
            
            return originalFetch.apply(this, arguments).then(response => {
                if (typeof url === 'string' && url.includes('anton')) {
                    response.clone().text().then(text => {
                        try {
                            const json = JSON.parse(text);
                            realLog(`%c[FETCH] ← Response from ${url}`, 'color: #00ffaa; font-style: italic;', json);
                        } catch(e) {
                            realLog(`%c[FETCH] ← Response from ${url}`, 'color: #00ffaa; font-style: italic;', text);
                        }
                    });
                }
                return response;
            });
        };
    }
    
    console.log = function() {
        const msg = Array.from(arguments).join(" ");
        if (msg.includes("Quirks") || msg.includes("DOCTYPE") || msg.includes("Socket") || 
            msg.includes("%c") || msg.includes("Download") || msg.includes("DevTools")) return;
        realLog.apply(console, arguments);
    };
    
    console.warn = function() {
        const msg = Array.from(arguments).join(" ");
        if (msg.includes("deprecated") || msg.includes("violation")) return;
        realWarn.apply(console, arguments);
    };
    
    window.RevinLogger = {
        getEvents: () => eventLog,
        filterByCategory: (category) => eventLog.filter(e => e.category === category),
        filterByEvent: (eventName) => eventLog.filter(e => e.event.includes(eventName)),
        clearLog: () => eventLog.length = 0,
        exportLog: () => JSON.stringify(eventLog, null, 2),
        searchData: (key) => eventLog.filter(e => JSON.stringify(e.data).includes(key)),
        getStats: () => {
            const stats = {};
            eventLog.forEach(e => {
                stats[e.category] = (stats[e.category] || 0) + 1;
            });
            return stats;
        }
    };
    
    
})();
