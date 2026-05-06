async function loadExhibits(){
  try{
    const res = await fetch('exhibits.json');
    const exhibits = await res.json();
    renderGrid(exhibits);
    initScrollAnimations();
  }catch(e){
    console.error('Failed to load exhibits', e);
  }
}

function initScrollAnimations(){
  // mark elements for reveal
  const sections = Array.from(document.querySelectorAll('.section'));
  const cards = Array.from(document.querySelectorAll('.card'));
  const toObserve = sections.concat(cards).filter(Boolean);
  toObserve.forEach(el => el.classList.add('reveal'));

  // reuse global reveal observer when available so dynamically-added items can be observed
  if(window._revealObserver){
    toObserve.forEach(el=>window._revealObserver.observe(el));
  } else {
    const observer = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
        } else {
          entry.target.classList.remove('in-view');
        }
      });
    }, {root:null, rootMargin:'0px 0px -10% 0px', threshold: 0.12});

    toObserve.forEach(el=>observer.observe(el));
    window._revealObserver = observer;
  }

  // subtle parallax for hero graphic
  const hero = document.querySelector('.hero-graphic');
  if(hero){
    let ticking = false;
    window.addEventListener('scroll', ()=>{
      if(ticking) return;
      ticking = true;
      window.requestAnimationFrame(()=>{
        const rect = hero.getBoundingClientRect();
        const offset = Math.max(Math.min(-rect.top * 0.06, 30), -30);
        hero.style.transform = `translateY(${offset}px)`;
        ticking = false;
      });
    }, {passive:true});
  }
}

function chooseImage(ex){
  return ex && ex.localImage ? ex.localImage : (ex && ex.image ? ex.image : '');
}

function renderGrid(exhibits){
  const grid = document.getElementById('exhibit-grid');
  grid.innerHTML = '';
  exhibits.forEach(ex => {
    const card = document.createElement('article');
    card.className = 'card';
    const imgSrc = chooseImage(ex);
    card.innerHTML = `
      <div class="thumb-wrap"><img class="thumb" src="${imgSrc}" alt="${ex.title}" loading="lazy"></div>
      <div class="card-body">
        <h3>${ex.title}</h3>
        <p>${ex.description.substring(0,140)}...</p>
        <div class="meta">${ex.period}</div>
        <div class="card-actions"><a class="details" href="exhibit.html?id=${ex.id}">View details</a></div>
      </div>`;

    // image fallback: if local fails, try remote image
    const imgEl = card.querySelector('img.thumb');
    imgEl.addEventListener('error', ()=>{
      if(ex.image && imgEl.src !== ex.image) imgEl.src = ex.image;
    });

    imgEl.addEventListener('click', ()=> openModal(ex));
    // ensure the detail link resolves correctly even when served from a subpath
    const detailLink = card.querySelector('a.details');
    if(detailLink){
      try{
        detailLink.href = new URL(`exhibit.html?id=${ex.id}`, document.baseURI).href;
      }catch(e){
        // fallback: leave relative href as-is
      }
      // If some other script prevents the default navigation, ensure we still navigate.
      detailLink.addEventListener('click', (evt)=>{
        if(evt.defaultPrevented){
          window.location.href = detailLink.href;
        }
      });
    }
    grid.appendChild(card);
  });
}

function openModal(ex){
  const modal = document.getElementById('modal');
  const main = document.querySelector('main');
  // remember focus
  window._lastFocused = document.activeElement;
  modal.setAttribute('aria-hidden','false');
  if(main) main.setAttribute('aria-hidden','true');
  const img = document.getElementById('modal-img');
  img.src = chooseImage(ex);
  img.alt = ex.title;
  // compose caption with attribution + license
  const capParts = [];
  if(ex.credit) capParts.push(ex.credit);
  if(ex.author) capParts.push('By ' + ex.author);
  if(ex.source) capParts.push(`<a href="${ex.source}" target="_blank" rel="noopener">Source</a>`);
  if(ex.license_url) capParts.push(`<a href="${ex.license_url}" target="_blank" rel="noopener">${ex.license || 'License'}</a>`);
  document.getElementById('modal-caption').innerHTML = capParts.join(' — ');
  document.getElementById('modal-body').innerHTML = `<h3>${ex.title}</h3><p>${ex.description}</p><p><strong>Period:</strong> ${ex.period}</p><p><strong>Curator notes:</strong> ${ex.curatorNotes || ''}</p>`;
  // focus management & keyboard
  const closeBtn = document.getElementById('modal-close');
  closeBtn.focus();
  window._modalKeyHandler = function(e){
    if(e.key === 'Escape') closeModal();
    if(e.key === 'Tab') handleModalTab(e);
  };
  document.addEventListener('keydown', window._modalKeyHandler);
}

function closeModal(){
  const modal = document.getElementById('modal');
  const main = document.querySelector('main');
  modal.setAttribute('aria-hidden','true');
  if(main) main.removeAttribute('aria-hidden');
  document.getElementById('modal-img').src = '';
  // restore focus
  try{ if(window._modalKeyHandler) document.removeEventListener('keydown', window._modalKeyHandler); }catch(e){}
  if(window._lastFocused && typeof window._lastFocused.focus === 'function') window._lastFocused.focus();
}

function handleModalTab(e){
  const modal = document.getElementById('modal');
  const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
  if(!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length-1];
  if(e.shiftKey){
    if(document.activeElement === first){
      e.preventDefault();
      last.focus();
    }
  }else{
    if(document.activeElement === last){
      e.preventDefault();
      first.focus();
    }
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadExhibits();
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', (e)=>{
    if(e.target.id === 'modal') closeModal();
  });
  // allow Enter on focused card to open modal for keyboard users
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' && document.activeElement && document.activeElement.closest && document.activeElement.closest('.card')){
      const card = document.activeElement.closest('.card');
      const idx = Array.from(document.querySelectorAll('.card')).indexOf(card);
      // safe: fetch exhibits and open the one at idx
      fetch('exhibits.json').then(r=>r.json()).then(list=>{ if(list[idx]) openModal(list[idx]); }).catch(()=>{});
    }
  });
  // initialize story feed (infinite scroll + spec-driven rendering)
  initStoryLoading();
});

/* Story / infinite scroll + spec-driven rendering */
window._storyState = window._storyState || { page:0, perPage:4, cache:[], loading:false, loop:false, sentinelObserver:null };

function initStoryLoading(){
  const loopCheckbox = document.getElementById('story-loop');
  if(loopCheckbox){
    loopCheckbox.addEventListener('change', (e)=>{ window._storyState.loop = !!e.target.checked; });
  }
  const sentinel = document.getElementById('story-sentinel');
  if(!sentinel) return;
  // create sentinel observer
  const observer = new IntersectionObserver((entries)=>{
    if(entries[0].isIntersecting){
      loadStoryChunk();
    }
  }, {root:null, rootMargin:'400px'});
  observer.observe(sentinel);
  window._storyState.sentinelObserver = observer;
  // load first chunk
  loadStoryChunk();
}

async function loadStoryChunk(){
  if(window._storyState.loading) return;
  window._storyState.loading = true;
  try{
    if(!window._storyState.cache || !window._storyState.cache.length){
      window._storyState.cache = await fetch('story.json').then(r=>r.json());
      // optionally read spec
      try{ window._siteSpec = await fetch('site-spec.json').then(r=>r.json()); }catch(e){ window._siteSpec = null; }
      // derive perPage from spec if present
      if(window._siteSpec && window._siteSpec.site && window._siteSpec.site.story && window._siteSpec.site.story.paging && window._siteSpec.site.story.paging.pageSize){
        window._storyState.perPage = window._siteSpec.site.story.paging.pageSize;
      }
    }

    const start = window._storyState.page * window._storyState.perPage;
    let items = window._storyState.cache.slice(start, start + window._storyState.perPage);
    if(items.length === 0 && window._storyState.loop){
      window._storyState.page = 0;
      items = window._storyState.cache.slice(0, window._storyState.perPage);
    }
    if(items.length) appendStoryItems(items);
    window._storyState.page += 1;
    // if we've exhausted items and not looping, disconnect sentinel observer
    if(window._storyState.page * window._storyState.perPage >= window._storyState.cache.length && !window._storyState.loop){
      if(window._storyState.sentinelObserver) window._storyState.sentinelObserver.disconnect();
    }
  }catch(e){
    console.error('Failed to load story chunk', e);
  }finally{
    window._storyState.loading = false;
  }
}

function appendStoryItems(items){
  const feed = document.getElementById('story-feed');
  if(!feed) return;
  items.forEach(it=>{
    const article = document.createElement('article');
    article.className = 'story-item card reveal';
    const imgSrc = it.image || '';
    article.innerHTML = `
      <figure>
        <img src="${imgSrc}" alt="${it.title}">
      </figure>
      <div class="content">
        <h3>${it.title}</h3>
        <div class="summary">${it.summary}</div>
        <div class="body">${it.body}</div>
        <div class="meta">By ${it.author || 'Unknown'}</div>
      </div>
    `;
    feed.appendChild(article);
    // make sure reveal observer observes the new element
    try{ if(window._revealObserver) window._revealObserver.observe(article); }
    catch(e){}
  });
}
