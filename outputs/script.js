const themeToggle=document.querySelector('.theme-toggle');
const root=document.documentElement;
let savedTheme=null;
try{savedTheme=localStorage.getItem('prizma-theme');}catch{}
if(savedTheme==='light'||savedTheme==='dark')root.dataset.theme=savedTheme;
const syncThemeToggle=()=>{const light=root.dataset.theme==='light';themeToggle.setAttribute('aria-pressed',String(light));themeToggle.setAttribute('aria-label',light?'Koyu temaya geç':'Açık temaya geç');themeToggle.title=light?'Koyu temaya geç':'Açık temaya geç';document.querySelector('meta[name="theme-color"]').content=light?'#f8f9fa':'#0b0b0c';};
syncThemeToggle();
themeToggle.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='light'?'dark':'light';try{localStorage.setItem('prizma-theme',root.dataset.theme);}catch{}syncThemeToggle();});

const menuButton=document.querySelector('.menu-toggle');
const mobileMenu=document.querySelector('.mobile-menu');
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Menüyü kapat':'Menüyü aç');mobileMenu.classList.toggle('open',open);mobileMenu.setAttribute('aria-hidden',String(!open));});
mobileMenu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Menüyü aç');mobileMenu.classList.remove('open');mobileMenu.setAttribute('aria-hidden','true');}));

const chairDialog=document.querySelector('.chair-dialog');
document.querySelector('.chair-detail').addEventListener('click',()=>chairDialog.showModal());
document.querySelector('.dialog-close').addEventListener('click',()=>chairDialog.close());
chairDialog.addEventListener('click',event=>{if(event.target===chairDialog)chairDialog.close();});

const form=document.querySelector('#apply-form');
const successOverlay=document.querySelector('.success-overlay');
const successPanel=successOverlay.querySelector('.confirm-dialog');
let successCloseTimer;
let successHideTimer;
function closeSuccessNotice(){
  if(successOverlay.hidden)return;
  window.clearTimeout(successCloseTimer);window.clearTimeout(successHideTimer);
  successOverlay.classList.remove('is-visible');successOverlay.setAttribute('aria-hidden','true');
  document.body.classList.remove('has-success-overlay');
  successHideTimer=window.setTimeout(()=>{successOverlay.hidden=true;},360);
}
function showSuccessNotice(){
  window.clearTimeout(successCloseTimer);window.clearTimeout(successHideTimer);
  successOverlay.hidden=false;successOverlay.setAttribute('aria-hidden','false');
  document.body.classList.add('has-success-overlay');
  requestAnimationFrame(()=>{successOverlay.classList.add('is-visible');successPanel.focus();});
  successCloseTimer=window.setTimeout(closeSuccessNotice,2800);
}
successOverlay.querySelector('.confirm-close').addEventListener('click',closeSuccessNotice);
successOverlay.querySelector('.confirm-done').addEventListener('click',closeSuccessNotice);
successOverlay.addEventListener('click',event=>{if(event.target===successOverlay)closeSuccessNotice();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!successOverlay.hidden)closeSuccessNotice();});
form.addEventListener('submit',async event=>{
  event.preventDefault();
  const feedback=form.querySelector('.form-feedback');
  if(!form.reportValidity())return;
  const data=Object.fromEntries(new FormData(form).entries());
  const button=form.querySelector('.submit-button');
  feedback.textContent='';feedback.classList.remove('is-error');
  button.disabled=true;button.setAttribute('aria-busy','true');form.classList.add('is-sending');
  const controller=new AbortController();
  const requestTimeout=window.setTimeout(()=>controller.abort(),25000);
  try{
    const response=await fetch('/api/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:controller.signal});
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||'Başvuru gönderilemedi. Lütfen bilgilerinizi kontrol edip tekrar deneyin.');
    form.reset();feedback.textContent='';showSuccessNotice();
  }catch(error){
    feedback.textContent=error.name==='AbortError'?'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.':(error.message||'Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    feedback.classList.add('is-error');
  }finally{
    window.clearTimeout(requestTimeout);
    button.disabled=false;button.removeAttribute('aria-busy');form.classList.remove('is-sending');
  }
});
