# syntax=docker/dockerfile:1.7
FROM node:22-bookworm-slim

WORKDIR /app

COPY apps/api/README.md ./README.md

EXPOSE 10000

CMD ["node", "--eval", "const http=require('node:http'); const port=Number(process.env.PORT||10000); http.createServer((req,res)=>{ if(req.url==='/health'){ res.statusCode=200; res.setHeader('Content-Type','application/json; charset=utf-8'); res.end(JSON.stringify({status:'placeholder', service:'mountain-race-api'})); return; } res.statusCode=503; res.setHeader('Content-Type','text/plain; charset=utf-8'); res.end('mountain-race-api placeholder. Implement apps/api before production use.'); }).listen(port,'0.0.0.0',()=>{ console.log('mountain-race-api placeholder listening on '+port); });"]
