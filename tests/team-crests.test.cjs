'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx={};vm.createContext(ctx);vm.runInContext(['era-2000.js','club-crests.js','team-crests.js'].map(f=>fs.readFileSync(path.join(root,'src',f),'utf8')).join('\n')+';this.era=FootballEra2000;this.original=FootballClubCrests;this.extra=FootballTeamCrests;',ctx);
test('every middle school, high school and 2000-season professional club has a real embedded emblem',()=>{
 const sources=JSON.parse(fs.readFileSync(path.join(root,'docs/team-crest-sources.json'),'utf8'));
 assert.equal(sources.entries.filter(x=>/^MS-|^HS-/.test(x.id)).length,24);
 for(const school of [...ctx.era.MIDDLE_SCHOOLS,...ctx.era.HIGH_SCHOOLS])assert.ok(ctx.extra.has(school.id),school.id);
 for(const club of ctx.era.CLUBS)assert.ok(ctx.extra.has(club.id)||ctx.original.src(club.id).includes(';base64,'),club.id);
 for(const item of sources.entries){const src=ctx.extra.src(item.id);assert.match(src,/^data:image\/(png|gif|jpeg|svg\+xml);base64,/);if(item.crop){const[x,y,w,h]=item.crop;assert.ok(w>0&&h>0&&x+w<=item.width&&y+h<=item.height,item.id);const svg=Buffer.from(src.split(',')[1],'base64').toString();assert.match(svg,/<image width="\d+" height="\d+"/);assert.doesNotMatch(svg,/(?:href|src)="https?:|<script/);}}
 assert.equal(ctx.extra.src('EN-charlton-U18'),ctx.extra.src('EN-charlton'));assert.equal(ctx.extra.src('unknown-team'),null);
 assert.equal(sources.continentalClubs.length,6);
 for(const club of sources.continentalClubs){assert.ok(ctx.extra.has(club.clubId));const image=ctx.extra.src(club.clubId);assert.match(image,/^data:image\/svg\+xml;base64,/);const svg=Buffer.from(image.split(',')[1],'base64').toString();assert.match(svg,/<svg/);assert.doesNotMatch(svg,/<script|onload=|<image[^>]+(?:href|src)=["']https?:/i);}
});
