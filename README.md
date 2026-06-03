# Staff Chat

A simple, self-hosted team chat — a stripped-down Slack/Discord — built by
**BigHappySmiley** for talking with your team without the bloat.

Create named **channels**, organize them into **servers** (one per organization),
invite teammates with a short code, and chat in real time. Every new account
lands in **Official Updates**, where BigHappySmiley staff post product news.

---

## Features

- **Email + password login** via Firebase Authentication (passwords are hashed
  and salted by Firebase — never stored in plain text).
- **Servers** you can create and name, each with its own channels and members.
- **Invite codes** — share a 6-character code to let teammates join.
- **Auto-join Official Updates** on signup.
- **Roles per server**: `admin` (full control), `moderator` (can delete any
  message), `member` (chat).
- **Real-time chat** with usernames and profile pictures.
- **Staff admin dashboard** for BigHappySmiley staff — overview of all users and
  servers.
- Security enforced server-side by Firestore + Storage rules (in this repo).

## Tech

React + Vite on the front end; Firebase (Authentication, Firestore, Storage,
optional Hosting) on the back end. No server to run yourself.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and
   create a project.
2. **Authentication** → Get started → enable **Email/Password**.
3. **Firestore Database** → Create database (start in production mode).
4. **Storage** → Get started (for profile pictures / server icons).
5. **Project settings → General → Your apps** → add a **Web app** and copy the
   config object.

### 3. Configure environment

```bash
cp .env.example .env
```

Fill `.env` with the values from your Firebase web app config. (These values are
safe to ship in client code — the security rules do the real protecting.)

### 4. Deploy security rules

The rules in `firestore.rules` and `storage.rules` are what enforce the
permission model. Deploy them with the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # pick your project
firebase deploy --only firestore:rules,storage
```

### 5. Run it

```bash
npm run dev
```

Open the printed URL, create an account, and you'll land in Official Updates.

---

## Making yourself staff

Staff status (`isStaff`) is a global super-user flag. By design it **cannot** be
granted from inside the app — only with admin credentials — so nobody can
self-promote.

After signing up, promote yourself:

```bash
npm install --no-save firebase-admin
# Download a service account key (Project settings → Service accounts →
# Generate new private key) and save it as serviceAccount.json in the repo root.
node scripts/make-staff.mjs you@yourcompany.com
```

You can also just flip `isStaff` to `true` on your `users/{uid}` document
directly in the Firebase console. The first person to sign up automatically
becomes the owner/admin of the Official Updates server.

---

## How it fits together

| Concept | Firestore location | Notes |
| --- | --- | --- |
| User profile | `users/{uid}` | username, photo, `isStaff` |
| Your server list | `users/{uid}/memberships/{serverId}` | powers the left rail |
| Server | `servers/{serverId}` | name, icon, ownerId, `inviteCode` |
| Membership / role | `servers/{serverId}/members/{uid}` | `admin` / `moderator` / `member` |
| Channel | `servers/{serverId}/channels/{channelId}` | named, ordered |
| Message | `…/channels/{channelId}/messages/{id}` | real-time |

## Deploy to the web (optional)

```bash
npm run build
firebase deploy --only hosting
```

---

## Roadmap / not yet built

This is the MVP scaffold. Natural next steps: message editing UI, typing
indicators, file attachments in chat, threaded replies, and tighter Storage
rules for server icons (admin-only via a Firestore lookup).
