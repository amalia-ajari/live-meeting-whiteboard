# Setup Multiple Git Accounts (GitLab + GitHub)

## Scenario
- You have **GitLab** with one SSH key
- You want to use **GitHub** with a different account/key

## Solution: SSH Config

### Step 1: Check Your Existing SSH Keys

```bash
# List your SSH keys
ls -la ~/.ssh/

# You might see:
# id_rsa (GitLab key)
# id_rsa_github (GitHub key - if you create one)
```

### Step 2: Generate New SSH Key for GitHub (if needed)

```bash
# Generate a new SSH key for GitHub
ssh-keygen -t ed25519 -C "your-github-email@example.com" -f ~/.ssh/id_ed25519_github

# Or if ed25519 not available:
ssh-keygen -t rsa -b 4096 -C "your-github-email@example.com" -f ~/.ssh/id_rsa_github
```

### Step 3: Add GitHub Key to SSH Agent

```bash
# Start SSH agent
eval "$(ssh-agent -s)"

# Add GitHub key
ssh-add ~/.ssh/id_ed25519_github
# or
ssh-add ~/.ssh/id_rsa_github
```

### Step 4: Add Public Key to GitHub

```bash
# Copy your GitHub public key
cat ~/.ssh/id_ed25519_github.pub
# or
cat ~/.ssh/id_rsa_github.pub

# Then:
# 1. Go to GitHub → Settings → SSH and GPG keys
# 2. Click "New SSH key"
# 3. Paste the public key
# 4. Save
```

### Step 5: Configure SSH Config

Edit `~/.ssh/config`:

```bash
# Open SSH config
nano ~/.ssh/config
# or
code ~/.ssh/config
```

Add this configuration:

```
# GitLab (default)
Host gitlab.com
  HostName gitlab.com
  User git
  IdentityFile ~/.ssh/id_rsa
  IdentitiesOnly yes

# GitHub (different account)
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes
```

**Save and close**

### Step 6: Test Connections

```bash
# Test GitLab
ssh -T git@gitlab.com

# Test GitHub
ssh -T git@github.com
```

You should see success messages from both!

---

## Option 2: Use HTTPS Instead of SSH

If you prefer HTTPS (simpler, but requires password/token):

```bash
# For GitHub repo, use HTTPS
git remote add origin https://github.com/YOUR_USERNAME/live-meeting-whiteboard.git

# When pushing, GitHub will prompt for credentials
# Use your GitHub username + Personal Access Token (not password)
```

**Generate Personal Access Token:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Copy token
4. Use token as password when pushing

---

## Option 3: Use Different Git Config Per Repo

For this specific repo (GitHub), set local config:

```bash
cd /Users/amalia/Documents/live-meeting-whiteboard

# Set GitHub account for this repo only
git config --local user.name "YOUR_GITHUB_USERNAME"
git config --local user.email "your-github-email@example.com"

# Use HTTPS remote (avoids SSH key conflicts)
git remote add origin https://github.com/YOUR_USERNAME/live-meeting-whiteboard.git
```

---

## Quick Setup for This Repo (Recommended)

Since you already have GitLab set up, easiest approach:

1. **Use HTTPS for GitHub** (no SSH key needed):
```bash
cd /Users/amalia/Documents/live-meeting-whiteboard

# Configure for GitHub account
git config --local user.name "YOUR_GITHUB_USERNAME"
git config --local user.email "your-github-email@example.com"

# Commit
git commit -m "Initial commit: Training meeting whiteboard app"

# Add remote with HTTPS
git remote add origin https://github.com/YOUR_USERNAME/live-meeting-whiteboard.git

# Push (will prompt for GitHub credentials)
git branch -M main
git push -u origin main
```

2. **When prompted for credentials:**
   - Username: Your GitHub username
   - Password: Your GitHub Personal Access Token (not your password!)

---

## Summary

✅ **Yes, you can use different accounts!**

- **GitLab**: Uses your existing SSH key (no changes needed)
- **GitHub**: Can use:
  - Different SSH key (via SSH config)
  - HTTPS with Personal Access Token (simplest)
  - Different local git config per repo

**Recommendation**: Use HTTPS for GitHub to avoid SSH key conflicts!
