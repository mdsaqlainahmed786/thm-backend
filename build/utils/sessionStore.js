"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStore = void 0;
class SessionStore {
    findSession(id) { }
    saveSession(id, session) { }
    findAllSessions() { }
}
exports.SessionStore = SessionStore;
class InMemorySessionStore extends SessionStore {
    constructor() {
        super();
        this.sessions = new Map();
    }
    findSession(id) {
        return this.sessions.get(id);
    }
    saveSession(id, session) {
        this.sessions.set(id, session);
    }
    findAllSessions() {
        return [...this.sessions.values()];
    }
    destroySession(username) {
        for (let [key, value] of this.sessions) {
            if (value.username === username) {
                this.sessions.delete(key);
                break; // Exit loop after the first match (assuming usernames are unique)
            }
        }
    }
}
exports.default = InMemorySessionStore;
