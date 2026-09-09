const { spawn } = require('child_process');

const env = Object.assign({}, process.env, {
    JAVA_HOME: 'C:\\Program\\ Files\\Java\\jre1.8.0_461'
});

const child = spawn('cmd.exe', ['/c', 'C:\\Users\\Sem\\AppData\\Local\\Android\\Sdk\\tools\\bin\\sdkmanager.bat', '--licenses'], { env: { ...process.env, JAVA_HOME: 'C:\\Program Files\\Java\\jre1.8.0_461' } });

// Spam 'y' every 500ms
const intervalId = setInterval(() => {
    try {
        child.stdin.write('y\n');
    } catch (e) {}
}, 500);

child.stdout.on('data', (data) => {
    console.log(data.toString());
});
child.stderr.on('data', (data) => {
    console.error(data.toString());
});

child.on('close', (code) => {
    clearInterval(intervalId);
    console.log(`child process exited with code ${code}`);
});
