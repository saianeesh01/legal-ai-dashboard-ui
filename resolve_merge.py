#!/usr/bin/env python3
"""
Script to resolve git merge conflicts by adding files and committing
"""

import subprocess
import sys

def run_command(cmd):
    """Run a git command and return the result"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        print(f"Command: {cmd}")
        print(f"Return code: {result.returncode}")
        if result.stdout:
            print(f"Output: {result.stdout}")
        if result.stderr:
            print(f"Error: {result.stderr}")
        return result.returncode == 0
    except Exception as e:
        print(f"Error running command {cmd}: {e}")
        return False

def main():
    print("🔧 Resolving git merge conflicts...")
    
    # Check current status
    print("\n📊 Current git status:")
    run_command("git status")
    
    # Add the conflicted files
    print("\n➕ Adding conflicted files...")
    success = True
    success &= run_command("git add ai_service/app.py")
    success &= run_command("git add server/routes.ts")
    
    if not success:
        print("❌ Failed to add files")
        return False
    
    # Check status after adding
    print("\n📊 Status after adding files:")
    run_command("git status")
    
    # Commit the changes
    print("\n💾 Committing resolved conflicts...")
    success = run_command('git commit -m "Resolve merge conflicts: implement incremental summarization with final synthesis"')
    
    if success:
        print("✅ Successfully resolved merge conflicts!")
        print("\n📊 Final status:")
        run_command("git status")
    else:
        print("❌ Failed to commit changes")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 