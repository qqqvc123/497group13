import {generate, checklist, groups, preferredLength} from './core.mjs';
import {ruleTypes, ruleText, validateEntry, entriesFromText, compileRules, checkEntry} from './rules.mjs';
import {charactersForReading} from './reading.mjs';

const $=id=>document.getElementById(id);
let entries=[], nextId=0, copyVersion=0, editingId=null;

let manuallyEdited = false;
let reviewedText = '';

function icon(name) {
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  const use=document.createElementNS('http://www.w3.org/2000/svg','use');
  svg.classList.add('icon');svg.setAttribute('aria-hidden','true');
  use.setAttribute('href','#icon-'+name);svg.append(use);return svg;
}
function setVisible(visible) {
  const hasPassword=Boolean($('password').value);
  $('password').type=visible?'text':'password';
  $('password').hidden=visible&&hasPassword;
  $('password-display').hidden=!visible||!hasPassword;
  $('reading-help').hidden=!visible||!hasPassword;
  $('reveal-label').textContent=visible?'Hide password':'Show password';
  $('reveal').setAttribute('aria-pressed',String(visible));
  $('reveal').querySelector('use').setAttribute('href',visible?'#icon-eye-off':'#icon-eye');
}
function renderReadablePassword(password) {
  const characters=charactersForReading(password);
  function glyph(row,tag='span') {
    const element=document.createElement(tag);
    element.className='password-character '+row.className;
    element.textContent=row.character;
    element.title=`Position ${row.position}: ${row.description}`;
    return element;
  }
  $('password-display').replaceChildren(...characters.map(row=>glyph(row)));
  $('password-characters').replaceChildren(...characters.map(row=>{
    const tr=document.createElement('tr'), position=document.createElement('td'), character=document.createElement('td'), description=document.createElement('td');
    position.textContent=row.position;character.append(glyph(row,'code'));description.textContent=row.description;
    tr.append(position,character,description);return tr;
  }));
}
function clearPassword() {
  copyVersion++;
  $('password-display').replaceChildren();$('password-characters').replaceChildren();
  $('generate').hidden=false;
  $('password').value='';$('password-length').textContent='';setVisible(true);
  $('copy-label').textContent='Copy password';$('result-status').textContent='';
  $('checklist').replaceChildren();$('checks-panel').hidden=true;
  $('reading-help').hidden=true;$('empty-state').hidden=false;
  for(const id of ['copy','again','reveal'])$(id).disabled=true;
  $('error').textContent='';
}
function updateSummary() {
  const active=entries.filter(entry=>entry.enabled);
  $('rule-count').textContent=active.length===entries.length
    ?`${active.length} ${active.length===1?'rule':'rules'}`
    :`${active.length} of ${entries.length} selected`;
  const pending = !$('replacement').hidden;
  $('rule-controls').disabled = pending;
  $('generate').disabled = true;
  $('error').textContent = '';
  if (pending) {
    $('generation-note').textContent = 'Choose Cancel or Replace rules before generating.';
    return;
  }
  if (!active.length) {
    $('generation-note').textContent = 'Select at least one rule to generate a password.';
    return;
  }
  try {
    const rule = compileRules(entries);
    $('generation-note').textContent = `Your selected rules allow a ${rule.length}-character password.`;
    $('generate').disabled = false;
  } catch (error) {
    $('error').textContent = error.message;
    $('generation-note').textContent = 'Resolve the conflict before generating.';
  }
}
function renderRules() {
  const rows=entries.map(entry=>{
    const li=document.createElement('li');li.className='rule-row'+(entry.enabled?'':' is-off');
    const label=document.createElement('label');label.className='rule-toggle';
    const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=entry.enabled;
    checkbox.setAttribute('aria-label','Include '+ruleText(entry));
    checkbox.addEventListener('change',()=>{
      manuallyEdited=true;entry.enabled=checkbox.checked;li.classList.toggle('is-off',!entry.enabled);
      clearPassword();updateSummary();
    });
    label.append(checkbox);
    const edit=document.createElement('button');edit.type='button';edit.className='rule-edit';
    edit.dataset.ruleId=entry.id;edit.setAttribute('aria-label','Edit '+ruleText(entry));
    const name=document.createElement('span');name.className='rule-name';name.textContent=ruleText(entry);
    edit.append(name,icon('pencil'));edit.addEventListener('click',()=>openEditor(entry));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', 'Remove ' + ruleText(entry));
    remove.addEventListener('click', () => {
      const index = entries.indexOf(entry);
      entries.splice(index, 1);
      manuallyEdited = true;
      clearPassword();
      renderRules();
      const next = entries[index] ?? entries[index - 1];
      const target = next ? document.querySelector(`[data-rule-id="${next.id}"]`) : $('add-rule');
      target.focus();
    });
    li.append(label,edit,remove);return li;
  });
  if(!rows.length) {
    const empty=document.createElement('li');empty.className='rule-empty';
    empty.textContent='Paste requirements above, or add a rule below.';rows.push(empty);
  }
  $('rule-list').replaceChildren(...rows);updateSummary();
}
function analyze() {
  manuallyEdited = false;
  reviewedText = $('requirements').value;
  $('replacement').hidden = true;
  clearPassword();
  const text=$('requirements').value.trim(), parsed=entriesFromText(text);
  entries=parsed.entries.map(entry=>({...entry,id:String(++nextId)}));
  const messages=[...parsed.warnings];
  if(text&&!entries.length)messages.unshift('We could not identify any rules. Use Add a rule to enter the website’s requirements.');
  $('parse-warning').textContent=messages.join(' ');$('parse-warning').hidden=!messages.length;
  renderRules();return parsed;
}
function reviewNewText() {
  if (!manuallyEdited) {
    analyze();
    return;
  }
  $('replacement').hidden = $('requirements').value === reviewedText;
  clearPassword();
  updateSummary();
}
function updateEditor() {
  const type=ruleTypes[$('rule-type').value];
  $('number-field').hidden=type.field!=='number';
  $('symbols-field').hidden=type.field!=='symbols';
  $('boolean-help').hidden=type.field!=='none';
  if(type.field==='number')$('number-label').textContent=type.label;
  $('boolean-help').textContent=type.name+'. Select Save rule to apply this condition.';
  $('dialog-error').textContent='';
}
function setEditorValues() {
  const type = $('rule-type').value;
  const original = entries.find(entry => entry.id === editingId && entry.type === type);
  const defaultNumbers = {min:12, max:24, exact:16};
  $('rule-number').value = ruleTypes[type].field === 'number' ? (original?.value ?? defaultNumbers[type] ?? 1) : '';
  $('rule-symbols').value = type === 'symbols' && original ? original.value : groups.symbol;
  updateEditor();
}
function openEditor(entry=null) {
  editingId=entry?.id??null;
  $('dialog-title').textContent=entry?'Edit rule':'Add a rule';
  $('rule-type').value=entry?.type??Object.keys(ruleTypes).find(type=>!entries.some(e=>e.type===type))??'min';
  setEditorValues();
  $('rule-dialog').showModal();$('rule-type').focus();
}
function saveRule(event) {
  event.preventDefault();
  const type=$('rule-type').value, field=ruleTypes[type].field;
  const previous=entries.find(entry=>entry.id===editingId);
  const entry={id:editingId??String(++nextId),type,enabled:previous?.enabled??true,
    value:field==='number'?Number($('rule-number').value):field==='symbols'?$('rule-symbols').value:true};
  try {
    validateEntry(entry);
    if(entries.some(other=>other.id!==editingId&&other.type===type))throw new Error('This rule already exists. Edit the existing rule instead.');
    if(previous)entries=entries.map(other=>other.id===editingId?entry:other);
    else entries.push(entry);
    manuallyEdited=true;clearPassword();renderRules();$('rule-dialog').close();
    document.querySelector(`[data-rule-id="${entry.id}"]`).focus();
  } catch(error) {$('dialog-error').textContent=error.message;}
}
function createPassword(shortConfirmed = false) {
  if (!$('replacement').hidden) return;
  try {
    const rule = compileRules(entries);
    if (rule.length < preferredLength && !shortConfirmed) {
      $('short-text').textContent = `These rules limit the password to ${rule.length} characters. A shorter password can be easier to guess. If the website allows more, edit the length rule.`;
      $('short-dialog').showModal();
      return;
    }
    clearPassword();
    const password = generate(rule);
    const active = entries.filter(entry => entry.enabled);
    if(checklist(password,rule).some(row=>!row.ok)||active.some(entry=>!checkEntry(password,entry)))throw new Error('Could not meet the selected rules. Check the rules and try again.');
    $('password').value=password;$('password-length').textContent=`${password.length} characters`;
    renderReadablePassword(password);setVisible(true);$('empty-state').hidden=true;
    for(const id of ['copy','again','reveal'])$(id).disabled=false;
    $('checklist').replaceChildren(...active.map(entry=>{
      const li=document.createElement('li'), mark=document.createElement('span'), text=document.createElement('span');
      mark.className='check';mark.textContent='✓';mark.setAttribute('aria-hidden','true');
      text.className='check-text';text.textContent=ruleText(entry);
      const accessible=document.createElement('span');accessible.className='sr-only';accessible.textContent='Met: ';
      li.append(mark,accessible,text);return li;
    }));
    $('checks-panel').hidden=false;
    $('generate').hidden = true;
    $('generation-note').textContent = 'Copy your password when you’re ready.';
    $('result-status').textContent='New password generated.';
    $('password-display').focus();
  } catch(error) {clearPassword();updateSummary();$('error').textContent=error.message;}
}

const categories = {
  'Length': ['min', 'max', 'exact'],
  'Numbers': ['digit', 'no-digit'],
  'Letters': ['upper', 'no-upper', 'lower', 'no-lower'],
  'Special characters': ['symbol', 'no-symbol', 'symbols'],
  'Readability': ['excludeSimilar'],
};
for (const [label, values] of Object.entries(categories)) {
  const group = document.createElement('optgroup');
  group.label = label;
  for (const value of values) group.append(new Option(ruleTypes[value].name, value));
  $('rule-type').append(group);
}
$('requirements').addEventListener('input', reviewNewText);
$('clear').addEventListener('click', () => {
  $('requirements').value = '';
  reviewNewText();
  $('requirements').focus();
});
$('keep-edits').addEventListener('click', () => {
  $('requirements').value = reviewedText;
  $('replacement').hidden = true;
  updateSummary();
  $('requirements').focus();
});
$('replace-rules').addEventListener('click', () => {
  analyze();
  $('requirements').focus();
});
$('short-cancel').addEventListener('click', () => $('short-dialog').close());
$('short-accept').addEventListener('click', () => {
  $('short-dialog').close();
  createPassword(true);
});
$('add-rule').addEventListener('click',()=>openEditor());
$('rule-type').addEventListener('change',setEditorValues);
$('rule-form').addEventListener('submit',saveRule);
for(const id of ['close-dialog','cancel-dialog'])$(id).addEventListener('click',()=>$('rule-dialog').close());
$('generate').addEventListener('click',()=>createPassword());
$('again').addEventListener('click',()=>createPassword());
$('reveal').addEventListener('click',()=>setVisible($('password').type==='password'));
$('copy').addEventListener('click',async()=>{
  const password=$('password').value,version=copyVersion;
  if(!password)return;
  try {
    await navigator.clipboard.writeText(password);
    if(version!==copyVersion)return;
    $('copy-label').textContent='Copied!';$('result-status').textContent='Copied. You can paste it into the website.';
  } catch {
    if(version!==copyVersion)return;
    setVisible(true);$('password-display').focus();
    const selection=window.getSelection(), range=document.createRange();
    range.selectNodeContents($('password-display'));selection.removeAllRanges();selection.addRange(range);
    $('result-status').textContent='Copy the selected password using Ctrl+C or Command+C.';
  }
});

// Show the example rules, but generate a password only after a user action.
analyze();

if(document.modelContext?.registerTool) {
  const lifecycle=new AbortController();
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  try {
    Promise.resolve(document.modelContext.registerTool({
      name:'analyze_password_requirements',
      description:'Read password requirements into the editable rule list. Does not generate or return a password.',
      inputSchema:{type:'object',properties:{requirements:{type:'string',minLength:1,maxLength:5000}},required:['requirements'],additionalProperties:false},
      annotations:{readOnlyHint:false},
      execute(input) {
        if(typeof input?.requirements!=='string'||!input.requirements.trim()||input.requirements.length>5000)throw new Error('Requirements must contain 1–5000 characters.');
        $('requirements').value=input.requirements;reviewNewText();
        if (!$('replacement').hidden) return {pendingReplacement:true,reviewRequired:true};
        return {rules:entries.map(({id,...entry})=>entry),reviewRequired:true};
      }
    },{signal:lifecycle.signal})).catch(()=>{});
  } catch {}
}
