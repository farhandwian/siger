# SIGER Mobile Authentication Guide (React Native)

Simple integration guide for React Native developers to connect with SIGER authentication system.

## Quick Setup

### 1. Install Dependencies
```bash
npm install @react-native-async-storage/async-storage
```

### 2. API Configuration
```typescript
const API_BASE_URL = 'http://localhost:3000'; // Change for production
```

### 3. Basic Setup Files

Copy these 3 files to your React Native project:

---

## File 1: AuthService.ts

```typescript
// services/AuthService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'MANAGER' | 'VIEWER';
}

class AuthService {
  private baseURL = 'http://localhost:3000'; // Change this to your API URL
  private tokenKey = 'auth_token';

  // Login user
  async login(email: string, password: string) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/mobile/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem(this.tokenKey, data.data.token);
        return { success: true, user: data.data.user };
      }

      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Logout user
  async logout() {
    await AsyncStorage.removeItem(this.tokenKey);
  }

  // Get stored token
  async getToken() {
    return AsyncStorage.getItem(this.tokenKey);
  }

  // Check if user is logged in
  async isLoggedIn() {
    const token = await this.getToken();
    return !!token;
  }

  // Make authenticated API call
  async apiCall(endpoint: string, method = 'GET', body?: any) {
    const token = await this.getToken();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      // Token expired, logout user
      await this.logout();
      throw new Error('Session expired');
    }

    return response.json();
  }
}

export default new AuthService();
```

---

## File 2: AuthContext.tsx

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService from '../services/AuthService';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const isLoggedIn = await AuthService.isLoggedIn();
      if (isLoggedIn) {
        // Verify token with server
        const response = await AuthService.apiCall('/api/auth/mobile/verify');
        if (response.success) {
          setUser(response.data.user);
        }
      }
    } catch (error) {
      console.log('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await AuthService.login(email, password);
    if (result.success) {
      setUser(result.user);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## File 3: LoginScreen.tsx

```typescript
// screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (!success) {
      Alert.alert('Error', 'Invalid email or password');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login to SIGER</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
```

---

## Usage Examples

### App.tsx Setup
```typescript
import { AuthProvider } from './contexts/AuthContext';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
```

### Navigation Setup
```typescript
// navigation/AppNavigator.tsx
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? <HomeScreen /> : <LoginScreen />;
};
```

### Making API Calls
```typescript
// In any component
import AuthService from '../services/AuthService';

const MyComponent = () => {
  const fetchData = async () => {
    try {
      const data = await AuthService.apiCall('/api/projects');
      console.log(data);
    } catch (error) {
      console.error('API call failed:', error);
    }
  };

  return (
    // Your component JSX
  );
};
```

### Check User Role
```typescript
const { user } = useAuth();

// Show admin features only for admin users
{user?.role === 'ADMIN' && (
  <AdminButton />
)}
```

---

## API Endpoints Available

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/mobile/login` | POST | Login user |
| `/api/auth/mobile/verify` | GET | Verify token |
| `/api/auth/mobile/logout` | POST | Logout user |
| `/api/projects` | GET | Get projects list |
| `/api/mobile/daily-activities` | GET | Get daily activities |
| `/api/mobile/daily-updates` | POST | Submit daily update |

---

## Test Accounts

```json
{
  "admin": { "email": "admin@siger.com", "password": "password123" },
  "manager": { "email": "manager@siger.com", "password": "password123" },
  "user": { "email": "user@siger.com", "password": "password123" },
  "viewer": { "email": "viewer@siger.com", "password": "password123" }
}
```

---

## Common Issues

**1. Network Error**
- Check if API server is running on the correct URL
- Make sure `baseURL` in AuthService matches your server

**2. Token Storage**
- Ensure AsyncStorage is properly installed
- Check device storage permissions

**3. CORS Issues**
- Only affects development
- Server should allow mobile app origins

---

## Production Setup

1. Change `baseURL` in AuthService to production URL
2. Use secure storage library like `react-native-keychain`
3. Add proper error handling and loading states
4. Implement token refresh logic

---

*Need help? Check the main authentication documentation or contact the backend team.*
