const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { setConfig } = require('./config');

async function checkSSH() {
  console.log('[SSH CHECK] Starting SSH connection test...');
  
  try {
    let result;
    try {
      console.log('[SSH CMD] Executing: ssh -T git@github.com');
      result = execSync('ssh -T git@github.com', {
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
      });
      console.log('[SSH CMD] Command completed without throwing error');
    } catch (sshErr) {
      // SSH her zaman exit code 1 döner (permission denied bile olsa)
      // stdout veya stderr'den çıktıyı al
      console.log('[SSH ERROR CATCH] SSH command threw error (this is expected)');
      console.log('[SSH ERROR CATCH] Error code:', sshErr.status || sshErr.code);
      
      // Handle Buffer objects properly
      let stdoutStr = '';
      let stderrStr = '';
      
      if (sshErr.stdout && sshErr.stdout instanceof Buffer) {
        stdoutStr = sshErr.stdout.toString('utf-8');
      } else if (typeof sshErr.stdout === 'string') {
        stdoutStr = sshErr.stdout;
      }
      
      if (sshErr.stderr && sshErr.stderr instanceof Buffer) {
        stderrStr = sshErr.stderr.toString('utf-8');
      } else if (typeof sshErr.stderr === 'string') {
        stderrStr = sshErr.stderr;
      }
      
      console.log('[SSH ERROR CATCH] stdout:', stdoutStr || 'NO STDOUT');
      console.log('[SSH ERROR CATCH] stderr:', stderrStr || 'NO STDERR');
      
      // Try to get output from either stdout, stderr, or error message
      result = stdoutStr || stderrStr || sshErr.message || '';
    }

    // result is already a string now
    const output = result || '';
    console.log('[SSH RAW OUTPUT]:', output);
    console.log('[SSH RAW OUTPUT LENGTH]:', output.length);
    console.log('[SSH OUTPUT TYPE]:', typeof output);
    
    const match = output.match(/Hi (.+?)!/);
    console.log('[SSH MATCH] Regex match result:', match);
    
    const connected = !!match;
    const username = match ? match[1] : null;
    const lastChecked = new Date().toISOString();
    const rawOutput = output;

    console.log('[SSH RESULT] connected:', connected, 'username:', username);
    
    setConfig({ sshStatus: { connected, username, lastChecked } });

    return { connected, username, lastChecked, rawOutput };
  } catch (err) {
    console.log('[SSH CRITICAL ERROR] Unexpected error in checkSSH:');
    console.log('[SSH CRITICAL ERROR] Message:', err.message);
    console.log('[SSH CRITICAL ERROR] Stack:', err.stack);
    
    setConfig({ sshStatus: { connected: false, username: null, lastChecked: new Date().toISOString() } });
    return { 
      connected: false, 
      username: null, 
      lastChecked: new Date().toISOString(),
      rawOutput: err.message || 'Connection failed'
    };
  }
}

function getPublicKey() {
  const candidates = [
    path.join(os.homedir(), '.ssh', 'id_ed25519.pub'),
    path.join(os.homedir(), '.ssh', 'id_rsa.pub'),
    path.join(os.homedir(), '.ssh', 'id_ecdsa.pub'),
  ];
  for (const f of candidates) {
    if (fs.existsSync(f)) return fs.readFileSync(f, 'utf-8').trim();
  }
  return null;
}

function hasSSHKey() {
  const candidates = [
    path.join(os.homedir(), '.ssh', 'id_ed25519'),
    path.join(os.homedir(), '.ssh', 'id_rsa'),
    path.join(os.homedir(), '.ssh', 'id_ecdsa'),
  ];
  return candidates.some(f => fs.existsSync(f));
}

module.exports = { checkSSH, getPublicKey, hasSSHKey };
