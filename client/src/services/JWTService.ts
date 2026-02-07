// services/JWTService.ts
class JWTService {
    private tokenKey = "jwt_token";
    private userKey = "jwt_user";

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    setToken(token: string) {
        localStorage.setItem(this.tokenKey, token);
    }

    clearToken() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    setUser(username: string) {
        localStorage.setItem(this.userKey, username);
    }

    getUser() {
        return localStorage.getItem(this.userKey);
    }
}

export const jwtService = new JWTService();
