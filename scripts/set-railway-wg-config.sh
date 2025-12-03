#!/bin/bash
# Bash Script to set WG_CONFIG in Railway
# Usage: ./scripts/set-railway-wg-config.sh

echo "Setting WG_CONFIG in Railway..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Railway CLI not found. Installing..."
    npm i -g @railway/cli
fi

# Check if we're in a Railway project
if [ ! -f .railway ]; then
    echo "Not linked to Railway project. Linking..."
    railway link
fi

# Read the config file
CONFIG_PATH="config/wg_config.conf"
if [ ! -f "$CONFIG_PATH" ]; then
    echo "Error: $CONFIG_PATH not found!"
    exit 1
fi

# Set the variable
echo "Setting WG_CONFIG variable..."
railway variables set WG_CONFIG="$(cat $CONFIG_PATH)"

echo "✅ WG_CONFIG set successfully!"
echo "You may need to redeploy for changes to take effect."

