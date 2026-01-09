# Git Setup for Different GitHub Account

## Step 1: Configure Git for This Repo Only

Run these commands with YOUR GitHub account details:

```bash
# Set your GitHub username (for this repo only)
git config --local user.name "YOUR_GITHUB_USERNAME"

# Set your GitHub email (for this repo only)
git config --local user.email "your-email@example.com"
```

**Example:**
```bash
git config --local user.name "john-doe"
git config --local user.email "john@example.com"
```

## Step 2: Create Initial Commit

```bash
git commit -m "Initial commit: Training meeting whiteboard app"
```

## Step 3: Create GitHub Repository

1. Go to **https://github.com/new**
2. Repository name: `live-meeting-whiteboard` (or any name you want)
3. Choose **Public** or **Private**
4. **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 4: Connect and Push

After creating the repo, GitHub will show you commands. Use these:

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/live-meeting-whiteboard.git

# Or if using SSH:
# git remote add origin git@github.com:YOUR_USERNAME/live-meeting-whiteboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Alternative: Using GitHub CLI

If you have GitHub CLI installed:

```bash
# Login to different account
gh auth login

# Create repo and push in one command
gh repo create live-meeting-whiteboard --public --source=. --remote=origin --push
```

## Troubleshooting

**If you get authentication errors:**
- Use **Personal Access Token** instead of password
- Generate token: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Use token as password when pushing

**To check your current git config:**
```bash
git config --local user.name
git config --local user.email
```
