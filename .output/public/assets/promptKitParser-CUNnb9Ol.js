var e=/^##\s*Prompt:\s*(.*)$/i;function t(t){if(!t)return[];let n=t.split(`
`),r=[],i=null;for(let t=0;t<n.length;t++){let a=n[t],o=a.match(e);o?(i&&r.push({index:r.length+1,title:i.title||`Untitled`,body:i.bodyLines.join(`
`).trim(),headingLine:i.headingLine}),i={title:(o[1]||``).trim(),bodyLines:[],headingLine:t}):i&&i.bodyLines.push(a)}return i&&r.push({index:r.length+1,title:i.title||`Untitled`,body:i.bodyLines.join(`
`).trim(),headingLine:i.headingLine}),r}function n(e){return t(e).length}function r(t){if(!t)return[];let n=t.split(`
`),r=[],i=[],a=null,o=0,s=()=>{let e=i.join(`
`).trim();e&&r.push({type:`prose`,markdown:e}),i=[]},c=()=>{a&&=(o+=1,r.push({type:`prompt`,index:o,title:a.title||`Untitled`,body:a.bodyLines.join(`
`).trim()}),null)};for(let t=0;t<n.length;t++){let r=n[t],o=r.match(e);o?(a?c():s(),a={title:(o[1]||``).trim(),bodyLines:[]}):a?a.bodyLines.push(r):i.push(r)}return a?c():s(),r}export{r as n,t as r,n as t};