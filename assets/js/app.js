/* Drift Staging & Design Studio — client app.
   Portfolio renders from /data/portfolio.json so the admin CMS can manage it. */
(function(){
  "use strict";
  var esc=function(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  function get(url){return fetch(url,{cache:'no-cache'}).then(function(r){return r.ok?r.json():Promise.reject(r.status);});}

  function tiles(imgs){
    var n=imgs.length,t=[];
    if(n===0)return t;
    if(n===1)return [['half',imgs[0]],['half',imgs[0]]];
    t=[['big',imgs[0]],['small',imgs[1]]];
    var rest=imgs.slice(2),i=0;
    while(i<rest.length){
      var rem=rest.length-i;
      if(rem===1){t.push(['full',rest[i]]);i+=1;}
      else if(rem===2||rem===4){t.push(['half',rest[i]]);t.push(['half',rest[i+1]]);i+=2;}
      else{t.push(['third',rest[i]]);t.push(['third',rest[i+1]]);t.push(['third',rest[i+2]]);i+=3;}
    }
    return t;
  }
  function renderPortfolio(){
    var root=document.getElementById('portfolio-root'); if(!root) return Promise.resolve();
    return get('data/portfolio.json').then(function(d){var list=d.projects||d;
      root.innerHTML=list.map(function(p){
        var name=esc(p.name), loc=esc(p.location||''), imgs=p.images||[];
        var inner=tiles(imgs).map(function(t){return '<div class="tile '+t[0]+'" data-full="'+esc(t[1])+'"><img src="'+esc(t[1])+'" alt="'+name+'" loading="lazy"></div>';}).join('');
        return '<div class="project reveal in"><div class="project-head"><h3>'+name+'</h3><span class="loc">'+loc+'</span></div>'
          +'<div class="grid-gallery">'+inner+'</div></div>';
      }).join('');
    }).catch(function(){});
  }
  function initReveal(){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.12});
    document.querySelectorAll('.reveal:not(.in)').forEach(function(el){io.observe(el);});
  }
  function initNav(){
    var t=document.querySelector('.nav-toggle'); if(t)t.onclick=function(){document.querySelector('nav.main').classList.toggle('show');};
  }
  function initLightbox(){
    var lb=document.getElementById('lb'); if(!lb) return;
    var img=lb.querySelector('img'),list=[],i=0;
    function show(){img.src=list[i];}
    document.querySelectorAll('[data-full]').forEach(function(el){
      el.onclick=function(){
        list=[].slice.call(document.querySelectorAll('[data-full]')).map(function(x){return x.dataset.full;});
        i=Math.max(0,list.indexOf(el.dataset.full)); show(); lb.classList.add('open');
      };
    });
    lb.querySelector('.close').onclick=function(){lb.classList.remove('open');};
    lb.querySelector('.next').onclick=function(e){e.stopPropagation();i=(i+1)%list.length;show();};
    lb.querySelector('.prev').onclick=function(e){e.stopPropagation();i=(i-1+list.length)%list.length;show();};
    lb.addEventListener('click',function(e){if(e.target===lb)lb.classList.remove('open');});
    document.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;if(e.key==='Escape')lb.classList.remove('open');if(e.key==='ArrowRight')lb.querySelector('.next').click();if(e.key==='ArrowLeft')lb.querySelector('.prev').click();});
  }
  function initForm(){
    var form=document.querySelector('.lead-form'); if(!form) return;
    var success=document.querySelector('.form-success');
    form.addEventListener('submit',function(e){
      e.preventDefault(); if(!form.reportValidity())return;
      var btn=form.querySelector('button[type=submit]'); if(btn){btn.disabled=true;btn.textContent='Sending…';}
      var data=new URLSearchParams(new FormData(form)).toString();
      fetch(form.getAttribute('action')||'/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:data}).catch(function(){}).then(function(){
        form.style.display='none'; if(success){success.hidden=false;success.scrollIntoView({behavior:'smooth',block:'center'});}
      });
    });
  }
  function applyContent(){
    return get('data/content.json').then(function(c){
      Object.keys(c).forEach(function(k){
        var v=c[k]; if(v==null||v==='') return;
        if(typeof v==='object') return;
        document.querySelectorAll('[data-cms="'+k+'"]').forEach(function(el){
          if(k==='email'){ el.textContent=v; if(el.tagName==='A') el.href='mailto:'+v; }
          else if(k==='phone'){ el.textContent=v; if(el.tagName==='A') el.href='tel:'+v.replace(/[^0-9+]/g,''); }
          else { el.innerHTML=v; }
        });
      });
      if(c.social){ Object.keys(c.social).forEach(function(k){ var url=c.social[k];
        document.querySelectorAll('[data-social="'+k+'"]').forEach(function(el){ if(url){el.href=url;el.hidden=false;}else{el.hidden=true;} }); }); }
    }).catch(function(){});
  }
  document.addEventListener('DOMContentLoaded',function(){
    initNav(); applyContent();
    renderPortfolio().then(function(){ initReveal(); initLightbox(); initForm(); });
  });
})();
