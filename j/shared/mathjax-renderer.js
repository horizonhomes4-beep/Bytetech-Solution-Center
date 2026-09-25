/*
 * MathCloud JAMB mathematical/scientific renderer.
 *
 * Rendering standard:
 *   - MathJax 3 + TeX input + CHTML output for Mathematics and quantitative Science.
 *   - mhchem extension for Chemistry formulae/reactions (\ce{...}).
 *   - Existing TeX delimiters are preserved.
 *   - Plain source notation in imported JSON is upgraded to readable TeX at render time.
 *
 * Firebase stores the source content; MathJax is only the presentation layer.
 */
(function(){
  const READY_TIMEOUT=12000;
  let readyPromise=null;

  function waitForMathJax(){
    if(readyPromise)return readyPromise;
    readyPromise=new Promise(resolve=>{
      const started=Date.now();
      const check=()=>{
        if(window.MathJax?.startup?.promise){
          Promise.resolve(window.MathJax.startup.promise).then(()=>resolve(true)).catch(()=>resolve(false));
          return;
        }
        if(Date.now()-started>=READY_TIMEOUT){resolve(false);return;}
        setTimeout(check,50);
      };
      check();
    });
    return readyPromise;
  }

  function protect(s){
    const slots=[];
    const out=s.replace(/\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\$\$([\s\S]*?)\$\$|\\ce\{[^{}]*\}/g,(m,a,b,c)=>{
      const i=slots.length;slots.push(/^\\ce\{/.test(m)?wrapInline(m):m);return `@@MC_MATH_${i}@@`;
    });
    return {out,slots};
  }
  function restore(s,slots){return s.replace(/@@MC_MATH_(\d+)@@/g,(_,i)=>slots[Number(i)]??'');}

  function wrapInline(tex){return `\\(${tex}\\)`;}
  function texSafeText(x){
    return String(x)
      .replace(/\\/g,'\\backslash ')
      .replace(/&/g,'\\&')
      .replace(/%/g,'\\%')
      .replace(/#/g,'\\#');
  }

  function convertPlainMath(input){
    let s=String(input??'');
    const p=protect(s); s=p.out;

    // Roots and common Unicode mathematical operators.
    s=s.replace(/√\s*\(?\s*([A-Za-z0-9]+)\s*\)?/g,(_,x)=>wrapInline(`\\sqrt{${x}}`));
    s=s.replace(/sqrt\s*\(\s*([^()]+?)\s*\)/gi,(_,x)=>wrapInline(`\\sqrt{${x}}`));
    s=s.replace(/(-?\d+(?:\.\d+)?)°/g,(_,x)=>wrapInline(`${x}^{\\circ}`));

    // Common fractions. Only transform unambiguous numeric/simple algebraic fractions.
    s=s.replace(/(?<![A-Za-z0-9_.])(\d+)\s*\/\s*(\d+)(?![A-Za-z0-9_])/g,(_,a,b)=>wrapInline(`\\frac{${a}}{${b}}`));
    s=s.replace(/(?<![A-Za-z0-9_.])([A-Za-z])\s*\/\s*([A-Za-z0-9]+)(?![A-Za-z0-9_])/g,(_,a,b)=>wrapInline(`\\frac{${a}}{${b}}`));

    // Powers such as 2^5, x^2, x^(n+1), 10^23.
    s=s.replace(/(?<![\\\w}])([A-Za-z](?:[A-Za-z0-9]*)|\d+(?:\.\d+)?)\^\(([^()]+)\)/g,(_,a,b)=>wrapInline(`${a}^{${b}}`));
    s=s.replace(/(?<![\\\w}])([A-Za-z](?:[A-Za-z0-9]*)|\d+(?:\.\d+)?)\^(-?\d+|[A-Za-z])/g,(_,a,b)=>wrapInline(`${a}^{${b}}`));

    // Inequalities and common operators are rendered in a compact math span.
    s=s.replace(/(?<![\\\w])([A-Za-z0-9().]+)\s*(≤|≥|≠|≈|±|×|÷|=)\s*([A-Za-z0-9().+\-*/]+)(?![\\\w])/g,(m,a,op,b)=>{
      const opMap={'≤':'\\leq','≥':'\\geq','≠':'\\neq','≈':'\\approx','±':'\\pm','×':'\\times','÷':'\\div','=':'='};
      return wrapInline(`${a}${opMap[op]}${b}`);
    });

    // Scientific notation: 6.02 x 10^23 / 6.02 × 10^23.
    s=s.replace(/(?<![\\\w])(\d+(?:\.\d+)?)\s*[x×]\s*10\^(-?\d+)(?![\\\w])/gi,(_,a,b)=>wrapInline(`${a}\\times10^{${b}}`));

    // Simple combinations/permutations written as C(n,r), P(n,r).
    s=s.replace(/\b([CP])\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/g,(_,f,n,r)=>wrapInline(`${f}(${n},${r})`));

    s=s.replace(/×/g,wrapInline('\\times')).replace(/÷/g,wrapInline('\\div')).replace(/±/g,wrapInline('\\pm')).replace(/≤/g,wrapInline('\\leq')).replace(/≥/g,wrapInline('\\geq')).replace(/≠/g,wrapInline('\\neq')).replace(/≈/g,wrapInline('\\approx'));
    // Restore source TeX after all plain-text conversions.
    return restore(s,p.slots);
  }

  function chemistryFormulaToTex(value){
    let s=String(value??'');
    const p=protect(s); s=p.out;
    s=s.replace(/(<=>|⇌|→|->)/g,op=>wrapInline(op==='->'||op==='→'?'\\rightarrow':'\\rightleftharpoons'));
    // Broader formula support for valid element-symbol sequences (e.g. FeSO4, K2SO4, CH3COONa).
    const elements='(?:Ac|Ag|Al|Am|Ar|As|At|Au|Ba|Be|Bh|Bi|Bk|Br|C|Ca|Cd|Ce|Cf|Cl|Cm|Cn|Co|Cr|Cs|Cu|F|Dy|Er|Es|Eu|Fe|Fl|Fm|Fr|Ga|Gd|Ge|H|He|Hf|Hg|Ho|Hs|I|In|Ir|K|Kr|La|Li|Lr|Lu|Lv|Mc|Md|Mg|Mn|Mo|Mt|Na|Nb|Nd|Ne|Nh|Ni|No|Np|O|Og|Os|P|Pa|Pb|Pd|Pm|Po|Pr|Pt|Pu|Ra|Rb|Re|Rf|Rg|Rh|Rn|Ru|S|Sb|Sc|Se|Sg|Si|Sm|Sn|Sr|Ta|Tb|Tc|Te|Th|Ti|Tl|Tm|Ts|Xe|Y|Yb|Zn|Zr)';
    const genericFormula=new RegExp('(?:\\b\\d+\\s*)?(?:'+elements+')\\d*(?:(?:'+elements+')\\d*)+(?:\\([A-Za-z0-9]+\\)\\d*)*\\b|(?:\\b\\d+\\s*)?(?:'+elements+')\\d+(?:(?:'+elements+')\\d*)*\\b|(?:\\b\\d+\\s*)?(?:'+elements+')\\d*(?:\\([A-Za-z0-9]+\\)\\d*)+\\b','g');
    s=s.replace(genericFormula,x=>x.includes('\\\\')?x:wrapInline(`\\ce{${x}}`));
    s=s.replace(/\b(\d+(?:\.\d+)?)\s*[x×]\s*10\^(-?\d+)\b/gi,(_,a,b)=>wrapInline(`${a}\\times10^{${b}}`));
    s=s.replace(/\b([A-Za-z])\^(-?\d+)\b/g,(_,a,b)=>wrapInline(`${a}^{${b}}`));
    return restore(s,p.slots);
  }

  function mcPrepareRichMath(root,subjectId=''){
    const el=typeof root==='string'?document.querySelector(root):root;
    if(!el)return el;
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const parent=node.parentElement;
      if(!parent||/^(SCRIPT|STYLE|TEXTAREA|PRE|CODE|MJX-CONTAINER)$/i.test(parent.tagName))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{const converted=mcMathTex(n.nodeValue,subjectId);if(converted!==n.nodeValue)n.nodeValue=converted;});
    return el;
  }

  function mcMathTex(value,subjectId=''){
    const sid=String(subjectId||'').toLowerCase();
    let s=String(value??'');
    if(sid==='chemistry')return chemistryFormulaToTex(s);
    return convertPlainMath(s);
  }

  async function mcRenderMath(root){
    const el=typeof root==='string'?document.querySelector(root):root;
    if(!el)return;
    const ready=await waitForMathJax();
    if(!ready||!window.MathJax?.typesetPromise)return;
    try{await window.MathJax.typesetPromise([el]);}
    catch(e){console.warn('MathJax typeset warning',e);}
  }
  function mcTypesetSoon(root){return new Promise(resolve=>requestAnimationFrame(()=>mcRenderMath(root).finally(resolve)));}
  function mcTypesetAll(){return mcRenderMath(document.body);}

  window.mcMathTex=mcMathTex;
  window.mcPrepareRichMath=mcPrepareRichMath;
  window.mcRenderMath=mcRenderMath;
  window.mcTypesetSoon=mcTypesetSoon;
  window.mcTypesetAll=mcTypesetAll;
})();
