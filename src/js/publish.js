const packageJson = require('./package.json');
const version = packageJson.version;
const description = packageJson.versionDescription;

// function to run bash commands
const execSync = require('child_process').execSync;
function runShell(command) {
    return execSync(command, { encoding: 'utf-8' });
}

console.log(`releasing Stagepay (${version} - ${description})...`);

const lastCommitMessage = runShell('git log -1 --pretty=%B');
if (lastCommitMessage.includes(version) || lastCommitMessage.includes(description)) {
    console.error(`**ABORTING: "version ${version} - ${description}" has already been published!**`);
    console.error(`**if applicable, in package.json, update "version" and "versionDescription" and try again.**`);
    process.exit(0);
}

console.info(`  installing npm dependencies...`);
runShell('npm install');
runShell('cd web; npm install');

console.info(`  building /dist folder...`);
buildOutput = runShell('npm run build-production');

if (!buildOutput.includes('compiled successfully')) {
    console.error(`**ABORTING: "npm run build-production  failed`);
    process.exit(0);
}

console.info(`  git staging modified/deleted/new files...`);
runShell(`git add --all`);

console.info(`  git committing...`);
runShell(`git commit -m "Release version ${version} - ${description}"`);

console.info(`  git tagging...`);
runShell(`git tag ${version}`);
runShell(`git tag -f latest`);

console.info(`  git pushing...`);
runShell(`git push origin master :refs/tags/latest`);
runShell(`git push origin master --tags`);

process.exit(0);