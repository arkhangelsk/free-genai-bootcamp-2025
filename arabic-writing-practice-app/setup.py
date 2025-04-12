#!/usr/bin/env python3
"""
Setup script for the Arabic Learning Portal
This script will:
1. Check for Python 3.8+
2. Create a virtual environment
3. Install dependencies
4. Run the Streamlit app
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

# Ensure we're using Python 3.8+
if sys.version_info < (3, 8):
    print("This application requires Python 3.8 or higher")
    sys.exit(1)

# Function to execute shell commands
def run_command(command, cwd=None):
    try:
        print(f"Running: {command}")
        subprocess.run(command, shell=True, check=True, cwd=cwd)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {e}")
        return False

# Create a virtual environment
def create_venv():
    venv_dir = Path("venv")
    
    if venv_dir.exists():
        print("Virtual environment already exists.")
    else:
        print("Creating virtual environment...")
        if not run_command(f"{sys.executable} -m venv venv"):
            print("Failed to create virtual environment.")
            return False
    
    return True

# Activate virtual environment and install dependencies
def install_dependencies():
    # Get the correct activate script and pip based on platform
    if platform.system() == "Windows":
        activate_script = "venv\\Scripts\\activate"
        pip_command = "venv\\Scripts\\pip"
    else:
        activate_script = "source venv/bin/activate"
        pip_command = "venv/bin/pip"
    
    # Upgrade pip first
    print("Upgrading pip...")
    if platform.system() == "Windows":
        if not run_command(f"{pip_command} install --upgrade pip"):
            return False
    else:
        if not run_command(f"{activate_script} && pip install --upgrade pip", cwd=os.getcwd()):
            return False
    
    # Install requirements
    print("Installing dependencies...")
    if platform.system() == "Windows":
        if not run_command(f"{pip_command} install -r requirements.txt"):
            return False
    else:
        if not run_command(f"{activate_script} && pip install -r requirements.txt", cwd=os.getcwd()):
            return False
    
    return True

# Run the Streamlit app
def run_app():
    if platform.system() == "Windows":
        command = "venv\\Scripts\\streamlit run app.py"
    else:
        command = "source venv/bin/activate && streamlit run app.py"
    
    print("Starting Streamlit app...")
    run_command(command, cwd=os.getcwd())

# Main function
def main():
    print("Setting up Arabic Learning Portal...")
    
    # Create virtual environment
    if not create_venv():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("Failed to install dependencies.")
        sys.exit(1)
    
    print("\n✅ Setup completed successfully!")
    
    # Ask user if they want to run the app
    run_now = input("Do you want to run the app now? (y/n): ").lower().strip()
    if run_now == 'y' or run_now == 'yes':
        run_app()
    else:
        if platform.system() == "Windows":
            print("\nTo run the app later, execute: venv\\Scripts\\streamlit run app.py")
        else:
            print("\nTo run the app later, execute: source venv/bin/activate && streamlit run app.py")

if __name__ == "__main__":
    main()