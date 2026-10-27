export const groups = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower: 'abcdefghijklmnopqrstuvwxyz',
  digit: '0123456789', symbol: '!@#$%^&*',
};
export const names = {upper:'Uppercase letters', lower:'Lowercase letters', digit:'Numbers', symbol:'Symbols'};
export const lookAlikes = 'Il1O0';
const numberWords = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,twelve:12,sixteen:16};

export function parseRules(text) {
  const t = text.toLowerCase().replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|twelve|sixteen)\b/g, x => numberWords[x]);
  const rule = {min:8, max:128, length:16, symbols:groups.symbol, excludeSimilar:false, allowed:{upper:true,lower:true,digit:true,symbol:true}, counts:{upper:0,lower:0,digit:0,symbol:0}};
  const defaults = [], warnings = [];
  let recognized = 0, foundMin = false, foundMax = false;
  const range = t.match(/(\d+)\s*(?:-|–|—|~|to|and|에서)\s*(\d+)\s*(?:characters?|chars?|자|자리)/);
  const exact = t.match(/(?:exactly|정확히)\s*(\d+)\s*(?:characters?|chars?|자|자리)/);
  // Require a length unit or explicit length label: "minimum 2 numbers" is not a length.
  const min = t.match(/(?:at least|minimum(?:\s+of)?|min(?:imum)?\s*[:=]?|최소)\s*(\d+)\s*(?:characters?|chars?|자|자리)/)
    || t.match(/(?:minimum|min)\s+length\s*(?:of|is|:|=)?\s*(\d+)/)
    || t.match(/(\d+)\s*(?:characters?|chars?|자|자리)\s*(?:이상|or more)/)
    || t.match(/(\d+)\+\s*(?:characters?|chars?)/);
  const max = t.match(/(?:at most|up to|maximum(?:\s+of)?|max(?:imum)?\s*[:=]?|최대)\s*(\d+)\s*(?:characters?|chars?|자|자리)/)
    || t.match(/(?:maximum|max)\s+length\s*(?:of|is|:|=)?\s*(\d+)/)
    || t.match(/(\d+)\s*(?:characters?|chars?|자|자리)\s*(?:이하|or fewer)/);
  if (range) {rule.min=+range[1];rule.max=+range[2];foundMin=foundMax=true;recognized++;}
  if (min) {rule.min=+min[1];foundMin=true;recognized++;}
  if (max) {rule.max=+max[1];foundMax=true;recognized++;}
  if (exact) {rule.min=rule.max=+exact[1];foundMin=foundMax=true;recognized++;}
  const terms = {upper:'upper[ -]?case(?:\\s+letters?)?|capital(?:\\s+letters?)?|대문자',lower:'lower[ -]?case(?:\\s+letters?)?|소문자',digit:'numbers?|digits?|숫자',symbol:'special\\s+characters?|symbols?|특수\\s*문자'};
  // Symbol allowlists are handled separately so "Allowed symbols" does not imply a required symbol.
  const categoryText=t.replace(/(?:allowed\s+(?:special\s+characters|symbols)|허용\s*특수문자)\s*[:：][^\n]*/g,'');
  for (const [key, term] of Object.entries(terms)) {
    if (!new RegExp(term,'i').test(categoryText)) continue;
    recognized++;
    const negative = new RegExp('(?:no|without|exclude|must not (?:include|contain)|cannot (?:include|contain))\\s+(?:any\\s+)?(?:'+term+')|(?:'+term+')\\s*(?:(?:are|is)\\s+)?(?:not allowed|prohibited|금지|불가|제외|사용 불가|사용하지)','i');
    const optional = new RegExp('(?:'+term+')\\s*(?:are\\s+|is\\s+)?(?:optional|선택)|optional\\s+(?:'+term+')','i');
    if (negative.test(categoryText)) {rule.allowed[key]=false;continue;}
    if (optional.test(categoryText)) continue;
    const before = categoryText.match(new RegExp('(\\d+)\\s+(?:'+term+')','i'));
    const after = categoryText.match(new RegExp('(?:'+term+')\\s*(?:최소\\s*)?(\\d+)\\s*(?:개|자)?','i'));
    rule.counts[key] = before ? +before[1] : after ? +after[1] : 1;
  }
  if (/(?:only\s+(?:numbers|digits)|(?:numbers|digits)\s+only|숫자만)/.test(t)) {
    rule.allowed={upper:false,lower:false,digit:true,symbol:false};rule.counts={upper:0,lower:0,digit:1,symbol:0};recognized++;
  }
  if (/alphanumeric\s+only|only\s+alphanumeric|영문과?\s*숫자만/.test(t)) {rule.allowed.symbol=false;rule.counts.symbol=0;recognized++;}
  const symbols = text.match(/(?:allowed\s+(?:special\s+characters|symbols)|허용\s*특수문자)\s*[:：]\s*([^\n]+)/i);
  if (symbols) {rule.symbols=[...new Set([...symbols[1]].filter(c=>/^[!-~]$/.test(c)&&!/[a-z0-9]/i.test(c)))].join('');recognized++;}
  if (!foundMin) defaults.push('No minimum length found; 8 characters is used.');
  if (!foundMax) defaults.push('No maximum length found; this prototype uses a limit of 128.');
  if (/consecutive|repeat|username|user name|dictionary|previous|three of|3 of|two of|2 of|연속|반복|아이디/.test(t)) {
    warnings.push('Some extra rules cannot be checked here (for example, repeated characters or your username). Review the original text; this prototype only checks length, character types, and allowed symbols.');
  }
  rule.length=Math.min(rule.max,Math.max(16,rule.min,Object.values(rule.counts).reduce((a,b)=>a+b,0)));
  return {rule, recognized, defaults, warnings, foundMin, foundMax};
}

function characters(rule,key) {
  const chars=key==='symbol'?rule.symbols:groups[key];
  return [...new Set(chars)].filter(c=>!rule.excludeSimilar||!lookAlikes.includes(c)).join('');
}
export function validate(rule) {
  for (const key of ['min','max','length']) if (!Number.isInteger(rule[key]) || rule[key]<1 || rule[key]>128) throw new Error('Enter whole-number lengths from 1 to 128.');
  if (rule.min>rule.max) throw new Error('Minimum length cannot be greater than maximum length.');
  if (rule.length<rule.min || rule.length>rule.max) throw new Error('Set the generated length between the minimum and maximum.');
  let required=0, pool='';
  for (const key of Object.keys(groups)) {
    const n=rule.counts[key];
    if (!Number.isInteger(n)||n<0||n>128) throw new Error('Enter a whole number from 0 to 128 for each required count.');
    if (!rule.allowed[key] && n>0) throw new Error(names[key]+' are not allowed. Set their required count to 0 or allow them.');
    if (rule.allowed[key]) {
      if (key==='symbol' && [...rule.symbols].some(c=>!(/^[!-~]$/.test(c))||/[a-z0-9]/i.test(c))) throw new Error('Use only keyboard symbols in Allowed symbols. Remove letters, numbers, and spaces.');
      const chars=characters(rule,key);
      if (!chars) throw new Error('Enter allowed symbols, or turn off Allow for symbols.');
      pool+=chars;
    }
    required+=n;
  }
  if (!pool) throw new Error('Allow at least one character type.');
  if (required>rule.length) throw new Error('The required counts add up to more than the generated length. Increase the length or reduce the counts.');
  return [...new Set(pool)].join('');
}
export function randomIndex(n) {
  const a=new Uint32Array(1), limit=Math.floor(4294967296/n)*n;
  do {crypto.getRandomValues(a);} while(a[0]>=limit);
  return a[0]%n;
}
export function generate(rule) {
  const pool=validate(rule), out=[];
  for (const key of Object.keys(groups)) {
    const chars=characters(rule,key);
    for (let i=0;i<rule.counts[key];i++) out.push(chars[randomIndex(chars.length)]);
  }
  while (out.length<rule.length) out.push(pool[randomIndex(pool.length)]);
  for (let i=out.length-1;i>0;i--) {const j=randomIndex(i+1);[out[i],out[j]]=[out[j],out[i]];}
  return out.join('');
}
// The same sentences appear before generation and in the result checklist.
export function requirements(rule) {
  const rows=[{text:rule.min===rule.max?`Exactly ${rule.min} characters`:`At least ${rule.min} characters`,check:p=>p.length>=rule.min&&p.length<=rule.max}];
  if (rule.min!==rule.max) rows.push({text:`No more than ${rule.max} characters`,check:p=>p.length<=rule.max});
  for (const key of Object.keys(groups)) {
    const chars=key==='symbol'?rule.symbols:groups[key];
    if (!rule.allowed[key]) rows.push({text:`No ${names[key].toLowerCase()}`,check:p=>![...p].some(c=>chars.includes(c))});
    else if (rule.counts[key]>0) {
      const singular={upper:'uppercase letter',lower:'lowercase letter',digit:'number',symbol:'symbol'};
      rows.push({text:`At least ${rule.counts[key]} ${rule.counts[key]===1?singular[key]:names[key].toLowerCase()}`,check:p=>[...p].filter(c=>chars.includes(c)).length>=rule.counts[key]});
    }
  }
  if (rule.allowed.symbol) rows.push({text:`Allowed symbols: ${rule.symbols}`,check:p=>[...p].every(c=>/[A-Za-z0-9]/.test(c)||rule.symbols.includes(c))});
  rows.push({text:'No spaces',check:p=>!(/\s/.test(p))});
  if (rule.excludeSimilar) rows.push({text:'No look-alike characters: I, l, 1, O, 0',check:p=>![...p].some(c=>lookAlikes.includes(c))});
  return rows;
}
export function checklist(password,rule) {
  const pool=Object.keys(groups).filter(k=>rule.allowed[k]).map(k=>characters(rule,k)).join('');
  return [...requirements(rule).map(row=>({text:row.text,ok:row.check(password)})),{text:'Only allowed characters used',ok:[...password].every(c=>pool.includes(c))}];
}
