const { exec } = require('child_process');
const os = require('os');

function killPids(pids) {
  if (!pids || !pids.length) return Promise.resolve();
  return new Promise((resolve) => {
    const cmds = pids.map(pid => {
      if (os.platform() === 'win32') return `taskkill /PID ${pid} /F`;
      return `kill -9 ${pid}`;
    });

    let i = 0;
    function runNext() {
      if (i >= cmds.length) return resolve();
      exec(cmds[i], (err, so, se) => {
        i += 1;
        runNext();
      });
    }
    runNext();
  });
}

function findPids(port) {
  return new Promise((resolve, reject) => {
    if (os.platform() === 'win32') {
      exec('netstat -ano', (err, stdout) => {
        if (err) return resolve([]);
        const lines = stdout.split(/\r?\n/);
        const pids = new Set();
        for (const line of lines) {
          if (line.includes(':' + port)) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (/^\d+$/.test(pid)) pids.add(pid);
          }
        }
        resolve(Array.from(pids));
      });
    } else {
      // linux / mac
      exec(`lsof -i :${port} -t || true`, (err, stdout) => {
        if (!stdout) return resolve([]);
        const pids = stdout.split(/\r?\n/).filter(Boolean);
        resolve(pids);
      });
    }
  });
}

async function main() {
  const port = process.env.PORT || '4000';
  try {
    const pids = await findPids(port);
    if (pids.length) {
      console.log(`Killing processes on port ${port}:`, pids.join(', '));
      await killPids(pids);
    } else {
      console.log(`No processes on port ${port}`);
    }
  } catch (e) {
    // ignore
  }
}

main().then(() => process.exit(0));
