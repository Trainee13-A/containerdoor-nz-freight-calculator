import{p as e,C as p,D as d,x as h,O as l,A as c}from"./chunk-4N6VE7H7-DLOOFdQO.js";import{A as u}from"./AppProxyProvider-LMJ2zKqf.js";var t;(function(r){r.AppStore="app_store",r.SingleMerchant="single_merchant",r.ShopifyAdmin="shopify_admin"})(t||(t={}));var i;(function(r){r.MissingShop="MISSING_SHOP",r.InvalidShop="INVALID_SHOP"})(i||(i={}));function f(r){const{parentHeaders:n,loaderHeaders:a,actionHeaders:o,errorHeaders:s}=r;return s&&Array.from(s.entries()).length>0?s:new Headers([...n?Array.from(n.entries()):[],...a?Array.from(a.entries()):[],...o?Array.from(o.entries()):[]])}function m(r){if(r.constructor.name==="ErrorResponse"||r.constructor.name==="ErrorResponseImpl")return e.jsx("div",{dangerouslySetInnerHTML:{__html:r.data||"Handling response"}});throw r}const x={error:m,headers:f},j=p(function(){const{apiKey:n}=h();return e.jsxs(u,{embedded:!0,apiKey:n,children:[e.jsx("style",{children:`
        .app-shell {
          width: 100%;
          max-width: none;
          padding: 0 8px 16px;
          box-sizing: border-box;
        }
        .app-shell s-page {
          width: 100%;
          max-width: none;
        }
        .app-shell s-section {
          max-width: none;
        }
      `}),e.jsxs("s-app-nav",{children:[e.jsx("s-link",{href:"/app",children:"Dashboard"}),e.jsx("s-link",{href:"/app/settings",children:"Settings"}),e.jsx("s-link",{href:"/app/rates",children:"Rates"}),e.jsx("s-link",{href:"/app/freight-orders",children:"Freight Orders"})]}),e.jsx("div",{className:"app-shell",children:e.jsx(l,{})})]})}),S=d(function(){return x.error(c())});export{S as ErrorBoundary,j as default};
