var _a;
import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter, UNSAFE_withComponentProps, Meta, Links, Outlet, ScrollRestoration, Scripts, useLoaderData, useActionData, Form, redirect, UNSAFE_withErrorBoundaryProps, useRouteError, useSearchParams, useNavigation, Link } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import "@shopify/shopify-app-react-router/adapters/node";
import { shopifyApp, AppDistribution, ApiVersion, LoginErrorType, boundary } from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { PrismaClient } from "@prisma/client";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useState } from "react";
const ADMIN_API_VERSION = "2025-10";
const DEFAULT_CARRIER_NAME = "ContainerDoor Shipping";
async function registerOrUpdateCarrierService(shop, accessToken) {
  const appUrl = normaliseAppUrl(process.env.SHOPIFY_APP_URL || "");
  if (!appUrl) {
    throw new Error("Missing SHOPIFY_APP_URL environment variable");
  }
  const callbackUrl = `${appUrl}/api/shipping-rates?shop=${encodeURIComponent(shop)}`;
  const carrierName = process.env.CARRIER_SERVICE_NAME || DEFAULT_CARRIER_NAME;
  console.log(`Registering/updating carrier service for ${shop} with callback URL ${callbackUrl}`);
  console.log(`Using Shopify API version ${ADMIN_API_VERSION} to register carrier service`);
  console.log(`Shopify app URL: ${carrierName}`);
  const existing = await listCarrierServices(shop, accessToken);
  const current = existing.find((service) => service.name === carrierName);
  if (current) {
    await updateCarrierService(shop, accessToken, current.id, carrierName, callbackUrl);
    return { ok: true, action: "updated", carrierServiceId: current.id };
  }
  const created = await createCarrierService(shop, accessToken, carrierName, callbackUrl);
  return { ok: true, action: "created", carrierServiceId: created.id };
}
async function listCarrierServices(shop, accessToken) {
  const response = await fetch(
    `https://${shop}/admin/api/${ADMIN_API_VERSION}/carrier_services.json`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken
      }
    }
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to list carrier services (${response.status}): ${body}`);
  }
  const json = await response.json();
  return json.carrier_services ?? [];
}
function normaliseAppUrl(url) {
  const trimmed = url.trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}
async function createCarrierService(shop, accessToken, name, callbackUrl) {
  var _a2;
  const response = await fetch(
    `https://${shop}/admin/api/${ADMIN_API_VERSION}/carrier_services.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken
      },
      body: JSON.stringify({
        carrier_service: {
          name,
          callback_url: callbackUrl,
          service_discovery: true,
          format: "json",
          active: true
        }
      })
    }
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to create carrier service (${response.status}): ${body}`);
  }
  const json = await response.json();
  if (!((_a2 = json.carrier_service) == null ? void 0 : _a2.id)) {
    throw new Error("Carrier service create returned no id");
  }
  return json.carrier_service;
}
async function updateCarrierService(shop, accessToken, carrierServiceId, name, callbackUrl) {
  const response = await fetch(
    `https://${shop}/admin/api/${ADMIN_API_VERSION}/carrier_services/${carrierServiceId}.json`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken
      },
      body: JSON.stringify({
        carrier_service: {
          id: carrierServiceId,
          name,
          callback_url: callbackUrl,
          service_discovery: true,
          format: "json",
          active: true
        }
      })
    }
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to update carrier service (${response.status}): ${body}`);
  }
}
if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
}
const prisma = global.prismaGlobal ?? new PrismaClient();
function shouldAutoRegisterCarrierService() {
  const value = String(process.env.AUTO_REGISTER_CARRIER_SERVICE || "true").toLowerCase();
  return value !== "false" && value !== "0";
}
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: (_a = process.env.SCOPES) == null ? void 0 : _a.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  hooks: {
    afterAuth: async ({ session }) => {
      if (!shouldAutoRegisterCarrierService()) {
        return;
      }
      if (!session.shop || !session.accessToken || session.isOnline) {
        return;
      }
      try {
        const result = await registerOrUpdateCarrierService(session.shop, session.accessToken);
        console.log(
          `Carrier service ${result.action} for ${session.shop} (id=${result.carrierServiceId})`
        );
      } catch (error) {
        console.error(`Carrier service registration failed for ${session.shop}`, error);
      }
    }
  },
  future: {
    expiringOfflineAccessTokens: true
  },
  ...process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {}
});
ApiVersion.October25;
const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
const authenticate = shopify.authenticate;
const unauthenticated = shopify.unauthenticated;
const login = shopify.login;
shopify.registerWebhooks;
shopify.sessionStorage;
const streamTimeout = 5e3;
async function handleRequest(request, responseStatusCode, responseHeaders, reactRouterContext) {
  addDocumentResponseHeaders(request, responseHeaders);
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";
  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        ServerRouter,
        {
          context: reactRouterContext,
          url: request.url
        }
      ),
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width,initial-scale=1"
      }), /* @__PURE__ */ jsx("link", {
        rel: "preconnect",
        href: "https://cdn.shopify.com/"
      }), /* @__PURE__ */ jsx("link", {
        rel: "stylesheet",
        href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [/* @__PURE__ */ jsx(Outlet, {}), /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: root
}, Symbol.toStringTag, { value: "Module" }));
const action$6 = async ({
  request
}) => {
  const {
    payload,
    session,
    topic,
    shop
  } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  const current = payload.current;
  if (session) {
    await prisma.session.update({
      where: {
        id: session.id
      },
      data: {
        scope: current.toString()
      }
    });
  }
  return new Response();
};
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$6
}, Symbol.toStringTag, { value: "Module" }));
const action$5 = async ({
  request
}) => {
  const {
    shop,
    session,
    topic
  } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  if (session) {
    await prisma.session.deleteMany({
      where: {
        shop
      }
    });
  }
  return new Response();
};
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5
}, Symbol.toStringTag, { value: "Module" }));
const action$4 = async ({
  request
}) => {
  const {
    payload,
    topic,
    shop
  } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  const orderPayload = payload;
  const syncPayload = buildOrderSyncPayload(shop, orderPayload);
  const targets = [{
    name: "Cin7",
    url: process.env.CIN7_SYNC_URL,
    token: process.env.CIN7_SYNC_TOKEN
  }, {
    name: "Monday",
    url: process.env.MONDAY_SYNC_URL,
    token: process.env.MONDAY_SYNC_TOKEN
  }];
  await Promise.all(targets.map(async (target) => {
    if (!target.url) return;
    try {
      const headers2 = {
        "Content-Type": "application/json"
      };
      if (target.token) {
        headers2.Authorization = `Bearer ${target.token}`;
      }
      const response = await fetch(target.url, {
        method: "POST",
        headers: headers2,
        body: JSON.stringify(syncPayload)
      });
      if (!response.ok) {
        console.error(`Order sync failed for ${target.name}: ${response.status}`);
      }
    } catch (error) {
      console.error(`Order sync request failed for ${target.name}`, error);
    }
  }));
  return new Response();
};
function buildOrderSyncPayload(shop, order) {
  var _a2, _b, _c;
  return {
    shop,
    order: {
      id: order.id,
      name: order.name,
      createdAt: order.created_at,
      currency: order.currency,
      totalPrice: order.total_price,
      shippingAddress: {
        city: (_a2 = order.shipping_address) == null ? void 0 : _a2.city,
        postalCode: (_b = order.shipping_address) == null ? void 0 : _b.zip,
        countryCode: (_c = order.shipping_address) == null ? void 0 : _c.country_code
      },
      lineItems: (order.line_items ?? []).map((lineItem) => ({
        id: lineItem.id,
        sku: lineItem.sku,
        quantity: lineItem.quantity,
        grams: lineItem.grams,
        freight: extractFreightProperties(lineItem.properties ?? [])
      }))
    }
  };
}
function extractFreightProperties(properties) {
  const map = Object.fromEntries(properties.filter((property) => property.name).map((property) => [String(property.name), String(property.value ?? "")]));
  return {
    company: map.courier_company,
    serviceType: map.freight_service_type,
    boxes: map.number_of_boxes,
    unitsPerBox: map.units_per_box,
    weightGrams: map.weight_grams,
    volumeCm3: map.volume_cm3,
    hiabRequired: map.hiab_required,
    shippingCharge: map.freight_charge
  };
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4
}, Symbol.toStringTag, { value: "Module" }));
const carrierCompanies = [
  "FLIWAY",
  "NZP",
  "CASTLE",
  "TGE",
  "M2H",
  "MAINFREIGHT"
];
const serviceTypes = [
  "STANDARD_DELIVERY",
  "DEPOT_DELIVERY",
  "CUSTOMER_PICKUP"
];
const carrierModes = ["AIR", "ROAD"];
const costTypes = ["FIXED", "PERCENTAGE"];
const serviceLabels = {
  STANDARD_DELIVERY: "Standard delivery",
  DEPOT_DELIVERY: "Depot delivery",
  CUSTOMER_PICKUP: "Customer pickup"
};
const companyLabels = {
  FLIWAY: "Fliway",
  NZP: "NZP",
  CASTLE: "Castle",
  TGE: "Team Global Express",
  M2H: "M2H",
  MAINFREIGHT: "Mainfreight"
};
const freightFormula = {
  marginRate: 0.1,
  gstRate: 0.15,
  homeDeliveryFees: {
    FLIWAY: 45,
    TGE: 25
  },
  depotCollectionCompanies: ["FLIWAY", "MAINFREIGHT", "TGE"],
  // NEW: NZP-specific
  nzp: {
    totalVariableRate: 0.114
  },
  // NEW: Castle-specific
  castle: {
    totalVariableRate: 0.167
  }
};
const modeLabels = {
  AIR: "Air",
  ROAD: "Road"
};
const costTypeLabels = {
  FIXED: "Fixed",
  PERCENTAGE: "Percentage"
};
const variantFreightMetafields = [
  { key: "box_length_cm", name: "Box length (cm)", type: "number_decimal" },
  { key: "box_width_cm", name: "Box width (cm)", type: "number_decimal" },
  { key: "box_height_cm", name: "Box height (cm)", type: "number_decimal" },
  { key: "number_of_boxes", name: "Number of boxes", type: "number_integer" },
  { key: "weight_grams", name: "Weight (g)", type: "number_integer" },
  { key: "courier_company", name: "Courier company", type: "single_line_text_field" },
  { key: "hiab_required", name: "HIAB required", type: "boolean" },
  { key: "units_per_box", name: "Units per box", type: "number_integer" }
];
const freightMetafieldNamespace = "containerdoor_freight";
function toMoney(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
}
function parseBoolean(value) {
  return value === "on" || value === "true" || value === "1";
}
function parseOptionalInt(value) {
  if (value === null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}
function parseDecimalString(value) {
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
}
async function getAppSettings(shop) {
  return prisma.appSetting.upsert({
    where: { shop },
    update: {},
    create: { shop }
  });
}
async function updateAppSettings(shop, formData) {
  return prisma.appSetting.upsert({
    where: { shop },
    update: {
      fuelSurchargePercent: parseDecimalString(formData.get("fuelSurchargePercent")),
      additionalCostType: String(formData.get("additionalCostType") || "FIXED"),
      additionalCostValue: parseDecimalString(formData.get("additionalCostValue")),
      defaultCurrency: String(formData.get("defaultCurrency") || "NZD").toUpperCase(),
      defaultServiceType: String(formData.get("defaultServiceType") || "STANDARD_DELIVERY")
    },
    create: {
      shop,
      fuelSurchargePercent: parseDecimalString(formData.get("fuelSurchargePercent")),
      additionalCostType: String(formData.get("additionalCostType") || "FIXED"),
      additionalCostValue: parseDecimalString(formData.get("additionalCostValue")),
      defaultCurrency: String(formData.get("defaultCurrency") || "NZD").toUpperCase(),
      defaultServiceType: String(formData.get("defaultServiceType") || "STANDARD_DELIVERY")
    }
  });
}
async function listRates(shop, page, filters) {
  var _a2;
  const take = 100;
  const skip = Math.max(page - 1, 0) * take;
  const query = (_a2 = filters == null ? void 0 : filters.query) == null ? void 0 : _a2.trim();
  const company = (filters == null ? void 0 : filters.company) || "";
  const serviceType = (filters == null ? void 0 : filters.serviceType) || "";
  const where = {
    shop,
    active: true,
    ...company ? { company } : {},
    ...serviceType ? { serviceType } : {},
    ...query ? {
      OR: [
        { city: { contains: query, mode: "insensitive" } },
        { postalCode: { contains: query, mode: "insensitive" } }
      ]
    } : {}
  };
  const [rates, total] = await Promise.all([
    prisma.shippingRate.findMany({
      where,
      orderBy: [{ company: "asc" }, { serviceType: "asc" }, { city: "asc" }],
      take,
      skip
    }),
    prisma.shippingRate.count({ where })
  ]);
  return {
    rates: rates.map((rate) => ({
      ...rate,
      rate: rate.rate.toString(),
      zoneSurcharge: rate.zoneSurcharge.toString(),
      createdAt: rate.createdAt.toISOString(),
      updatedAt: rate.updatedAt.toISOString()
    })),
    total,
    page,
    pageCount: Math.max(Math.ceil(total / take), 1)
  };
}
async function upsertRate(shop, formData) {
  const id = String(formData.get("id") || "");
  const data = readRateForm(shop, formData);
  if (!isServiceSupportedByCompany(data.company, data.serviceType)) {
    return {
      ok: false,
      message: "Depot delivery is only available for Fliway, Mainfreight, and Team Global Express."
    };
  }
  if (id) {
    await prisma.shippingRate.update({ where: { id, shop }, data });
    return { ok: true, message: "Rate updated" };
  }
  await prisma.shippingRate.create({ data });
  return { ok: true, message: "Rate added" };
}
async function deleteRate(shop, id) {
  await prisma.shippingRate.deleteMany({ where: { id, shop } });
  return { ok: true, message: "Rate deleted" };
}
async function exportRatesCsv(shop) {
  const rates = await prisma.shippingRate.findMany({
    where: { shop },
    orderBy: [{ company: "asc" }, { serviceType: "asc" }, { city: "asc" }]
  });
  const rows = [
    [
      "company",
      "serviceType",
      "city",
      "postalCode",
      "useWeightRange",
      "minWeightGrams",
      "maxWeightGrams",
      "useVolumeRange",
      "minVolumeCm3",
      "maxVolumeCm3",
      "rate",
      "zoneSurcharge",
      "mode",
      "active",
      "id"
    ],
    ...rates.map((rate) => [
      rate.company,
      rate.serviceType,
      rate.city,
      rate.postalCode,
      String(rate.useWeightRange),
      rate.minWeightGrams ?? "",
      rate.maxWeightGrams ?? "",
      String(rate.useVolumeRange),
      rate.minVolumeCm3 ?? "",
      rate.maxVolumeCm3 ?? "",
      rate.rate.toString(),
      rate.zoneSurcharge.toString(),
      rate.mode ?? "",
      String(rate.active),
      rate.id
    ])
  ];
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}
async function importRatesCsv(shop, csv) {
  const [headerLine, ...lines] = csv.split(/\r?\n/).filter(Boolean);
  if (!headerLine) return { ok: false, message: "CSV is empty" };
  const headers2 = parseCsvLine(headerLine);
  let created = 0;
  let updated = 0;
  for (const line of lines) {
    const cells = parseCsvLine(line);
    const row = Object.fromEntries(headers2.map((header, index2) => [header, cells[index2] ?? ""]));
    const minWeightGrams = toNullableInt(row.minWeightGrams);
    const maxWeightGrams = toNullableInt(row.maxWeightGrams);
    const minVolumeCm3 = toNullableInt(row.minVolumeCm3);
    const maxVolumeCm3 = toNullableInt(row.maxVolumeCm3);
    const useWeightRange = normaliseBoolean(row.useWeightRange) || minWeightGrams !== null || maxWeightGrams !== null;
    const useVolumeRange = normaliseBoolean(row.useVolumeRange) || minVolumeCm3 !== null || maxVolumeCm3 !== null;
    const data = {
      shop,
      company: normaliseEnum(row.company, carrierCompanies, "FLIWAY"),
      serviceType: normaliseEnum(row.serviceType, serviceTypes, "STANDARD_DELIVERY"),
      city: row.city || "All",
      postalCode: row.postalCode || "*",
      useWeightRange,
      minWeightGrams,
      maxWeightGrams,
      useVolumeRange,
      minVolumeCm3,
      maxVolumeCm3,
      rate: parseDecimalString(row.rate),
      zoneSurcharge: parseDecimalString(row.zoneSurcharge),
      mode: row.mode ? normaliseEnum(row.mode, carrierModes, "ROAD") : null,
      active: row.active === "" ? true : normaliseBoolean(row.active)
    };
    if (!isServiceSupportedByCompany(data.company, data.serviceType)) {
      continue;
    }
    const existing = row.id ? await prisma.shippingRate.findFirst({ where: { id: row.id, shop } }) : await prisma.shippingRate.findFirst({
      where: {
        shop,
        company: data.company,
        serviceType: data.serviceType,
        city: data.city,
        postalCode: data.postalCode,
        mode: data.mode
      }
    });
    if (existing) {
      await prisma.shippingRate.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.shippingRate.create({ data });
      created += 1;
    }
  }
  return { ok: true, message: `${created} rates created, ${updated} rates updated` };
}
async function calculateServiceRates(shop, destination, packages) {
  const settings = await getAppSettings(shop);
  const packagesByVariant = /* @__PURE__ */ new Map();
  for (const pkg of packages) {
    const key = pkg.variantId ?? "";
    const group = packagesByVariant.get(key) ?? [];
    group.push(pkg);
    packagesByVariant.set(key, group);
  }
  const serviceAccum = /* @__PURE__ */ new Map();
  for (const [variantId, variantPackages] of packagesByVariant) {
    const bestByService = /* @__PURE__ */ new Map();
    for (const freightPackage of variantPackages) {
      const matchedRates = await findMatchingRates(shop, destination, freightPackage);
      for (const matchedRate of matchedRates) {
        const amount = calculateFreightRate(freightPackage, matchedRate);
        if (amount === null) continue;
        const current = bestByService.get(matchedRate.serviceType);
        if (!current || amount < current.amount) {
          bestByService.set(matchedRate.serviceType, {
            company: matchedRate.company,
            amount,
            boxes: freightPackage.boxes
          });
        }
      }
    }
    for (const [serviceType, best] of bestByService) {
      const existing = serviceAccum.get(serviceType) ?? {
        total: 0,
        packageCount: 0,
        coveredVariants: 0,
        lineItemBreakdown: []
      };
      existing.total += best.amount;
      existing.packageCount += best.boxes;
      existing.coveredVariants += 1;
      existing.lineItemBreakdown.push({
        variantId,
        company: best.company,
        amount: best.amount,
        boxes: best.boxes
      });
      serviceAccum.set(serviceType, existing);
    }
  }
  const completeServiceRates = [];
  for (const [serviceType, accum] of serviceAccum) {
    if (accum.coveredVariants !== packagesByVariant.size) continue;
    const companies = [...new Set(accum.lineItemBreakdown.map((l) => l.company))];
    completeServiceRates.push({
      serviceType,
      total: applySettings(accum.total, settings),
      currency: settings.defaultCurrency,
      packageCount: accum.packageCount,
      companies,
      lineItemBreakdown: accum.lineItemBreakdown
    });
  }
  return completeServiceRates.sort((a, b) => a.serviceType.localeCompare(b.serviceType));
}
async function findMatchingRates(shop, destination, freightPackage) {
  var _a2, _b;
  const city = (_a2 = destination.city) == null ? void 0 : _a2.trim();
  const postalCode = (_b = destination.postalCode) == null ? void 0 : _b.trim();
  const rates = await prisma.shippingRate.findMany({
    where: {
      shop,
      active: true,
      company: freightPackage.company
    }
  });
  return rates.filter((rate) => {
    const matchesWeight = !rate.useWeightRange || (rate.minWeightGrams === null || freightPackage.weightGrams >= rate.minWeightGrams) && (rate.maxWeightGrams === null || freightPackage.weightGrams <= rate.maxWeightGrams);
    const matchesVolume = !rate.useVolumeRange || (rate.minVolumeCm3 === null || freightPackage.volumeCm3 >= rate.minVolumeCm3) && (rate.maxVolumeCm3 === null || freightPackage.volumeCm3 <= rate.maxVolumeCm3);
    const matchesPostalCode = !postalCode || rate.postalCode === "*" || postalCodeInRange(postalCode, rate.postalCode);
    const matchesCity = !city || cityMatches(city, rate.city);
    return matchesWeight && matchesVolume && matchesPostalCode && matchesCity;
  });
}
function readRateForm(shop, formData) {
  const minWeightGrams = parseOptionalInt(formData.get("minWeightGrams"));
  const maxWeightGrams = parseOptionalInt(formData.get("maxWeightGrams"));
  const minVolumeCm3 = parseOptionalInt(formData.get("minVolumeCm3"));
  const maxVolumeCm3 = parseOptionalInt(formData.get("maxVolumeCm3"));
  const useWeightRange = parseBoolean(formData.get("useWeightRange")) || minWeightGrams !== null || maxWeightGrams !== null;
  const useVolumeRange = parseBoolean(formData.get("useVolumeRange")) || minVolumeCm3 !== null || maxVolumeCm3 !== null;
  return {
    shop,
    company: String(formData.get("company") || "FLIWAY"),
    serviceType: String(formData.get("serviceType") || "STANDARD_DELIVERY"),
    city: String(formData.get("city") || "").trim(),
    postalCode: String(formData.get("postalCode") || "*").trim(),
    useWeightRange,
    minWeightGrams,
    maxWeightGrams,
    useVolumeRange,
    minVolumeCm3,
    maxVolumeCm3,
    rate: parseDecimalString(formData.get("rate")),
    zoneSurcharge: parseDecimalString(formData.get("zoneSurcharge")),
    mode: formData.get("mode") ? String(formData.get("mode")) : null,
    active: parseBoolean(formData.get("active"))
  };
}
function calculateFreightRate(freightPackage, rate) {
  if (rate.serviceType === "DEPOT_DELIVERY" && !freightFormula.depotCollectionCompanies.includes(rate.company)) {
    return null;
  }
  if (rate.serviceType === "CUSTOMER_PICKUP") {
    return 0;
  }
  if (rate.company === "NZP") {
    return calculateNzpRate(freightPackage, rate);
  }
  if (rate.company === "CASTLE") {
    return calculateCastleRate(freightPackage, rate);
  }
  const cbm = freightPackage.volumeCm3 / 1e6;
  const baseFreight = cbm * Number(rate.rate);
  const zoneSurcharge = rate.serviceType === "STANDARD_DELIVERY" ? Number(rate.zoneSurcharge) : 0;
  const homeDeliveryFee = rate.serviceType === "STANDARD_DELIVERY" ? freightFormula.homeDeliveryFees[rate.company] ?? 0 : 0;
  const subtotal = baseFreight + zoneSurcharge + homeDeliveryFee;
  const withMargin = subtotal * (1 + freightFormula.marginRate);
  return withMargin * (1 + freightFormula.gstRate);
}
function calculateNzpRate(freightPackage, rate) {
  const baseCharge = Number(rate.rate);
  const additionalCharges = Number(rate.zoneSurcharge);
  const subtotal = (baseCharge + additionalCharges) * (1 + freightFormula.nzp.totalVariableRate);
  const withMargin = subtotal * (1 + freightFormula.marginRate);
  return withMargin * (1 + freightFormula.gstRate);
}
function calculateCastleRate(freightPackage, rate) {
  const baseCharge = Number(rate.rate);
  const additionalCharges = Number(rate.zoneSurcharge);
  const subtotal = (baseCharge + additionalCharges) * (1 + freightFormula.castle.totalVariableRate);
  const withMargin = subtotal * (1 + freightFormula.marginRate);
  return withMargin * (1 + freightFormula.gstRate);
}
function applySettings(baseRate, settings) {
  const withFuel = baseRate + baseRate * (Number(settings.fuelSurchargePercent) / 100);
  if (settings.additionalCostType === "PERCENTAGE") {
    return withFuel + withFuel * (Number(settings.additionalCostValue) / 100);
  }
  return withFuel + Number(settings.additionalCostValue);
}
function postalCodeInRange(postalCode, range) {
  if (range === "*" || range === postalCode) return true;
  const [start, end] = range.split("-").map((part) => Number.parseInt(part.trim(), 10));
  const numericPostalCode = Number.parseInt(postalCode.trim(), 10);
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(numericPostalCode)) {
    return false;
  }
  return numericPostalCode >= start && numericPostalCode <= end;
}
function cityMatches(destinationCity, rateCity) {
  const normalisedRateCity = rateCity.trim().toLowerCase();
  if (!normalisedRateCity || normalisedRateCity === "*" || normalisedRateCity === "all") {
    return true;
  }
  return destinationCity.trim().toLowerCase() === normalisedRateCity;
}
function escapeCsvCell(value) {
  const cell = String(value ?? "");
  if (!/[",\n]/.test(cell)) return cell;
  return `"${cell.replace(/"/g, '""')}"`;
}
function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index2 = 0; index2 < line.length; index2 += 1) {
    const character = line[index2];
    const next = line[index2 + 1];
    if (character === '"' && quoted && next === '"') {
      current += '"';
      index2 += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  cells.push(current);
  return cells;
}
function normaliseEnum(value, values, fallback) {
  const normalised = String(value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  return values.includes(normalised) ? normalised : fallback;
}
function toNullableInt(value) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
function normaliseBoolean(value) {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").trim().toLowerCase());
}
function isServiceSupportedByCompany(company, serviceType) {
  return serviceType !== "DEPOT_DELIVERY" || freightFormula.depotCollectionCompanies.includes(company);
}
const action$3 = async ({
  request
}) => {
  var _a2, _b, _c, _d, _e, _f, _g, _h, _i;
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop") || process.env.SHOPIFY_SHOP_DOMAIN || "";
    if (!shop) {
      console.error("Shipping callback missing shop query parameter and SHOPIFY_SHOP_DOMAIN fallback");
      return Response.json({
        rates: []
      });
    }
    const payload = await request.json();
    console.log(`Shipping callback received for ${shop} with ${((_b = (_a2 = payload.rate) == null ? void 0 : _a2.items) == null ? void 0 : _b.length) ?? 0} cart items`);
    const destination = {
      city: (_d = (_c = payload.rate) == null ? void 0 : _c.destination) == null ? void 0 : _d.city,
      postalCode: (_f = (_e = payload.rate) == null ? void 0 : _e.destination) == null ? void 0 : _f.postal_code
    };
    const packages = await getFreightPackages(shop, ((_g = payload.rate) == null ? void 0 : _g.items) ?? []);
    if (packages.length === 0) {
      return Response.json({
        rates: []
      });
    }
    const serviceRates = await calculateServiceRates(shop, destination, packages);
    const standardRate = serviceRates.find((r) => r.serviceType === "STANDARD_DELIVERY");
    if (!standardRate) {
      return Response.json({
        rates: [{
          service_name: "Freight Quote Required",
          service_code: "manual_quote",
          description: "Please contact us for a freight quote for your location.",
          currency: ((_h = payload.rate) == null ? void 0 : _h.currency) || "NZD",
          total_price: "0"
        }]
      });
    }
    console.log(`[FREIGHT] Standard Delivery breakdown for ${shop}:`, JSON.stringify(standardRate.lineItemBreakdown, null, 2));
    const lineItemSummary = standardRate.lineItemBreakdown.map((l) => `${l.variantId.split("/").pop()}:${l.company}x${l.boxes}`).join("|");
    const companies = [...new Set(standardRate.lineItemBreakdown.map((l) => l.company))].join(",");
    const serviceCode = `standard_delivery::${companies}::${standardRate.packageCount}boxes::${lineItemSummary}`;
    const rates = [{
      service_name: "Standard Delivery",
      service_code: serviceCode,
      currency: standardRate.currency || ((_i = payload.rate) == null ? void 0 : _i.currency) || "NZD",
      total_price: Math.round(standardRate.total * 100).toString()
    }];
    return Response.json({
      rates
    });
  } catch (error) {
    console.error("Shipping callback failed", error);
    return Response.json({
      rates: []
    });
  }
};
async function getFreightPackages(shop, items) {
  const variantIds = (items ?? []).map((item) => item.variant_id).filter(Boolean).map((variantId) => `gid://shopify/ProductVariant/${variantId}`);
  const metafieldsByVariant = await loadVariantMetafields(shop, variantIds);
  const packages = [];
  for (const item of items ?? []) {
    const variantGid = item.variant_id ? `gid://shopify/ProductVariant/${item.variant_id}` : "";
    const metafields = metafieldsByVariant.get(variantGid) ?? {};
    const properties = item.properties ?? {};
    const quantity = Number(item.quantity ?? 1);
    const unitsPerBox = positiveInt(metafields.units_per_box || properties.units_per_box) || 1;
    const explicitBoxes = positiveInt(metafields.number_of_boxes || properties.number_of_boxes);
    const boxes = Math.max(explicitBoxes || Math.ceil(quantity / unitsPerBox), 1);
    const length = positiveNumber(metafields.box_length_cm || properties.box_length_cm);
    const width = positiveNumber(metafields.box_width_cm || properties.box_width_cm);
    const height = positiveNumber(metafields.box_height_cm || properties.box_height_cm);
    const companyRaw = metafields.courier_company || properties.courier_company || "";
    const companies = companyRaw.split(",").map((c) => normaliseCompany(c.trim())).filter((c) => c !== null);
    if (companies.length === 0) {
      continue;
    }
    for (const company of companies) {
      packages.push({
        variantId: variantGid,
        quantity,
        company,
        boxes,
        weightGrams: positiveInt(metafields.weight_grams || properties.weight_grams) || Number(item.grams ?? 0) * quantity,
        volumeCm3: length * width * height * boxes,
        hiabRequired: isTrue(metafields.hiab_required) || isTrue(properties.hiab_required)
      });
    }
  }
  return packages;
}
async function loadVariantMetafields(shop, variantIds) {
  var _a2, _b;
  const metafieldsByVariant = /* @__PURE__ */ new Map();
  if (variantIds.length === 0) return metafieldsByVariant;
  try {
    const {
      admin
    } = await unauthenticated.admin(shop);
    const response = await admin.graphql(`#graphql
      query VariantFreightMetafields($ids: [ID!]!, $namespace: String!) {
        nodes(ids: $ids) {
          ... on ProductVariant {
            id
            metafields(first: 20, namespace: $namespace) {
              nodes { key value }
            }
          }
        }
      }`, {
      variables: {
        ids: variantIds,
        namespace: freightMetafieldNamespace
      }
    });
    const json = await response.json();
    for (const node of ((_a2 = json.data) == null ? void 0 : _a2.nodes) ?? []) {
      if (!(node == null ? void 0 : node.id)) continue;
      metafieldsByVariant.set(node.id, Object.fromEntries((((_b = node.metafields) == null ? void 0 : _b.nodes) ?? []).map((field) => [field.key, field.value])));
    }
  } catch {
    return metafieldsByVariant;
  }
  return metafieldsByVariant;
}
function normaliseCompany(value) {
  const normalised = String(value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  const aliases = {
    TEAM_GLOBAL_EXPRESS: "TGE",
    MAIN_FREIGHT: "MAINFREIGHT",
    COURIER_POST: "NZP"
  };
  const mapped = aliases[normalised] ?? normalised;
  return carrierCompanies.includes(mapped) ? mapped : null;
}
function positiveNumber(value) {
  const parsed = Number.parseFloat(value ?? "0");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
function positiveInt(value) {
  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
function isTrue(value) {
  return ["1", "true", "yes", "on", "y"].includes(String(value ?? "").trim().toLowerCase());
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3
}, Symbol.toStringTag, { value: "Module" }));
const loader$8 = async ({
  request
}) => {
  const {
    session
  } = await authenticate.admin(request);
  const csv = await exportRatesCsv(session.shop);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="containerdoor-shipping-rates.csv"'
    }
  });
};
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
function loginErrorMessage(loginErrors) {
  if ((loginErrors == null ? void 0 : loginErrors.shop) === LoginErrorType.MissingShop) {
    return { shop: "Please enter your shop domain to log in" };
  } else if ((loginErrors == null ? void 0 : loginErrors.shop) === LoginErrorType.InvalidShop) {
    return { shop: "Please enter a valid shop domain to log in" };
  }
  return {};
}
const loader$7 = async ({
  request
}) => {
  const errors = loginErrorMessage(await login(request));
  return {
    errors
  };
};
const action$2 = async ({
  request
}) => {
  const errors = loginErrorMessage(await login(request));
  return {
    errors
  };
};
const route$1 = UNSAFE_withComponentProps(function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const {
    errors
  } = actionData || loaderData;
  return /* @__PURE__ */ jsx(AppProvider, {
    embedded: false,
    children: /* @__PURE__ */ jsx("s-page", {
      children: /* @__PURE__ */ jsx(Form, {
        method: "post",
        children: /* @__PURE__ */ jsxs("s-section", {
          heading: "Log in",
          children: [/* @__PURE__ */ jsx("s-text-field", {
            name: "shop",
            label: "Shop domain",
            details: "example.myshopify.com",
            value: shop,
            onChange: (e) => setShop(e.currentTarget.value),
            autocomplete: "on",
            error: errors.shop
          }), /* @__PURE__ */ jsx("s-button", {
            type: "submit",
            children: "Log in"
          })]
        })
      })
    })
  });
});
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: route$1,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
const index = "_index_12o3y_1";
const heading = "_heading_12o3y_11";
const text = "_text_12o3y_12";
const content = "_content_12o3y_22";
const form = "_form_12o3y_27";
const label = "_label_12o3y_35";
const input = "_input_12o3y_43";
const button = "_button_12o3y_47";
const list = "_list_12o3y_51";
const styles = {
  index,
  heading,
  text,
  content,
  form,
  label,
  input,
  button,
  list
};
const loader$6 = async ({
  request
}) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return {
    showForm: Boolean(login)
  };
};
const route = UNSAFE_withComponentProps(function App2() {
  const {
    showForm
  } = useLoaderData();
  return /* @__PURE__ */ jsx("div", {
    className: styles.index,
    children: /* @__PURE__ */ jsxs("div", {
      className: styles.content,
      children: [/* @__PURE__ */ jsx("h1", {
        className: styles.heading,
        children: "A short heading about [your app]"
      }), /* @__PURE__ */ jsx("p", {
        className: styles.text,
        children: "A tagline about [your app] that describes your value proposition."
      }), showForm && /* @__PURE__ */ jsxs(Form, {
        className: styles.form,
        method: "post",
        action: "/auth/login",
        children: [/* @__PURE__ */ jsxs("label", {
          className: styles.label,
          children: [/* @__PURE__ */ jsx("span", {
            children: "Shop domain"
          }), /* @__PURE__ */ jsx("input", {
            className: styles.input,
            type: "text",
            name: "shop"
          }), /* @__PURE__ */ jsx("span", {
            children: "e.g: my-shop-domain.myshopify.com"
          })]
        }), /* @__PURE__ */ jsx("button", {
          className: styles.button,
          type: "submit",
          children: "Log in"
        })]
      }), /* @__PURE__ */ jsxs("ul", {
        className: styles.list,
        children: [/* @__PURE__ */ jsxs("li", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Product feature"
          }), ". Some detail about your feature and its benefit to your customer."]
        }), /* @__PURE__ */ jsxs("li", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Product feature"
          }), ". Some detail about your feature and its benefit to your customer."]
        }), /* @__PURE__ */ jsxs("li", {
          children: [/* @__PURE__ */ jsx("strong", {
            children: "Product feature"
          }), ". Some detail about your feature and its benefit to your customer."]
        })]
      })]
    })
  });
});
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: route,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
const loader$5 = async ({
  request
}) => {
  await authenticate.admin(request);
  return null;
};
const headers$2 = (headersArgs) => {
  return boundary.headers(headersArgs);
};
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  headers: headers$2,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
const loader$4 = async ({
  request
}) => {
  await authenticate.admin(request);
  return {
    apiKey: process.env.SHOPIFY_API_KEY || ""
  };
};
const app = UNSAFE_withComponentProps(function App3() {
  const {
    apiKey
  } = useLoaderData();
  return /* @__PURE__ */ jsxs(AppProvider, {
    embedded: true,
    apiKey,
    children: [/* @__PURE__ */ jsx("style", {
      children: `
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
      `
    }), /* @__PURE__ */ jsxs("s-app-nav", {
      children: [/* @__PURE__ */ jsx("s-link", {
        href: "/app",
        children: "Dashboard"
      }), /* @__PURE__ */ jsx("s-link", {
        href: "/app/settings",
        children: "Settings"
      }), /* @__PURE__ */ jsx("s-link", {
        href: "/app/rates",
        children: "Rates"
      }), /* @__PURE__ */ jsx("s-link", {
        href: "/app/freight-orders",
        children: "Freight Orders"
      })]
    }), /* @__PURE__ */ jsx("div", {
      className: "app-shell",
      children: /* @__PURE__ */ jsx(Outlet, {})
    })]
  });
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2() {
  return boundary.error(useRouteError());
});
const headers$1 = (headersArgs) => {
  return boundary.headers(headersArgs);
};
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  default: app,
  headers: headers$1,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
const PAGE_SIZE = 25;
async function loader$3({
  request
}) {
  var _a2, _b;
  const {
    admin
  } = await authenticate.admin(request);
  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page") || "1"), 1);
  const response = await admin.graphql(`
    #graphql
    query FreightOrders($first: Int!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: true) {
        nodes {
          id
          name
          createdAt
          currencyCode
          shippingAddress { city zip }
          shippingLines(first: 5) {
            nodes {
              title
              code
              originalPriceSet {
                shopMoney { amount currencyCode }
              }
            }
          }
          lineItems(first: 50) {
            nodes {
              id
              title
              variant { id }
            }
          }
        }
      }
    }
  `, {
    variables: {
      first: 250
    }
  });
  const json = await response.json();
  const allOrders = ((_b = (_a2 = json.data) == null ? void 0 : _a2.orders) == null ? void 0 : _b.nodes) ?? [];
  const freightOrders = allOrders.map((order) => buildFreightOrderRow(order)).filter((row) => row !== null);
  const total = freightOrders.length;
  const pageCount = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const paged = freightOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return {
    orders: paged,
    total,
    page,
    pageCount
  };
}
function buildFreightOrderRow(order) {
  var _a2, _b, _c;
  const shippingLine = order.shippingLines.nodes.find((s) => {
    var _a3;
    return (_a3 = s.code) == null ? void 0 : _a3.startsWith("standard_delivery::");
  });
  if (!shippingLine) return null;
  const [, carriers, packageCount, lineItemsRaw] = shippingLine.code.split("::");
  if (!carriers || !lineItemsRaw) return null;
  const variantTitleMap = /* @__PURE__ */ new Map();
  for (const li of order.lineItems.nodes) {
    if ((_a2 = li.variant) == null ? void 0 : _a2.id) {
      const numericId = li.variant.id.replace("gid://shopify/ProductVariant/", "");
      variantTitleMap.set(numericId, li.title);
    }
  }
  const lineItems = lineItemsRaw.split("|").map((part, idx) => {
    const [variantId, rest] = part.split(":");
    const [company, boxesStr] = (rest ?? "").split("x");
    return {
      id: `${order.id}-${idx}`,
      variantId,
      title: variantTitleMap.get(variantId),
      company: company ?? "",
      boxes: Number(boxesStr ?? 0)
    };
  });
  const totalFreight = Number(shippingLine.originalPriceSet.shopMoney.amount ?? 0);
  return {
    id: order.id,
    shopifyOrderId: order.id.replace("gid://shopify/Order/", ""),
    shopifyOrderName: order.name,
    currency: order.currencyCode,
    totalFreight,
    city: ((_b = order.shippingAddress) == null ? void 0 : _b.city) ?? null,
    postalCode: ((_c = order.shippingAddress) == null ? void 0 : _c.zip) ?? null,
    createdAt: order.createdAt,
    carriers,
    packageCount,
    shippingTitle: shippingLine.title,
    lineItems
  };
}
const app_freightOrders = UNSAFE_withComponentProps(function FreightOrdersPage() {
  const {
    orders,
    total,
    page,
    pageCount
  } = useLoaderData();
  const [, setSearchParams] = useSearchParams();
  const formatCurrency = (amount, currency) => new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency
  }).format(amount);
  return /* @__PURE__ */ jsxs("div", {
    style: {
      padding: "20px",
      fontFamily: "sans-serif"
    },
    children: [/* @__PURE__ */ jsxs("div", {
      style: {
        marginBottom: "20px"
      },
      children: [/* @__PURE__ */ jsx("h1", {
        style: {
          fontSize: "20px",
          fontWeight: 600,
          margin: 0
        },
        children: "Freight Orders"
      }), /* @__PURE__ */ jsxs("p", {
        style: {
          color: "#6b7280",
          marginTop: "4px",
          fontSize: "14px"
        },
        children: [total, " orders — carrier selections from checkout"]
      })]
    }), orders.length === 0 ? /* @__PURE__ */ jsx("div", {
      style: {
        padding: "48px",
        textAlign: "center",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        color: "#6b7280"
      },
      children: "No freight orders yet. Orders appear here after checkout completes."
    }) : /* @__PURE__ */ jsx("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      },
      children: orders.map((order) => /* @__PURE__ */ jsxs("div", {
        style: {
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          overflow: "hidden"
        },
        children: [/* @__PURE__ */ jsxs("div", {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb"
          },
          children: [/* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "12px"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                fontWeight: 600,
                fontSize: "15px"
              },
              children: order.shopifyOrderName
            }), order.city && /* @__PURE__ */ jsxs("span", {
              style: {
                fontSize: "12px",
                color: "#6b7280",
                background: "#f3f4f6",
                padding: "2px 8px",
                borderRadius: "4px"
              },
              children: [order.city, " ", order.postalCode]
            }), /* @__PURE__ */ jsxs("span", {
              style: {
                fontSize: "12px",
                color: "#6b7280",
                background: "#f3f4f6",
                padding: "2px 8px",
                borderRadius: "4px"
              },
              children: [order.packageCount, " · ", order.carriers]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "16px"
            },
            children: [/* @__PURE__ */ jsx("span", {
              style: {
                fontSize: "13px",
                color: "#6b7280"
              },
              children: new Date(order.createdAt).toLocaleDateString("en-NZ", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })
            }), /* @__PURE__ */ jsx("span", {
              style: {
                fontWeight: 600,
                fontSize: "15px"
              },
              children: formatCurrency(order.totalFreight, order.currency)
            })]
          })]
        }), /* @__PURE__ */ jsxs("table", {
          style: {
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px"
          },
          children: [/* @__PURE__ */ jsx("thead", {
            children: /* @__PURE__ */ jsxs("tr", {
              style: {
                background: "#f9fafb"
              },
              children: [/* @__PURE__ */ jsx("th", {
                style: thStyle,
                children: "Product"
              }), /* @__PURE__ */ jsx("th", {
                style: thStyle,
                children: "Carrier"
              }), /* @__PURE__ */ jsx("th", {
                style: thStyle,
                children: "Boxes"
              })]
            })
          }), /* @__PURE__ */ jsx("tbody", {
            children: order.lineItems.map((item, idx) => /* @__PURE__ */ jsxs("tr", {
              style: {
                background: idx % 2 === 0 ? "#fff" : "#f9fafb"
              },
              children: [/* @__PURE__ */ jsx("td", {
                style: tdStyle,
                children: item.title ? /* @__PURE__ */ jsx("span", {
                  style: {
                    fontWeight: 500
                  },
                  children: item.title
                }) : /* @__PURE__ */ jsxs("span", {
                  style: {
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: "#6b7280"
                  },
                  children: ["Variant #", item.variantId]
                })
              }), /* @__PURE__ */ jsx("td", {
                style: tdStyle,
                children: /* @__PURE__ */ jsx("span", {
                  style: {
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 500,
                    background: carrierColor(item.company).bg,
                    color: carrierColor(item.company).text
                  },
                  children: companyLabels[item.company] ?? item.company
                })
              }), /* @__PURE__ */ jsx("td", {
                style: tdStyle,
                children: item.boxes
              })]
            }, item.id))
          }), /* @__PURE__ */ jsx("tfoot", {
            children: /* @__PURE__ */ jsxs("tr", {
              style: {
                borderTop: "2px solid #e5e7eb"
              },
              children: [/* @__PURE__ */ jsx("td", {
                colSpan: 2,
                style: {
                  ...tdStyle,
                  color: "#6b7280",
                  fontSize: "13px"
                },
                children: "Total freight (incl. fuel surcharge & GST)"
              }), /* @__PURE__ */ jsx("td", {
                style: {
                  ...tdStyle,
                  textAlign: "right",
                  fontWeight: 700
                },
                children: formatCurrency(order.totalFreight, order.currency)
              })]
            })
          })]
        })]
      }, order.id))
    }), pageCount > 1 && /* @__PURE__ */ jsxs("div", {
      style: {
        display: "flex",
        justifyContent: "center",
        gap: "8px",
        marginTop: "24px"
      },
      children: [/* @__PURE__ */ jsx("button", {
        disabled: page <= 1,
        onClick: () => setSearchParams({
          page: String(page - 1)
        }),
        style: paginationBtn(page <= 1),
        children: "Previous"
      }), /* @__PURE__ */ jsxs("span", {
        style: {
          padding: "6px 12px",
          fontSize: "14px",
          color: "#6b7280"
        },
        children: ["Page ", page, " of ", pageCount]
      }), /* @__PURE__ */ jsx("button", {
        disabled: page >= pageCount,
        onClick: () => setSearchParams({
          page: String(page + 1)
        }),
        style: paginationBtn(page >= pageCount),
        children: "Next"
      })]
    })]
  });
});
const thStyle = {
  padding: "8px 16px",
  textAlign: "left",
  fontSize: "12px",
  fontWeight: 600,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "1px solid #e5e7eb"
};
const tdStyle = {
  padding: "10px 16px",
  borderBottom: "1px solid #f3f4f6"
};
const paginationBtn = (disabled) => ({
  padding: "6px 16px",
  fontSize: "14px",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  background: disabled ? "#f9fafb" : "#fff",
  color: disabled ? "#9ca3af" : "#374151",
  cursor: disabled ? "not-allowed" : "pointer"
});
function carrierColor(company) {
  const colors = {
    FLIWAY: {
      bg: "#dbeafe",
      text: "#1e40af"
    },
    TGE: {
      bg: "#dcfce7",
      text: "#166534"
    },
    MAINFREIGHT: {
      bg: "#fef3c7",
      text: "#92400e"
    },
    NZP: {
      bg: "#f3e8ff",
      text: "#6b21a8"
    },
    CASTLE: {
      bg: "#ffe4e6",
      text: "#9f1239"
    },
    M2H: {
      bg: "#f0f9ff",
      text: "#0369a1"
    }
  };
  return colors[company] ?? {
    bg: "#f3f4f6",
    text: "#374151"
  };
}
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app_freightOrders,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const loader$2 = async ({
  request
}) => {
  const {
    session
  } = await authenticate.admin(request);
  const settings = await getAppSettings(session.shop);
  return {
    settings: {
      fuelSurchargePercent: settings.fuelSurchargePercent.toString(),
      additionalCostType: settings.additionalCostType,
      additionalCostValue: settings.additionalCostValue.toString(),
      defaultCurrency: settings.defaultCurrency,
      defaultServiceType: settings.defaultServiceType
    },
    metafields: variantFreightMetafields
  };
};
const action$1 = async ({
  request
}) => {
  var _a2, _b, _c, _d;
  const {
    admin,
    session
  } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "save");
  if (intent === "carrier-register") {
    const offlineSession = await prisma.session.findFirst({
      where: {
        shop: session.shop,
        isOnline: false
      },
      orderBy: {
        id: "asc"
      }
    });
    const token = (offlineSession == null ? void 0 : offlineSession.accessToken) || session.accessToken;
    if (!token) {
      return {
        ok: false,
        message: "No access token found for this shop. Reinstall app and try again."
      };
    }
    try {
      const result = await registerOrUpdateCarrierService(session.shop, token);
      const services = await listCarrierServices(session.shop, token);
      const names = services.map((service) => service.name).join(", ") || "none";
      return {
        ok: true,
        message: `Carrier service ${result.action}. Active services: ${names}`
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to register carrier service";
      return {
        ok: false,
        message
      };
    }
  }
  if (intent === "metafields") {
    const results = [];
    for (const field of variantFreightMetafields) {
      const response = await admin.graphql(`#graphql
        mutation CreateVariantFreightDefinition($definition: MetafieldDefinitionInput!) {
          metafieldDefinitionCreate(definition: $definition) {
            createdDefinition { id key namespace }
            userErrors { field message }
          }
        }`, {
        variables: {
          definition: {
            name: field.name,
            namespace: freightMetafieldNamespace,
            key: field.key,
            type: field.type,
            ownerType: "PRODUCTVARIANT",
            access: {
              admin: "MERCHANT_READ_WRITE"
            }
          }
        }
      });
      const json = await response.json();
      results.push(((_d = (_c = (_b = (_a2 = json.data) == null ? void 0 : _a2.metafieldDefinitionCreate) == null ? void 0 : _b.userErrors) == null ? void 0 : _c[0]) == null ? void 0 : _d.message) ?? field.key);
    }
    return {
      ok: true,
      message: `Variant metafield setup checked: ${results.join(", ")}`
    };
  }
  await updateAppSettings(session.shop, formData);
  return {
    ok: true,
    message: "Settings saved"
  };
};
const app_settings = UNSAFE_withComponentProps(function SettingsPage() {
  const {
    settings,
    metafields
  } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const saving = navigation.state === "submitting";
  return /* @__PURE__ */ jsxs("s-page", {
    heading: "Settings",
    children: [/* @__PURE__ */ jsx("style", {
      children: `
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
      `
    }), /* @__PURE__ */ jsxs("s-section", {
      heading: "Shipping defaults",
      children: [(actionData == null ? void 0 : actionData.message) ? /* @__PURE__ */ jsx("s-banner", {
        tone: actionData.ok ? "success" : "critical",
        children: actionData.message
      }) : null, /* @__PURE__ */ jsx("div", {
        className: "settings-card",
        children: /* @__PURE__ */ jsxs(Form, {
          method: "post",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "settings-grid",
            children: [/* @__PURE__ */ jsxs("label", {
              className: "settings-field",
              children: ["Fuel surcharge percentage", /* @__PURE__ */ jsx("input", {
                name: "fuelSurchargePercent",
                type: "number",
                step: "0.01",
                min: "0",
                defaultValue: settings.fuelSurchargePercent
              })]
            }), /* @__PURE__ */ jsxs("label", {
              className: "settings-field",
              children: ["Additional cost type", /* @__PURE__ */ jsx("select", {
                name: "additionalCostType",
                defaultValue: settings.additionalCostType,
                children: costTypes.map((type) => /* @__PURE__ */ jsx("option", {
                  value: type,
                  children: costTypeLabels[type]
                }, type))
              })]
            }), /* @__PURE__ */ jsxs("label", {
              className: "settings-field",
              children: ["Additional cost value", /* @__PURE__ */ jsx("input", {
                name: "additionalCostValue",
                type: "number",
                step: "0.01",
                min: "0",
                defaultValue: settings.additionalCostValue
              })]
            }), /* @__PURE__ */ jsxs("label", {
              className: "settings-field",
              children: ["Default currency", /* @__PURE__ */ jsx("input", {
                name: "defaultCurrency",
                type: "text",
                maxLength: 3,
                defaultValue: settings.defaultCurrency
              })]
            }), /* @__PURE__ */ jsxs("label", {
              className: "settings-field",
              children: ["Default service", /* @__PURE__ */ jsx("select", {
                name: "defaultServiceType",
                defaultValue: settings.defaultServiceType,
                children: serviceTypes.map((type) => /* @__PURE__ */ jsx("option", {
                  value: type,
                  children: serviceLabels[type]
                }, type))
              })]
            })]
          }), /* @__PURE__ */ jsx("div", {
            style: {
              marginTop: 12
            },
            children: /* @__PURE__ */ jsx("s-button", {
              type: "submit",
              ...saving ? {
                loading: true
              } : {},
              children: "Save settings"
            })
          })]
        })
      })]
    }), /* @__PURE__ */ jsx("s-section", {
      heading: "Variant metafields",
      children: /* @__PURE__ */ jsx("div", {
        className: "settings-card",
        children: /* @__PURE__ */ jsxs("s-stack", {
          direction: "block",
          gap: "small",
          children: [/* @__PURE__ */ jsxs("s-paragraph", {
            children: ["Namespace: ", freightMetafieldNamespace]
          }), /* @__PURE__ */ jsx("ul", {
            className: "meta-list",
            children: metafields.map((field) => /* @__PURE__ */ jsxs("li", {
              children: [/* @__PURE__ */ jsx("span", {
                children: field.name
              }), /* @__PURE__ */ jsx("span", {
                className: "meta-key",
                children: field.key
              })]
            }, field.key))
          }), /* @__PURE__ */ jsxs(Form, {
            method: "post",
            children: [/* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "intent",
              value: "metafields"
            }), /* @__PURE__ */ jsx("s-button", {
              type: "submit",
              children: "Create variant metafields"
            })]
          })]
        })
      })
    }), /* @__PURE__ */ jsx("s-section", {
      heading: "Carrier callback registration",
      children: /* @__PURE__ */ jsx("div", {
        className: "settings-card",
        children: /* @__PURE__ */ jsxs("s-stack", {
          direction: "block",
          gap: "small",
          children: [/* @__PURE__ */ jsx("s-paragraph", {
            children: "Use this after deploy/reinstall to ensure Shopify calls this app for checkout shipping rates."
          }), /* @__PURE__ */ jsxs(Form, {
            method: "post",
            children: [/* @__PURE__ */ jsx("input", {
              type: "hidden",
              name: "intent",
              value: "carrier-register"
            }), /* @__PURE__ */ jsx("s-button", {
              type: "submit",
              ...saving ? {
                loading: true
              } : {},
              children: "Register carrier service now"
            })]
          })]
        })
      })
    })]
  });
});
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: app_settings,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const loader$1 = async ({
  request
}) => {
  const {
    session
  } = await authenticate.admin(request);
  const [settings, activeRates, inactiveRates] = await Promise.all([getAppSettings(session.shop), prisma.shippingRate.count({
    where: {
      shop: session.shop,
      active: true
    }
  }), prisma.shippingRate.count({
    where: {
      shop: session.shop,
      active: false
    }
  })]);
  return {
    shop: session.shop,
    activeRates,
    inactiveRates,
    settings: {
      fuelSurchargePercent: settings.fuelSurchargePercent.toString(),
      additionalCostType: settings.additionalCostType,
      additionalCostValue: settings.additionalCostValue.toString(),
      defaultCurrency: settings.defaultCurrency
    }
  };
};
const app__index = UNSAFE_withComponentProps(function Index() {
  const {
    shop,
    activeRates,
    inactiveRates,
    settings
  } = useLoaderData();
  const totalRates = activeRates + inactiveRates;
  const activeRatio = totalRates > 0 ? Math.round(activeRates / totalRates * 100) : 0;
  return /* @__PURE__ */ jsxs("s-page", {
    heading: "ContainerDoor freight",
    children: [/* @__PURE__ */ jsx("style", {
      children: `
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
      `
    }), /* @__PURE__ */ jsx("s-section", {
      heading: "Operations summary",
      children: /* @__PURE__ */ jsxs("div", {
        className: "ops-grid",
        children: [/* @__PURE__ */ jsxs("article", {
          className: "ops-card",
          children: [/* @__PURE__ */ jsx("p", {
            className: "ops-label",
            children: "Active rates"
          }), /* @__PURE__ */ jsx("p", {
            className: "ops-value",
            children: activeRates
          })]
        }), /* @__PURE__ */ jsxs("article", {
          className: "ops-card",
          children: [/* @__PURE__ */ jsx("p", {
            className: "ops-label",
            children: "Inactive rates"
          }), /* @__PURE__ */ jsx("p", {
            className: "ops-value",
            children: inactiveRates
          })]
        }), /* @__PURE__ */ jsxs("article", {
          className: "ops-card",
          children: [/* @__PURE__ */ jsx("p", {
            className: "ops-label",
            children: "Coverage health"
          }), /* @__PURE__ */ jsxs("p", {
            className: "ops-value",
            children: [activeRatio, "%"]
          })]
        }), /* @__PURE__ */ jsxs("article", {
          className: "ops-card",
          children: [/* @__PURE__ */ jsx("p", {
            className: "ops-label",
            children: "Checkout currency"
          }), /* @__PURE__ */ jsx("p", {
            className: "ops-value",
            children: settings.defaultCurrency
          })]
        })]
      })
    }), /* @__PURE__ */ jsx("s-section", {
      heading: "Global adjustments",
      children: /* @__PURE__ */ jsxs("s-stack", {
        direction: "block",
        gap: "small",
        children: [/* @__PURE__ */ jsxs("s-paragraph", {
          children: ["Fuel surcharge: ", settings.fuelSurchargePercent, "% · Additional cost: ", settings.additionalCostType.toLowerCase(), " ", settings.additionalCostValue]
        }), /* @__PURE__ */ jsxs("div", {
          className: "action-row",
          children: [/* @__PURE__ */ jsx(Link, {
            className: "action-link",
            to: "/app/settings",
            children: "Open settings"
          }), /* @__PURE__ */ jsx(Link, {
            className: "action-link",
            to: "/app/rates",
            children: "Manage rates"
          })]
        })]
      })
    }), /* @__PURE__ */ jsx("s-section", {
      slot: "aside",
      heading: "Store",
      children: /* @__PURE__ */ jsx("s-paragraph", {
        children: shop
      })
    })]
  });
});
const headers = (headersArgs) => boundary.headers(headersArgs);
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: app__index,
  headers,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const loader = async ({
  request
}) => {
  const {
    session
  } = await authenticate.admin(request);
  const url = new URL(request.url);
  const page = Number.parseInt(url.searchParams.get("page") || "1", 10);
  const query = url.searchParams.get("q") || "";
  const companyParam = url.searchParams.get("company") || "";
  const serviceTypeParam = url.searchParams.get("serviceType") || "";
  const company = carrierCompanies.includes(companyParam) ? companyParam : "";
  const serviceType = serviceTypes.includes(serviceTypeParam) ? serviceTypeParam : "";
  return listRates(session.shop, page, {
    query,
    company,
    serviceType
  });
};
const action = async ({
  request
}) => {
  const {
    session
  } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "save");
  if (intent === "delete") {
    return deleteRate(session.shop, String(formData.get("id")));
  }
  if (intent === "import") {
    const file = formData.get("csv");
    if (!(file instanceof File)) return {
      ok: false,
      message: "Choose a CSV file"
    };
    return importRatesCsv(session.shop, await file.text());
  }
  return upsertRate(session.shop, formData);
};
const app_rates = UNSAFE_withComponentProps(function RatesPage() {
  const {
    rates,
    page,
    pageCount,
    total
  } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const [showAddForm, setShowAddForm] = useState(false);
  const query = searchParams.get("q") || "";
  const selectedCompany = searchParams.get("company") || "";
  const selectedServiceType = searchParams.get("serviceType") || "";
  const isSubmitting = navigation.state === "submitting";
  const buildPageLink = (nextPage) => {
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    if (query) params.set("q", query);
    if (selectedCompany) params.set("company", selectedCompany);
    if (selectedServiceType) params.set("serviceType", selectedServiceType);
    return `/app/rates?${params.toString()}`;
  };
  return /* @__PURE__ */ jsxs("s-page", {
    inlineSize: "large",
    heading: "Rate management",
    children: [/* @__PURE__ */ jsx("style", {
      children: `
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
      `
    }), (actionData == null ? void 0 : actionData.message) ? /* @__PURE__ */ jsx("s-banner", {
      tone: actionData.ok ? "success" : "critical",
      children: actionData.message
    }) : null, /* @__PURE__ */ jsxs("div", {
      className: "top-row",
      children: [/* @__PURE__ */ jsxs("button", {
        className: "top-btn",
        type: "button",
        onClick: () => setShowAddForm((value) => !value),
        children: ["+ ", showAddForm ? "Close add rate" : "Add rate"]
      }), /* @__PURE__ */ jsxs(Form, {
        method: "post",
        encType: "multipart/form-data",
        children: [/* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "intent",
          value: "import"
        }), /* @__PURE__ */ jsxs("label", {
          className: "top-btn import-btn",
          children: ["Import CSV", /* @__PURE__ */ jsx("input", {
            type: "file",
            name: "csv",
            accept: ".csv,text/csv",
            onChange: (event) => {
              var _a2, _b;
              if ((_a2 = event.currentTarget.files) == null ? void 0 : _a2.length) {
                (_b = event.currentTarget.form) == null ? void 0 : _b.requestSubmit();
              }
            }
          })]
        })]
      })]
    }), showAddForm ? /* @__PURE__ */ jsx("div", {
      className: "add-wrap",
      children: /* @__PURE__ */ jsx(RateForm, {})
    }) : null, /* @__PURE__ */ jsxs("div", {
      className: "rates-card",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "rates-head",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "rates-title",
          children: "Rates list"
        }), /* @__PURE__ */ jsxs("p", {
          className: "summary",
          children: [total, " active rates · page ", page, " of ", pageCount]
        })]
      }), /* @__PURE__ */ jsxs("div", {
        className: "toolbar",
        children: [/* @__PURE__ */ jsxs(Form, {
          method: "get",
          className: "search-form",
          children: [/* @__PURE__ */ jsx("input", {
            name: "q",
            placeholder: "Search city or postal code",
            defaultValue: query
          }), /* @__PURE__ */ jsxs("select", {
            name: "company",
            defaultValue: selectedCompany,
            children: [/* @__PURE__ */ jsx("option", {
              value: "",
              children: "All companies"
            }), carrierCompanies.map((company) => /* @__PURE__ */ jsx("option", {
              value: company,
              children: companyLabels[company]
            }, company))]
          }), /* @__PURE__ */ jsxs("select", {
            name: "serviceType",
            defaultValue: selectedServiceType,
            children: [/* @__PURE__ */ jsx("option", {
              value: "",
              children: "All services"
            }), serviceTypes.map((serviceType) => /* @__PURE__ */ jsx("option", {
              value: serviceType,
              children: serviceLabels[serviceType]
            }, serviceType))]
          }), /* @__PURE__ */ jsx("s-button", {
            type: "submit",
            children: "Search"
          })]
        }), /* @__PURE__ */ jsx("s-button", {
          href: "/api/rates/export",
          ...isSubmitting ? {
            loading: true
          } : {},
          children: "Export CSV"
        })]
      }), /* @__PURE__ */ jsx("div", {
        className: "table-wrap",
        children: /* @__PURE__ */ jsxs("table", {
          className: "rates-table",
          children: [/* @__PURE__ */ jsx("thead", {
            children: /* @__PURE__ */ jsxs("tr", {
              children: [/* @__PURE__ */ jsx("th", {
                children: "Company"
              }), /* @__PURE__ */ jsx("th", {
                children: "Service"
              }), /* @__PURE__ */ jsx("th", {
                children: "City"
              }), /* @__PURE__ */ jsx("th", {
                children: "Postal"
              }), /* @__PURE__ */ jsx("th", {
                children: "Weight (g)"
              }), /* @__PURE__ */ jsx("th", {
                children: "Volume (cm3)"
              }), /* @__PURE__ */ jsx("th", {
                children: "Rate"
              }), /* @__PURE__ */ jsx("th", {
                children: "Surcharge"
              }), /* @__PURE__ */ jsx("th", {
                children: "Mode"
              }), /* @__PURE__ */ jsx("th", {
                children: "Active"
              }), /* @__PURE__ */ jsx("th", {
                children: "Actions"
              })]
            })
          }), /* @__PURE__ */ jsx("tbody", {
            children: rates.map((rate) => /* @__PURE__ */ jsx(InlineRateRow, {
              rate
            }, rate.id))
          })]
        })
      }), /* @__PURE__ */ jsxs("div", {
        className: "pager",
        children: [page > 1 ? /* @__PURE__ */ jsx(Link, {
          to: buildPageLink(page - 1),
          children: "Previous"
        }) : null, page < pageCount ? /* @__PURE__ */ jsx(Link, {
          to: buildPageLink(page + 1),
          children: "Next"
        }) : null]
      })]
    })]
  });
});
function InlineRateRow({
  rate
}) {
  return /* @__PURE__ */ jsxs("tr", {
    children: [/* @__PURE__ */ jsx("td", {
      children: /* @__PURE__ */ jsxs(Form, {
        method: "post",
        id: `rate-${rate.id}`,
        children: [/* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "intent",
          value: "save"
        }), /* @__PURE__ */ jsx("input", {
          type: "hidden",
          name: "id",
          value: rate.id
        }), /* @__PURE__ */ jsx("select", {
          name: "company",
          defaultValue: rate.company,
          "aria-label": "Company",
          children: carrierCompanies.map((company) => /* @__PURE__ */ jsx("option", {
            value: company,
            children: companyLabels[company]
          }, company))
        })]
      })
    }), /* @__PURE__ */ jsx("td", {
      children: /* @__PURE__ */ jsx("select", {
        form: `rate-${rate.id}`,
        name: "serviceType",
        defaultValue: rate.serviceType,
        "aria-label": "Service",
        children: serviceTypes.map((serviceType) => /* @__PURE__ */ jsx("option", {
          value: serviceType,
          children: serviceLabels[serviceType]
        }, serviceType))
      })
    }), /* @__PURE__ */ jsx("td", {
      children: /* @__PURE__ */ jsx("input", {
        form: `rate-${rate.id}`,
        name: "city",
        required: true,
        defaultValue: rate.city,
        "aria-label": "City"
      })
    }), /* @__PURE__ */ jsx("td", {
      children: /* @__PURE__ */ jsx("input", {
        form: `rate-${rate.id}`,
        name: "postalCode",
        required: true,
        defaultValue: rate.postalCode,
        "aria-label": "Postal code"
      })
    }), /* @__PURE__ */ jsxs("td", {
      children: [/* @__PURE__ */ jsxs("div", {
        className: "range-col",
        children: [/* @__PURE__ */ jsx("input", {
          form: `rate-${rate.id}`,
          name: "minWeightGrams",
          type: "number",
          min: "0",
          defaultValue: rate.minWeightGrams ?? "",
          "aria-label": "Min weight"
        }), /* @__PURE__ */ jsx("input", {
          form: `rate-${rate.id}`,
          name: "maxWeightGrams",
          type: "number",
          min: "0",
          defaultValue: rate.maxWeightGrams ?? "",
          "aria-label": "Max weight"
        })]
      }), /* @__PURE__ */ jsxs("label", {
        className: "checkbox-row",
        children: [/* @__PURE__ */ jsx("input", {
          form: `rate-${rate.id}`,
          name: "useWeightRange",
          type: "checkbox",
          defaultChecked: rate.useWeightRange
        }), " Use"]
      })]
    }), /* @__PURE__ */ jsxs("td", {
      children: [/* @__PURE__ */ jsxs("div", {
        className: "range-col",
        children: [/* @__PURE__ */ jsx("input", {
          form: `rate-${rate.id}`,
          name: "minVolumeCm3",
          type: "number",
          min: "0",
          defaultValue: rate.minVolumeCm3 ?? "",
          "aria-label": "Min volume"
        }), /* @__PURE__ */ jsx("input", {
          form: `rate-${rate.id}`,
          name: "maxVolumeCm3",
          type: "number",
          min: "0",
          defaultValue: rate.maxVolumeCm3 ?? "",
          "aria-label": "Max volume"
        })]
      }), /* @__PURE__ */ jsxs("label", {
        className: "checkbox-row",
        children: [/* @__PURE__ */ jsx("input", {
          form: `rate-${rate.id}`,
          name: "useVolumeRange",
          type: "checkbox",
          defaultChecked: rate.useVolumeRange
        }), " Use"]
      })]
    }), /* @__PURE__ */ jsx("td", {
      children: /* @__PURE__ */ jsx("input", {
        form: `rate-${rate.id}`,
        name: "rate",
        type: "number",
        step: "0.01",
        min: "0",
        required: true,
        defaultValue: toMoney(rate.rate),
        "aria-label": "Rate"
      })
    }), /* @__PURE__ */ jsx("td", {
      children: /* @__PURE__ */ jsx("input", {
        form: `rate-${rate.id}`,
        name: "zoneSurcharge",
        type: "number",
        step: "0.01",
        min: "0",
        defaultValue: toMoney(rate.zoneSurcharge),
        "aria-label": "Zone surcharge"
      })
    }), /* @__PURE__ */ jsx("td", {
      children: /* @__PURE__ */ jsxs("select", {
        form: `rate-${rate.id}`,
        name: "mode",
        defaultValue: rate.mode ?? "",
        "aria-label": "Mode",
        children: [/* @__PURE__ */ jsx("option", {
          value: "",
          children: "Any"
        }), carrierModes.map((mode) => /* @__PURE__ */ jsx("option", {
          value: mode,
          children: modeLabels[mode]
        }, mode))]
      })
    }), /* @__PURE__ */ jsx("td", {
      children: /* @__PURE__ */ jsxs("label", {
        className: "checkbox-row",
        children: [/* @__PURE__ */ jsx("input", {
          form: `rate-${rate.id}`,
          name: "active",
          type: "checkbox",
          defaultChecked: rate.active
        }), " Active"]
      })
    }), /* @__PURE__ */ jsx("td", {
      children: /* @__PURE__ */ jsxs("div", {
        className: "inline-actions",
        children: [/* @__PURE__ */ jsx("button", {
          className: "plain-save",
          form: `rate-${rate.id}`,
          type: "submit",
          children: "Save"
        }), /* @__PURE__ */ jsxs(Form, {
          method: "post",
          children: [/* @__PURE__ */ jsx("input", {
            type: "hidden",
            name: "intent",
            value: "delete"
          }), /* @__PURE__ */ jsx("input", {
            type: "hidden",
            name: "id",
            value: rate.id
          }), /* @__PURE__ */ jsx("s-button", {
            type: "submit",
            tone: "critical",
            variant: "tertiary",
            children: "Delete"
          })]
        })]
      })
    })]
  });
}
function RateForm({
  rate
}) {
  var _a2, _b, _c, _d;
  return /* @__PURE__ */ jsxs(Form, {
    method: "post",
    children: [/* @__PURE__ */ jsx("input", {
      type: "hidden",
      name: "intent",
      value: "save"
    }), (rate == null ? void 0 : rate.id) ? /* @__PURE__ */ jsx("input", {
      type: "hidden",
      name: "id",
      value: rate.id
    }) : null, /* @__PURE__ */ jsxs("div", {
      className: "grid-form",
      children: [/* @__PURE__ */ jsxs("label", {
        children: ["Company", /* @__PURE__ */ jsx("select", {
          name: "company",
          defaultValue: (rate == null ? void 0 : rate.company) ?? "FLIWAY",
          children: carrierCompanies.map((company) => /* @__PURE__ */ jsx("option", {
            value: company,
            children: companyLabels[company]
          }, company))
        })]
      }), /* @__PURE__ */ jsxs("label", {
        children: ["Service", /* @__PURE__ */ jsx("select", {
          name: "serviceType",
          defaultValue: (rate == null ? void 0 : rate.serviceType) ?? "STANDARD_DELIVERY",
          children: serviceTypes.map((serviceType) => /* @__PURE__ */ jsx("option", {
            value: serviceType,
            children: serviceLabels[serviceType]
          }, serviceType))
        })]
      }), /* @__PURE__ */ jsxs("label", {
        children: ["City", /* @__PURE__ */ jsx("input", {
          name: "city",
          required: true,
          defaultValue: (rate == null ? void 0 : rate.city) ?? ""
        })]
      }), /* @__PURE__ */ jsxs("label", {
        children: ["Postal code/range", /* @__PURE__ */ jsx("input", {
          name: "postalCode",
          required: true,
          defaultValue: (rate == null ? void 0 : rate.postalCode) ?? "*"
        })]
      }), /* @__PURE__ */ jsxs("label", {
        children: ["Min weight (g)", /* @__PURE__ */ jsx("input", {
          name: "minWeightGrams",
          type: "number",
          min: "0",
          defaultValue: (rate == null ? void 0 : rate.minWeightGrams) ?? ""
        })]
      }), /* @__PURE__ */ jsxs("label", {
        children: ["Max weight (g)", /* @__PURE__ */ jsx("input", {
          name: "maxWeightGrams",
          type: "number",
          min: "0",
          defaultValue: (rate == null ? void 0 : rate.maxWeightGrams) ?? ""
        })]
      }), /* @__PURE__ */ jsxs("label", {
        children: ["Min volume (cm3)", /* @__PURE__ */ jsx("input", {
          name: "minVolumeCm3",
          type: "number",
          min: "0",
          defaultValue: (rate == null ? void 0 : rate.minVolumeCm3) ?? ""
        })]
      }), /* @__PURE__ */ jsxs("label", {
        children: ["Max volume (cm3)", /* @__PURE__ */ jsx("input", {
          name: "maxVolumeCm3",
          type: "number",
          min: "0",
          defaultValue: (rate == null ? void 0 : rate.maxVolumeCm3) ?? ""
        })]
      }), /* @__PURE__ */ jsxs("label", {
        children: ["Rate", /* @__PURE__ */ jsx("input", {
          name: "rate",
          type: "number",
          step: "0.01",
          min: "0",
          required: true,
          defaultValue: ((_b = (_a2 = rate == null ? void 0 : rate.rate) == null ? void 0 : _a2.toString) == null ? void 0 : _b.call(_a2)) ?? ""
        })]
      }), /* @__PURE__ */ jsxs("label", {
        children: ["Zone surcharge", /* @__PURE__ */ jsx("input", {
          name: "zoneSurcharge",
          type: "number",
          step: "0.01",
          min: "0",
          defaultValue: ((_d = (_c = rate == null ? void 0 : rate.zoneSurcharge) == null ? void 0 : _c.toString) == null ? void 0 : _d.call(_c)) ?? "0.00"
        })]
      }), /* @__PURE__ */ jsxs("label", {
        children: ["Mode", /* @__PURE__ */ jsxs("select", {
          name: "mode",
          defaultValue: (rate == null ? void 0 : rate.mode) ?? "",
          children: [/* @__PURE__ */ jsx("option", {
            value: "",
            children: "Any"
          }), carrierModes.map((mode) => /* @__PURE__ */ jsx("option", {
            value: mode,
            children: modeLabels[mode]
          }, mode))]
        })]
      }), /* @__PURE__ */ jsxs("label", {
        children: [/* @__PURE__ */ jsx("input", {
          name: "useWeightRange",
          type: "checkbox",
          defaultChecked: (rate == null ? void 0 : rate.useWeightRange) ?? false
        }), " Use weight range"]
      }), /* @__PURE__ */ jsxs("label", {
        children: [/* @__PURE__ */ jsx("input", {
          name: "useVolumeRange",
          type: "checkbox",
          defaultChecked: (rate == null ? void 0 : rate.useVolumeRange) ?? false
        }), " Use volume range"]
      }), /* @__PURE__ */ jsxs("label", {
        children: [/* @__PURE__ */ jsx("input", {
          name: "active",
          type: "checkbox",
          defaultChecked: (rate == null ? void 0 : rate.active) ?? true
        }), " Active"]
      })]
    }), /* @__PURE__ */ jsx("div", {
      style: {
        marginTop: 12
      },
      children: /* @__PURE__ */ jsx("s-button", {
        type: "submit",
        children: (rate == null ? void 0 : rate.id) ? "Save rate" : "Add rate"
      })
    })]
  });
}
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: app_rates,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-B-ulA9xS.js", "imports": ["/assets/chunk-4N6VE7H7-DLOOFdQO.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/root-Bgd5tKIG.js", "imports": ["/assets/chunk-4N6VE7H7-DLOOFdQO.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.app.scopes_update": { "id": "routes/webhooks.app.scopes_update", "parentId": "root", "path": "webhooks/app/scopes_update", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.scopes_update-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.app.uninstalled": { "id": "routes/webhooks.app.uninstalled", "parentId": "root", "path": "webhooks/app/uninstalled", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.app.uninstalled-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/webhooks.orders.create": { "id": "routes/webhooks.orders.create", "parentId": "root", "path": "webhooks/orders/create", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/webhooks.orders.create-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.shipping-rates": { "id": "routes/api.shipping-rates", "parentId": "root", "path": "api/shipping-rates", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.shipping-rates-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/api.rates.export": { "id": "routes/api.rates.export", "parentId": "root", "path": "api/rates/export", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/api.rates.export-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth.login": { "id": "routes/auth.login", "parentId": "root", "path": "auth/login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/route-OnjKDwio.js", "imports": ["/assets/chunk-4N6VE7H7-DLOOFdQO.js", "/assets/AppProxyProvider-LMJ2zKqf.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/route-il-aES7r.js", "imports": ["/assets/chunk-4N6VE7H7-DLOOFdQO.js"], "css": ["/assets/route-Xpdx9QZl.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth.$": { "id": "routes/auth.$", "parentId": "root", "path": "auth/*", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": false, "hasErrorBoundary": false, "module": "/assets/auth._-l0sNRNKZ.js", "imports": [], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app": { "id": "routes/app", "parentId": "root", "path": "app", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": true, "module": "/assets/app-DrIpx0SR.js", "imports": ["/assets/chunk-4N6VE7H7-DLOOFdQO.js", "/assets/AppProxyProvider-LMJ2zKqf.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.freight-orders": { "id": "routes/app.freight-orders", "parentId": "routes/app", "path": "freight-orders", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.freight-orders-BjJx-eVP.js", "imports": ["/assets/chunk-4N6VE7H7-DLOOFdQO.js", "/assets/freight-CcKv5R17.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.settings": { "id": "routes/app.settings", "parentId": "routes/app", "path": "settings", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.settings-CBKHw8WQ.js", "imports": ["/assets/chunk-4N6VE7H7-DLOOFdQO.js", "/assets/freight-CcKv5R17.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app._index": { "id": "routes/app._index", "parentId": "routes/app", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app._index-C9Oh2iol.js", "imports": ["/assets/chunk-4N6VE7H7-DLOOFdQO.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/app.rates": { "id": "routes/app.rates", "parentId": "routes/app", "path": "rates", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasDefaultExport": true, "hasErrorBoundary": false, "module": "/assets/app.rates-eDgYmyOI.js", "imports": ["/assets/chunk-4N6VE7H7-DLOOFdQO.js", "/assets/freight-CcKv5R17.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-65ca0eef.js", "version": "65ca0eef", "sri": void 0 };
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "v8_passThroughRequests": false, "unstable_trailingSlashAwareDataRequests": false, "unstable_previewServerPrerendering": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/webhooks.app.scopes_update": {
    id: "routes/webhooks.app.scopes_update",
    parentId: "root",
    path: "webhooks/app/scopes_update",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/webhooks.app.uninstalled": {
    id: "routes/webhooks.app.uninstalled",
    parentId: "root",
    path: "webhooks/app/uninstalled",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/webhooks.orders.create": {
    id: "routes/webhooks.orders.create",
    parentId: "root",
    path: "webhooks/orders/create",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/api.shipping-rates": {
    id: "routes/api.shipping-rates",
    parentId: "root",
    path: "api/shipping-rates",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/api.rates.export": {
    id: "routes/api.rates.export",
    parentId: "root",
    path: "api/rates/export",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/auth.login": {
    id: "routes/auth.login",
    parentId: "root",
    path: "auth/login",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route7
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: route9
  },
  "routes/app.freight-orders": {
    id: "routes/app.freight-orders",
    parentId: "routes/app",
    path: "freight-orders",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/app.settings": {
    id: "routes/app.settings",
    parentId: "routes/app",
    path: "settings",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route12
  },
  "routes/app.rates": {
    id: "routes/app.rates",
    parentId: "routes/app",
    path: "rates",
    index: void 0,
    caseSensitive: void 0,
    module: route13
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
