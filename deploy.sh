#!/bin/bash

# Build the project
echo "Building the project..."
npm run build

# Create a new branch for deployment
echo "Creating deployment branch..."
git checkout -b gh-pages

# Add build files
echo "Adding build files..."
git add -f build/

# Commit
echo "Committing build files..."
git commit -m "Deploy to GitHub Pages"

# Push to GitHub
echo "Pushing to GitHub..."
git push origin gh-pages

# Switch back to main branch
echo "Switching back to main branch..."
git checkout main

# Delete local gh-pages branch
echo "Cleaning up..."
git branch -D gh-pages

echo "Deployment complete! Your site will be available at:"
echo "https://[your-username].github.io/[repository-name]"
