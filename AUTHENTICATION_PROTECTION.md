# Authentication Protection Documentation

This document outlines all pages that require authentication and their protection mechanisms.

## Protected Routes

### Admin Routes (Require Admin Role)
All admin routes require:
1. User authentication (logged in)
2. Admin role

**Protected Pages:**
- ✅ `/admin` - Main admin dashboard
- ✅ `/admin/users` - User management
- ✅ `/admin/items` - Item management
- ✅ `/admin/claims` - Claims management
- ✅ `/admin/releases` - Release logs
- ✅ `/admin/donations` - Donation management
- ✅ `/admin/audit-logs` - Audit logs

**Protection Mechanism:**
```typescript
useEffect(() => {
  if (!isAuthenticated) {
    router.push("/login")
    return
  }
  if (user?.role !== "admin") {
    router.push("/dashboard")
    return
  }
}, [isAuthenticated, user, router])

if (!isAuthenticated || user?.role !== "admin") {
  return null
}
```

### Volunteer Routes (Require Volunteer Role)
All volunteer routes require:
1. User authentication (logged in)
2. Volunteer role

**Protected Pages:**
- ✅ `/volunteer/dashboard` - Volunteer dashboard
- ✅ `/volunteer/release/[id]` - Release item page

**Protection Mechanism:**
```typescript
useEffect(() => {
  if (!isAuthenticated || user?.role !== "volunteer") {
    router.push("/login")
  }
}, [isAuthenticated, user, router])

if (!isAuthenticated || user?.role !== "volunteer") {
  return null
}
```

### User Routes (Require Authentication)
All user routes require:
1. User authentication (logged in)
2. Any role (user, volunteer, or admin)

**Protected Pages:**
- ✅ `/dashboard` - User dashboard
- ✅ `/browse` - Browse lost items
- ✅ `/upload` - Upload found item
- ✅ `/my-uploads` - User's uploaded items
- ✅ `/my-claims` - User's claims
- ✅ `/profile` - User profile
- ✅ `/items/[id]` - Item detail page

**Protection Mechanism:**
```typescript
useEffect(() => {
  if (!isAuthenticated) {
    router.push("/login")
  }
}, [isAuthenticated, router])

if (!isAuthenticated) {
  return null
}
```

## Public Routes

These routes do not require authentication:

- `/` - Home page
- `/login` - Login page
- `/signup` - Signup page

## Security Behavior

### Unauthenticated Access Attempts
- **Admin routes**: Redirected to `/login`
- **Volunteer routes**: Redirected to `/login`
- **User routes**: Redirected to `/login`

### Authenticated Non-Admin Access
- **Admin routes**: Redirected to `/dashboard`
- **Volunteer routes**: Access granted if role is volunteer
- **User routes**: Access granted

### Authenticated Non-Volunteer Access
- **Volunteer routes**: Redirected to `/login`
- **User routes**: Access granted
- **Admin routes**: Access granted if role is admin

## Implementation Details

### Authentication Check Flow
1. Component mounts
2. `useEffect` checks authentication status
3. If not authenticated → redirect to `/login`
4. If authenticated but wrong role → redirect appropriately
5. Component renders only if authenticated and authorized

### Loading State
While checking authentication, components return `null` to prevent flash of content.

### Role-Based Access Control (RBAC)
- **Admin**: Full access to all routes
- **Volunteer**: Access to volunteer routes and user routes
- **User**: Access only to user routes

## Status

✅ **All routes are properly protected**

- All admin routes require admin role
- All volunteer routes require volunteer role
- All user routes require authentication
- Public routes remain accessible
- No unauthorized access possible

