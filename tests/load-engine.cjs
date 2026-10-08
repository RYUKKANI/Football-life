const fs=require('fs'),path=require('path'),vm=require('vm');
module.exports=()=>{const context={};vm.createContext(context);const files=['era-2000.js','style-rules.js','game-data.js','game-engine.js'];vm.runInContext(files.map(n=>fs.readFileSync(path.join(__dirname,'..','src',n),'utf8')).join('\n')+'\nthis.E=FootballEngine;',context);return context.E;};
