const { spawn } = require('child_process');

const env = Object.assign({}, process.env, {
    JAVA_HOME: 'C:\\Program Files\\Java\\jre1.8.0_461'
});

const child = spawn('cmd.exe', ['/c', 'C:\\Users\\Sem\\AppData\\Local\\Android\\Sdk\\tools\\bin\\sdkmanager.bat', '--licenses'], { env });

child.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    if (output.toLowerCase().includes('accept?')) {
        child.stdin.write('y\n');
    }
});

child.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});
