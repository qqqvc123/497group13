const digitNames=['zero','one','two','three','four','five','six','seven','eight','nine'];
const symbolNames={
  '!':'Exclamation mark','@':'At sign','#':'Hash sign','$':'Dollar sign','%':'Percent sign',
  '^':'Caret','&':'Ampersand','*':'Asterisk','_':'Underscore','-':'Hyphen','+':'Plus sign',
  '=':'Equals sign','.':'Period',',':'Comma',':':'Colon',';':'Semicolon','?':'Question mark',
  '/':'Forward slash','\\':'Backslash','|':'Vertical bar','~':'Tilde','`':'Backtick',
  '(':'Opening parenthesis',')':'Closing parenthesis','[':'Opening square bracket',
  ']':'Closing square bracket','{':'Opening brace','}':'Closing brace',
  '<':'Less-than sign','>':'Greater-than sign',"'":'Single quote','"':'Double quote',
};

export function charactersForReading(password) {
  return [...password].map((character,index)=>({
    character,
    position:index+1,
    description:/^[A-Z]$/.test(character)?`Uppercase letter ${character}`
      :/^[a-z]$/.test(character)?`Lowercase letter ${character}`
      :/^[0-9]$/.test(character)?`Number ${digitNames[Number(character)]}`
      :symbolNames[character]??'Special character',
    className:character==='0'?'number-zero':/^[Oo]$/.test(character)?'round-letter':'',
  }));
}
