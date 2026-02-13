#!/bin/bash

echo "🗓️  WorkForce Scheduler Pro - Starting..."
echo ""
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "Starting server..."
python server.py
