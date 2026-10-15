const { spawn } = require('child_process');
const child = spawn('cmd.exe', ['/c', 'C:\\Users\\Sem\\AppData\\Local\\Android\\Sdk\\tools\\bin\\sdkmanager.bat', '--licenses']);

child.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    if (output.includes('Accept?')) {
        child.stdin.write('y\n');
    }
});

child.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});
