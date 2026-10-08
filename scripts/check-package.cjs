'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const localPath=url=>url.split(/[?#]/)[0];
const scripts=[...html.matchAll(/<script src="([^"]+)" defer>/g)].map(m=>localPath(m[1]));
for(const file of scripts){assert.ok(fs.existsSync(path.join(root,file)),file);new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});}
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g))assert.ok(fs.existsSync(path.join(root,localPath(match[1]))),match[1]);
assert.equal(scripts.length,14);assert.ok(scripts.indexOf('src/game-engine.js')<scripts.indexOf('src/game-save.js'));assert.ok(scripts.indexOf('src/team-crests.js')<scripts.indexOf('src/game-ui.js'));assert.ok(scripts.indexOf('src/soundtracks.js')<scripts.indexOf('src/game-audio.js'));assert.ok(scripts.indexOf('src/game-audio.js')<scripts.indexOf('src/game-ui.js'));
assert.ok(html.includes('<title>축구 생활 · Football Life</title>'));assert.ok(html.includes('id="backup-file"'));
const png=fs.readFileSync(path.join(root,'assets/home-cover.png'));assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),1536);
const css=fs.readdirSync(path.join(root,'css')).map(n=>fs.readFileSync(path.join(root,'css',n),'utf8')).join('\n');
assert.ok(!/url\(https?:/i.test(css),'styles do not depend on remote assets');
const ui=fs.readFileSync(path.join(root,'src/game-ui.js'),'utf8');assert.ok(!ui.includes('이번 생은 축구다'),'all live branding updated');
assert.ok(!/localhost|file:\/\//.test(html));
console.log('Package checks passed: relative URLs, script order, syntax, branding and local assets.');
