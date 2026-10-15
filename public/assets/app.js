const $ = (selector, parent = document) => parent.querySelector(selector);
const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => Number(n).toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
const fold = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,'');
const names = {'motores':'Mecânica','lataria':'Lataria & Carroceria','capos-portas-e-tampas':'Capôs, Portas & Tampas','eletrica-automotiva/modulos':'Módulos','iluminacao':'Iluminação','eletrica-automotiva':'Elétrico','som-e-multimidia':'Rádio & Som','rodas':'Rodas & Pneus','cambios':'Transmissão','interior':'Interior'};
const nav = [['Promoção','promocoes'],['Mecânica','motores'],['Lataria & Carroceria','lataria'],['Módulos','eletrica-automotiva/modulos'],['Iluminação','iluminacao'],['Elétrico','eletrica-automotiva'],['Rádio & Som','som-e-multimidia'],['Rodas & Pneus','rodas'],['Transmissão','cambios'],['Interior','interior']];
let products = [], categories = [], bySlug = new Map(), byId = new Map(), routeSequence = 0;
let cart;
try { cart = JSON.parse(localStorage.getItem('stoffels-cart-v1') || '[]'); if (!Array.isArray(cart)) cart = []; } catch {cart = [];}
cart = cart.filter(x => x && typeof x.id === 'string' && Number.isInteger(x.quantity) && x.quantity > 0 && x.quantity <= 99);
const placeholder = '/favicon.svg';
const imageUrl = value => value.startsWith('/images/products/') && window.STOFFELS_CONFIG?.imageBaseUrl ? window.STOFFELS_CONFIG.imageBaseUrl.replace(/\/$/,'')+'/'+value.split('/').at(-1) : value;
const productUrl = p => '/' + p.slug;
const categoryTitle = slug => names[slug] || categories.find(c => c.slug === slug)?.name || slug.split('/').at(-1).replaceAll('-', ' ');

function go(url) {
  if (location.pathname + location.search !== url) history.pushState({}, '', url);
  renderRoute();
  window.scrollTo({top:0,behavior:'instant'});
  $('#category-menu').hidden = true;
  $('#category-toggle').setAttribute('aria-expanded','false');
}
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').classList.remove('visible'), 3000); }
function card(p) {
  const sale = p.price < p.originalPrice;
  return `<article class="product-card"><a class="product-image" href="${esc(productUrl(p))}"><img src="${esc(imageUrl(p.image || placeholder))}" alt="${esc(p.name)}" loading="lazy" width="280" height="230"><div class="seals">${sale ? `<span class="sale-seal">-${Math.round(100*(1-p.price/p.originalPrice))}%</span>` : ''}${p.featured ? '<span>DESTAQUE</span>' : ''}${!p.available ? '<span class="unavailable-seal">INDISPONÍVEL</span>' : ''}</div></a><a class="product-name" href="${esc(productUrl(p))}">${esc(p.name)}</a><div class="product-price">${sale ? `<del>${money(p.originalPrice)}</del>` : ''}<strong>${money(p.price)}</strong><small>Peça original ${p.brand ? esc(p.brand) : ''}</small><small class="free-shipping">Frete grátis</small></div><a class="view-product" href="${esc(productUrl(p))}">Ver produto <span>→</span></a></article>`;
}
function section(title, items, link='/catalogo') { return `<section class="container showcase"><div class="section-heading"><h2>${title}</h2><a href="${link}">Ver todos <span>→</span></a></div><div class="product-grid">${items.map(card).join('')}</div></section>`; }
function home() {
  const featured = products.filter(p => p.available && p.featured).slice(-8).reverse();
  const engines = products.filter(p => p.available && p.category.startsWith('motores/motor-parcial')).slice(-8).reverse();
  const tileCategories = ['iluminacao/farois','som-e-multimidia','eletrica-automotiva/modulos','capos-portas-e-tampas/portas/maquina-vidro'];
  const tileLabels = ['Faróis','Multimídia','Módulos','Máquina de vidro'];
  return `<section class="hero home-banner"><a href="/sobre"><img src="/images/brand/banner.png" alt="Stoffels: atendemos em nossa loja física na Rua Comandai, 1287, Centro, Guarani das Missões, RS." width="2172" height="724" fetchpriority="high"></a></section><section class="container home-welcome"><div><span class="eyebrow">STOFFELS AUTOPEÇAS</span><h1>Qual peça você procura?</h1><p>Originais e seminovas para seu veículo.</p></div><a href="/catalogo" class="welcome-link">Ver catálogo →</a></section>
  <section class="benefits container" aria-label="Vantagens"><div><span>▱</span><p><b>Frete grátis</b><small>Em todos os produtos, para todo o Brasil</small></p></div><div><span>♧</span><p><b>Qualidade e procedência</b><small>Peças automotivas originais</small></p></div><div><span>✓</span><p><b>Garantia de 90 dias</b><small>Mais segurança para seu veículo</small></p></div><div><span>⚙</span><p><b>Encontre a peça certa</b><small>Busque por modelo ou aplicação</small></p></div></section>
  <section class="container highlights"><div class="section-heading"><h2>Destaque</h2></div><div class="mosaic"><a href="/catalogo?q=Jeep"><img src="/images/brand/pecas-originais-stoffels-vermelho.png" alt="Peças originais: Jeep vermelho na identidade visual da Stoffels" width="1536" height="1024" loading="lazy" decoding="async"></a>${tileCategories.map((slug,i)=>{const p=products.find(p=>p.available && p.image && p.category===slug);return `<a class="category-highlight" href="/${slug}"><img src="${esc(imageUrl(p?.image||placeholder))}" alt="${tileLabels[i]}" width="280" height="230" loading="lazy"><strong>${tileLabels[i]}</strong></a>`;}).join('')}</div></section>
  ${section('Em destaque',featured)}
  <section class="category-section"><div class="container"><div class="section-heading"><h2>Encontre por categoria</h2><a href="/catalogo">Todo o catálogo →</a></div><div class="category-tiles">${nav.slice(1,9).map(([label,slug])=>`<a href="/${slug}"><span class="category-symbol">${{'motores':'⚙','lataria':'◇','eletrica-automotiva/modulos':'▣','iluminacao':'☼','eletrica-automotiva':'ϟ','som-e-multimidia':'♫','rodas':'◉','cambios':'⚒'}[slug]||'◇'}</span><b>${label}</b><small>Ver peças →</small></a>`).join('')}</div></div></section>
  ${section('Motores e componentes',engines,'/motores/motor-parcial')}
  <section class="brand-band"><div class="container"><div><span>STOFFELS AUTOPEÇAS</span><h2>A peça que você precisa.<br>A confiança que seu carro merece.</h2><p>Explore nosso catálogo de peças originais e seminovas.</p><a class="primary-button" href="/catalogo">Conhecer o catálogo →</a></div><span class="band-mark" aria-hidden="true">S<span>///</span></span></div></section>`;
}
function catalog(slug='') {
  const params = new URLSearchParams(location.search), q = params.get('q') || '', brand = params.get('marca') || '', availability = params.get('disponibilidade') || '', order = params.get('ordem') || 'relevancia';
  const selected = params.has('categoria') ? (params.get('categoria') || '') : (slug === 'promocoes' ? '' : slug);
  let result = products.filter(p => (!selected || p.category === selected || p.category.startsWith(selected+'/')) && (!q || fold(q).split(/\s+/).filter(Boolean).every(term=>fold(p.name+' '+p.brand+' '+p.model).includes(term))) && (!brand || p.brand === brand) && (!availability || (availability === 'sim' ? p.available : !p.available)) && (slug !== 'promocoes' || p.price < p.originalPrice));
  if (order === 'menor') result.sort((a,b)=>a.price-b.price);
  else if (order === 'maior') result.sort((a,b)=>b.price-a.price);
  else if (order === 'nome') result.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  else result.sort((a,b)=>Number(b.available)-Number(a.available)||Number(b.featured)-Number(a.featured)||Number(b.id)-Number(a.id));
  const pages = Math.max(1,Math.ceil(result.length/24)), page = Math.min(pages,Math.max(1,Number(params.get('pagina'))||1));
  const brands = [...new Set(products.filter(p=>!selected || p.category===selected || p.category.startsWith(selected+'/')).map(p=>p.brand).filter(Boolean))].sort();
  const title = q ? `Resultados para “${esc(q)}”` : slug === 'promocoes' ? 'Ofertas & Promoções' : selected ? esc(categoryTitle(selected)) : 'Catálogo de peças';
  return `<div class="container catalog-page"><div class="breadcrumbs"><a href="/">Início</a><span>›</span><span>${title}</span></div><div class="catalog-heading"><div><h1>${title}</h1><p>${result.length.toLocaleString('pt-BR')} produtos encontrados</p></div><label class="sort">Ordenar por<select id="sort"><option value="relevancia" ${order==='relevancia'?'selected':''}>Mais relevantes</option><option value="menor" ${order==='menor'?'selected':''}>Menor preço</option><option value="maior" ${order==='maior'?'selected':''}>Maior preço</option><option value="nome" ${order==='nome'?'selected':''}>Nome do produto</option></select></label></div>
  <div class="catalog-layout"><details class="filters"><summary>Filtrar produtos <span>⌄</span></summary><form id="filters"><label>Categoria<select name="categoria"><option value="">Todas as categorias</option>${categories.sort((a,b)=>a.slug.localeCompare(b.slug)).map(c=>`<option value="${esc(c.slug)}" ${c.slug===selected?'selected':''}>${c.slug.includes('/')?'↳ ':''}${esc(names[c.slug]||c.name)} (${c.count})</option>`).join('')}</select></label><label>Marca<select name="marca"><option value="">Todas as marcas</option>${brands.map(b=>`<option ${b===brand?'selected':''}>${esc(b)}</option>`).join('')}</select></label><label>Disponibilidade<select name="disponibilidade"><option value="">Todos os produtos</option><option value="sim" ${availability==='sim'?'selected':''}>Disponíveis</option><option value="nao" ${availability==='nao'?'selected':''}>Indisponíveis</option></select></label><button class="primary-button" type="submit">Aplicar filtros</button><a class="clear-filters" href="/catalogo">Limpar filtros</a></form><div class="filter-help"><b>Encontrou sua peça?</b><p>Confira o modelo, ano e código da peça para garantir a compatibilidade.</p></div></details><div><div class="product-grid catalog-grid">${result.slice((page-1)*24,page*24).map(card).join('') || '<div class="empty"><h2>Nenhuma peça encontrada</h2><p>Tente buscar por outra marca, modelo ou nome.</p><a href="/catalogo" class="primary-button">Ver todo o catálogo</a></div>'}</div><nav class="pagination" aria-label="Paginação">${page>1?`<button data-page="${page-1}" aria-label="Página anterior">←</button>`:''}${[...new Set([1,...Array.from({length:5},(_,i)=>page-2+i).filter(n=>n>1&&n<pages),pages])].map((n,i,arr)=>`${i&&n-arr[i-1]>1?'<span>…</span>':''}<button data-page="${n}" ${n===page?'aria-current="page" class="active"':''}>${n}</button>`).join('')}${page<pages?`<button data-page="${page+1}" aria-label="Próxima página">→</button>`:''}</nav></div></div></div>`;
}
function categoryPage() {
  const roots = categories.filter(c=>!c.slug.includes('/')).sort((a,b)=>categoryTitle(a.slug).localeCompare(categoryTitle(b.slug),'pt-BR'));
  return `<section class="container categories-page"><div class="page-intro"><span class="eyebrow">ENCONTRE SUA PEÇA</span><h1>Categorias</h1><p>Explore as linhas de peças para seu veículo.</p></div><div class="category-directory">${roots.map(c=>{const p=products.find(p=>p.available&&p.image&&(p.category===c.slug||p.category.startsWith(c.slug+'/')));return `<a href="/${esc(c.slug)}"><img src="${esc(imageUrl(p?.image||placeholder))}" alt="" width="120" height="100" loading="lazy"><b>${esc(categoryTitle(c.slug))}</b><small>${c.count.toLocaleString('pt-BR')} peças <span>→</span></small></a>`;}).join('')}</div></section>`;
}
function syncLayout(slug) {
  document.body.classList.toggle('has-purchase-bar',Boolean($('#main [data-add]')));
  const active = ['minha-conta','admin'].includes(slug) ? 'account' : !slug ? 'home' : slug==='categorias' ? 'categories' : slug==='catalogo' ? 'search' : 'categories';
  document.querySelectorAll('[data-mobile-tab]').forEach(el=>{
    el.classList.toggle('active',el.dataset.mobileTab===active);
    if(el.dataset.mobileTab===active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
  });
  const filters=$('details.filters');
  if(filters)filters.open=Boolean(window.matchMedia?.('(min-width: 960px)').matches);
}
function productPage(p) {
  const related = products.filter(x => x.id !== p.id && x.category === p.category && x.available).slice(0,4);
  return `<div class="container product-page"><div class="breadcrumbs"><a href="/">Início</a><span>›</span><a href="/${esc(p.category)}">${esc(p.categoryName||categoryTitle(p.category))}</a><span>›</span><span>${esc(p.name)}</span></div><div class="product-detail"><section class="gallery" aria-label="Galeria de fotos"><button id="zoom-photo" class="main-photo" aria-label="Ampliar foto do produto"><img id="main-photo" src="${esc(imageUrl(p.images[0]||placeholder))}" alt="${esc(p.name)}" width="650" height="550"><span>⌕ Ampliar imagem</span></button><div class="thumbnails">${p.images.map((img,i)=>`<button data-photo="${esc(imageUrl(img))}" class="${i===0?'selected':''}" aria-label="Ver foto ${i+1}"><img src="${esc(imageUrl(img))}" alt="Foto ${i+1} de ${esc(p.name)}" width="80" height="80" loading="lazy"></button>`).join('')}</div></section><section class="purchase"><div class="detail-badges"><span>PEÇA ORIGINAL</span>${p.featured?'<span>DESTAQUE</span>':''}</div><h1>${esc(p.name)}</h1><p class="product-reference">Código do catálogo: ${esc(p.id)} ${p.brand?'· Marca: '+esc(p.brand):''}</p><div class="availability ${p.available?'available':''}"><i></i>${p.available?'Produto disponível':'Produto indisponível no catálogo de origem'}</div><div class="detail-price">${p.price<p.originalPrice?`<del>${money(p.originalPrice)}</del>`:''}<strong>${money(p.price)}</strong></div>${p.available?`<div class="purchase-actions"><label>Quantidade<input type="number" min="1" max="99" value="1" id="quantity" aria-label="Quantidade"></label><button class="primary-button" data-add="${p.id}">Adicionar ao carrinho</button></div>`:'<p class="stock-note">Este produto permanece no catálogo para consulta. No momento, ele não está disponível para compra.</p>'}<p class="checkout-note">O pagamento online estará disponível em breve.</p><div class="detail-assurances"><p class="free-shipping">✓ Frete grátis para todo o Brasil</p><p>✓ Garantia de 90 dias</p><p>✓ Fotos da peça disponíveis na galeria</p><p>✓ Confira o código e a aplicação antes de comprar</p></div></section></div><section class="description"><h2>Detalhes e aplicação da peça</h2><div class="description-content">${p.description || '<p>Confira as fotos, o modelo e a aplicação da peça. Informações adicionais não estão disponíveis no catálogo de origem.</p>'}</div>${p.model?`<p><strong>Modelo:</strong> ${esc(p.model)}</p>`:''}</section></div>${related.length?section('Produtos relacionados',related,'/'+p.category):''}`;
}
async function renderRoute() {
  const sequence = ++routeSequence;
  const slug = decodeURIComponent(location.pathname).replace(/^\/+|\/+$/g,'');
  const p = bySlug.get(slug);
  document.body.classList.remove('has-purchase-bar');
  $('meta[name="description"]').content = 'Encontre peças automotivas originais e seminovas na Stoffels. Motores, lataria, faróis, câmbios e acessórios.';
  $('#search input').value = new URLSearchParams(location.search).get('q') || '';
  if (slug==='minha-conta'||slug==='admin') {await accountPage(slug,sequence);document.title=(slug==='admin'?'Administração':'Minha conta')+' | Stoffels';syncLayout(slug);return;}
  if (p) {
    $('#main').innerHTML = '<div class="container loading">Carregando detalhes da peça…</div>';
    try {
      const response = await fetch(window.STOFFELS_CONFIG?.databaseApi ? `/api/product?id=${p.id}` : `/data/products/${p.id}.json`);
      if (!response.ok) throw new Error();
      const full = await response.json();
      if (sequence !== routeSequence) return;
      $('#main').innerHTML = productPage(full);
      document.title = p.name+' | Stoffels';
      $('meta[name="description"]').content = `${p.name}. ${full.brand || ''} Confira fotos, preço e aplicação na Stoffels.`;
    } catch {
      if (sequence === routeSequence) $('#main').innerHTML = '<div class="container empty"><h1>Não foi possível carregar esta peça</h1><p>Atualize a página para tentar novamente.</p><a href="/catalogo">Voltar ao catálogo</a></div>';
    }
  } else if (!slug) { $('#main').innerHTML = home(); document.title = 'Stoffels | Autopeças Originais e Seminovas'; }
  else if (slug === 'sobre') { $('#main').innerHTML = '<section class="container about"><span class="eyebrow">STOFFELS AUTOPEÇAS</span><h1>Peças originais.<br>Novos caminhos.</h1><p>Encontre peças automotivas originais e seminovas para seu veículo. Nosso catálogo reúne motores, lataria, iluminação, transmissão e acessórios de diversas marcas.</p><a class="primary-button" href="/catalogo">Explorar catálogo →</a></section>'; document.title='Sobre a Stoffels | Autopeças'; }
  else if (slug==='categorias') {$('#main').innerHTML=categoryPage();document.title='Categorias | Stoffels';}
  else if (['catalogo','promocoes'].includes(slug)||categories.some(c=>c.slug===slug)) { $('#main').innerHTML = catalog(['catalogo','categorias'].includes(slug)?'':slug); document.title = (slug==='catalogo'?'Catálogo':categoryTitle(slug))+' | Stoffels'; }
  else { $('#main').innerHTML='<section class="container empty"><h1>Página não encontrada</h1><a class="primary-button" href="/catalogo">Voltar ao catálogo</a></section>'; document.title='Página não encontrada | Stoffels'; }
  syncLayout(slug);
}
function saveCart() { try {localStorage.setItem('stoffels-cart-v1',JSON.stringify(cart));} catch {} const amount=cart.reduce((n,x)=>n+x.quantity,0);$('#cart-count').textContent=amount;$('#mobile-cart-count').textContent=amount;$('#mobile-cart-count').hidden=amount===0; }
function cartContent() {
  const entries = cart.map(item=>({...item,p:byId.get(item.id)})).filter(item=>item.p);
  const total = entries.reduce((n,item)=>n+item.p.price*item.quantity,0);
  $('#cart-content').innerHTML = entries.length ? `${entries.map(({p,quantity})=>`<div class="cart-item"><img src="${esc(imageUrl(p.image||placeholder))}" alt="${esc(p.name)}" width="80" height="80"><div><a href="${esc(productUrl(p))}" data-close-cart>${esc(p.name)}</a><strong>${money(p.price)}</strong><div class="cart-controls"><button data-quantity="${p.id}" data-delta="-1" aria-label="Diminuir quantidade">−</button><span>${quantity}</span><button data-quantity="${p.id}" data-delta="1" aria-label="Aumentar quantidade">+</button><button data-remove="${p.id}" class="remove">Remover</button></div>${!p.available?'<small>Produto indisponível</small>':''}</div></div>`).join('')}<div class="cart-total"><span>Subtotal</span><strong>${money(total)}</strong></div><div class="cart-total"><span>Frete</span><strong class="free-shipping">Grátis</strong></div><div class="cart-total"><span>Total</span><strong>${money(total)}</strong></div><p class="checkout-note">Checkout em configuração. Nenhum pedido ou pagamento será realizado neste momento.</p><button class="primary-button" id="continue-shopping">Continuar comprando</button>`:'<div class="empty"><h3>Seu carrinho está vazio</h3><p>Encontre a peça que seu carro precisa.</p><button class="primary-button" id="continue-shopping">Ver catálogo</button></div>';
}
const dialogs = {
  support:['Fale com a Stoffels','Os canais de atendimento da Stoffels serão informados em breve.'],
  warranty:['Garantia das peças','As peças do catálogo de origem têm garantia de 90 dias. Confira o estado, o código e a aplicação da peça antes da compra. As condições de atendimento da Stoffels serão informadas antes da abertura das vendas.'],
  shipping:['Envio e entrega','Todos os produtos têm frete grátis para todo o Brasil, sem valor mínimo de compra. O prazo de entrega será informado pela loja conforme o destino.'],
  compatibility:['Compatibilidade','Confira marca, modelo, ano, motorização e código original da peça. A semelhança visual não garante compatibilidade. Consulte um profissional antes da instalação.']
};
document.addEventListener('click', event => {
  const anchor = event.target.closest('a');
  if (anchor && anchor.origin === location.origin && !anchor.hash && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button===0) { event.preventDefault(); if (anchor.hasAttribute('data-close-cart')) $('#cart-dialog').close(); go(anchor.pathname+anchor.search); return; }
  const target = event.target.closest('button');
  if (!target) return;
  if (target.dataset.dialog==='account') {go('/minha-conta');return;}
  if (target.dataset.dialog) { const [title,text]=dialogs[target.dataset.dialog]; $('#dialog-content').innerHTML=`<h2>${title}</h2><p>${text}</p>`; $('#info-dialog').showModal(); }
  if (target.id==='dialog-close') $('#info-dialog').close();
  if (target.id==='category-toggle') { $('#category-menu').hidden=!$('#category-menu').hidden; target.setAttribute('aria-expanded',String(!$('#category-menu').hidden)); }
  if (target.id==='cart-toggle' || target.hasAttribute('data-open-cart')) { cartContent(); $('#cart-dialog').showModal(); }
  if (target.hasAttribute('data-mobile-search')) {go('/catalogo');$('#search input').focus();}
  if (target.id==='cart-close') $('#cart-dialog').close();
  if (target.id==='continue-shopping') { $('#cart-dialog').close(); go('/catalogo'); }
  if (target.dataset.add) { const p=byId.get(target.dataset.add); if (!p?.available) return; const quantity=Math.min(99,Math.max(1,Math.floor(Number($('#quantity')?.value)||1))); const existing=cart.find(x=>x.id===p.id); if(existing)existing.quantity=Math.min(99,existing.quantity+quantity);else cart.push({id:p.id,quantity});saveCart();toast('Peça adicionada ao carrinho'); }
  if (target.dataset.remove) { cart=cart.filter(x=>x.id!==target.dataset.remove);saveCart();cartContent(); }
  if (target.dataset.quantity) { const item=cart.find(x=>x.id===target.dataset.quantity);if(item)item.quantity=Math.min(99,item.quantity+Number(target.dataset.delta));cart=cart.filter(x=>x.quantity>0);saveCart();cartContent(); }
  if (target.dataset.photo) { $('#main-photo').src=target.dataset.photo;document.querySelectorAll('[data-photo]').forEach(x=>x.classList.toggle('selected',x===target)); }
  if (target.id==='zoom-photo') { $('#dialog-content').innerHTML=`<img class="zoomed" src="${esc($('#main-photo').src)}" alt="${esc($('#main-photo').alt)}">`;$('#info-dialog').showModal(); }
  if (target.dataset.page) { const params=new URLSearchParams(location.search);params.set('pagina',target.dataset.page);go(location.pathname+'?'+params); }
});
document.addEventListener('submit',event=>{
  if(event.target.id==='search'){event.preventDefault();const q=$('#search input').value.trim();go('/catalogo'+(q?'?q='+encodeURIComponent(q):''));}
  if(event.target.id==='filters'){event.preventDefault();applyFilters(event.target);}
});
function applyFilters(form) {
  const wasOpen=Boolean(form.closest('details')?.open);
  const scrollTop=window.scrollY;
  const params=new URLSearchParams(location.search);
  const data=new FormData(form);
  const category=String(data.get('categoria') || '');
  const brand=String(data.get('marca') || '');
  // Ao trocar de categoria, uma marca incompatível não pode continuar escondida no filtro.
  if(brand && !products.some(p=>p.brand===brand && (!category || p.category===category || p.category.startsWith(category+'/')))) data.set('marca','');
  params.delete('pagina');
  for(const [key,value] of data) {if(value)params.set(key,String(value));else params.delete(key);}
  const route=location.pathname==='/promocoes'?'/promocoes':'/catalogo';
  const query=params.toString();
  go(route+(query?'?'+query:''));
  const panel=$('details.filters');
  if(panel && wasOpen)panel.open=true;
  window.scrollTo({top:scrollTop,behavior:'instant'});
}
document.addEventListener('change',event=>{
  if(event.target.id==='sort'){const params=new URLSearchParams(location.search);params.set('ordem',event.target.value);params.delete('pagina');go(location.pathname+'?'+params);}
  else if(event.target.matches('#filters select'))applyFilters(event.target.closest('form'));
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){$('#category-menu').hidden=true;$('#category-toggle').setAttribute('aria-expanded','false');}});
document.addEventListener('click',event=>{if(!event.target.closest('.search-wrap')){$('#category-menu').hidden=true;$('#category-toggle').setAttribute('aria-expanded','false');}});
for (const d of document.querySelectorAll('dialog')) d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
window.addEventListener('popstate',renderRoute);
window.matchMedia?.('(min-width: 960px)').addEventListener('change',()=>{const filters=$('details.filters');if(filters)filters.open=window.matchMedia('(min-width: 960px)').matches;});
$('#year').textContent = new Date().getFullYear();
$('#primary-nav').innerHTML=nav.map(([name,slug],i)=>`<a href="/${slug}" class="${i===0?'promotion':''}">${name}<span>⌄</span></a>`).join('');
async function accountApi(action,data={}) {
  const response=await fetch('/api/auth',action?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data})}:{});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível acessar sua conta.');return result;
}
function loginForm(admin=false) {
  const register=!admin&&new URLSearchParams(location.search).get('cadastro')==='1';
  return `<section class="container account-page"><div class="account-card"><span class="eyebrow">${admin?'ADMINISTRAÇÃO':'MINHA CONTA'}</span><h1>${register?'Criar minha conta':admin?'Entrar no painel':'Entrar na minha conta'}</h1><p>${admin?'Acesso exclusivo da equipe Stoffels.':'Acesse sua conta na Stoffels.'}</p><form id="account-form" data-action="${register?'register':'login'}">${register?'<label>Nome completo<input name="name" autocomplete="name" minlength="2" maxlength="100" required></label>':''}<label>E-mail<input name="email" type="email" autocomplete="username" maxlength="254" required></label><label>Senha<input name="password" type="password" autocomplete="${register?'new-password':'current-password'}" ${register?'minlength="12"':''} maxlength="256" required></label>${register?'<small>Use pelo menos 12 caracteres.</small>':''}<p class="form-message" role="status" aria-live="polite"></p><button class="primary-button" type="submit">${register?'Criar conta':'Entrar'}</button></form>${admin?'<a href="/minha-conta">Acesso do cliente →</a>':`<a href="/minha-conta${register?'':'?cadastro=1'}">${register?'Já tenho uma conta':'Quero criar minha conta'} →</a>`}<p class="account-help">Se precisar recuperar o acesso, entre em contato com a loja.</p></div></section>`;
}
async function accountPage(slug,sequence) {
  const admin=slug==='admin';
  $('#main').innerHTML='<section class="container loading">Verificando seu acesso…</section>';
  try {
    const {user}=await accountApi();if(sequence!==routeSequence)return;
    if(!user){$('#main').innerHTML=loginForm(admin);return;}
    if(admin){
      if(user.role!=='admin'){$('#main').innerHTML='<section class="container account-page"><div class="account-card"><h1>Acesso restrito</h1><p>Esta conta não tem permissão para acessar a administração.</p><a href="/minha-conta">Voltar à minha conta</a><button class="primary-button" data-logout>Sair da conta</button></div></section>';return;}
      const response=await fetch('/api/admin');const result=await response.json();if(!response.ok)throw new Error(result.error);if(sequence!==routeSequence)return;
      $('#main').innerHTML=`<section class="container account-page"><div class="account-card"><span class="eyebrow">ADMINISTRAÇÃO STOFFELS</span><h1>Olá, ${esc(user.name)}</h1><p>Seu acesso administrativo está ativo.</p><div class="account-stats"><p><strong>${result.summary.products}</strong>Peças</p><p><strong>${result.summary.customers}</strong>Clientes</p><p><strong>${result.summary.orders}</strong>Pedidos</p></div><p>O gerenciamento de peças e pedidos será disponibilizado na próxima etapa.</p><a href="/minha-conta">Minha conta e segurança →</a><button class="primary-button" data-logout>Sair da conta</button><p class="form-message" role="status"></p></div></section>`;return;
    }
    $('#main').innerHTML=`<section class="container account-page"><div class="account-card"><span class="eyebrow">MINHA CONTA</span><h1>Olá, ${esc(user.name)}</h1><p>${esc(user.email)}</p>${user.role==='admin'?'<a href="/admin">Abrir administração →</a>':''}<h2>Segurança da conta</h2><form id="account-form" data-action="password"><label>Senha atual<input name="currentPassword" type="password" autocomplete="current-password" required maxlength="256"></label><label>Nova senha<input name="password" type="password" autocomplete="new-password" minlength="12" maxlength="256" required></label><small>Use pelo menos 12 caracteres. A troca encerra os outros acessos à conta.</small><p class="form-message" role="status" aria-live="polite"></p><button class="primary-button" type="submit">Alterar senha</button></form><button class="account-logout" data-logout>Sair da conta</button><p class="form-message" role="status"></p></div></section>`;
  }catch(error){if(sequence===routeSequence)$('#main').innerHTML=`<section class="container account-page"><div class="account-card"><h1>Acesso indisponível</h1><p role="alert">${esc(error.message)}</p><a href="/${admin?'admin':'minha-conta'}">Tentar novamente →</a></div></section>`;}
}
document.addEventListener('submit',async event=>{
 if(event.target.id!=='account-form')return;
 event.preventDefault();const form=event.target,button=form.querySelector('[type="submit"]'),message=form.querySelector('.form-message');
 button.disabled=true;message.textContent='Aguarde…';
 try{
  const result=await accountApi(form.dataset.action,Object.fromEntries(new FormData(form)));
  if(form.dataset.action==='password'){form.reset();message.textContent=result.message;}else await renderRoute();
 }catch(error){message.textContent=error.message;}finally{button.disabled=false;}
});
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-logout]');if(!button)return;button.disabled=true;
 try{await accountApi('logout');go(location.pathname==='/admin'?'/admin':'/minha-conta');}
 catch(error){const message=$('#main .form-message');if(message)message.textContent=error.message;}finally{button.disabled=false;}
});

async function boot(){
  try {
    let imported;
    if(window.STOFFELS_CONFIG?.databaseApi) {
      const response=await fetch('/api/catalog');
      if(!response.ok)throw new Error('Catálogo indisponível');
      imported=await response.json();
    } else {
      const [p,c]=await Promise.all([fetch('/data/catalog.json'),fetch('/data/categories.json')]);
      if(!p.ok||!c.ok)throw new Error('Catálogo indisponível');
      imported={products:await p.json(),categories:await c.json()};
    }
    products=imported.products;categories=imported.categories;
    bySlug=new Map(products.map(p=>[p.slug,p]));byId=new Map(products.map(p=>[p.id,p]));
    $('#category-menu').innerHTML='<b>Linhas de peças</b>'+categories.filter(c=>!c.slug.includes('/')).sort((a,b)=>a.name.localeCompare(b.name)).map(c=>`<a href="/${esc(c.slug)}">${esc(names[c.slug]||c.name)} <span>›</span></a>`).join('')+'<a class="all-catalog" href="/catalogo">Ver todo o catálogo →</a>';
    cart=cart.filter(x=>byId.has(x.id));saveCart();await renderRoute();
  } catch { if(['/minha-conta','/admin'].includes(location.pathname)){await renderRoute();return;} $('#main').innerHTML='<section class="container empty"><h1>O catálogo não carregou</h1><p>Verifique sua conexão e atualize a página.</p></section>'; }
}
boot();
