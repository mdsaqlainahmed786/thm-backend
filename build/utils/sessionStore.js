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
    destroySession(userID) {
        // Use userID instead of username for more reliable session management
        this.sessions.delete(userID);
    }
    // Helper method to find session by username (for backward compatibility)
    findSessionByUsername(username) {
        for (let [key, value] of this.sessions) {
            if (value.username === username) {
                return value;
            }
        }
        return undefined;
    }
}
exports.default = InMemorySessionStore;
