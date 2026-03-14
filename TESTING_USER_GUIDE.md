# Testing User Guide - Vault Church Lost & Found

## Test Accounts

### Admin Account
\`\`\`
Username: admin
Password: admin123
Role: Admin (Full system access)
\`\`\`

### Volunteer Account
\`\`\`
Username: volunteer
Password: volunteer123
Role: Volunteer (Claims processing, item release, service logging)
\`\`\`

### Regular User Accounts
\`\`\`
User 1:
Username: john
Password: user123
Role: User

User 2:
Username: sarah
Password: user123
Role: User

User 3:
Username: michael
Password: user123
Role: User
\`\`\`

---

## QUICK REFERENCE: FEATURES BY ROLE

### Regular User Can:
✓ Login/Logout
✓ Signup (create account)
✓ Upload items (with details and image)
✓ Browse all items
✓ Filter & search items
✓ View item details
✓ Submit claims for items
✓ View my claims & status
✓ Cancel pending claims
✓ Edit/delete own items
✓ Change password
✓ View/edit profile

### Volunteer Can:
✓ All user features, PLUS:
✓ Access volunteer dashboard
✓ View pending claims
✓ Approve/reject claims
✓ Release items to claimants
✓ Log service hours
✓ View service history
✓ View assigned missions
✓ View playbooks (procedures)

### Admin Can:
✓ All volunteer features, PLUS:
✓ Access admin dashboard
✓ Manage all users (create, edit, delete)
✓ View audit logs (all actions)
✓ Filter & search audit logs
✓ Manage locations
✓ Manage playbooks (create/edit)
✓ Configure system settings
✓ View system dashboard & stats

---

## STEP-BY-STEP TESTING SCENARIOS

### Scenario 1: Regular User Flow

#### Step 1: Signup & Create Account
1. Navigate to `/signup`
2. Enter email: `testuser@example.com`
3. Enter username: `testuser123`
4. Enter password: `TestPassword123!@#` (must be 12+ chars, uppercase, lowercase, number, symbol)
5. Click "Sign Up"
6. **Expected**: Auto-login, redirect to dashboard

#### Step 2: Upload an Item
1. Click "Upload Item" in navbar
2. Enter Title: `Lost Keys`
3. Enter Description: `Silver car keys with blue keychain, last seen at church parking lot`
4. Select Category: `Keys`
5. Enter Location Found: `Church Parking Lot`
6. Enter Date Found: Pick date
7. Select Condition: `Good`
8. Upload image (if available)
9. Click "Submit"
10. **Expected**: Toast success message, item appears in browse

#### Step 3: Browse Items
1. Click "Browse" in navbar
2. See all items listed with image, title, location
3. Try filtering by Category: `Keys`
4. Try filtering by Location
5. Try searching: `keys`
6. **Expected**: Items filtered correctly

#### Step 4: View Item Details
1. Click on any item card
2. See full details: image, title, description, category, location, date, condition
3. See "uploaded by" and claims count
4. **Expected**: Full item page loads

#### Step 5: Submit a Claim
1. On item detail page, click "Claim This Item"
2. Enter Reason: `These are my keys, I've been looking for them`
3. Upload proof image (receipt, photo, etc.)
4. Enter Contact: `555-1234`
5. Click "Submit Claim"
6. **Expected**: Modal closes, success message, claim recorded

#### Step 6: View My Claims
1. Click "My Claims" in navbar
2. See claim in list with status "Pending"
3. See item details in claim
4. See submitted date
5. **Expected**: Claim visible with correct status

#### Step 7: View & Edit Profile
1. Click profile icon → "Profile"
2. See personal details, stats (items, claims)
3. Click Edit
4. Change name/phone
5. Click Save
6. **Expected**: Changes saved, confirmation message

#### Step 8: Change Password
1. Click "Change Password"
2. Enter current password: `TestPassword123!@#`
3. Enter new password: `NewPassword123!@#`
4. Confirm new password
5. Click Save
6. **Expected**: Success message, can login with new password

#### Step 9: Logout
1. Click profile icon → "Logout"
2. **Expected**: Redirected to login page

---

### Scenario 2: Volunteer Flow

#### Step 1: Volunteer Login
1. Go to `/login`
2. Username: `volunteer`
3. Password: `volunteer123`
4. Click Login
5. **Expected**: Redirected to dashboard with volunteer options

#### Step 2: Access Volunteer Dashboard
1. Click "Volunteer Dashboard" or navigate to `/volunteer/dashboard`
2. See pending claims for items
3. **Expected**: List of unprocessed claims visible

#### Step 3: Process a Claim (Approve)
1. Click on a pending claim card
2. Review claim details: reason, proof image, contact info
3. Click "Approve"
4. **Expected**: Claim status changes to "approved", removed from pending list

#### Step 4: Process a Claim (Reject)
1. Click on another pending claim
2. Review details
3. Click "Reject"
4. Enter reason: `Unable to verify ownership`
5. Click "Confirm"
6. **Expected**: Claim marked as rejected with reason visible

#### Step 5: Release an Item
1. Click "Release Item" or navigate to `/volunteer/release/[item-id]`
2. See approved claims for this item
3. Select the claim to release to
4. Add optional notes: `Handed to user at pickup location`
5. Click "Release"
6. **Expected**: Item marked as released, release log created

#### Step 6: Log Service Hours
1. Click "Log Hours" or profile → service records
2. Enter hours: `3` (hours)
3. Enter minutes: `30` (optional)
4. Add description: `Processed claims and sorted donations`
5. Click "Submit"
6. **Expected**: Hours logged, total updated

#### Step 7: View Service History
1. Click profile → "Service History"
2. See all logged hours with date, duration, description
3. See total hours at top
4. **Expected**: Complete service record visible

#### Step 8: View Assigned Missions
1. Click "Missions" in navbar
2. See list of missions assigned by admin
3. Click on mission to see details
4. **Expected**: Mission details visible with description, deadline

#### Step 9: View Playbooks (Guides)
1. Click "Playbooks" in navbar
2. See list of admin-created procedures
3. Click to view playbook details
4. **Expected**: Step-by-step guide visible

#### Step 10: Logout
1. Click profile → "Logout"
2. **Expected**: Redirected to login

---

### Scenario 3: Admin Flow

#### Step 1: Admin Login
1. Go to `/login`
2. Username: `admin`
3. Password: `admin123`
4. Click Login
5. **Expected**: Dashboard with admin stats

#### Step 2: Access Admin Dashboard
1. Click "Admin Dashboard"
2. See key stats: total items, pending claims, released items, volunteers
3. See recent activity log
4. **Expected**: Dashboard loads with all stats

#### Step 3: Manage Users
1. Navigate to `/admin/users`
2. See paginated list of all users
3. Click filter by role: "Volunteer"
4. See only volunteers
5. Click on user to view details
6. Click "Edit User"
7. Change user details (name, email, role)
8. Click "Save"
9. **Expected**: User updated, confirmation message

#### Step 4: Create New User
1. On users page, click "Create User"
2. Fill in user details:
   - Name: `New Volunteer`
   - Email: `newvolunteer@vaultchurch.org`
   - Role: `Volunteer`
3. Enter temporary password: `TempPassword123!@#`
4. Click "Create"
5. **Expected**: User created, can login with provided credentials

#### Step 5: View Audit Logs
1. Navigate to `/admin/audit-logs`
2. See log entries with action, user, timestamp
3. Filter by action type: "login"
4. See only login records
5. Filter by user: select a user
6. See only that user's actions
7. Search by keyword: enter "claim"
8. See relevant records
9. **Expected**: All filters work, logs updated

#### Step 6: Manage Locations
1. Navigate to `/admin/locations`
2. See list of all locations
3. Click "Add Location"
4. Enter name: `South Campus`
5. Enter address: `123 Main St`
6. Enter hours: `9am-5pm`
7. Click "Create"
8. **Expected**: Location added, visible in list
9. Click to edit a location
10. Change details, click save
11. **Expected**: Location updated

#### Step 7: Manage Playbooks
1. Navigate to `/admin/playbooks`
2. See list of all playbooks
3. Click "Add Playbook"
4. Enter title: `Claim Processing Guide`
5. Enter content: `Step 1: Review claim...`
6. Click "Create"
7. **Expected**: Playbook added
8. Volunteers can now view this playbook

#### Step 8: Configure Settings
1. Navigate to `/admin/settings`
2. See current settings:
   - Item expiration days: 90
   - Session timeout: 30 (minutes)
3. Change item expiration: `120`
4. Click "Save"
5. **Expected**: Settings updated, confirmation message

#### Step 9: View Audit Log Entry Details
1. On audit logs page, click on a log entry
2. See detailed info: who, what, when, where, why
3. **Expected**: Full details visible

#### Step 10: Logout
1. Click profile → "Logout"
2. **Expected**: Redirected to login

---

## VALIDATION CHECKLIST

### Authentication & Security
- [ ] Users cannot access pages without login
- [ ] Wrong password rejected
- [ ] Session expires after 30 minutes
- [ ] Password strength enforced (12+ chars, mixed case, symbols)
- [ ] Passwords not visible in browser console or network tab
- [ ] Role-based redirects work (users to user pages, volunteers to volunteer pages, etc.)

### User Features
- [ ] Can upload item with all fields
- [ ] Items appear in browse immediately
- [ ] Filters work (category, location, condition)
- [ ] Search works
- [ ] Can submit claim
- [ ] Can view own claims
- [ ] Can view own items
- [ ] Can edit/delete own items
- [ ] Can view/edit profile
- [ ] Can change password

### Volunteer Features
- [ ] Can access volunteer dashboard
- [ ] Can view pending claims
- [ ] Can approve/reject claims
- [ ] Can release items
- [ ] Can log service hours
- [ ] Can view service history
- [ ] Can view assigned missions
- [ ] Can view playbooks
- [ ] Cannot access admin features

### Admin Features
- [ ] Can access admin dashboard
- [ ] Can view all users
- [ ] Can create user
- [ ] Can edit user
- [ ] Can view audit logs
- [ ] Can filter audit logs
- [ ] Can manage locations
- [ ] Can manage playbooks
- [ ] Can change settings
- [ ] Cannot access volunteer-only features (like claim processing from volunteer dash) when using their own dashboard only

### Data Isolation
- [ ] Users see only their own items & claims
- [ ] Users cannot edit other users' items
- [ ] Volunteers cannot access admin functions
- [ ] Admin can see all data

### Error Handling
- [ ] Invalid credentials show error message
- [ ] Duplicate email shows error
- [ ] Required fields validated
- [ ] Network errors handled gracefully
- [ ] Timeout shows session expired message

---

## REGRESSION TEST MATRIX

Run through ALL scenarios after any code changes:

| Scenario | Status | Notes |
|----------|--------|-------|
| User Signup | [ ] | Complete signup flow |
| User Login | [ ] | Valid + invalid credentials |
| User Upload Item | [ ] | Full form with all fields |
| User Browse Items | [ ] | All filters + search |
| User Submit Claim | [ ] | Create + verify in My Claims |
| User Change Password | [ ] | Test new password works |
| Volunteer Process Claims | [ ] | Approve + Reject both tested |
| Volunteer Release Item | [ ] | Item marked released |
| Volunteer Log Hours | [ ] | Hours logged + visible |
| Admin Create User | [ ] | User can login after |
| Admin Manage Settings | [ ] | Changes persist |
| RBAC Isolation | [ ] | Users cannot access volunteer pages |
| Audit Logging | [ ] | All actions logged |
| Session Timeout | [ ] | 30 min timeout works |
| Password Security | [ ] | Hashing verified, not plaintext |

---

## DEBUGGING TIPS

### Check User Role in Browser
1. Open browser DevTools (F12)
2. Go to Application → SessionStorage
3. Look for `sessionToken` or user data
4. Verify role is set correctly

### View API Responses
1. Open DevTools → Network tab
2. Perform an action (login, create item, etc.)
3. Check the API request/response
4. Look for errors in response

### Check Server Logs
1. Server logs show request details
2. Look for validation errors
3. Check for database errors
4. Verify role checks are executing

### Test Database
1. Seed data should create 4 test users
2. Check that passwords are hashed (not plaintext)
3. Verify audit logs are being created

---

## PERFORMANCE CHECKLIST

- [ ] Login completes in <2 seconds
- [ ] Browse/filter loads in <1 second
- [ ] Item upload confirms in <3 seconds
- [ ] Claim submission processes in <2 seconds
- [ ] Volunteer dashboard loads in <2 seconds
- [ ] Admin dashboard loads in <2 seconds
- [ ] No network waterfall delays
- [ ] Pagination works smoothly

---

## Browser Compatibility

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome (iOS/Android)
- [ ] Mobile Safari (iOS)

---

**Ready for UAT (User Acceptance Testing)**

Print this guide or share with test team. Each scenario should take 5-10 minutes to complete.
