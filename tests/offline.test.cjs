'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
test('the standalone HTML boots all modules in order after its actual body nodes exist',()=>{
 const root=path.join(__dirname,'..');execFileSync(process.execPath,[path.join(root,'scripts/build-offline.cjs')],{cwd:root,stdio:'pipe'});
 const html=fs.readFileSync(path.join(root,'dist/football-life.html'),'utf8'),nodes={},errors=[],listeners={};
 const document={documentElement:{classList:{toggle(){}}},getElementById:id=>nodes[id]||null,querySelectorAll:()=>[],addEventListener:(type,fn)=>listeners[type]=fn};
 const context={TextEncoder,TextDecoder,document,localStorage:{getItem:()=>null,setItem(){}},window:{scrollY:0,scrollTo(){}},setTimeout:()=>1,clearTimeout(){},console:{error:e=>errors.push(e)},Blob,URL};vm.createContext(context);
 let scripts=0;for(const match of html.matchAll(/<script>([\s\S]*?)<\/script>|<(?:div|dialog|input)\b[^>]*\bid="([^"]+)"[^>]*>/g)){
  if(match[2])nodes[match[2]]={innerHTML:'',dataset:{},classList:{add(){},remove(){}},addEventListener(){},close(){},showModal(){}};
  else {vm.runInContext(match[1],context,{filename:'offline-module-'+(++scripts)});}
 }
 assert.equal(scripts,18);assert.equal(errors.length,0);assert.ok(nodes.app);assert.match(nodes.app.innerHTML,/축구 생활 메인|축구 생활/);assert.match(nodes.app.innerHTML,/클럽하우스/);assert.match(nodes.app.innerHTML,/새로운 축구 인생 시작/);assert.ok(listeners.click);assert.ok(listeners.change);
 assert.doesNotMatch(html,/<script src=|<link rel="stylesheet"/);assert.match(html,/data:image\/png;base64,/);
});
