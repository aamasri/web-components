// function to run bash commands
const execSync = require('child_process').execSync;
function runShell(command) {
    return execSync(command, { encoding: 'utf-8' });
}

console.log(`upgrading server and web packages...`);

console.log(`upgrading server packages...`);
console.debug(runShell('npm upgrade;'));

console.log(`upgrading web packages...`);
console.debug(runShell('cd web; npm upgrade;'));

console.log(`UPGRADE COMPLETE.`);

process.exit(0);