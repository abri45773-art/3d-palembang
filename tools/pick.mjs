import fs from 'node:fs'; import zlib from 'node:zlib';
const f = fs.readFileSync(process.argv[2]);
let o = 8, W=0,H=0, idat=[];
while (o < f.length) {
  const len = f.readUInt32BE(o); const type = f.toString('ascii', o+4, o+8);
  if (type==='IHDR'){ W=f.readUInt32BE(o+8); H=f.readUInt32BE(o+12); }
  if (type==='IDAT') idat.push(f.subarray(o+8, o+8+len));
  o += 12+len;
}
const raw = zlib.inflateSync(Buffer.concat(idat));
const stride = W*3+1;
const px=(x,y)=>{const b=y*stride+1+x*3; return [raw[b],raw[b+1],raw[b+2]];};
for (const arg of process.argv.slice(3)) {
  const [x,y,label] = arg.split(',');
  const c = px(+x,+y);
  console.log(`(${x},${y}) ${label||''}`.padEnd(34), 'rgb('+c.join(',')+')', '#'+c.map(v=>v.toString(16).padStart(2,'0')).join(''));
}
