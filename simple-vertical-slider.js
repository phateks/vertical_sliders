function t(t,e,i,s){var n,o=arguments.length,r=o<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(n=t[a])&&(r=(o<3?n(r):o>3?n(e,i,r):n(e,i))||r);return o>3&&r&&Object.defineProperty(e,i,r),r}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),n=new WeakMap;let o=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(e,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new o(i,t,s)},a=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:h,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,m=globalThis,g=m.trustedTypes,_=g?g.emptyScript:"",f=m.reactiveElementPolyfillSupport,v=(t,e)=>t,b={toAttribute(t,e){switch(e){case Boolean:t=t?_:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},$=(t,e)=>!l(t,e),y={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:$};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const o=s?.call(this);n?.call(this,e),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),n=e.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:b;this._$Em=s;const o=n.fromAttribute(e,t.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const o=this.constructor;if(!1===s&&(n=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??$)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==n||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[v("elementProperties")]=new Map,x[v("finalized")]=new Map,f?.({ReactiveElement:x}),(m.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,A=t=>t,E=w.trustedTypes,S=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,k="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+M,P=`<${C}>`,O=document,T=()=>O.createComment(""),U=t=>null===t||"object"!=typeof t&&"function"!=typeof t,N=Array.isArray,z="[ \t\n\f\r]",R=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,j=/-->/g,H=/>/g,I=RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),q=/'/g,D=/"/g,L=/^(?:script|style|textarea|title)$/i,B=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),V=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),F=new WeakMap,Y=O.createTreeWalker(O,129);function G(t,e){if(!N(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const K=(t,e)=>{const i=t.length-1,s=[];let n,o=2===e?"<svg>":3===e?"<math>":"",r=R;for(let e=0;e<i;e++){const i=t[e];let a,l,c=-1,h=0;for(;h<i.length&&(r.lastIndex=h,l=r.exec(i),null!==l);)h=r.lastIndex,r===R?"!--"===l[1]?r=j:void 0!==l[1]?r=H:void 0!==l[2]?(L.test(l[2])&&(n=RegExp("</"+l[2],"g")),r=I):void 0!==l[3]&&(r=I):r===I?">"===l[0]?(r=n??R,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,a=l[1],r=void 0===l[3]?I:'"'===l[3]?D:q):r===D||r===q?r=I:r===j||r===H?r=R:(r=I,n=void 0);const d=r===I&&t[e+1].startsWith("/>")?" ":"";o+=r===R?i+P:c>=0?(s.push(a),i.slice(0,c)+k+i.slice(c)+M+d):i+M+(-2===c?e:d)}return[G(t,o+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class J{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,o=0;const r=t.length-1,a=this.parts,[l,c]=K(t,e);if(this.el=J.createElement(l,i),Y.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=Y.nextNode())&&a.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(k)){const e=c[o++],i=s.getAttribute(t).split(M),r=/([.?@])?(.*)/.exec(e);a.push({type:1,index:n,name:r[2],strings:i,ctor:"."===r[1]?et:"?"===r[1]?it:"@"===r[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(M)&&(a.push({type:6,index:n}),s.removeAttribute(t));if(L.test(s.tagName)){const t=s.textContent.split(M),e=t.length-1;if(e>0){s.textContent=E?E.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],T()),Y.nextNode(),a.push({type:2,index:++n});s.append(t[e],T())}}}else if(8===s.nodeType)if(s.data===C)a.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(M,t+1));)a.push({type:7,index:n}),t+=M.length-1}n++}}static createElement(t,e){const i=O.createElement("template");return i.innerHTML=t,i}}function Z(t,e,i=t,s){if(e===V)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const o=U(e)?void 0:e._$litDirective$;return n?.constructor!==o&&(n?._$AO?.(!1),void 0===o?n=void 0:(n=new o(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=Z(t,n._$AS(t,e.values),n,s)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??O).importNode(e,!0);Y.currentNode=s;let n=Y.nextNode(),o=0,r=0,a=i[0];for(;void 0!==a;){if(o===a.index){let e;2===a.type?e=new X(n,n.nextSibling,this,t):1===a.type?e=new a.ctor(n,a.name,a.strings,this,t):6===a.type&&(e=new nt(n,this,t)),this._$AV.push(e),a=i[++r]}o!==a?.index&&(n=Y.nextNode(),o++)}return Y.currentNode=O,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Z(this,t,e),U(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==V&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>N(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&U(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(G(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Q(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=F.get(t.strings);return void 0===e&&F.set(t.strings,e=new J(t)),e}k(t){N(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new X(this.O(T()),this.O(T()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(t,e=this,i,s){const n=this.strings;let o=!1;if(void 0===n)t=Z(this,t,e,0),o=!U(t)||t!==this._$AH&&t!==V,o&&(this._$AH=t);else{const s=t;let r,a;for(t=n[0],r=0;r<n.length-1;r++)a=Z(this,s[i+r],e,r),a===V&&(a=this._$AH[r]),o||=!U(a)||a!==this._$AH[r],a===W?t=W:t!==W&&(t+=(a??"")+n[r+1]),this._$AH[r]=a}o&&!s&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}}class st extends tt{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=Z(this,t,e,0)??W)===V)return;const i=this._$AH,s=t===W&&i!==W||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==W&&(i===W||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class nt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Z(this,t)}}const ot=w.litHtmlPolyfillSupport;ot?.(J,X),(w.litHtmlVersions??=[]).push("3.3.3");const rt=globalThis;class at extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new X(e.insertBefore(T(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}}at._$litElement$=!0,at.finalized=!0,rt.litElementHydrateSupport?.({LitElement:at});const lt=rt.litElementPolyfillSupport;lt?.({LitElement:at}),(rt.litElementVersions??=[]).push("4.2.2");const ct=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},ht={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:$},dt=(t=ht,e,i)=>{const{kind:s,metadata:n}=i;let o=globalThis.litPropertyMetadata.get(n);if(void 0===o&&globalThis.litPropertyMetadata.set(n,o=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),o.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function pt(t){return(e,i)=>"object"==typeof i?dt(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function ut(t){return pt({...t,state:!0,attribute:!1})}const mt="tile",gt=10,_t="relative",ft=1,vt=!0,bt=!0,$t={light:"#ffcf8a",switch:"#ffd166",input_boolean:"#ffd166",fan:"#4fc3f7",media_player:"#b39dff",number:"#5dcaa5",input_number:"#5dcaa5"},yt=["light","switch","input_boolean","fan","number","input_number","media_player"],xt=r`
  :host {
    display: block;
    height: 100%;
    min-width: 0;
    --svs-txt: #e8eef6;
    --svs-surface: rgba(255, 255, 255, 0.06);
    --svs-surface-on: rgba(255, 255, 255, 0.05);
    --svs-off-border: 22%;
    --svs-off-icon: 55%;
    --svs-off-name: rgba(255, 255, 255, 0.75);
    --svs-on-name: rgba(255, 255, 255, 0.92);
    --svs-radius: 22px;
  }
  :host([light]) {
    --svs-txt: var(--primary-text-color, #1c2733);
    --svs-surface: rgba(30, 50, 80, 0.05);
    --svs-surface-on: rgba(30, 50, 80, 0.04);
    --svs-off-border: 40%;
    --svs-off-icon: 75%;
    --svs-off-name: var(--secondary-text-color, #5b6b7d);
    --svs-on-name: var(--primary-text-color, #1c2733);
  }
  ha-card {
    background: none;
    border: none;
    box-shadow: none;
    height: 100%;
    box-sizing: border-box;
    overflow: visible;
  }
  .grid {
    display: grid;
    height: 100%;
    box-sizing: border-box;
  }
  svs-slider {
    min-width: 0;
    min-height: 0;
  }
  .warning {
    padding: 12px;
    color: var(--error-color, #db4437);
    font-size: 13px;
  }
`,wt=r`
  :host {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
    /* masonry dashboards give no height: fall back to a tall tile */
    aspect-ratio: var(--svs-aspect, 0.62);
    -webkit-tap-highlight-color: transparent;
  }
  .slider {
    --a: var(--svs-accent, #ffcf8a);
    position: relative;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    color: var(--svs-txt);
    user-select: none;
    -webkit-user-select: none;
    outline: none;
  }

  /* ================================================================ TILE */
  .tile {
    container-type: size;
    overflow: hidden;
    cursor: pointer;
    touch-action: none;
    border-radius: clamp(12px, 11cqmin, var(--svs-radius));
    background: var(--svs-surface);
    border: 1px solid color-mix(in srgb, var(--a) var(--svs-off-border), transparent);
    transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
  }
  .tile:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--a) 70%, transparent);
  }
  .tile.on {
    background: var(--svs-surface-on);
    border-color: color-mix(in srgb, var(--a) 55%, transparent);
  }
  .tile.on.glow {
    box-shadow: 0 0 22px color-mix(in srgb, var(--a) 18%, transparent);
  }

  /* fill: off = faint accent tint from the bottom (variant C), on = level */
  .fill {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    transition: height 0.3s ease, background 0.3s ease;
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--a) 55%, transparent),
      color-mix(in srgb, var(--a) 16%, transparent)
    );
  }
  .tile.off .fill {
    height: 100% !important;
    background: linear-gradient(to top, color-mix(in srgb, var(--a) 8%, transparent), transparent 60%);
  }
  .tile.switch.on .fill {
    background: color-mix(in srgb, var(--a) 22%, transparent);
  }
  .dragging .fill {
    transition: none;
  }

  .content {
    position: absolute;
    inset: 0;
    padding: clamp(8px, 9cqmin, 22px);
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-areas: "i" "." "n";
    pointer-events: none;
    min-width: 0;
  }
  .tile .icon {
    grid-area: i;
    --mdc-icon-size: clamp(18px, 30cqmin, 72px);
    width: var(--mdc-icon-size);
    height: var(--mdc-icon-size);
    color: color-mix(in srgb, var(--a) var(--svs-off-icon), transparent);
    transition: color 0.25s ease;
  }
  .tile.on .icon {
    color: var(--a);
  }
  .tile .name {
    grid-area: n;
    font-size: clamp(11px, 10cqmin, 22px);
    font-weight: 500;
    line-height: 1.2;
    color: var(--svs-off-name);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
  .tile.on .name {
    color: var(--svs-on-name);
  }
  .tile .pct {
    position: absolute;
    right: clamp(8px, 9cqmin, 22px);
    top: clamp(8px, 9cqmin, 22px);
    font-size: clamp(12px, 14cqmin, 36px);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: #fff;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
    opacity: 0;
    transition: opacity 0.15s ease;
    pointer-events: none;
  }
  .dragging .pct {
    opacity: 1;
  }

  /* short tile: icon and name on one row */
  @container (max-height: 140px) {
    .content {
      padding: 0 clamp(10px, 18cqh, 22px);
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-rows: 1fr;
      grid-template-areas: "i n";
      column-gap: clamp(8px, 16cqh, 18px);
      align-items: center;
    }
    .tile .icon {
      --mdc-icon-size: clamp(18px, 50cqh, 52px);
    }
    .tile .name {
      font-size: clamp(12px, 26cqh, 24px);
    }
    .tile .pct {
      top: 50%;
      bottom: auto;
      transform: translateY(-50%);
      right: clamp(10px, 18cqh, 22px);
      font-size: clamp(13px, 32cqh, 30px);
    }
  }
  /* very narrow tile: icon only, centred */
  @container (max-width: 70px) {
    .tile .name {
      display: none;
    }
    .content {
      justify-items: center;
    }
  }

  /* colour-temperature mode */
  .temp-track,
  .temp-mask {
    position: absolute;
    left: 0;
    right: 0;
    pointer-events: none;
  }
  .temp-track {
    inset: 0;
    opacity: 0.55;
  }
  .temp-mask {
    top: 0;
    background: rgba(10, 18, 30, 0.55);
    border-bottom: 2px solid rgba(255, 255, 255, 0.8);
  }
  .temp .fill {
    display: none;
  }

  .unavailable {
    opacity: 0.45;
    cursor: default;
  }

  /* ============================================================== COLUMN */
  .column {
    container-type: size;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(6px, 4cqh, 12px);
    padding: clamp(8px, 4cqh, 12px) 6px;
    border-radius: clamp(16px, 20cqw, 35px);
    background: var(--svs-surface);
    border: 1px solid color-mix(in srgb, var(--a) var(--svs-off-border), transparent);
  }
  .column .name {
    font-size: clamp(11px, 12cqw, 15px);
    font-weight: 500;
    color: var(--svs-off-name);
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .column.on .name {
    color: var(--svs-on-name);
  }
  .column .track {
    position: relative;
    flex: 1;
    min-height: 40px;
    width: min(75px, 78%);
    border-radius: clamp(12px, 18cqw, 25px);
    overflow: hidden;
    background: color-mix(in srgb, var(--a) 8%, rgba(255, 255, 255, 0.06));
    cursor: ns-resize;
    touch-action: none;
  }
  .column.off .fill {
    height: 0 !important;
  }
  .column .pct {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: clamp(12px, 16cqw, 20px);
    font-weight: 600;
    color: #fff;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.7);
    opacity: 0;
    pointer-events: none;
  }
  .column .power {
    flex: none;
    width: clamp(36px, 55cqw, 56px);
    height: clamp(36px, 55cqw, 56px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    touch-action: none;
  }
  .column.on .power {
    background: color-mix(in srgb, var(--a) 14%, transparent);
  }
  .column .icon {
    --mdc-icon-size: clamp(18px, 28cqw, 28px);
    color: color-mix(in srgb, var(--a) var(--svs-off-icon), transparent);
  }
  .column.on .icon {
    color: var(--a);
  }

  /* ================================================================ MENU */
  .menu-backdrop {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(5, 12, 22, 0.35);
    border-radius: inherit;
  }
  .menu {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px;
    border-radius: 14px;
    background: #16243a;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
  }
  .menu button {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.06);
    color: #dbe6f3;
    cursor: pointer;
    --mdc-icon-size: 22px;
  }
  .menu button.active {
    background: color-mix(in srgb, var(--a) 30%, transparent);
    color: #fff;
  }
`;var At,Et;!function(t){t.language="language",t.system="system",t.comma_decimal="comma_decimal",t.decimal_comma="decimal_comma",t.space_comma="space_comma",t.none="none"}(At||(At={})),function(t){t.language="language",t.system="system",t.am_pm="12",t.twenty_four="24"}(Et||(Et={}));var St=function(t,e,i,s){s=s||{},i=null==i?{}:i;var n=new Event(e,{bubbles:void 0===s.bubbles||s.bubbles,cancelable:Boolean(s.cancelable),composed:void 0===s.composed||s.composed});return n.detail=i,t.dispatchEvent(n),n};const kt=(t,e=0,i=100)=>Math.min(i,Math.max(e,t));function Mt(t){let e,i,s;(t=Math.max(1e3,Math.min(12e3,t))/100)<=66?(e=255,i=99.4708025861*Math.log(t)-161.1195681661,s=t<=19?0:138.5177312231*Math.log(t-10)-305.0447927307):(e=329.698727446*Math.pow(t-60,-.1332047592),i=288.1221695283*Math.pow(t-60,-.0755148492),s=255);const n=t=>Math.round(kt(t,0,255));return[n(e),n(i),n(s)]}const Ct=([t,e,i])=>"#"+[t,e,i].map(t=>Math.round(t).toString(16).padStart(2,"0")).join("");function Pt(t){const e=t?.attributes??{};return[e.min_color_temp_kelvin??2e3,e.max_color_temp_kelvin??6500]}function Ot(t,e,i){const s=e.entity,n=(s||"").split(".")[0];const o=t.states[s],r=!o||"unavailable"===o.state||"unknown"===o.state,a=e.name??o?.attributes.friendly_name??s;let l=e.accent??i.defaultAccent??$t[n]??"#ffcf8a";const c={entityId:s,domain:n,stateObj:o,name:a,unavailable:r,on:!1,level:0,draggable:!1,toggleable:!0,supportsTemp:!1,supportsColor:!1,accent:l,format:t=>`${Math.round(t)}%`,snap:1};if(!o)return c;const h=o.attributes;switch(n){case"light":{const s=h.supported_color_modes??[],n=s.some(t=>"onoff"!==t)||"number"==typeof h.brightness;c.on="on"===o.state,c.draggable=n,c.supportsTemp=s.includes("color_temp"),c.supportsColor=s.some(t=>["hs","rgb","rgbw","rgbww","xy"].includes(t));const r=function(t,e){const i=e.attributes.brightness;if("number"==typeof i)return i;const s=e.attributes.entity_id;if(Array.isArray(s))for(const e of s){const i=t.states[e]?.attributes.brightness;if("number"==typeof i)return i}}(t,o);if(c.level=c.on?void 0!==r?Math.max(1,Math.round(r/2.55)):100:0,c.on&&i.useLightColor&&!e.accent&&(Array.isArray(h.rgb_color)&&"color_temp"!==h.color_mode?l=function(t){const e=(.2126*t[0]+.7152*t[1]+.0722*t[2])/255;if(e>=.45)return Ct(t);const i=.45-e;return Ct(t.map(t=>t+(255-t)*i))}(h.rgb_color):"number"==typeof h.color_temp_kelvin&&(l=Ct(Mt(h.color_temp_kelvin))),c.accent=l),"temp"===i.mode&&c.supportsTemp){const[t,e]=Pt(o),i=h.color_temp_kelvin??(t+e)/2;c.level=kt((i-t)/(e-t)*100),c.format=i=>`${Math.round(t+i/100*(e-t))} K`}break}case"fan":c.on="on"===o.state,c.draggable="number"==typeof h.percentage||!!(1&(h.supported_features??0)),c.level=c.on?"number"==typeof h.percentage?Math.round(h.percentage):100:0,c.snap="number"==typeof h.percentage_step&&h.percentage_step>1?h.percentage_step:1;break;case"switch":case"input_boolean":default:c.on="on"===o.state,c.level=c.on?100:0;break;case"number":case"input_number":{const t=e.min??Number(h.min??0),i=e.max??Number(h.max??100),s=e.step??Number(h.step??1),n=Number(o.state),r=h.unit_of_measurement?` ${h.unit_of_measurement}`:"",a=(String(s).split(".")[1]||"").length;c.on=!0,c.toggleable=!1,c.draggable=i>t,c.level=Number.isFinite(n)&&i>t?kt((n-t)/(i-t)*100):0,c.snap=i>t&&s>0?s/(i-t)*100:1,c.format=e=>`${(t+e/100*(i-t)).toFixed(a)}${r}`;break}case"media_player":{const t="number"==typeof h.volume_level?h.volume_level:0;c.on=!["off","standby","idle","unavailable"].includes(o.state)&&!h.is_volume_muted,c.draggable=!0,c.level=Math.round(100*t);break}}return r&&(c.on=!1,c.draggable=!1,c.toggleable=!1),c}function Tt(t,e){"media_player"!==e.domain?t.callService("homeassistant","toggle",{entity_id:e.entityId}):t.callService("media_player","volume_mute",{entity_id:e.entityId,is_volume_muted:!e.stateObj?.attributes.is_volume_muted})}const Ut=(t,e)=>kt(e>1?Math.round(t/e)*e:Math.round(t));let Nt=class extends at{constructor(){super(...arguments),this._mode="level",this._drag=null,this._menu=!1,this._pending=null,this._p={id:-1,y0:0,start:0,moved:!1,held:!1,timer:0},this._region="tile",this._move=t=>{const e=this._model;if(!e||t.pointerId!==this._p.id||this._p.held||"power"===this._region)return;const i=this._p.y0-t.clientY;if(!this._p.moved){if(Math.abs(i)<6||!e.draggable)return;this._p.moved=!0,clearTimeout(this._p.timer)}if(t.preventDefault(),"absolute"===this.opts.dragMode)this._drag=this._absolute(t);else{const e=t.currentTarget.getBoundingClientRect().height||200;this._drag=Math.max(0,Math.min(100,this._p.start+i/e*100*this.opts.sensitivity))}},this._up=t=>{const e=this._model;if(clearTimeout(this._p.timer),e&&t.pointerId===this._p.id&&(this._p.id=-1,!this._p.held)){if(null!==this._drag){const t=Ut(this._drag,e.snap);return this._drag=null,void this._send(e,t)}this._p.moved||(e.toggleable?(this._haptic("light"),Tt(this.hass,e)):this._moreInfo())}},this._cancel=()=>{clearTimeout(this._p.timer),this._p.id=-1,this._drag=null},this._key=t=>{const e=this._model;if(e&&!e.unavailable)if("Enter"===t.key||" "===t.key)t.preventDefault(),e.toggleable?Tt(this.hass,e):this._moreInfo();else if(("ArrowUp"===t.key||"ArrowDown"===t.key)&&e.draggable){t.preventDefault();const i=this._pending?.value??(e.on||"temp"===this._mode?e.level:0),s=Math.max(5,e.snap);this._send(e,Ut(i+("ArrowUp"===t.key?s:-s),e.snap))}},this._closeMenu=t=>{t.stopPropagation(),this._menu=!1},this._stop=t=>t.stopPropagation()}shouldUpdate(t){if(!t.has("hass")||t.size>1)return!0;const e=t.get("hass"),i=this.cfg?.entity;if(!e||!i)return!0;if(e.states[i]!==this.hass.states[i])return!0;const s=this.hass.states[i]?.attributes.entity_id;return Array.isArray(s)&&s.some(t=>e.states[t]!==this.hass.states[t])}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._p.timer)}render(){if(!this.hass||!this.cfg)return W;const t=this._model=Ot(this.hass,this.cfg,{useLightColor:this.opts.useLightColor,defaultAccent:this.opts.defaultAccent,mode:this._mode});let e=t.level;this._pending&&(Date.now()>this._pending.until||Math.abs(this._pending.value-t.level)<=Math.max(1,t.snap)?this._pending=null:e=this._pending.value),null!==this._drag&&(e=this._drag);const i=null!==this._drag,s="temp"===this._mode,n=t.on||i&&e>0&&!s||null!==this._pending&&e>0,o=!t.draggable&&t.toggleable,r=s?100:o?n?100:0:n?e:0,a=["slider",this.opts.style,n?"on":"off",o?"switch":"",t.unavailable?"unavailable":"",i?"dragging":"",s?"temp":"",this.opts.glow?"glow":""].join(" "),l=B`<ha-state-icon
      class="icon"
      .hass=${this.hass}
      .stateObj=${t.stateObj}
      .icon=${this.cfg.icon}
    ></ha-state-icon>`,c=B`<div class="fill" style="height:${r}%"></div>
      ${s?B`<div class="temp-track" style="background:${function(t){const[e,i]=Pt(t),s=[0,.25,.5,.75,1].map(t=>Ct(Mt(e+t*(i-e))));return`linear-gradient(to top, ${s.join(", ")})`}(t.stateObj)}"></div>
            <div class="temp-mask" style="height:${100-e}%"></div>`:W}`,h=B`<div class="pct">${t.format(e)}</div>`,d=this._menu?this._renderMenu(t):W,p=`--svs-accent:${t.accent}`;return"column"===this.opts.style?B`<div class=${a} style=${p}>
        <div class="name">${t.name}</div>
        <div
          class="track"
          @pointerdown=${t=>this._down(t,"track")}
          @pointermove=${this._move}
          @pointerup=${this._up}
          @pointercancel=${this._cancel}
          @contextmenu=${t=>t.preventDefault()}
        >
          ${c} ${h}
        </div>
        <div
          class="power"
          tabindex="0"
          role="button"
          aria-label=${t.name}
          @pointerdown=${t=>this._down(t,"power")}
          @pointerup=${this._up}
          @pointercancel=${this._cancel}
          @keydown=${this._key}
          @contextmenu=${t=>t.preventDefault()}
        >
          ${l}
        </div>
        ${d}
      </div>`:B`<div
      class=${a}
      style=${p}
      tabindex="0"
      role="slider"
      aria-label=${t.name}
      aria-valuenow=${Math.round(e)}
      aria-valuemin="0"
      aria-valuemax="100"
      @pointerdown=${t=>this._down(t,"tile")}
      @pointermove=${this._move}
      @pointerup=${this._up}
      @pointercancel=${this._cancel}
      @keydown=${this._key}
      @contextmenu=${t=>t.preventDefault()}
    >
      ${c}
      <div class="content">${l}<div class="name">${t.name}</div></div>
      ${h} ${d}
    </div>`}_renderMenu(t){const e=(t,e,i,s=!1)=>B`<button class=${s?"active":""} title=${e} aria-label=${e} @click=${i}>
        <ha-icon .icon=${t}></ha-icon>
      </button>`;return B`<div class="menu-backdrop" @pointerdown=${this._stop} @pointerup=${this._stop} @click=${this._closeMenu}>
      <div class="menu" @click=${this._stop}>
        ${e("mdi:brightness-6","Brightness",()=>this._setMode("level"),"level"===this._mode)}
        ${t.supportsTemp?e("mdi:thermometer","Colour temperature",()=>this._setMode("temp"),"temp"===this._mode):W}
        ${e("mdi:dots-horizontal","More info",()=>{this._menu=!1,this._moreInfo()})}
      </div>
    </div>`}_down(t,e){const i=this._model;if(!i||this._menu||"mouse"===t.pointerType&&0!==t.button)return;if(i.unavailable)return void("track"!==e&&(this._p.timer=window.setTimeout(()=>this._moreInfo(),500)));this._region=e,t.currentTarget.setPointerCapture(t.pointerId),clearTimeout(this._p.timer);const s=this._pending?this._pending.value:i.level;this._p={id:t.pointerId,y0:t.clientY,start:"temp"===this._mode||i.on?s:0,moved:!1,held:!1,timer:0},"track"!==e&&(this._p.timer=window.setTimeout(()=>this._hold(),500)),"track"===e&&i.draggable&&"absolute"===this.opts.dragMode&&(this._p.moved=!0,this._drag=this._absolute(t))}_hold(){const t=this._model;t&&!this._p.moved&&(this._p.held=!0,this._haptic("medium"),"light"===t.domain&&t.supportsTemp?this._menu=!0:this._moreInfo())}_absolute(t){const e=t.currentTarget.getBoundingClientRect();return Math.max(0,Math.min(100,(e.bottom-t.clientY)/e.height*100))}_send(t,e){!function(t,e,i,s,n){const o=e.entityId;switch(i=kt(i),e.domain){case"light":if("temp"===s){const[s,n]=Pt(e.stateObj);t.callService("light","turn_on",{entity_id:o,color_temp_kelvin:Math.round(s+i/100*(n-s))})}else i<=0?t.callService("light","turn_off",{entity_id:o}):t.callService("light","turn_on",{entity_id:o,brightness_pct:Math.round(i)});return;case"fan":return void(i<=0?t.callService("fan","turn_off",{entity_id:o}):t.callService("fan","set_percentage",{entity_id:o,percentage:Math.round(i)}));case"number":case"input_number":{const s=e.stateObj?.attributes??{},r=n.min??Number(s.min??0),a=n.max??Number(s.max??100),l=n.step??Number(s.step??1);let c=r+i/100*(a-r);return l>0&&(c=Math.round((c-r)/l)*l+r),c=Number(Math.min(a,Math.max(r,c)).toFixed(6)),void t.callService(e.domain,"set_value",{entity_id:o,value:c})}case"media_player":t.callService("media_player","volume_set",{entity_id:o,volume_level:Number((i/100).toFixed(2))})}}(this.hass,t,e,this._mode,this.cfg),this._pending={value:e,until:Date.now()+4e3},window.setTimeout(()=>this.requestUpdate(),4050)}_setMode(t){this._mode=t,this._menu=!1,this._pending=null}_moreInfo(){St(this,"hass-more-info",{entityId:this.cfg.entity})}_haptic(t){St(window,"haptic",t)}};Nt.styles=wt,t([pt({attribute:!1})],Nt.prototype,"hass",void 0),t([pt({attribute:!1})],Nt.prototype,"cfg",void 0),t([pt({attribute:!1})],Nt.prototype,"opts",void 0),t([ut()],Nt.prototype,"_mode",void 0),t([ut()],Nt.prototype,"_drag",void 0),t([ut()],Nt.prototype,"_menu",void 0),t([ut()],Nt.prototype,"_pending",void 0),Nt=t([ct("svs-slider")],Nt);const zt={entity:{domain:yt}},Rt=t=>({name:t,selector:{text:{}}}),jt=(t,e,i,s=1)=>({name:t,selector:{number:{min:e,max:i,step:s,mode:"box"}}}),Ht=t=>({type:"grid",name:"",schema:t}),It=[{name:"entity",selector:zt},Ht([Rt("name"),{name:"icon",selector:{icon:{}}}]),Rt("accent")],qt=[Ht([{name:"slider_style",selector:{select:{mode:"dropdown",options:[{value:"tile",label:"Tile (whole button is the slider)"},{value:"column",label:"Column (track + power button)"}]}}},{name:"drag_mode",selector:{select:{mode:"dropdown",options:[{value:"relative",label:"Relative (from current level)"},{value:"absolute",label:"Absolute (level under finger)"}]}}}]),Ht([Rt("width"),Rt("height")]),Ht([jt("columns",1,12),jt("gap",0,40)]),Ht([jt("sensitivity",.25,4,.25),Rt("default_accent")]),Ht([{name:"glow",selector:{boolean:{}}},{name:"use_light_color",selector:{boolean:{}}}])],Dt=[{name:"entity",selector:zt},Ht([Rt("name"),{name:"icon",selector:{icon:{}}}]),Rt("accent"),Ht([jt("min",-1e3,1e3,.1),jt("max",-1e3,1e3,.1)]),jt("step",0,100,.01)],Lt={entity:"Entity",name:"Name (optional)",icon:"Icon (optional)",accent:"Accent colour (optional, e.g. #ffcf8a)",slider_style:"Style",drag_mode:"Drag",width:"Width (optional, e.g. 120px)",height:"Height (optional, e.g. 220px)",columns:"Sliders per row (multi)",gap:"Gap (px)",sensitivity:"Drag sensitivity (1 = full height)",default_accent:"Default accent (optional)",glow:"Glow when on",use_light_color:"Use the light's colour",min:"Min (number only)",max:"Max (number only)",step:"Step (number only)"},Bt=t=>{const e={...t};for(const t of Object.keys(e))""!==e[t]&&void 0!==e[t]&&null!==e[t]||delete e[t];return e};let Vt=class extends at{constructor(){super(...arguments),this._label=t=>Lt[t.name]??t.name,this._add=()=>{const t=[...this._list];!t.length&&this._config.entity&&t.push(Bt({entity:this._config.entity,name:this._config.name,icon:this._config.icon,accent:this._config.accent})),t.push({entity:""});const e={...this._config,entities:t};delete e.entity,delete e.name,delete e.icon,delete e.accent,this._emit(e)}}setConfig(t){const e=(t.entities??[]).map(t=>"string"==typeof t?{entity:t}:t);this._config={...t,entities:e}}get _list(){return this._config.entities??[]}render(){if(!this.hass||!this._config)return W;const t=this._list.length>0;return B`
      ${t?W:B`<div class="section">Slider</div>
            <ha-form
              .hass=${this.hass}
              .data=${this._config}
              .schema=${It}
              .computeLabel=${this._label}
              @value-changed=${this._mainChanged}
            ></ha-form>`}

      <div class="section">Layout</div>
      <ha-form
        .hass=${this.hass}
        .data=${{slider_style:"tile",drag_mode:"relative",glow:!0,use_light_color:!0,...this._config}}
        .schema=${qt}
        .computeLabel=${this._label}
        @value-changed=${this._mainChanged}
      ></ha-form>

      <div class="section">Multiple sliders</div>
      ${this._list.map((t,e)=>this._item(e,t))}
      <button class="add" @click=${this._add}>+ Add slider</button>
    `}_item(t,e){const i=e.name||this.hass.states[e.entity]?.attributes.friendly_name||e.entity||`Slider ${t+1}`;return B`<ha-expansion-panel outlined .header=${i}>
      <ha-form
        .hass=${this.hass}
        .data=${e}
        .schema=${Dt}
        .computeLabel=${this._label}
        @value-changed=${e=>this._itemChanged(t,e)}
      ></ha-form>
      <div class="row">
        <button ?disabled=${0===t} @click=${()=>this._move(t,-1)}>↑</button>
        <button ?disabled=${t===this._list.length-1} @click=${()=>this._move(t,1)}>↓</button>
        <button class="del" @click=${()=>this._remove(t)}>Remove</button>
      </div>
    </ha-expansion-panel>`}_emit(t){const e={...t};e.entities&&e.entities.length||delete e.entities,this._config={...t,entities:t.entities??[]},St(this,"config-changed",{config:e})}_mainChanged(t){t.stopPropagation();const e=Bt(t.detail.value);this._emit({...e,entities:this._list})}_itemChanged(t,e){e.stopPropagation();const i=[...this._list];i[t]=Bt(e.detail.value),this._emit({...this._config,entities:i})}_remove(t){const e=[...this._list],[i]=e.splice(t,1),s={...this._config,entities:e};!e.length&&i?.entity&&(s.entity=i.entity),this._emit(s)}_move(t,e){const i=[...this._list],s=t+e;s<0||s>=i.length||([i[t],i[s]]=[i[s],i[t]],this._emit({...this._config,entities:i}))}};Vt.styles=r`
    .section {
      margin: 18px 0 6px;
      font-weight: 600;
      font-size: 15px;
    }
    .section:first-child {
      margin-top: 0;
    }
    .hint {
      font-size: 13px;
      color: var(--secondary-text-color);
      margin-bottom: 4px;
    }
    ha-expansion-panel {
      display: block;
      margin-bottom: 8px;
      --expansion-panel-content-padding: 8px 12px;
    }
    .row {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      margin-top: 8px;
    }
    button {
      font: inherit;
      font-size: 13px;
      padding: 4px 12px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: transparent;
      color: var(--primary-text-color);
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.4;
      cursor: default;
    }
    button.del {
      color: var(--error-color, #db4437);
    }
    button.add {
      width: 100%;
      padding: 8px;
      border-style: dashed;
    }
  `,t([pt({attribute:!1})],Vt.prototype,"hass",void 0),t([ut()],Vt.prototype,"_config",void 0),Vt=t([ct("simple-vertical-slider-editor")],Vt),console.info("%c SIMPLE-VERTICAL-SLIDER %c v0.1.0 ","color:#16243a;background:#ffcf8a;font-weight:700;border-radius:4px 0 0 4px;padding:2px 6px;","color:#ffcf8a;background:#16243a;font-weight:700;border-radius:0 4px 4px 0;padding:2px 6px;"),window.customCards=window.customCards||[],window.customCards.push({type:"simple-vertical-slider",name:"Simple Vertical Slider",description:"Vertical slider tiles: tap to toggle, hold and drag to dim. Lights, fans, switches, numbers, media.",preview:!0,documentationURL:"https://github.com/phateks/vertical_sliders"});const Wt=t=>null==t||""===t?void 0:"number"==typeof t||/^\d+(\.\d+)?$/.test(t)?`${t}px`:t;let Ft=class extends at{static async getConfigElement(){return document.createElement("simple-vertical-slider-editor")}static getStubConfig(t){const e=Object.keys(t?.states??{});return{type:"custom:simple-vertical-slider",entity:e.find(t=>t.startsWith("light."))??e.find(t=>yt.includes(t.split(".")[0]))??"light.example"}}setConfig(t){if(!t)throw new Error("Invalid configuration");this._config=t}getCardSize(){return 4}getGridOptions(){const t=Math.max(1,this._entities(this._config).length),e=Math.min(t,this._config?.columns??t),i=Math.ceil(t/e);return{columns:Math.min(12,3*e),rows:4*i,min_columns:Math.min(12,e),min_rows:2*i}}_entities(t){if(!t)return[];const e=(t.entities??[]).filter(t=>!!t).map(t=>"string"==typeof t?{entity:t}:t).filter(t=>!!t.entity);return e.length?e:t.entity?[{entity:t.entity,name:t.name,icon:t.icon,accent:t.accent}]:[]}updated(t){if(t.has("hass")&&this.hass){const t=this.hass.themes?.darkMode;this.toggleAttribute("light",!1===t)}}render(){if(!this._config||!this.hass)return W;const t=this._config,e=this._entities(t);if(!e.length)return B`<ha-card><div class="warning">Pick an entity in the editor.</div></ha-card>`;const i=t.slider_style??mt,s={style:i,dragMode:t.drag_mode??("column"===i?"absolute":_t),sensitivity:Number(t.sensitivity)>0?Number(t.sensitivity):ft,glow:t.glow??vt,useLightColor:t.use_light_color??bt,defaultAccent:t.default_accent??t.fill_color},n=Math.max(1,Math.min(e.length,Number(t.columns)||e.length)),o=Wt(t.width),r=Wt(t.height??t.card_height),a=Number(t.gap??gt),l=`grid-template-columns:${o?`repeat(${n}, ${o})`:`repeat(${n}, minmax(0, 1fr))`};grid-template-rows:repeat(${Math.ceil(e.length/n)}, ${r??"minmax(0, 1fr)"});gap:${a}px;`,c=[r?`height:${r};aspect-ratio:auto`:"",t.column_bg?`--svs-surface:${t.column_bg}`:""].filter(Boolean).join(";");return B`<ha-card>
      <div class="grid" style=${l}>
        ${e.map(t=>B`<svs-slider style=${c} .hass=${this.hass} .cfg=${t} .opts=${s}></svs-slider>`)}
      </div>
    </ha-card>`}};Ft.styles=xt,t([pt({attribute:!1})],Ft.prototype,"hass",void 0),t([ut()],Ft.prototype,"_config",void 0),Ft=t([ct("simple-vertical-slider")],Ft);export{Ft as SimpleVerticalSlider};
