// Usage: node start-bna.js
// Run this in the directory where package.json is located. Make sure ./dist directory is available.
'use strict';
const { 
  execSync
} = require('child_process');

// Usage: node upgrade.js package.json
const fs = require('fs');
let rawdata = fs.readFileSync('package.json');
let jsondata = JSON.parse(rawdata);  
let version = jsondata.version;
let desc = jsondata.description;
var arr = version.split(".");
let next = Number(arr[2]) + 1;
let nextVersion = "0.0." + next;
let newDesc = desc.replace(version, nextVersion);
console.log('Current Version: '+version); 
console.log('Current Description: '+desc); 
console.log('Next Version: ' +nextVersion); 
console.log('New Description: '+newDesc); 

jsondata.version = nextVersion;
jsondata.description = newDesc;
version = nextVersion;

fs.writeFileSync('new-package.json', JSON.stringify(jsondata,null,2));
fs.renameSync('new-package.json', 'package.json');

console.log('');
let cmd1 = 'cd dist; composer archive create -t dir -n ../';
console.log('Running ' + cmd1);
execSync(cmd1, {stdio: 'inherit'});

console.log('');
let cmd2 = 'cd dist; composer network install -a smartquora-bna@' + version + '.bna -c PeerAdmin@hlfv1'  ;
console.log('Running ' + cmd2);
execSync(cmd2, {stdio: 'inherit'});

console.log('');
let cmd3 = 'cd dist; composer network upgrade -c PeerAdmin@hlfv1 -n smartquora-bna -V ' + version  ;
console.log('Running ' + cmd3);
execSync(cmd3, {stdio: 'inherit'});

console.log('');
let cmd4 = 'cd dist; composer network ping -c admin@smartquora-bna';
console.log('Running ' + cmd4);
execSync(cmd4, {stdio: 'inherit'});

console.log('');
console.log('Exiting');
