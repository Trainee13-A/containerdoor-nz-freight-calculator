import{C as R,x as A,v as $,z,B as W,s as M,p as e,F as r,L as v}from"./chunk-4N6VE7H7-DLOOFdQO.js";import{c as x,b as h,g as f,s as g,a as V,m as C,t as w}from"./freight-CcKv5R17.js";const T=R(function(){const{rates:s,page:l,pageCount:d,total:o}=A(),a=$(),S=z(),[c]=W(),[j,k]=M.useState(!1),p=c.get("q")||"",m=c.get("company")||"",u=c.get("serviceType")||"",N=S.state==="submitting",b=n=>{const t=new URLSearchParams;return t.set("page",String(n)),p&&t.set("q",p),m&&t.set("company",m),u&&t.set("serviceType",u),`/app/rates?${t.toString()}`};return e.jsxs("s-page",{inlineSize:"large",heading:"Rate management",children:[e.jsx("style",{children:`
        .top-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .top-btn {
          border: 1px solid #d4dce4;
          border-radius: 10px;
          background: #fff;
          color: #0f2a43;
          padding: 8px 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(15, 42, 67, 0.08);
        }
        .import-btn {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .import-btn input[type="file"] {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }
        .add-wrap {
          border: 1px solid #dce5ef;
          border-radius: 12px;
          background: #f8fbff;
          padding: 14px;
          margin-bottom: 12px;
        }
        .rates-card {
          border: 1px solid #dce5ef;
          border-radius: 12px;
          background: #fff;
          overflow: hidden;
        }
        .rates-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 16px;
          border-bottom: 1px solid #e8eef4;
        }
        .rates-title {
          margin: 0;
          color: #0f2a43;
          font-size: 22px;
          font-weight: 700;
        }
        .summary {
          margin: 0;
          color: #486581;
          font-size: 14px;
          white-space: nowrap;
        }
        .toolbar {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          padding: 12px 16px;
          border-bottom: 1px solid #e8eef4;
        }
        .search-form {
          display: grid;
          gap: 10px;
          grid-template-columns: 2fr 1fr 1fr auto;
          flex: 1;
        }
        .search-form input,
        .search-form select,
        .rates-table input,
        .rates-table select,
        .grid-form input,
        .grid-form select {
          width: 100%;
          border: 1px solid #d3dde8;
          border-radius: 10px;
          padding: 9px 12px;
          min-height: 36px;
          box-sizing: border-box;
        }
        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }
        .rates-table {
          width: 100%;
          min-width: 1320px;
          border-collapse: collapse;
          font-size: 14px;
        }
        .rates-table th,
        .rates-table td {
          border-bottom: 1px solid #eef3f8;
          padding: 12px 10px;
          vertical-align: top;
          white-space: nowrap;
        }
        .rates-table th {
          color: #486581;
          font-weight: 700;
          background: #fff;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .range-col {
          display: grid;
          gap: 6px;
          grid-auto-flow: column;
        }
        .checkbox-row {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #52606d;
        }
        .inline-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .plain-save {
          border: 1px solid #d3dde8;
          background: #fff;
          color: #102a43;
          border-radius: 10px;
          padding: 8px 12px;
          font-weight: 600;
          height: 36px;
          cursor: pointer;
        }
        .pager {
          display: flex;
          gap: 10px;
          padding: 12px 16px;
        }
        .pager a {
          text-decoration: none;
          border: 1px solid #d3dde8;
          border-radius: 999px;
          padding: 6px 12px;
          color: #243b53;
          font-size: 14px;
        }
        .grid-form {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
        }
        .grid-form label {
          display: grid;
          gap: 6px;
          color: #455a64;
          font-size: 13px;
        }
        @media (max-width: 980px) {
          .rates-head {
            flex-direction: column;
            align-items: flex-start;
          }
          .search-form {
            grid-template-columns: 1fr;
          }
          .toolbar {
            display: grid;
          }
        }
      `}),a!=null&&a.message?e.jsx("s-banner",{tone:a.ok?"success":"critical",children:a.message}):null,e.jsxs("div",{className:"top-row",children:[e.jsxs("button",{className:"top-btn",type:"button",onClick:()=>k(n=>!n),children:["+ ",j?"Close add rate":"Add rate"]}),e.jsxs(r,{method:"post",encType:"multipart/form-data",children:[e.jsx("input",{type:"hidden",name:"intent",value:"import"}),e.jsxs("label",{className:"top-btn import-btn",children:["Import CSV",e.jsx("input",{type:"file",name:"csv",accept:".csv,text/csv",onChange:n=>{var t,y;(t=n.currentTarget.files)!=null&&t.length&&((y=n.currentTarget.form)==null||y.requestSubmit())}})]})]})]}),j?e.jsx("div",{className:"add-wrap",children:e.jsx(L,{})}):null,e.jsxs("div",{className:"rates-card",children:[e.jsxs("div",{className:"rates-head",children:[e.jsx("h2",{className:"rates-title",children:"Rates list"}),e.jsxs("p",{className:"summary",children:[o," active rates · page ",l," of ",d]})]}),e.jsxs("div",{className:"toolbar",children:[e.jsxs(r,{method:"get",className:"search-form",children:[e.jsx("input",{name:"q",placeholder:"Search city or postal code",defaultValue:p}),e.jsxs("select",{name:"company",defaultValue:m,children:[e.jsx("option",{value:"",children:"All companies"}),x.map(n=>e.jsx("option",{value:n,children:h[n]},n))]}),e.jsxs("select",{name:"serviceType",defaultValue:u,children:[e.jsx("option",{value:"",children:"All services"}),f.map(n=>e.jsx("option",{value:n,children:g[n]},n))]}),e.jsx("s-button",{type:"submit",children:"Search"})]}),e.jsx("s-button",{href:"/api/rates/export",...N?{loading:!0}:{},children:"Export CSV"})]}),e.jsx("div",{className:"table-wrap",children:e.jsxs("table",{className:"rates-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Company"}),e.jsx("th",{children:"Service"}),e.jsx("th",{children:"City"}),e.jsx("th",{children:"Postal"}),e.jsx("th",{children:"Weight (g)"}),e.jsx("th",{children:"Volume (cm3)"}),e.jsx("th",{children:"Rate"}),e.jsx("th",{children:"Surcharge"}),e.jsx("th",{children:"Mode"}),e.jsx("th",{children:"Active"}),e.jsx("th",{children:"Actions"})]})}),e.jsx("tbody",{children:s.map(n=>e.jsx(q,{rate:n},n.id))})]})}),e.jsxs("div",{className:"pager",children:[l>1?e.jsx(v,{to:b(l-1),children:"Previous"}):null,l<d?e.jsx(v,{to:b(l+1),children:"Next"}):null]})]})]})});function q({rate:i}){return e.jsxs("tr",{children:[e.jsx("td",{children:e.jsxs(r,{method:"post",id:`rate-${i.id}`,children:[e.jsx("input",{type:"hidden",name:"intent",value:"save"}),e.jsx("input",{type:"hidden",name:"id",value:i.id}),e.jsx("select",{name:"company",defaultValue:i.company,"aria-label":"Company",children:x.map(s=>e.jsx("option",{value:s,children:h[s]},s))})]})}),e.jsx("td",{children:e.jsx("select",{form:`rate-${i.id}`,name:"serviceType",defaultValue:i.serviceType,"aria-label":"Service",children:f.map(s=>e.jsx("option",{value:s,children:g[s]},s))})}),e.jsx("td",{children:e.jsx("input",{form:`rate-${i.id}`,name:"city",required:!0,defaultValue:i.city,"aria-label":"City"})}),e.jsx("td",{children:e.jsx("input",{form:`rate-${i.id}`,name:"postalCode",required:!0,defaultValue:i.postalCode,"aria-label":"Postal code"})}),e.jsxs("td",{children:[e.jsxs("div",{className:"range-col",children:[e.jsx("input",{form:`rate-${i.id}`,name:"minWeightGrams",type:"number",min:"0",defaultValue:i.minWeightGrams??"","aria-label":"Min weight"}),e.jsx("input",{form:`rate-${i.id}`,name:"maxWeightGrams",type:"number",min:"0",defaultValue:i.maxWeightGrams??"","aria-label":"Max weight"})]}),e.jsxs("label",{className:"checkbox-row",children:[e.jsx("input",{form:`rate-${i.id}`,name:"useWeightRange",type:"checkbox",defaultChecked:i.useWeightRange})," Use"]})]}),e.jsxs("td",{children:[e.jsxs("div",{className:"range-col",children:[e.jsx("input",{form:`rate-${i.id}`,name:"minVolumeCm3",type:"number",min:"0",defaultValue:i.minVolumeCm3??"","aria-label":"Min volume"}),e.jsx("input",{form:`rate-${i.id}`,name:"maxVolumeCm3",type:"number",min:"0",defaultValue:i.maxVolumeCm3??"","aria-label":"Max volume"})]}),e.jsxs("label",{className:"checkbox-row",children:[e.jsx("input",{form:`rate-${i.id}`,name:"useVolumeRange",type:"checkbox",defaultChecked:i.useVolumeRange})," Use"]})]}),e.jsx("td",{children:e.jsx("input",{form:`rate-${i.id}`,name:"rate",type:"number",step:"0.01",min:"0",required:!0,defaultValue:w(i.rate),"aria-label":"Rate"})}),e.jsx("td",{children:e.jsx("input",{form:`rate-${i.id}`,name:"zoneSurcharge",type:"number",step:"0.01",min:"0",defaultValue:w(i.zoneSurcharge),"aria-label":"Zone surcharge"})}),e.jsx("td",{children:e.jsxs("select",{form:`rate-${i.id}`,name:"mode",defaultValue:i.mode??"","aria-label":"Mode",children:[e.jsx("option",{value:"",children:"Any"}),V.map(s=>e.jsx("option",{value:s,children:C[s]},s))]})}),e.jsx("td",{children:e.jsxs("label",{className:"checkbox-row",children:[e.jsx("input",{form:`rate-${i.id}`,name:"active",type:"checkbox",defaultChecked:i.active})," Active"]})}),e.jsx("td",{children:e.jsxs("div",{className:"inline-actions",children:[e.jsx("button",{className:"plain-save",form:`rate-${i.id}`,type:"submit",children:"Save"}),e.jsxs(r,{method:"post",children:[e.jsx("input",{type:"hidden",name:"intent",value:"delete"}),e.jsx("input",{type:"hidden",name:"id",value:i.id}),e.jsx("s-button",{type:"submit",tone:"critical",variant:"tertiary",children:"Delete"})]})]})})]})}function L({rate:i}){var s,l,d,o;return e.jsxs(r,{method:"post",children:[e.jsx("input",{type:"hidden",name:"intent",value:"save"}),i!=null&&i.id?e.jsx("input",{type:"hidden",name:"id",value:i.id}):null,e.jsxs("div",{className:"grid-form",children:[e.jsxs("label",{children:["Company",e.jsx("select",{name:"company",defaultValue:(i==null?void 0:i.company)??"FLIWAY",children:x.map(a=>e.jsx("option",{value:a,children:h[a]},a))})]}),e.jsxs("label",{children:["Service",e.jsx("select",{name:"serviceType",defaultValue:(i==null?void 0:i.serviceType)??"STANDARD_DELIVERY",children:f.map(a=>e.jsx("option",{value:a,children:g[a]},a))})]}),e.jsxs("label",{children:["City",e.jsx("input",{name:"city",required:!0,defaultValue:(i==null?void 0:i.city)??""})]}),e.jsxs("label",{children:["Postal code/range",e.jsx("input",{name:"postalCode",required:!0,defaultValue:(i==null?void 0:i.postalCode)??"*"})]}),e.jsxs("label",{children:["Min weight (g)",e.jsx("input",{name:"minWeightGrams",type:"number",min:"0",defaultValue:(i==null?void 0:i.minWeightGrams)??""})]}),e.jsxs("label",{children:["Max weight (g)",e.jsx("input",{name:"maxWeightGrams",type:"number",min:"0",defaultValue:(i==null?void 0:i.maxWeightGrams)??""})]}),e.jsxs("label",{children:["Min volume (cm3)",e.jsx("input",{name:"minVolumeCm3",type:"number",min:"0",defaultValue:(i==null?void 0:i.minVolumeCm3)??""})]}),e.jsxs("label",{children:["Max volume (cm3)",e.jsx("input",{name:"maxVolumeCm3",type:"number",min:"0",defaultValue:(i==null?void 0:i.maxVolumeCm3)??""})]}),e.jsxs("label",{children:["Rate",e.jsx("input",{name:"rate",type:"number",step:"0.01",min:"0",required:!0,defaultValue:((l=(s=i==null?void 0:i.rate)==null?void 0:s.toString)==null?void 0:l.call(s))??""})]}),e.jsxs("label",{children:["Zone surcharge",e.jsx("input",{name:"zoneSurcharge",type:"number",step:"0.01",min:"0",defaultValue:((o=(d=i==null?void 0:i.zoneSurcharge)==null?void 0:d.toString)==null?void 0:o.call(d))??"0.00"})]}),e.jsxs("label",{children:["Mode",e.jsxs("select",{name:"mode",defaultValue:(i==null?void 0:i.mode)??"",children:[e.jsx("option",{value:"",children:"Any"}),V.map(a=>e.jsx("option",{value:a,children:C[a]},a))]})]}),e.jsxs("label",{children:[e.jsx("input",{name:"useWeightRange",type:"checkbox",defaultChecked:(i==null?void 0:i.useWeightRange)??!1})," Use weight range"]}),e.jsxs("label",{children:[e.jsx("input",{name:"useVolumeRange",type:"checkbox",defaultChecked:(i==null?void 0:i.useVolumeRange)??!1})," Use volume range"]}),e.jsxs("label",{children:[e.jsx("input",{name:"active",type:"checkbox",defaultChecked:(i==null?void 0:i.active)??!0})," Active"]})]}),e.jsx("div",{style:{marginTop:12},children:e.jsx("s-button",{type:"submit",children:i!=null&&i.id?"Save rate":"Add rate"})})]})}export{T as default};
