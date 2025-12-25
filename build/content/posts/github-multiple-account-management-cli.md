---
layout: post
title: 'Managing Multiple GitHub Accounts from the CLI'
permalink: github-multiple-account-management-cli
date: 2025-12-23T18:30:00.000Z
tags:
  - github
  - cli
  - multiple accounts
  - authentication
  - github auth
  - linux
  - macos
---

## The Problem

If you use **multiple GitHub accounts**—for example, a **work account** and a **personal account**—you may encounter a frustrating issue when working from the command line:

> You try to push code to your **personal repository**, but GitHub rejects it with a **permission denied** error because it is authenticating as your **work account**.

This happens even though you are the owner of the personal repository.

### Why This Happens

- GitHub allows multiple accounts, but **Git does not automatically switch identities per repository**
- The CLI (SSH or HTTPS) reuses a cached or default identity
- As a result, all pushes to `github.com` may be attempted using the same account

---

## The Solution: Separate SSH Keys per GitHub Account

The most reliable solution is to use **separate SSH keys** for each GitHub account and configure Git to select the correct one per repository.

This approach is:
- Secure
- One-time setup
- Scales across many repositories
- Widely used in professional environments

---

## Step-by-Step Setup

### 1. Create SSH Keys

```bash
ssh-keygen -t ed25519 -C "work-email@company.com" -f ~/.ssh/id_ed25519_work
ssh-keygen -t ed25519 -C "personal-email@gmail.com" -f ~/.ssh/id_ed25519_personal
```

---

### 2. Add Keys to the SSH Agent

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519_work
ssh-add ~/.ssh/id_ed25519_personal
```

---

### 3. Configure SSH Host Aliases

Edit `~/.ssh/config`:

```ssh
# Work GitHub
Host github-work
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_work
  IdentitiesOnly yes

# Personal GitHub
Host github-personal
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_personal
  IdentitiesOnly yes
```

---

### 4. Add Public Keys to GitHub

Add each public key (`*.pub`) to the corresponding GitHub account:

- GitHub → Settings → SSH and GPG Keys

---

### 5. Update Repository Remotes

This step ensures Git uses the correct account.

```bash
# Personal repository
git remote set-url origin git@github-personal:your-username/repo-name.git

# Work repository
git remote set-url origin git@github-work:org-name/repo-name.git
```

---

### 6. Verify Authentication

```bash
ssh -T git@github-personal
ssh -T git@github-work
```

Each command should authenticate as the correct GitHub user.

---

## Optional: Set Commit Author Per Repository

```bash
git config user.name "Your Name"
git config user.email "personal-email@gmail.com"
```

Repeat with work credentials in work repositories.

---

## Conclusion

If you regularly work with multiple GitHub accounts, **separating SSH keys per account is the cleanest and safest approach**. Once configured, Git automatically selects the correct identity, eliminating permission errors and manual switching.

One setup. Zero friction.