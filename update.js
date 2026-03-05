#!/usr/bin/env node

/**
 * PM2 Server Self-Update Script
 * 
 * This script runs independently to update the server:
 * 1. Check for uncommitted changes
 * 2. Stash local changes (if any)
 * 3. Pull latest changes from Git
 * 4. Install frontend dependencies
 * 5. Build frontend
 * 6. Restart PM2 process
 * 
 * Usage: node update.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log(`\n=== ${title} ===`, colors.bright + colors.cyan);
}

function logError(message) {
  log(`ERROR: ${message}`, colors.red);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function execute(command, description, options = {}) {
  try {
    log(`Running: ${description}...`);
    const result = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf-8',
      ...options
    });
    logSuccess(`${description} completed`);
    return { success: true, stdout: result, stderr: '' };
  } catch (error) {
    logError(`${description} failed`);
    if (error.stderr) {
      console.error(error.stderr);
    }
    return { success: false, stdout: error.stdout, stderr: error.stderr };
  }
}

async function main() {
  const startTime = Date.now();
  logSection('PM2 Server Self-Update');
  log(`Starting update process...`, colors.bright);
  
  const projectRoot = process.cwd();
  log(`Project root: ${projectRoot}`, colors.blue);

  // Check if .git exists
  const gitDir = path.join(projectRoot, '.git');
  if (!fs.existsSync(gitDir)) {
    logError('Not a git repository');
    process.exit(1);
  }
  logSuccess('Git repository found');

  // Check for uncommitted changes
  logSection('Checking for uncommitted changes');
  const statusResult = execute('git status --porcelain', 'git status');
  
  if (statusResult.success && statusResult.stdout.trim()) {
    logWarning('Uncommitted changes detected:');
    console.log(statusResult.stdout);
    
    // Stash changes
    logSection('Stashing local changes');
    const stashResult = execute('git stash push -u -m "Auto-stash before update"', 'git stash');
    
    if (stashResult.success) {
      logSuccess('Changes stashed. You can restore them later with: git stash pop');
    } else {
      logError('Failed to stash changes');
      logWarning('Attempting to proceed anyway...');
    }
  } else {
    logSuccess('No uncommitted changes');
  }

  // Pull latest changes
  logSection('Pulling from remote');
  const pullResult = execute('git pull', 'git pull');
  
  if (!pullResult.success) {
    logError('Git pull failed');
    logSection('Update Failed');
    process.exit(1);
  }

  // Check if there were updates
  if (pullResult.stdout.includes('Already up to date.')) {
    logSuccess('Already up to date');
  } else {
    logSuccess('Updated to latest version');
  }

  // Install frontend dependencies
  logSection('Installing frontend dependencies');
  const frontendDir = path.join(projectRoot, 'frontend');
  
  if (!fs.existsSync(frontendDir)) {
    logError('Frontend directory not found');
    process.exit(1);
  }

  const npmInstallResult = execute(
    'npm install',
    'npm install (frontend)',
    { cwd: frontendDir }
  );

  if (!npmInstallResult.success) {
    logError('npm install failed');
    process.exit(1);
  }

  // Build frontend
  logSection('Building frontend');
  const buildResult = execute(
    'npm run build',
    'npm run build',
    { cwd: frontendDir }
  );

  if (!buildResult.success) {
    logError('npm run build failed');
    process.exit(1);
  }

  // Restart PM2
  logSection('Restarting PM2');
  const restartResult = execute(
    'pm2 restart pm2-panel',
    'pm2 restart'
  );

  if (!restartResult.success) {
    logError('PM2 restart failed');
    logWarning('Please restart manually: pm2 restart pm2-panel');
    process.exit(1);
  }

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  logSection('Update Complete');
  logSuccess(`Server restarted successfully`);
  log(`Duration: ${duration}s`, colors.blue);
  log('\nYou can now refresh your browser to see the updated version.\n', colors.bright);
  
  // Reminder about stashed changes
  if (statusResult.success && statusResult.stdout.trim()) {
    log('\nReminder: Your local changes are stashed.', colors.yellow);
    log('To restore them, run: git stash pop', colors.yellow);
    console.log('');
  }

  process.exit(0);
}

// Run the update
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});