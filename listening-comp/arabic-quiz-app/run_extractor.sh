#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo ""
    echo "Please edit the .env file to add your YouTube API key."
    echo "Run this script again after adding your API key."
    exit 1
fi

# Run the YouTube extractor
python youtube_extractor.py "$@"
