// Usage: node start-bna.js
// Run this in the directory where package.json is located. Make sure ./dist directory is available.
'use strict';
const { 
  execSync
} = require('child_process');

const fs = require('fs');
let rawdata = fs.readFileSync('package.json');
let jsondata = JSON.parse(rawdata);  
let version = jsondata.version;
console.log('Current Version: '+version); 

console.log('');
let cmd2 = 'cd dist; composer network install -a smartquora-bna@' + version + '.bna -c PeerAdmin@hlfv1'  ;
console.log('Running ' + cmd2);
execSync(cmd2, {stdio: 'inherit'});

console.log('');
let cmd3 = 'cd dist; composer network start -A admin -S adminpw -c PeerAdmin@hlfv1 -n smartquora-bna -V ' + version  ;
console.log('Running ' + cmd3);
execSync(cmd3, {stdio: 'inherit'});

console.log('');
let cmd31 = 'cd dist; composer card delete -c admin@smartquora-bna';
console.log('Running ' + cmd31);
execSync(cmd31, {stdio: 'inherit'});

console.log('');
let cmd32 = 'cd dist; composer card import -f ./admin@smartquora-bna.card';
console.log('Running ' + cmd32);
execSync(cmd32, {stdio: 'inherit'});

console.log('');
let cmd4 = 'cd dist; composer network ping -c admin@smartquora-bna';
console.log('Running ' + cmd4);
execSync(cmd4, {stdio: 'inherit'});

console.log('');
let cmd5 = 'cd dist; docker ps';
console.log('Running ' + cmd5);
execSync(cmd5, {stdio: 'inherit'});

console.log('');
console.log('Exiting');
