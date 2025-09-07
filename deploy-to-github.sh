#!/bin/bash

# GitHub Deployment Script for Hoyn QR System

echo "🚀 Hoyn QR System GitHub Deployment Script"
echo "=========================================="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  There are uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Get repository details from user
echo "Please enter your GitHub username:"
read github_username

echo "Please enter your repository name:"
read repo_name

# Set the remote origin
git remote add origin https://github.com/$github_username/$repo_name.git 2>/dev/null || true

# Change the remote URL if it already exists
git remote set-url origin https://github.com/$github_username/$repo_name.git

echo "📦 Pushing code to GitHub..."
echo "This may take a few minutes depending on your connection speed."

# Push all branches and tags
git push -u origin --all
git push -u origin --tags

echo "✅ Deployment completed!"
echo "Your repository is now available at: https://github.com/$github_username/$repo_name"