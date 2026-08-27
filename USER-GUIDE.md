# Vault Church Security System — User Guide

> **Shielded in Silence. Fortified for Eternity.**

This guide explains how to use every feature of the Vault Lost & Found and Church Security Operations app.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Understanding Your Role](#2-understanding-your-role)
3. [Browsing Items](#3-browsing-items)
4. [Uploading Found Items](#4-uploading-found-items)
5. [Claiming an Item](#5-claiming-an-item)
6. [Managing Your Claims](#6-managing-your-claims)
7. [Managing Your Uploads](#7-managing-your-uploads)
8. [Missions](#8-missions)
9. [Security Orders](#9-security-orders)
10. [Volunteer — Reviewing & Releasing Items](#10-volunteer--reviewing--releasing-items)
11. [Playbooks (Staff Only)](#11-playbooks-staff-only)
12. [Your Profile](#12-your-profile)
13. [Admin Panel](#13-admin-panel)
14. [System Security](#14-system-security)
15. [FAQ](#15-faq)

---

## 1. Getting Started

### Accessing the System

Open the app in your browser. You will see the **Vault** landing page.

- Click **Access System** to go to the login page.
- Click **Browse Assets** to view found items (requires login).

### Logging In

1. Enter your **username** and **password**.
2. The key-strength indicator shows how secure your password is (WEAK → STABLE → SECURE).
3. Click **Login** (or press Enter).

On success, you are taken to your **Dashboard** based on your role:

| Role | Home Page |
|------|-----------|
| User | `/dashboard` |
| Volunteer | `/volunteer/dashboard` |
| Admin | `/admin` |

> **Note:** Accounts are created by administrators only. There is no self-registration. Contact your admin to get an account.

### Session Timeout

After **30 minutes** of inactivity, your session expires and you are returned to the landing page. Simply log in again.

### Theme Toggle

Click the sun/moon icon in the header to switch between **Light**, **Dark**, or **System** mode.

---

## 2. Understanding Your Role

The system has three roles with different permissions:

### User
- Browse and search found items
- Upload items you have found
- Submit claims on items you believe are yours
- View your own uploads and claims
- Complete assigned missions
- Read security orders directed to you
- Manage your profile

### Volunteer
All user permissions, plus:
- Review pending claims from other users
- Approve or reject claims
- Release approved items to their owners
- Read security playbooks

### Admin
All user and volunteer permissions, plus:
- Full user management (create, deactivate, assign roles)
- Manage all items, claims, and locations
- Create and assign missions
- Send security orders to any user
- Manage playbooks (security protocols)
- Record meeting minutes with action item tracking
- Manage the donation queue
- Record attendance and service for users
- View complete audit logs and system health

---

## 3. Browsing Items

**Page:** Browse Items (`/browse`)

All found items are displayed in a grid with images, categories, and status badges.

### Searching

Type in the search bar to filter by **category** or **description**.

### Filtering

Use the filter dropdowns to narrow results:
- **Category:** Wallet, Keys, Phone, Clothing, Jewelry, Bag/Backpack, Water Bottle, Umbrella, Eyeglasses, Watch, Electronics, Book, Other
- **Color:** Black, Blue, Red, Silver, Green
- **Location:** Dynamically loaded from the database

### Viewing an Item

Click any item card to see its full details:
- Photo
- Category, color, location, date found
- Description and unique markings
- Status badge (Available, Claimed, Released, Donated)
- **Donation countdown** — time remaining before the item is marked for donation (30 days from upload)

---

## 4. Uploading Found Items

**Page:** Upload Item (`/upload`) — requires login

If you have found a lost item, upload it so the owner can reclaim it.

### Steps

1. **Photo** — Click the upload area or drag an image onto it.
   - Must be an image (JPEG, PNG, WebP, GIF)
   - Maximum size: 5 MB
   - The system verifies the file is genuinely an image (not a renamed file)

2. **Category** — Select from the dropdown (Wallet, Keys, Phone, Clothing, etc.)

3. **Color** *(optional)* — Enter the primary color (e.g., "Red", "Silver")

4. **Location** — Select where you found the item (locations are set by admins)

5. **Date Found** — Defaults to today; adjust if needed

6. **Description** *(optional)* — Add details like brand, unique markings, or distinguishing features (max 1,000 characters)

7. Click **Submit**

### What Happens Next

- The item appears in the Browse grid as **Available**
- A **30-day donation countdown** starts
- The system logs the upload in the audit trail
- You earn **Vault Points** for contributing

---

## 5. Claiming an Item

If you have lost something and see it in the Browse page, you can claim it.

### Steps

1. Find the item in **Browse Items** and click on it
2. Click **"Claim This Item"**
3. Upload a **proof photo** — this could be:
   - A purchase receipt
   - A photo showing the item in your possession before you lost it
   - Any evidence proving ownership
4. Add optional **notes** describing why this item is yours
5. Click **Submit**

### After Submitting

- Your claim status is **Pending**
- The item status changes to **Claimed** (locked — no one else can claim it)
- A volunteer or admin will review your proof photo
- You will see the claim in **My Claims** with its current status

### Claim Statuses

| Status | Meaning |
|--------|---------|
| **Pending** | Waiting for volunteer review |
| **Approved** | Your proof was accepted; waiting for item release |
| **Released** | Item has been handed over to you |
| **Rejected** | Your claim was denied; the item is available again |

> **Tip:** If your claim is rejected, you can re-claim the same item with different proof. Each item allows one active claim per person at a time.

---

## 6. Managing Your Claims

**Page:** My Claims (`/my-claims`)

View all claims you have submitted across the system.

Each claim shows:
- Item photo and name
- Status badge (Pending / Approved / Released / Rejected)
- Date you submitted the claim
- Release date and notes (if released)

Click **"View Item"** to see the full item details.

---

## 7. Managing Your Uploads

**Page:** My Uploads (`/my-uploads`)

View all items you have uploaded to the system.

Each upload shows:
- Item photo, category, and location
- Status badge
- Days since upload
- **Donation countdown** (for available items approaching the 30-day deadline)

Click **"View Item"** to see the full item details.

---

## 8. Missions

**Page:** Missions (`/missions`)

Missions are tasks assigned to you by an administrator (e.g., patrol routes, check specific areas, report incidents).

### Your Missions

- **Pending** — Not yet started. Click **"Start Mission"** to begin.
- **In Progress** — You have started. Click **"Mark Complete"** when finished.
- **Completed** — Finished missions.
- **Cancelled** — Missions that were cancelled.

Each mission displays:
- Priority badge (Low / Medium / High / Critical)
- Title and description
- Detailed instructions (in a monospace block for clarity)
- Assigned location
- Due date

Use the **search bar** and **status filter** to find specific missions.

---

## 9. Security Orders

**Page:** Orders (`/orders`)

Security orders are directives sent to you by an administrator.

- **Unread orders** are highlighted with a colored border
- Click **"Mark as Read"** to acknowledge you have seen the order
- Each order shows: title, message, priority (High / Medium / Low), and date
- Use **search**, **status filter** (Unread / Read), and **priority filter** to find orders

> **Tip:** Your dashboard shows an unread orders badge so you know when new directives arrive.

---

## 10. Volunteer — Reviewing & Releasing Items

### Release Dashboard

**Page:** Volunteer Dashboard (`/volunteer/dashboard`)

This is your command center for processing claims.

**Stats at the top:**
- Pending Claims
- Approved (awaiting release)
- Released Today
- Released This Week

**Two tabs:**
- **Pending** — Claims waiting for your review
- **Approved** — Claims you have approved, ready for item release

Each row shows: item photo, item name, proof photo thumbnail, claimant name/email, and claim date.

### Reviewing a Claim

Click **"Review & Release"** to open the full review page.

**Photo Comparison:**
- Side-by-side view of the **found item photo** and the **claimant's proof photo**
- Compare details carefully — does the proof convincingly match the item?

**Item Details:**
- Category, color, location found, date found

**Claimant Information:**
- Name, email, claim date

### Actions

**If status is Pending:**
- **Approve Claim** — The claimant's proof looks legitimate. The item stays locked.
- **Reject Claim** — The proof is insufficient. The item returns to Available status.

**If status is Approved:**
- **Release Item** — Hand the item over to the claimant. A release log is created.
- **Reject Claim** — Override the previous approval. The item returns to Available.

You can add optional **review notes** or **release notes** to document your decision.

### What Happens on Release

1. Claim status → **Released**
2. Item status → **Released**
3. A **ReleaseLog** record is created (immutable audit trail)
4. The claimant can see the release in their My Claims page

---

## 11. Playbooks (Staff Only)

**Page:** Playbooks (`/playbooks`) — Volunteer and Admin only

Playbooks are security protocols and situational guides for staff reference.

Each playbook shows:
- **Priority** — Critical / High / Medium / Low
- **Title** — Name of the protocol
- **Scenario** — The situation that triggers this playbook
- **Protocol** — Step-by-step instructions (displayed in monospace for clarity)
- **Last Updated** — When the playbook was last edited

Use the **search bar** to find playbooks by title, scenario, or protocol content.

> **Note:** Only volunteers and admins can access playbooks. Regular users are redirected to their dashboard.

---

## 12. Your Profile

**Page:** Profile (`/profile`)

### Edit Your Name

1. Click **"Edit Profile"**
2. Update your full name
3. Click **"Save Changes"**

Your username and role are read-only (managed by admins).

### Change Your Password

1. Enter your **current password**
2. Enter a **new password** (minimum 12 characters, must include uppercase, lowercase, number, and special character)
3. **Confirm** the new password
4. Click **"Change Password"**

> **Important:** Changing your password logs out all other devices/sessions immediately for security.

### Your Statistics

View your activity summary:
- Items Uploaded
- Claims Submitted
- Items Received (successfully released claims)

### Preferences

- **Theme:** Light / Dark / System
- **Notifications:** Toggle options for push notifications, mission updates, and claim updates (stored locally in your browser)

---

## 13. Admin Panel

### Admin Dashboard (`/admin`)

The Security Command Center showing:
- **Active Nodes** — Total users in the system
- **Secure Vaults** — Total uploaded items
- **Verified Claims** — Total claims submitted
- **Audit Logs** — Total logged events

Quick navigation cards link to all admin sections.

### User Management (`/admin/users`)

| Action | How |
|--------|-----|
| **Create User** | Click "Create User" → enter name, username, password, role → Save |
| **Record Attendance** | Click the checkmark icon on a user row → select Attendance (+10 VP) or Service (+25 VP) → add date and notes → Save |
| **Deactivate User** | Click the trash icon → confirm deletion (blocked if user has items, claims, or orders) |

### Item Management (`/admin/items`)

- View all items with resolved uploader names
- Search by category or uploader
- Filter by status (Available / Claimed / Released / Donated)
- Delete items (with confirmation)

### Claim Management (`/admin/claims`)

- Tabbed view: All / Pending / Approved / Released / Rejected
- Approve, release, or reject claims directly
- View proof photos in full-screen

### Location Management (`/admin/locations`)

- Create, edit, and delete locations
- Locations appear in the upload form dropdowns for all users

### Mission Management (`/admin/missions`)

- Create, edit, and delete missions
- Assign missions to specific users
- Set priority (Low / Medium / High / Critical), due date, and location
- Provide detailed instructions for the assignee

### Order Management (`/admin/orders`)

- Send security orders/directives to specific users
- Set priority (High / Medium / Low)
- Track read/unread status

### Donation Management (`/admin/donations`)

- View items approaching their 30-day donation deadline
- Items within 7 days are highlighted
- Click **"Mark Donated"** to remove items from active circulation

### Release Logs (`/admin/releases`)

- Immutable record of all item releases
- Shows: item name, claimant, volunteer who processed it, date, notes
- Searchable and filterable

### Meeting Minutes (`/admin/meeting-minutes`)

- Create, edit, and delete meeting records
- **Fields:** Title, date, location, attendees, agenda, discussion, action items, decisions, next meeting date
- **Action items** can be tracked with status (Pending / In Progress / Completed)
- **Print** meetings in a formatted document

### Audit Logs (`/admin/audit-logs`)

- Complete record of all system events
- Filter by event type, severity, and search terms
- **Export to CSV** for external reporting
- Events include: logins, logouts, item uploads, claims, releases, user management, location changes, password changes, and more

### System Settings (`/admin/settings`)

- **System Health** — Audit stream status, event count (last 24h), open alerts
- **Recent Security Events** — Last 5 audit log entries with timestamps

---

## 14. System Security

The Vault system employs multiple security layers:

| Layer | How It Works |
|-------|-------------|
| **Authentication** | Cookie-based JWT tokens (httpOnly, 8-hour expiry). Never stored in browser storage. |
| **Authorization** | Role checked server-side on every request. Never trusted from the client. |
| **CSRF Protection** | Origin header validation on all state-changing requests. |
| **Rate Limiting** | Limits on login and mutation endpoints to prevent abuse. |
| **Input Validation** | All inputs validated with strict schemas before processing. |
| **Image Validation** | MIME type check, file size limit (5 MB), and magic-byte verification on uploads. |
| **Session Revocation** | Changing your password invalidates all other sessions immediately. |
| **Audit Logging** | Every significant action is logged immutably with user, timestamp, and details. |
| **Security Headers** | CSP, HSTS, X-Frame-Options DENY, and other protective headers on every response. |

---

## 15. FAQ

### "I forgot my password."
Contact your administrator. They can reset it for you.

### "I uploaded an item but don't see it."
It may take a moment to appear. Refresh the Browse page. If it still does not appear, check that you are logged in.

### "My claim was rejected. Can I try again?"
Yes. If your claim is rejected, the item becomes available again. You can submit a new claim with different proof.

### "What happens to unclaimed items?"
After **30 days**, items are moved to the donation queue. Admins review them and may mark them as donated.

### "I am a volunteer. How do I release an item?"
Go to your **Release Dashboard** → find the claim → click **Review & Release** → compare photos → Approve (if pending) → Release (if approved).

### "How do I get more Vault Points?"
- Upload found items
- Attend church services (recorded by admin)
- Perform service (recorded by admin)
- Complete missions

### "Can I delete my account?"
No. Only administrators can deactivate accounts. Contact your admin.

### "The system seems slow on first load."
The database may be warming up from sleep (cold start). The first request after idle takes a few seconds. Subsequent requests are fast.

---

*Vault Church Security System — Protecting what matters, one item at a time.*
