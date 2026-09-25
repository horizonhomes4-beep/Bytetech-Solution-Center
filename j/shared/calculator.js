// MathCloud digital calculator — a floating on-page tool for subjects that need
// calculation (Mathematics, Physics, Chemistry, Economics, Accounts, Geography,
// Agriculture, Commerce, Computer Studies). Opens as a dialog on click, with an
// ordinary mode and a Scientific switch, plus a Close button. No page needs to
// enable it manually beyond calling McCalculator.setSubject(subjectId) once the
// current subject is known; it shows/hides itself automatically.
const McCalculator=(function(){
  let expr="";
  let justEvaluated=false;
  let built=false;

  function fmt(n){
    if(!Number.isFinite(n))return "Error";
    const r=Math.round(n*1e10)/1e10;
    return String(r);
  }

  // --- Safe expression parser (no eval): recursive-descent over +,-,*,/,%,^,
  // parentheses, unary minus and the scientific functions/constants below. ---
  function evaluate(str){
    let i=0;
    const s=String(str||"").replace(/,/g,"");
    function peekChar(){return s[i]}
    function skipWs(){while(s[i]===" ")i++}
    function matchWord(){skipWs();const m=/^[a-zA-Z]+/.exec(s.slice(i));return m?m[0]:null}
    function parseExpression(){
      let v=parseTerm();
      for(;;){skipWs();const c=peekChar();
        if(c==="+"){i++;v+=parseTerm()}
        else if(c==="-"){i++;v-=parseTerm()}
        else break;
      }
      return v;
    }
    function parseTerm(){
      let v=parsePower();
      for(;;){skipWs();const c=peekChar();
        if(c==="*"){i++;v*=parsePower()}
        else if(c==="/"){i++;v/=parsePower()}
        else if(c==="%"){i++;v=v%parsePower()}
        else break;
      }
      return v;
    }
    function parsePower(){
      let v=parseUnary();
      skipWs();
      if(peekChar()==="^"){i++;v=Math.pow(v,parsePower())}
      return v;
    }
    function parseUnary(){
      skipWs();
      if(peekChar()==="-"){i++;return -parseUnary()}
      if(peekChar()==="+"){i++;return parseUnary()}
      return parsePrimary();
    }
    const FUNCS={
      sin:x=>Math.sin(x*Math.PI/180), cos:x=>Math.cos(x*Math.PI/180), tan:x=>Math.tan(x*Math.PI/180),
      asin:x=>Math.asin(x)*180/Math.PI, acos:x=>Math.acos(x)*180/Math.PI, atan:x=>Math.atan(x)*180/Math.PI,
      log:x=>Math.log10(x), ln:x=>Math.log(x), sqrt:x=>Math.sqrt(x), abs:x=>Math.abs(x)
    };
    function parsePrimary(){
      skipWs();
      const c=peekChar();
      if(c==="("){i++;const v=parseExpression();skipWs();if(peekChar()===")")i++;return v}
      const word=matchWord();
      if(word){
        const lower=word.toLowerCase();
        if(lower==="pi"){i+=word.length;return Math.PI}
        if(lower==="e"){i+=word.length;return Math.E}
        if(FUNCS[lower]){
          i+=word.length;skipWs();
          let arg;
          if(peekChar()==="("){i++;arg=parseExpression();skipWs();if(peekChar()===")")i++;}
          else arg=parseUnary();
          return FUNCS[lower](arg);
        }
        i+=word.length;return NaN;
      }
      const m=/^\d+(\.\d+)?/.exec(s.slice(i));
      if(m){i+=m[0].length;return parseFloat(m[0])}
      return NaN;
    }
    if(!s.trim())return 0;
    const result=parseExpression();
    skipWs();
    if(i<s.length)return NaN;
    return result;
  }

  const STD_BTNS=[
    {t:"C",act:"clear"},{t:"⌫",act:"back"},{t:"%",ins:"%"},{t:"÷",ins:"/"},
    {t:"7",ins:"7"},{t:"8",ins:"8"},{t:"9",ins:"9"},{t:"×",ins:"*"},
    {t:"4",ins:"4"},{t:"5",ins:"5"},{t:"6",ins:"6"},{t:"−",ins:"-"},
    {t:"1",ins:"1"},{t:"2",ins:"2"},{t:"3",ins:"3"},{t:"+",ins:"+"},
    {t:"0",ins:"0",wide:true},{t:".",ins:"."},{t:"(",ins:"("},{t:")",ins:")"}
  ];
  const SCI_BTNS=[
    {t:"sin",ins:"sin("},{t:"cos",ins:"cos("},{t:"tan",ins:"tan("},{t:"^",ins:"^"},
    {t:"√",ins:"sqrt("},{t:"log",ins:"log("},{t:"ln",ins:"ln("},{t:"π",ins:"pi"},
    {t:"asin",ins:"asin("},{t:"acos",ins:"acos("},{t:"atan",ins:"atan("},{t:"e",ins:"e"}
  ];

  function renderButtons(list){
    return list.map(b=>`<button type="button" class="mc-calc-btn${b.wide?" mc-calc-wide":""}" data-act="${b.act||""}" data-ins="${b.ins?b.ins.replace(/"/g,"&quot;"):""}">${b.t}</button>`).join("");
  }

  function build(){
    if(built)return;built=true;
    const fab=document.createElement("button");
    fab.type="button";fab.id="mcCalcFab";fab.className="mc-calc-fab";fab.title="Open calculator";fab.setAttribute("aria-label","Open calculator");
    fab.innerHTML="🧮";
    fab.hidden=true;
    fab.onclick=show;
    document.body.appendChild(fab);

    const backdrop=document.createElement("div");
    backdrop.id="mcCalcBackdrop";backdrop.className="mc-calc-backdrop";backdrop.hidden=true;
    backdrop.innerHTML=`
      <div class="mc-calc-dialog" role="dialog" aria-modal="true" aria-label="Calculator">
        <div class="mc-calc-head">
          <strong>Calculator</strong>
          <label class="mc-calc-switch"><input type="checkbox" id="mcCalcSciToggle"><span>Scientific</span></label>
          <button type="button" class="mc-calc-close" id="mcCalcClose" aria-label="Close calculator">✕</button>
        </div>
        <div class="mc-calc-display" id="mcCalcDisplay">0</div>
        <div class="mc-calc-grid mc-calc-sci" id="mcCalcSciGrid" hidden>${renderButtons(SCI_BTNS)}</div>
        <div class="mc-calc-grid" id="mcCalcStdGrid">${renderButtons(STD_BTNS)}</div>
        <button type="button" class="mc-calc-equals" id="mcCalcEquals">=</button>
      </div>`;
    document.body.appendChild(backdrop);

    backdrop.addEventListener("click",e=>{if(e.target===backdrop)hide()});
    document.getElementById("mcCalcClose").onclick=hide;
    document.getElementById("mcCalcSciToggle").onchange=e=>{document.getElementById("mcCalcSciGrid").hidden=!e.target.checked};
    document.getElementById("mcCalcEquals").onclick=doEquals;
    backdrop.querySelectorAll(".mc-calc-btn").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const act=btn.dataset.act;
        if(act==="clear"){expr="";justEvaluated=false;renderDisplay();return}
        if(act==="back"){expr=expr.slice(0,-1);justEvaluated=false;renderDisplay();return}
        const ins=btn.dataset.ins;
        if(ins==null)return;
        if(justEvaluated&&/^[0-9.]$/.test(ins)===false){/* keep result, chain new operator */}
        if(justEvaluated&&/^[0-9.]$/.test(ins)){expr=""}
        justEvaluated=false;
        expr+=ins;renderDisplay();
      });
    });
    document.addEventListener("keydown",e=>{
      if(backdrop.hidden)return;
      if(e.key==="Escape"){hide();return}
      if(e.key==="Enter"){e.preventDefault();doEquals();return}
    });
  }

  function doEquals(){
    const result=evaluate(expr);
    expr=Number.isFinite(result)?fmt(result):"Error";
    justEvaluated=true;
    renderDisplay();
  }

  function renderDisplay(){
    const el=document.getElementById("mcCalcDisplay");
    if(!el)return;
    const shown=(expr||"0").replace(/\*/g,"×").replace(/\//g,"÷");
    el.textContent=shown;
  }

  function show(){build();expr="";justEvaluated=false;renderDisplay();document.getElementById("mcCalcBackdrop").hidden=false}
  function hide(){const b=document.getElementById("mcCalcBackdrop");if(b)b.hidden=true}

  function setEnabled(on){
    build();
    document.getElementById("mcCalcFab").hidden=!on;
    if(!on)hide();
  }
  function setSubject(subjectId){
    setEnabled(typeof calculatorNeededFor==="function"?calculatorNeededFor(subjectId):false);
  }

  return {show,hide,setEnabled,setSubject,evaluate};
})();
