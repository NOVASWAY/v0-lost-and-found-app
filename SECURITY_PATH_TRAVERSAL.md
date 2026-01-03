# Path Traversal Vulnerability Protection

This document outlines all path traversal protections implemented in the application.

## Security Utilities (`lib/security.ts`)

### Core Functions

1. **`isPathTraversalSafe(input: string)`**
   - Detects path traversal patterns: `../`, `..\\`, URL-encoded variants
   - Blocks absolute paths (Unix and Windows)
   - Blocks `file://` protocol
   - Returns boolean indicating safety

2. **`isValidCUID(id: string)`**
   - Validates CUID format (25 chars, starts with 'c')
   - Also accepts UUID format
   - Prevents invalid ID injection

3. **`sanitizePath(input: string)`**
   - Removes path traversal patterns from strings
   - Removes absolute path indicators
   - Removes `file://` protocol

4. **`validateUrl(url: string)`**
   - Validates URLs for path traversal
   - Validates data URL format (base64 images)
   - Only allows HTTP/HTTPS protocols
   - Blocks private IPs in production
   - Returns validation result with sanitized URL

5. **`sanitizeSearchQuery(query: string)`**
   - Removes HTML/script injection characters
   - Removes SQL/NoSQL injection characters
   - Limits length to 200 characters
   - Returns sanitized query

6. **`validateRouteId(id: string)`**
   - Validates route parameters for path traversal
   - Validates CUID/UUID format
   - Returns validation result

## Protected API Routes

### Dynamic Route Parameters

All routes with `[id]` parameters validate IDs:

- ✅ `/api/items/[id]` - GET, PATCH, DELETE
- ✅ `/api/users/[id]` - GET, PATCH, DELETE
- ✅ `/api/claims/[id]` - GET, PATCH
- ✅ `/api/locations/[id]` - PATCH, DELETE
- ✅ `/api/playbooks/[id]` - PATCH, DELETE

### Query Parameters

All search and filter parameters are sanitized:

- ✅ `/api/items` - `search`, `category`, `location` sanitized
- ✅ `/api/users` - `search` sanitized
- ✅ `/api/claims` - `claimantId` validated, `status` enum validated
- ✅ `/api/audit-logs` - `search` sanitized, `type` and `severity` validated
- ✅ `/api/release-logs` - `search` sanitized

### URL Validation

All image URLs are validated:

- ✅ `/api/items` (POST) - `imageUrl` validated
- ✅ `/api/claims` (POST) - `proofImage` validated

### Request Body Validation

All request bodies use Zod schemas with path traversal protection:

- ✅ Item creation - `imageUrl`, `category`, `location`, `description` validated
- ✅ Claim creation - `itemId`, `proofImage`, `claimantId` validated
- ✅ Service records - `userId` validated in both GET and POST

## Validation Schema Enhancements (`lib/validation.ts`)

### Enhanced Schemas

1. **`createItemSchema`**
   - `imageUrl`: Blocks `../`, `file://`, absolute paths
   - `category`, `location`, `description`: Blocks path traversal patterns
   - `uploadedById`: Validates CUID/UUID format

2. **`createClaimSchema`**
   - `proofImage`: Blocks path traversal in URLs
   - `itemId`, `claimantId`: Validates CUID/UUID format
   - `notes`: Blocks path traversal patterns

## Protection Patterns

### Pattern Detection

The system detects and blocks:
- `../` (parent directory)
- `..\\` (Windows parent directory)
- `%2E%2E%2F` (URL encoded)
- `%2E%2E%5C` (URL encoded backslash)
- `%252E%252E%252F` (Double URL encoded)
- Absolute paths (`/path`, `C:\path`)
- `file://` protocol

### Validation Layers

1. **Schema Level**: Zod schemas validate input format
2. **Security Level**: Security utilities validate path safety
3. **Route Level**: Route handlers validate IDs and parameters
4. **Database Level**: Prisma uses parameterized queries (prevents SQL injection)

## Testing Recommendations

Test the following attack vectors:

1. **Path Traversal in IDs**
   ```
   GET /api/items/../../../etc/passwd
   GET /api/users/%2E%2E%2Fetc%2Fpasswd
   ```

2. **Path Traversal in URLs**
   ```
   POST /api/items
   { "imageUrl": "file:///etc/passwd" }
   { "imageUrl": "../../../etc/passwd" }
   ```

3. **Path Traversal in Search**
   ```
   GET /api/items?search=../../../etc/passwd
   GET /api/users?search=%2E%2E%2Fetc%2Fpasswd
   ```

4. **Invalid ID Formats**
   ```
   GET /api/items/../../admin
   GET /api/users/../../../etc/passwd
   ```

All of these should be blocked and return 400 Bad Request errors.

## Status

✅ **All path traversal vulnerabilities have been resolved**

- All dynamic route parameters validated
- All query parameters sanitized
- All URL inputs validated
- All string fields checked for path traversal patterns
- All ID fields validated for proper format

