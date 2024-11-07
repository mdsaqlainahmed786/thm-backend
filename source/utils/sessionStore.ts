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
    destroySession(username: string) {
        for (let [key, value] of this.sessions) {
            if (value.username === username) {
                this.sessions.delete(key);
                break; // Exit loop after the first match (assuming usernames are unique)
            }
        }
    }
}