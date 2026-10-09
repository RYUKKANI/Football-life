'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const inlineScripts=[];
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,file)=>'<style>'+fs.readFileSync(path.join(root,file.split(/[?#]/)[0]),'utf8')+'</style>');
html=html.replace(/<script src="([^"]+)" defer><\/script>/g,(_,file)=>{
 file=file.split(/[?#]/)[0];
 let code=fs.readFileSync(path.join(root,file),'utf8');
 if(file==='src/home-art.js')code="const FootballHomeArt={src:'data:image/png;base64,"+fs.readFileSync(path.join(root,'assets/home-cover.png')).toString('base64')+"',width:1024,height:1536};";
 inlineScripts.push('<script>'+code.replace(/<\/script/gi,'<\\/script')+'</script>');return '';
});
// Inline classic scripts cannot defer. Start the game after its body nodes exist.
html=html.replace('</body>',()=>inlineScripts.join('\n')+'\n</body>');
html=html.replace('href="assets/favicon.svg"','href="data:image/svg+xml,'+encodeURIComponent(fs.readFileSync(path.join(root,'assets/favicon.svg'),'utf8'))+'"');
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
const file=path.join(root,'dist/football-life.html');fs.writeFileSync(file,html);
console.log('Offline game built: dist/football-life.html');
