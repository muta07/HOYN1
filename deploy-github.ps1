# GitHub Deployment Script for Hoyn QR System

Write-Host "Hoyn QR System GitHub Deployment Script"
Write-Host "=========================================="

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not in a git repository"
    exit 1
}

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "There are uncommitted changes. Please commit or stash them first."
    exit 1
}

# Get repository details from user
$github_username = Read-Host "Please enter your GitHub username"
$repo_name = Read-Host "Please enter your repository name"

# Set the remote origin
git remote add origin "https://github.com/$github_username/$repo_name.git" 2>$null
# Change the remote URL if it already exists
git remote set-url origin "https://github.com/$github_username/$repo_name.git"

Write-Host "Pushing code to GitHub..."
Write-Host "This may take a few minutes depending on your connection speed."

# Push all branches and tags
git push -u origin --all
git push -u origin --tags

Write-Host "Deployment completed!"
Write-Host "Your repository is now available at: https://github.com/$github_username/$repo_name""