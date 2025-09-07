# GitHub Deployment Script for Hoyn QR System
# Enhanced version with better error handling and user experience

param(
    [string]$GithubUsername,
    [string]$RepoName
)

Write-Host "🚀 Hoyn QR System GitHub Deployment Script" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Function to prompt for input if not provided
function Get-InputIfMissing {
    param([string]$Value, [string]$Prompt)
    if (-not $Value) {
        $Value = Read-Host $Prompt
    }
    return $Value
}

# Get repository details from user if not provided as parameters
$GithubUsername = Get-InputIfMissing $GithubUsername "Please enter your GitHub username"
$RepoName = Get-InputIfMissing $RepoName "Please enter your repository name"

# Stage all changes
Write-Host "📦 Staging all changes..." -ForegroundColor Cyan
git add .

# Check for changes to commit
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📝 Creating commit with current changes..." -ForegroundColor Cyan
    git commit -m "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
} else {
    Write-Host "ℹ️  No changes to commit." -ForegroundColor Yellow
}

# Set the remote origin
Write-Host "🔗 Setting remote origin..." -ForegroundColor Cyan
git remote add origin "https://github.com/$GithubUsername/$RepoName.git" 2>$null
git remote set-url origin "https://github.com/$GithubUsername/$RepoName.git"

Write-Host "🚀 Pushing code to GitHub..." -ForegroundColor Cyan
Write-Host "This may take a few minutes depending on your connection speed." -ForegroundColor Gray

try {
    # Push all branches and tags
    git push -u origin --all
    git push -u origin --tags
    Write-Host "✅ GitHub deployment completed successfully!" -ForegroundColor Green
    Write-Host "Your repository is now available at: https://github.com/$GithubUsername/$RepoName" -ForegroundColor Blue
} catch {
    Write-Host "❌ Error during deployment: $_" -ForegroundColor Red
    Write-Host "Please check your internet connection and GitHub credentials." -ForegroundColor Yellow
    exit 1
}