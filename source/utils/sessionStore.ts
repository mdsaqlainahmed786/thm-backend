import { SocketUser } from "../common";
export class SessionStore {
    findSession(id: string) { }
    saveSession(id: string, session: SocketUser) { }
    findAllSessions() { }
}

export default class InMemorySessionStore extends SessionStore {
    private sessions: Map<string, SocketUser>;
    constructor() {
        super();
        this.sessions = new Map();
    }
    findSession(id: string) {
        return this.sessions.get(id);
    }
    saveSession(id: string, session: SocketUser) {
        this.sessions.set(id, session);
    }
    findAllSessions() {
        return [...this.sessions.values()];
    }
    destroySession(userID: string) {
        // Use userID instead of username for more reliable session management
        this.sessions.delete(userID);
    }
    // Helper method to find session by username (for backward compatibility)
    findSessionByUsername(username: string): SocketUser | undefined {
        for (let [key, value] of this.sessions) {
            if (value.username === username) {
                return value;
            }
        }
        return undefined;
    }
}