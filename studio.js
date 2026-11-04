'use strict';
const $ = s => document.querySelector(s);
const escapeText = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rub = n => Math.round(n).toLocaleString('ru-RU')+' ₽';
function load(key){try{return JSON.parse(sessionStorage.getItem(key))||{};}catch{return {};}}
function save(key,value){try{sessionStorage.setItem(key,JSON.stringify(value));}catch{}}
function file(name,content,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const field=(k,title,value='',attrs='')=>'<label class="field">'+title+'<input name="'+k+'" value="'+escapeText(value)+'" '+attrs+'></label>';
const dropdown=(k,title,items,value)=>'<label class="field">'+title+'<select name="'+k+'">'+items.map(([id,t])=>'<option value="'+id+'" '+(id===value?'selected':'')+'>'+t+'</option>').join('')+'</select></label>';
const paths={own:'На своём участке',listing:'По объявлению',search:'Поиск земли'};
const styles={natural:'Природная палитра',warm:'Тёплый минимализм'};
const pictures={natural:'interior',warm:'wood'};
const projectData={89:{inside:80.1,base:7800000},110:{inside:99.8,base:8800000}};
const orientation={south:'Снизу',north:'Сверху',east:'Справа',west:'Слева'};
const stored=load('crimea.brief.v1');
let state=Object.assign({path:'own',location:'',url:'',width:'',depth:'',entry:'south',terrain:'unknown',area:'auto',space:'compact',design:'natural',garden:'Терраса',period:'Изучаю варианты',budget:'',reserve:'10',wish:'',dimensions:'unknown'},stored);
const urlPath=new URLSearchParams(location.search).get('path');
if(Object.hasOwn(paths,urlPath))state.path=urlPath;
let step=0;
const titles=['С чего начнём?','Какая у вас земля?','Как вы хотите жить?','Проверим вводные.'];
const prompts={
 own:'Перед посадкой дома уточните границы, допустимое пятно застройки, уклон и положение сетей.',
 listing:'Сверьте сведения из объявления с документами продавца. Запросите размеры сторон, точку въезда и фото подъезда.',
 search:'Отберите 2–3 участка по ежедневным маршрутам семьи. Для каждого запросите полную стоимость земли, подготовки и подключений.'
};
const formValues=form=>Object.fromEntries(new FormData(form));
function remember(form){Object.assign(state,formValues(form));save('crimea.brief.v1',state);}
function modifiers(){return window.PROJECT_PROMPTS.rules.filter(rule=>new RegExp(rule.words,'iu').test(state.wish));}
function followups(){return modifiers().slice(0,3).map(rule=>field('detail_'+rule.id,rule.question,state['detail_'+rule.id]||'','maxlength="250" placeholder="Уточните по желанию"')).join('');}
function searchOptions(){
 const options=[
  ['Пригород с ежедневной связью с городом','Ищем маршрут до вашей школы и работы. Сравниваем реальное время проезда утром и вечером.'],
  ['Участок в сложившемся посёлке','Проверяем работающие сети, дорогу всесезонного доступа и повседневные услуги.'],
  ['Более просторная земля у предгорий','Сравниваем площадь сада, перепады высот и стоимость подготовки подъезда.']
 ];
 if(state.garden==='Сад с поливом')options.unshift(options.pop());
 return options;
}
function outline(){
 const area=Number(state.area==='auto'?(state.space==='large'?110:89):state.area);
 const known=state.path!=='search'&&state.dimensions==='known'&&+state.width>0&&+state.depth>0;
 const width=known?+state.width:24,depth=known?+state.depth:32;
 let w=Math.sqrt(area*1.3),h=area/w;
 if(w>width&&h<=width&&w<=depth)[w,h]=[h,w];
 const fits=w<=width&&h<=depth;
 const questions=[prompts[state.path]];
 if(!known)questions.push('Получите точные границы и размеры участка. Для эскиза использован пример 24 × 32 м.');
 if(state.terrain!=='even')questions.push('Проверьте перепад высот и условия основания с инженером.');
 if(!fits)questions.push('Выбранный контур не помещается в указанный прямоугольник. Требуется другой участок или проект.');
 if(state.period==='Хочу за 2 месяца')questions.push('Для цели в два месяца проверьте готовность земли, документации, сетей, поставок и отделки.');
 for(const rule of modifiers()){
 const detail=state['detail_'+rule.id];
 questions.push(rule.instruction+(detail?' Ваш ответ: '+detail:''));
 }
 if(state.wish)questions.push('Обсудите с проектировщиком пожелание «'+state.wish+'».');
 return {area,known,width,depth,w,h,fits,questions,...projectData[area]};
}
function sketch(r){
 const scale=Math.min(290/r.width,205/r.depth),W=r.width*scale,H=r.depth*scale,x=(400-W)/2,y=(270-H)/2;
 const bw=r.w*scale,bh=r.h*scale;
 const fx=state.entry==='west'?.66:state.entry==='east'?.34:.5;
 const fy=state.entry==='north'?.66:state.entry==='south'?.34:.5;
 const bx=x+(W-bw)*fx,by=y+(H-bh)*fy;
 const extraY=by+bh+5,extraX=bx+2;
 const extra=r.fits&&state.garden!=='Пока без благоустройства'&&extraY+10<y+H?
 '<g><rect x="'+extraX+'" y="'+extraY+'" width="'+Math.min(34,bw)+'" height="9" fill="#c88b52" rx="2"/><title>'+escapeText(state.garden)+'</title></g>':'';
 const marker={south:[x+W/2,y+H],north:[x+W/2,y],west:[x,y+H/2],east:[x+W,y+H/2]}[state.entry];
 return '<svg class="plot" viewBox="0 0 400 290" role="img" aria-label="Условная схема участка с въездом и контуром дома"><defs><pattern id="dots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#94ac87"/></pattern></defs><rect x="'+x+'" y="'+y+'" width="'+W+'" height="'+H+'" fill="url(#dots)" stroke="#71926e" stroke-width="2"/><text x="200" y="'+(y-7)+'" text-anchor="middle">'+r.width+' м</text><text x="'+(x+W+5)+'" y="138" font-size="12">'+r.depth+' м</text>'+(r.fits?'<rect x="'+bx+'" y="'+by+'" width="'+bw+'" height="'+bh+'" fill="#205a4d"/><text x="'+(bx+bw/2)+'" y="'+(by+bh/2+3)+'" fill="white" font-size="11" text-anchor="middle">'+r.area+' м²</text>':'<text x="200" y="135" text-anchor="middle">Контур не помещается</text>')+extra+'<circle cx="'+marker[0]+'" cy="'+marker[1]+'" r="6" fill="#d9723a"/><text x="200" y="280" font-size="10" text-anchor="middle">Въезд ● / Охра — выбранная дворовая зона</text></svg>';
}
function clarify(){
 let message=state.path==='listing'?'Цена и размеры со слов продавца. Ссылка будет приложена к брифу, содержание объявления автоматически не загружается.':state.path==='search'?'Соберём задание для специалиста. Реальные объявления подбираются после уточнения бюджета и района.':'Отметьте только известные параметры. Для участка сложной формы размеры задают ориентировочный прямоугольник.';
 return '<p class="note">'+message+'</p>';
}
function fieldset(){
 if(step===0)return dropdown('path','Ваш сценарий',Object.entries(paths),state.path);
 if(step===1)return (state.path==='listing'?field('url','Ссылка на объявление Авито',state.url,'type="url" required maxlength="800" placeholder="https://www.avito.ru/…"'):'')+field('location',state.path==='search'?'Желаемый район или ежедневный маршрут':'Район или населённый пункт',state.location,'required maxlength="150" placeholder="Например, пригород Симферополя"')+clarify()+(state.path!=='search'?dropdown('dimensions','Знаете размеры участка?',[['unknown','Пока не знаю'],['known','Введу размеры в метрах']],state.dimensions)+'<div id="sizes" class="row">'+field('width','Ширина, м',state.width,'type="number" step="0.1" min="1" max="1000"')+field('depth','Глубина, м',state.depth,'type="number" step="0.1" min="1" max="1000"')+'</div>':'')+dropdown('entry','Сторона въезда на схеме',Object.entries(orientation),state.entry)+dropdown('terrain','Рельеф',[['unknown','Не проверен'],['even','Кажется ровным'],['slope','Есть уклон']],state.terrain);
 if(step===2)return '<label class="field">Опишите дом своими словами<textarea name="wish" maxlength="1200" placeholder="Хочу кабинет, кухню с видом в сад и низкий порог на террасу">'+escapeText(state.wish)+'</textarea></label><button class="btn secondary" type="button" id="dictate">Надиктовать пожелания</button><span class="muted" id="voice" aria-live="polite">Диктовка использует распознавание речи вашего браузера. Введите текст, если она недоступна.</span>'+dropdown('space','Для выбора планировки',[['compact','Три спальни, компактная общая зона'],['large','Три спальни, просторная общая зона']],state.space)+dropdown('area','Какой проект примерить?',[['auto','Предложить по ответам'],['89','Дом 89 м²'],['110','Дом 110 м²']],state.area)+dropdown('design','Интерьер',Object.entries(styles),state.design)+dropdown('garden','Что предусмотреть во дворе?',['Терраса','Сад с поливом','Семейный двор','Пока без благоустройства'].map(x=>[x,x]),state.garden);
 return '<p class="note">'+escapeText(prompts[state.path])+'</p>'+followups()+dropdown('period','Желаемый срок',['Изучаю варианты','Хочу за 2 месяца','Около 3 месяцев','В течение года'].map(x=>[x,x]),state.period)+field('budget','Общий лимит семьи, ₽ (необязательно)',state.budget,'type="number" min="1" max="1000000000" step="1"')+field('reserve','Ваш резерв на изменение базовой цены, %',state.reserve,'type="number" min="0" max="50" required')+'<p class="muted">Резерв формирует сценарий бюджета. Земля, внешние сети, подготовка участка и дополнительные работы рассчитываются отдельно.</p>';
}
function sizeVisibility(form){if(!form.elements.dimensions)return;const enabled=form.elements.dimensions.value==='known';$('#sizes').hidden=!enabled;for(const k of ['width','depth']){form.elements[k].disabled=!enabled;form.elements[k].required=enabled;}}
let recognizer;
function stopVoice(){if(recognizer){recognizer.onend=null;recognizer.abort();recognizer=null;}}
function voice(form){
 const API=window.SpeechRecognition||window.webkitSpeechRecognition;
 const status=$('#voice');if(!API){status.textContent='Здесь диктовка недоступна. Можно использовать микрофон клавиатуры телефона или ввести текст.';return;}
 if(recognizer){recognizer.stop();return;}
 const engine=new API();recognizer=engine;engine.lang='ru-RU';engine.onresult=e=>{const t=form.elements.wish;t.value=(t.value+' '+e.results[0][0].transcript).trim().slice(0,1200);remember(form);status.textContent='Текст добавлен. Проверьте и исправьте его.';};
 engine.onerror=()=>status.textContent='Речь не распознана. Повторите или введите текст.';
 engine.onend=()=>{recognizer=null;if($('#dictate'))$('#dictate').textContent='Надиктовать пожелания';};
 try{engine.start();$('#dictate').textContent='Остановить диктовку';status.textContent='Слушаю…';}catch{recognizer=null;status.textContent='Не удалось включить микрофон.';}
}
function renderQuiz(){
 stopVoice();const target=$('#quiz');if(step===4){showResult(target);return;}
 target.innerHTML='<div class="step">Шаг <b>'+(step+1)+'</b> из 4 · '+paths[state.path]+'</div><div class="meter"><i style="width:'+((step+1)*25)+'%"></i></div><h1>'+titles[step]+'</h1><div class="work"><form class="box stack">'+fieldset()+'<p class="err" aria-live="polite"></p><div class="actions">'+(step?'<button type="button" class="btn secondary" id="back">← Назад</button>':'')+'<button class="btn">'+(step===3?'Показать мой эскиз':'Дальше →')+'</button></div></form><aside class="art"><img src="assets/'+['house','garden','interior','porcelain'][step]+'.webp" alt="Архитектурная концепция"><p>'+['Сначала выберем исходную ситуацию. Контакты для просмотра эскиза не нужны.','От рельефа и подъезда зависят основание, доставка и место для монтажа.','Для индивидуальной кухни важно заранее определить места выводов и размеры техники.','Вы увидите схему, исходные допущения и вопросы, которые стоит задать проектировщику.'][step]+'</p></aside></div>';
 const form=target.querySelector('form');sizeVisibility(form);form.addEventListener('change',()=>{sizeVisibility(form);remember(form);});
 if($('#back'))$('#back').onclick=()=>{remember(form);step--;renderQuiz();};
 if($('#dictate'))$('#dictate').onclick=()=>voice(form);
 form.onsubmit=e=>{e.preventDefault();remember(form);if(step===1&&state.path==='listing'){let url;try{url=new URL(state.url);}catch{}if(!url||url.protocol!=='https:'||!/(^|\.)avito\.ru$/.test(url.hostname)){form.querySelector('.err').textContent='Нужна HTTPS-ссылка на объявление avito.ru.';return;}}
 step++;renderQuiz();window.scrollTo(0,0);};
}
function designTotals(d){const area=Number(d.size||0),rate=Number(d.rate||0),goods=Number(d.goods||0);return {fee:area*rate,goods,total:area*rate+goods};}
function showResult(target){
 const r=outline(),high=r.base*(1+Number(state.reserve)/100),d=load('crimea.design.v1');
 const items=[['Сценарий',paths[state.path]],['Место',state.location],['Проект','Дом '+r.area+' м² / внутри '+r.inside.toLocaleString('ru-RU')+' м²'],['Интерьер и двор',styles[state.design]+' · '+state.garden],['Срок',state.period],['Размеры участка',(r.known?'По вашим данным: ':'Пример: ')+r.width+' × '+r.depth+' м'],['Ориентир дома с вашим резервом',rub(r.base)+' – '+rub(high)],['Основа','Предчистовая готовность с инженерией, без земли. Ориентиры партнёра октября 2026 года; подтверждаются индивидуальной сметой.'],['Технология','Заводская трёхслойная панель 230 мм. Основание, вводы и соединения согласуются для участка.'],['Дополнительно','Подготовка земли, подключения, отделка, мебель и благоустройство требуют отдельных расчётов.']];
 if(state.budget)items.push(['Лимит семьи',rub(state.budget)+(Number(state.budget)<r.base?' — ниже базового ориентира дома.':' — сравните с полным бюджетом после оценки участка.')]);
 if(d.size)items.push(['Ваш сценарий дизайна и закупки',rub(designTotals(d).total)+' / '+styles[d.style]+'; тариф задан пользователем.']);
 if(state.path==='listing')items.push(['Объявление',state.url]);
 if(state.path==='search')for(const [name,reason] of searchOptions())items.push(['Профиль участка для проверки',name+'. '+reason]);
 const brief='Жить в Крыму — предварительное предложение\n\n'+items.map(x=>x.join(': ')).join('\n')+'\n\nПроверить:\n'+r.questions.map(q=>'• '+q).join('\n')+'\n\nСледующий шаг — консультация и подтверждённая смета. +7 978 724-54-24';
 target.innerHTML='<div class="result"><small>ВАШ ПРЕДВАРИТЕЛЬНЫЙ ПРОЕКТ</small><h1>Дом '+r.area+' <i>на вашем плане.</i></h1><div class="work"><div>'+sketch(r)+'<p class="note">'+(r.known?'Размеры указали вы.':'Пока показан пример участка. ')+' Схема иллюстрирует площадь и въезд. Форма дома условная, охранные зоны, геология и нормативные отступы проверяются проектировщиком.</p></div><div class="box"><small>ДОМ С РЕЗЕРВОМ '+escapeText(state.reserve)+'%</small><p class="price">'+rub(r.base)+' – '+rub(high)+'</p><p>Верхняя граница — базовый ориентир плюс введённый резерв. Это сценарий планирования. Земля и дополнительные работы в сумму не включены.</p><a href="https://sanatsergej-cmyk.github.io/dom-za-leto/#/technology">Как устроены заводские панели ↗</a></div></div>'+items.map(x=>'<div class="sheet"><span>'+escapeText(x[0])+'</span><b>'+escapeText(x[1])+'</b></div>').join('')+'<h2>Что уточнить дальше</h2><ul>'+r.questions.map(x=>'<li>'+escapeText(x)+'</li>').join('')+'</ul><div class="actions"><button class="btn" id="print">Сохранить КП в PDF / печать</button><button class="btn secondary" id="export">Скачать бриф</button><a class="btn secondary" href="design.html?return=quiz">Добавить дизайн</a><button class="btn secondary" id="edit">Изменить ответы</button></div><div class="box noprint"><h2>Обсудить этот дом</h2><p>Можно отправить короткую заявку команде по SMS или передать сохранённый бриф в выбранный вами чат. Сообщение отправляется после вашего подтверждения в приложении.</p><div class="actions"><a class="btn" id="sms">Заявка по SMS</a><button class="btn secondary" id="share">Поделиться проектом</button><a href="tel:+79787245424">Позвонить специалисту ↗</a></div><p id="handoff" aria-live="polite"></p></div></div>';
 $('#sms').href='sms:+79787245424?body='+encodeURIComponent('Здравствуйте! Проект «Жить в Крыму». '+paths[state.path]+', '+state.location+', дом '+r.area+' м². Срок: '+state.period+'. Хочу обсудить расчёт.');
 const gateway=window.CRIMEA_SERVICE?.leadEndpoint;
 if(gateway&&/^https:\/\//.test(gateway)){
 const box=document.createElement('form');box.className='box stack noprint';
 box.innerHTML='<h3>Оставить заявку команде</h3>'+field('contact','Телефон для обратной связи','','type="tel" required maxlength="24"')+'<label><input name="consent" type="checkbox" required> Разрешаю передать мой контакт и бриф команде для обсуждения этого проекта.</label><button class="btn">Передать бриф</button><p role="status"></p>';
 target.append(box);const requestId=crypto.randomUUID();box.onsubmit=async e=>{e.preventDefault();const button=box.querySelector('button'),status=box.querySelector('[role=status]');button.disabled=true;
 try{const reply=await fetch(gateway,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId,contact:box.elements.contact.value,consent:true,brief,promptVersion:window.PROJECT_PROMPTS.version})});
 if(!reply.ok)throw Error();const receipt=await reply.json();if(!receipt.id)throw Error();status.textContent='Заявка зарегистрирована. Номер '+receipt.id+'.';}
 catch{status.textContent='Сервер не подтвердил приём. Повторите с этим же номером обращения или используйте SMS.';button.disabled=false;}};
 }
 $('#print').onclick=()=>window.print();$('#export').onclick=()=>file('Жить-в-Крыму-предварительное-КП.txt',brief);
 $('#edit').onclick=()=>{step=0;renderQuiz();window.scrollTo(0,0);};$('#share').onclick=async()=>{try{if(navigator.share)await navigator.share({title:'Мой проект дома',text:brief});else if(navigator.clipboard){await navigator.clipboard.writeText(brief);$('#handoff').textContent='Бриф скопирован. Вставьте его в нужный чат Telegram или MAX.';}else file('Мой-проект.txt',brief);}catch(e){if(e.name!=='AbortError')$('#handoff').textContent='Используйте кнопку «Скачать бриф» и приложите файл в чате.';}};
}
function renderDesign(){
 let d=Object.assign({size:'80.1',rate:'',goods:'',style:'natural'},load('crimea.design.v1'));
 $('#design').innerHTML='<p class="lead">Задайте свою ставку дизайнера и лимит на комплектацию. Расчёт пригодится для сравнения предложений.</p><div class="work"><form class="stack box">'+dropdown('style','Стиль',Object.entries(styles),d.style)+field('size','Площадь дизайна, м²',d.size,'type="number" min="1" max="1000" step="0.1" required')+field('rate','Ставка дизайнера, ₽/м²',d.rate,'type="number" min="0" max="1000000" required placeholder="По предложению вашего дизайнера"')+field('goods','Отдельный лимит на мебель и материалы, ₽',d.goods,'type="number" min="0" max="1000000000" placeholder="Например, ваш бюджет на закупку"')+'<output id="estimate" aria-live="polite"></output><button class="btn">Сохранить к проекту →</button></form><aside class="art"><img id="room" alt="Концептуальная визуализация интерьера"><p>В персональной ведомости дизайнер уточнит артикулы, размеры, доступность и сроки доставки в Крым.</p></aside></div>';
 const f=$('#design form');function recalc(){d=formValues(f);const t=designTotals(d);$('#room').src='assets/'+pictures[d.style]+'.webp';$('#estimate').textContent=d.rate!==''&&f.checkValidity()?'Дизайн '+rub(t.fee)+' + закупка '+rub(t.goods)+' = '+rub(t.total):'Укажите ставку для расчёта. Тариф партнёра индивидуален.';}f.oninput=recalc;recalc();f.onsubmit=e=>{e.preventDefault();save('crimea.design.v1',d);location.href='quiz.html'+(new URLSearchParams(location.search).get('return')==='quiz'?'?result=1':'');};
}
if($('#quiz')){if(new URLSearchParams(location.search).get('result')==='1'&&state.location)step=4;renderQuiz();}
if($('#design'))renderDesign();
