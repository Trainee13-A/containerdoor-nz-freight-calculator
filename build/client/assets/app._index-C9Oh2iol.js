import{C as c,x as o,p as e,L as n}from"./chunk-4N6VE7H7-DLOOFdQO.js";const x=c(function(){const{shop:l,activeRates:a,inactiveRates:i,settings:s}=o(),r=a+i,t=r>0?Math.round(a/r*100):0;return e.jsxs("s-page",{heading:"ContainerDoor freight",children:[e.jsx("style",{children:`
        .ops-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }
        .ops-card {
          border: 1px solid #d5d9dd;
          border-radius: 12px;
          padding: 14px;
          background: linear-gradient(180deg, #ffffff 0%, #f7f9fa 100%);
        }
        .ops-label {
          margin: 0;
          font-size: 12px;
          color: #4f5d6b;
          letter-spacing: 0.02em;
        }
        .ops-value {
          margin: 6px 0 0;
          font-size: 26px;
          font-weight: 700;
          color: #1f2933;
          line-height: 1.1;
        }
        .action-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }
        .action-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          border: 1px solid #bec5cc;
          border-radius: 999px;
          padding: 6px 12px;
          color: #22303c;
          background: #fff;
          font-weight: 600;
          font-size: 13px;
        }
      `}),e.jsx("s-section",{heading:"Operations summary",children:e.jsxs("div",{className:"ops-grid",children:[e.jsxs("article",{className:"ops-card",children:[e.jsx("p",{className:"ops-label",children:"Active rates"}),e.jsx("p",{className:"ops-value",children:a})]}),e.jsxs("article",{className:"ops-card",children:[e.jsx("p",{className:"ops-label",children:"Inactive rates"}),e.jsx("p",{className:"ops-value",children:i})]}),e.jsxs("article",{className:"ops-card",children:[e.jsx("p",{className:"ops-label",children:"Coverage health"}),e.jsxs("p",{className:"ops-value",children:[t,"%"]})]}),e.jsxs("article",{className:"ops-card",children:[e.jsx("p",{className:"ops-label",children:"Checkout currency"}),e.jsx("p",{className:"ops-value",children:s.defaultCurrency})]})]})}),e.jsx("s-section",{heading:"Global adjustments",children:e.jsxs("s-stack",{direction:"block",gap:"small",children:[e.jsxs("s-paragraph",{children:["Fuel surcharge: ",s.fuelSurchargePercent,"% · Additional cost: ",s.additionalCostType.toLowerCase()," ",s.additionalCostValue]}),e.jsxs("div",{className:"action-row",children:[e.jsx(n,{className:"action-link",to:"/app/settings",children:"Open settings"}),e.jsx(n,{className:"action-link",to:"/app/rates",children:"Manage rates"})]})]})}),e.jsx("s-section",{slot:"aside",heading:"Store",children:e.jsx("s-paragraph",{children:l})})]})});export{x as default};
