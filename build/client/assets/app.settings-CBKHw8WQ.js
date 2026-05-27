import{C as r,x as d,v as c,z as p,p as e,F as t}from"./chunk-4N6VE7H7-DLOOFdQO.js";import{e as o,d as u,g,s as x,f as m}from"./freight-CcKv5R17.js";const y=r(function(){const{settings:a,metafields:l}=d(),i=c(),n=p().state==="submitting";return e.jsxs("s-page",{heading:"Settings",children:[e.jsx("style",{children:`
        .settings-card {
          border: 1px solid #d5d9dd;
          border-radius: 12px;
          padding: 14px;
          background: #fff;
        }
        .settings-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .settings-field {
          display: grid;
          gap: 6px;
          font-size: 13px;
          color: #455a64;
        }
        .settings-field input,
        .settings-field select {
          width: 100%;
          border: 1px solid #bec5cc;
          border-radius: 8px;
          padding: 8px 10px;
          background: #fff;
          color: #1f2933;
        }
        .meta-list {
          display: grid;
          gap: 8px;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .meta-list li {
          border: 1px solid #dfe4e8;
          border-radius: 8px;
          padding: 10px;
          background: #fbfcfd;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .meta-key {
          color: #52606d;
          font-size: 12px;
        }
      `}),e.jsxs("s-section",{heading:"Shipping defaults",children:[i!=null&&i.message?e.jsx("s-banner",{tone:i.ok?"success":"critical",children:i.message}):null,e.jsx("div",{className:"settings-card",children:e.jsxs(t,{method:"post",children:[e.jsxs("div",{className:"settings-grid",children:[e.jsxs("label",{className:"settings-field",children:["Fuel surcharge percentage",e.jsx("input",{name:"fuelSurchargePercent",type:"number",step:"0.01",min:"0",defaultValue:a.fuelSurchargePercent})]}),e.jsxs("label",{className:"settings-field",children:["Additional cost type",e.jsx("select",{name:"additionalCostType",defaultValue:a.additionalCostType,children:o.map(s=>e.jsx("option",{value:s,children:u[s]},s))})]}),e.jsxs("label",{className:"settings-field",children:["Additional cost value",e.jsx("input",{name:"additionalCostValue",type:"number",step:"0.01",min:"0",defaultValue:a.additionalCostValue})]}),e.jsxs("label",{className:"settings-field",children:["Default currency",e.jsx("input",{name:"defaultCurrency",type:"text",maxLength:3,defaultValue:a.defaultCurrency})]}),e.jsxs("label",{className:"settings-field",children:["Default service",e.jsx("select",{name:"defaultServiceType",defaultValue:a.defaultServiceType,children:g.map(s=>e.jsx("option",{value:s,children:x[s]},s))})]})]}),e.jsx("div",{style:{marginTop:12},children:e.jsx("s-button",{type:"submit",...n?{loading:!0}:{},children:"Save settings"})})]})})]}),e.jsx("s-section",{heading:"Variant metafields",children:e.jsx("div",{className:"settings-card",children:e.jsxs("s-stack",{direction:"block",gap:"small",children:[e.jsxs("s-paragraph",{children:["Namespace: ",m]}),e.jsx("ul",{className:"meta-list",children:l.map(s=>e.jsxs("li",{children:[e.jsx("span",{children:s.name}),e.jsx("span",{className:"meta-key",children:s.key})]},s.key))}),e.jsxs(t,{method:"post",children:[e.jsx("input",{type:"hidden",name:"intent",value:"metafields"}),e.jsx("s-button",{type:"submit",children:"Create variant metafields"})]})]})})}),e.jsx("s-section",{heading:"Carrier callback registration",children:e.jsx("div",{className:"settings-card",children:e.jsxs("s-stack",{direction:"block",gap:"small",children:[e.jsx("s-paragraph",{children:"Use this after deploy/reinstall to ensure Shopify calls this app for checkout shipping rates."}),e.jsxs(t,{method:"post",children:[e.jsx("input",{type:"hidden",name:"intent",value:"carrier-register"}),e.jsx("s-button",{type:"submit",...n?{loading:!0}:{},children:"Register carrier service now"})]})]})})})]})});export{y as default};
