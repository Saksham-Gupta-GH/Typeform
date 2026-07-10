#!/bin/bash
# Azure Ubuntu VM Setup Script for Typeform Clone Backend

# Exit immediately if a command exits with a non-zero status
set -e

echo "Updating packages and installing Nginx & Python3-venv..."
sudo apt update
sudo apt install -y nginx python3-venv python3-pip

echo "Setting up Virtual Environment..."
cd /home/azureuser/Typeform/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo "Configuring Systemd for Gunicorn..."
sudo cp deploy/typeform.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start typeform
sudo systemctl enable typeform

echo "Configuring Nginx Reverse Proxy..."
sudo cp deploy/nginx.conf /etc/nginx/sites-available/typeform
sudo ln -sf /etc/nginx/sites-available/typeform /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

echo "Deployment complete! Your FastAPI backend is now running via Nginx."
