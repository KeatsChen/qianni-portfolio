// Local static preview with Pages-style .html → clean-URL redirects.
// This emulates file routing, not Cloudflare's CDN, account rules or deployment.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.mp4':'video/mp4','.m4a':'audio/mp4','.pdf':'application/pdf','.ico':'image/x-icon'};
export async function startPreview(port=0) {
  const server = http.createServer((request,response) => {
    const url = new URL(request.url,'http://localhost');
    let route;
    try { route=decodeURIComponent(url.pathname); } catch { response.writeHead(400).end(); return; }
    if (route.endsWith('.html')) {
      const clean=route==='/index.html' ? '/' : route.slice(0,-5);
      response.writeHead(308,{Location:clean+url.search,'Cache-Control':'no-cache'}).end(); return;
    }
    if (route==='/index') { response.writeHead(308,{Location:'/'+url.search}).end(); return; }
    if (route.endsWith('/') && route!=='/' && fs.existsSync(path.join(root,route.slice(1,-1)+'.html'))) {
      response.writeHead(308,{Location:route.slice(0,-1)+url.search}).end(); return;
    }
    let file=path.resolve(root,'.'+route);
    if (!file.startsWith(root+path.sep) && file!==root || route.split('/').some(part=>part.startsWith('.'))) { response.writeHead(403).end(); return; }
    if (route==='/') file=path.join(root,'index.html');
    else if (!path.extname(file)) file+='.html';
    let stat;
    try { stat=fs.statSync(file); if(!stat.isFile()) throw Error(); } catch { response.writeHead(404).end('Not found'); return; }
    const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
    const range=request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    let start=0,end=stat.size-1;
    if(range) { start=Number(range[1]); if(range[2])end=Math.min(end,Number(range[2])); }
    if(start>end||start>=stat.size){response.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
    headers['Content-Length']=end-start+1;
    if(range)headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
    response.writeHead(range?206:200,headers);
    if(request.method==='HEAD'){response.end();return;}
    const stream=fs.createReadStream(file,{start,end});
    stream.on('error',()=>response.destroy());
    response.on('close',()=>stream.destroy());
    stream.pipe(response);
  });
  await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
  return {origin:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();})};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const i=process.argv.indexOf('--port');
  const preview=await startPreview(i<0?4175:Number(process.argv[i+1]));
  console.log(`Cloudflare-style preview: ${preview.origin}/`);
}
