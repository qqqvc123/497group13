import {groups, lookAlikes, preferredLength, parseRules, validate} from './core.mjs';

export const ruleTypes = {
  min: {name:'Minimum length', field:'number', label:'Minimum number of characters'},
  max: {name:'Maximum length', field:'number', label:'Maximum number of characters'},
  exact: {name:'Exact length', field:'number', label:'Exact number of characters'},
  upper: {name:'Uppercase letters', field:'number', label:'Minimum uppercase letters'},
  lower: {name:'Lowercase letters', field:'number', label:'Minimum lowercase letters'},
  digit: {name:'Numbers', field:'number', label:'Minimum numbers'},
  symbol: {name:'Special characters', field:'number', label:'Minimum special characters'},
  'no-upper': {name:'No uppercase letters', field:'none'},
  'no-lower': {name:'No lowercase letters', field:'none'},
  'no-digit': {name:'No numbers', field:'none'},
  'no-symbol': {name:'No special characters', field:'none'},
  symbols: {name:'Allowed special characters', field:'symbols', label:'Allowed special characters'},
  excludeSimilar: {name:'Avoid look-alike characters (I, l, 1, O, 0)', field:'none'},
};
const singular = {upper:'uppercase letter',lower:'lowercase letter',digit:'number',symbol:'special character'};
const plural = {upper:'uppercase letters',lower:'lowercase letters',digit:'numbers',symbol:'special characters'};
export function ruleText(entry) {
  if(entry.type==='min')return `At least ${entry.value} characters`;
  if(entry.type==='max')return `No more than ${entry.value} characters`;
  if(entry.type==='exact')return `Exactly ${entry.value} characters`;
  if(singular[entry.type])return `At least ${entry.value} ${entry.value===1?singular[entry.type]:plural[entry.type]}`;
  if(entry.type==='symbols')return `Only these special characters: ${entry.value}`;
  return ruleTypes[entry.type]?.name ?? 'Unknown rule';
}
export function validateEntry(entry) {
  const type=ruleTypes[entry.type];
  if(!type)throw new Error('Choose a supported rule type.');
  if(type.field==='number'&&(!Number.isInteger(entry.value)||entry.value<1||entry.value>128))throw new Error('Enter a whole number from 1 to 128.');
  if(type.field==='symbols'&&(typeof entry.value!=='string'||!entry.value.length||[...entry.value].some(c=>!(/^[!-~]$/.test(c))||/[a-z0-9]/i.test(c))))throw new Error('Enter keyboard symbols only, such as !@#$. Do not include letters, numbers, or spaces.');
}
export function entriesFromText(text) {
  const parsed=parseRules(text), entries=[];
  const add=(type,value)=>entries.push({type,value,enabled:true});
  if(parsed.foundMin&&parsed.foundMax&&parsed.rule.min===parsed.rule.max)add('exact',parsed.rule.min);
  else {
    if(parsed.foundMin)add('min',parsed.rule.min);
    if(parsed.foundMax)add('max',parsed.rule.max);
  }
  for(const key of Object.keys(groups)) {
    if(!parsed.rule.allowed[key])add('no-'+key,true);
    if(parsed.rule.counts[key]>0)add(key,parsed.rule.counts[key]);
  }
  if(/(?:allowed\s+(?:special\s+characters|symbols)|허용\s*특수문자)\s*[:：]/i.test(text))add('symbols',parsed.rule.symbols);
  return {...parsed,entries};
}
export function compileRules(entries) {
  const active=entries.filter(e=>e.enabled);
  if(!active.length)throw new Error('Select at least one rule, or add a rule before generating a password.');
  active.forEach(validateEntry);
  const lengths=active.filter(e=>['min','max','exact'].includes(e.type));
  const minimums=lengths.filter(e=>e.type!=='max').map(e=>e.value);
  const maximums=lengths.filter(e=>e.type!=='min').map(e=>e.value);
  const max=Math.min(128,...maximums);
  const min=minimums.length?Math.max(...minimums):Math.min(8,max);
  const rule={min,max,length:16,symbols:groups.symbol,excludeSimilar:false,allowed:{upper:true,lower:true,digit:true,symbol:true},counts:{upper:0,lower:0,digit:0,symbol:0}};
  for(const entry of active) {
    if(singular[entry.type])rule.counts[entry.type]=Math.max(rule.counts[entry.type],entry.value);
    if(entry.type.startsWith('no-'))rule.allowed[entry.type.slice(3)]=false;
    if(entry.type==='symbols')rule.symbols=entry.value;
    if(entry.type==='excludeSimilar')rule.excludeSimilar=true;
  }
  const required=Object.values(rule.counts).reduce((sum,n)=>sum+n,0);
  rule.length=Math.min(max,Math.max(min,required,preferredLength));
  validate(rule);
  return rule;
}
export function checkEntry(password,entry) {
  if(entry.type==='min')return password.length>=entry.value;
  if(entry.type==='max')return password.length<=entry.value;
  if(entry.type==='exact')return password.length===entry.value;
  const isCharacter=(c,type)=>type==='symbol'?/^[!-~]$/.test(c)&&!/[a-z0-9]/i.test(c):groups[type].includes(c);
  if(singular[entry.type])return [...password].filter(c=>isCharacter(c,entry.type)).length>=entry.value;
  if(entry.type.startsWith('no-'))return ![...password].some(c=>isCharacter(c,entry.type.slice(3)));
  if(entry.type==='symbols')return [...password].every(c=>/[a-z0-9]/i.test(c)||entry.value.includes(c));
  if(entry.type==='excludeSimilar')return ![...password].some(c=>lookAlikes.includes(c));
  return false;
}
