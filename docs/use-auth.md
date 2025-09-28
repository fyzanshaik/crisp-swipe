

## **How to Use Auth Context for Authenticated Work:**

### **1. Basic Usage in Any Component:**
```typescript
import { useAuth } from "@/lib/use-auth";

function MyComponent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Your role: {user.role}</p>
      <p>Your email: {user.email}</p>
    </div>
  );
}
```

### **2. Making Authenticated API Calls:**
```typescript
function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  
  const fetchUserData = async () => {
    if (!isAuthenticated) return;
    
    // The API client automatically sends cookies
    const res = await api.someEndpoint.$get();
    // Your authenticated API call
  };
}
```

### **3. Role-Based Rendering:**
```typescript
function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return null;
  
  return (
    <div>
      {user.role === 'candidate' && (
        <div>Candidate-specific content</div>
      )}
      {user.role === 'recruiter' && (
        <div>Recruiter-specific content</div>
      )}
    </div>
  );
}
```

### **4. Protected Actions:**
```typescript
function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  const handleSensitiveAction = async () => {
    if (!isAuthenticated) {
      alert('Please log in first');
      return;
    }
    
    // Perform authenticated action
    const res = await api.sensitiveAction.$post({ 
      json: { userId: user.id } 
    });
  };
}
```

### **5. Available Auth State:**
```typescript
const {
  user,           // { id, email, name, role } | null
  isAuthenticated, // boolean
  isLoading,      // boolean
  login,          // (email, password) => Promise<void>
  register,       // (data) => Promise<void>
  logout,         // () => Promise<void>
} = useAuth();
```

The auth context is now ready for all your authenticated features! 🎉