# 🔍 API DEBUG GUIDE

## Problem Identified
The frontend can login successfully, but subsequent API calls are failing with 404 errors. The backend endpoints exist and require authentication.

## 🔧 Debug Steps

### **1. Check Browser Dev Tools**

1. **Open your Vercel app** in the browser
2. **Open Dev Tools** (F12)
3. **Go to Application tab → Local Storage**
4. **Check if `auth_token` exists** after login

### **2. Check Network Tab**

1. **Go to Network tab** in Dev Tools
2. **Try to access a page** (like /dashboard or /employees)
3. **Look for API requests** to `/api/employees/stats/dashboard`
4. **Check Request Headers** - should have `Authorization: Bearer <token>`

### **3. Manual Token Test**

If you have a token, test it manually:

```bash
# Replace YOUR_TOKEN_HERE with the actual token from localStorage
Invoke-RestMethod -Uri "https://epiuse-employee-hierarchy-production.up.railway.app/api/employees/stats/dashboard" -Method GET -Headers @{"Authorization"="Bearer YOUR_TOKEN_HERE"}
```

## 🎯 Possible Issues & Solutions

### **Issue 1: Token Not Stored**
- **Symptom**: No `auth_token` in localStorage
- **Solution**: Login flow issue - check login success

### **Issue 2: Token Not Sent**
- **Symptom**: API requests missing Authorization header
- **Solution**: API interceptor issue

### **Issue 3: Token Expired**
- **Symptom**: 401 errors
- **Solution**: Token refresh or re-login

### **Issue 4: CORS Preflight**
- **Symptom**: 404 on OPTIONS requests
- **Solution**: Backend CORS configuration

## 🔧 Quick Fixes to Try

### **Fix 1: Clear Browser Data**
1. Clear localStorage
2. Clear cookies
3. Refresh page
4. Login again

### **Fix 2: Check Environment Variables**
Make sure Vercel has:
```
NEXT_PUBLIC_API_URL = https://epiuse-employee-hierarchy-production.up.railway.app
```

### **Fix 3: Force Token Refresh**
Add this to browser console after login:
```javascript
// Check current token
console.log('Token:', localStorage.getItem('auth_token'));

// Force API test
fetch('https://epiuse-employee-hierarchy-production.up.railway.app/api/employees/stats/dashboard', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
}).then(r => r.json()).then(console.log);
```

## 🚀 Expected Result

After debugging, you should see:
- ✅ Token stored in localStorage
- ✅ Authorization header in API requests
- ✅ Successful API responses
- ✅ All pages loading with data

**Let me know what you find in the Dev Tools!** 🔍
