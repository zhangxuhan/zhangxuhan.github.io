(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.heading,.step,.path,.official-diagram,.explain>div,.box,.metric,.scale').forEach(el=>el.classList.add('reveal-tech'));
  if(!reduced){
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('tech-visible');io.unobserve(e.target)}}),{threshold:.12});
    document.querySelectorAll('.reveal-tech').forEach(el=>io.observe(el));
    const glow=document.createElement('div');glow.id='cursor-glow';document.body.appendChild(glow);
    addEventListener('pointermove',e=>{glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'});
    const hero=document.querySelector('.hero'),copy=document.querySelector('.hero-copy'),visual=document.querySelector('.hero .media');
    hero?.addEventListener('pointermove',e=>{const x=(e.clientX/innerWidth-.5);const y=(e.clientY/innerHeight-.5);if(copy)copy.style.transform=`translate3d(${x*-9}px,${y*-7}px,0)`;if(visual)visual.style.transform=`translate3d(${x*11}px,${y*8}px,0)`});
    hero?.addEventListener('pointerleave',()=>{if(copy)copy.style.transform='';if(visual)visual.style.transform=''});
    const canvas=document.createElement('canvas');canvas.id='tech-canvas';document.body.prepend(canvas);const ctx=canvas.getContext('2d');let w=0,h=0,dpr=1,pts=[];
    const resize=()=>{dpr=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);const count=Math.min(72,Math.max(28,Math.floor(w/22)));pts=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18,r:Math.random()*1.3+.45}))};
    const draw=()=>{ctx.clearRect(0,0,w,h);for(const p of pts){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>w)p.vx*=-1;if(p.y<0||p.y>h)p.vy*=-1;ctx.fillStyle='#6d90ff88';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const a=pts[i],b=pts[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);if(d<115){ctx.strokeStyle=`rgba(53,219,197,${(1-d/115)*.12})`;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}}requestAnimationFrame(draw)};
    addEventListener('resize',resize,{passive:true});resize();draw();
  }else document.querySelectorAll('.reveal-tech').forEach(el=>el.classList.add('tech-visible'));
})();
