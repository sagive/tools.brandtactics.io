#!/bin/bash

# Navigate to the directory where this script is located
cd "$(dirname "$0")"

echo "Downloading latest HEAD from github..."

# Download the latest zip of the main branch
curl -L -o main.zip https://github.com/sagive/tools.brandtactics.io/archive/refs/heads/main.zip

# Unzip quietly
unzip -q main.zip

# Copy contents (including hidden files) to the current directory, overwriting existing files
cp -a tools.brandtactics.io-main/. ./

# Clean up the zip and the extracted folder
rm -rf tools.brandtactics.io-main main.zip

echo "Update complete! You are now on the latest HEAD."
sleep 3
