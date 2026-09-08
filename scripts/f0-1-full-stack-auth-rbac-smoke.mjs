/*
 * Disposable full-stack smoke for F0.1.
 *
 * The script intentionally reads every credential and farm identifier from the
 * environment. It refuses to run unless F0_1_DISPOSABLE=true, so it cannot be
 * pointed at a developer database accidentally. It never prints tokens,
 * passwords, request bodies, or response bodies.
 */

const required = [
  "F0_1_ADMIN_EMAIL",
  "F0_1_ADMIN_PASSWORD",
  "F0_1_OWNER_A_EMAIL",
  "F0_1_OWNER_A_PASSWORD",
  "F0_1_OWNER_B_EMAIL",
  "F0_1_OWNER_B_PASSWORD",
  "F0_1_LINKED_OPERATOR_EMAIL",
  "F0_1_LINKED_OPERATOR_PASSWORD",
  "F0_1_UNLINKED_OPERATOR_EMAIL",
  "F0_1_UNLINKED_OPERATOR_PASSWORD",
  "F0_1_FARM_A_ID",
  "F0_1_FARM_B_ID",
];

if (process.env.F0_1_DISPOSABLE !== "true") {
  throw new Error("Refusing to run: set F0_1_DISPOSABLE=true for a disposable environment.");
}

const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Missing required smoke configuration: ${missing.join(", ")}`);
}

const baseUrl = (process.env.F0_1_BASE_URL ?? "http://127.0.0.1:8080/api/v1").replace(/\/$/, "");
const farmA = process.env.F0_1_FARM_A_ID;
const farmB = process.env.F0_1_FARM_B_ID;

async function call(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  let json;
  try {
    json = await response.json();
  } catch {
    json = undefined;
  }
  return { status: response.status, json };
}

function expectStatus(result, expected, label) {
  if (result.status !== expected) {
    throw new Error(`${label}: expected HTTP ${expected}, received ${result.status}`);
  }
}

function expectBoolean(result, field, expected, label) {
  if (result.json?.[field] !== expected) {
    throw new Error(`${label}: capability ${field} did not match expected value`);
  }
}

async function login(email, password, label) {
  const result = await call("/auth/login", { method: "POST", body: { email, password } });
  expectStatus(result, 200, `${label} login`);
  if (typeof result.json?.accessToken !== "string" || typeof result.json?.refreshToken !== "string") {
    throw new Error(`${label} login: response did not contain a complete token pair`);
  }
  return { accessToken: result.json.accessToken, refreshToken: result.json.refreshToken };
}

async function permissions(pair, farmId, expectedOperate, expectedAdminister, label) {
  const result = await call(`/goatfarms/${farmId}/permissions`, { token: pair.accessToken });
  expectStatus(result, 200, `${label} permissions`);
  expectBoolean(result, "canOperateFarm", expectedOperate, `${label} permissions`);
  expectBoolean(result, "canAdministerFarm", expectedAdminister, `${label} permissions`);
}

function goatPayload(prefix) {
  const registrationNumber = `${prefix}${String(Date.now()).slice(-6)}`.slice(0, 10);
  return {
    registrationNumber,
    name: `F0.1 smoke ${prefix}`,
    gender: "FEMEA",
    breed: "SAANEN",
    color: "Branca",
    birthDate: "2026-01-01",
    status: "ATIVO",
    category: "PA",
  };
}

const admin = await login(process.env.F0_1_ADMIN_EMAIL, process.env.F0_1_ADMIN_PASSWORD, "admin");
const ownerA = await login(process.env.F0_1_OWNER_A_EMAIL, process.env.F0_1_OWNER_A_PASSWORD, "owner A");
const ownerB = await login(process.env.F0_1_OWNER_B_EMAIL, process.env.F0_1_OWNER_B_PASSWORD, "owner B");
const linked = await login(process.env.F0_1_LINKED_OPERATOR_EMAIL, process.env.F0_1_LINKED_OPERATOR_PASSWORD, "linked operator");
const unlinked = await login(process.env.F0_1_UNLINKED_OPERATOR_EMAIL, process.env.F0_1_UNLINKED_OPERATOR_PASSWORD, "unlinked operator");

const me = await call("/auth/me", { token: ownerA.accessToken });
expectStatus(me, 200, "owner A auth/me");

const rotated = await call("/auth/refresh", {
  method: "POST",
  body: { refreshToken: admin.refreshToken },
});
expectStatus(rotated, 200, "refresh rotation");
if (typeof rotated.json?.accessToken !== "string" || typeof rotated.json?.refreshToken !== "string") {
  throw new Error("refresh rotation: response did not contain a complete token pair");
}

const replay = await call("/auth/refresh", {
  method: "POST",
  body: { refreshToken: admin.refreshToken },
});
expectStatus(replay, 401, "refresh replay");

const revokedReplacement = await call("/auth/refresh", {
  method: "POST",
  body: { refreshToken: rotated.json.refreshToken },
});
expectStatus(revokedReplacement, 401, "refresh family revocation");

const logoutPair = await login(process.env.F0_1_ADMIN_EMAIL, process.env.F0_1_ADMIN_PASSWORD, "admin logout");
expectStatus(await call("/auth/logout", { method: "POST", token: logoutPair.accessToken, body: { refreshToken: logoutPair.refreshToken } }), 204, "logout");
expectStatus(await call("/auth/refresh", { method: "POST", body: { refreshToken: logoutPair.refreshToken } }), 401, "refresh after logout");

await permissions(admin, farmA, true, true, "admin farm A");
await permissions(admin, farmB, true, true, "admin farm B");
await permissions(ownerA, farmA, true, true, "owner A farm A");
await permissions(ownerA, farmB, false, false, "owner A farm B");
await permissions(ownerB, farmB, true, true, "owner B farm B");
await permissions(ownerB, farmA, false, false, "owner B farm A");
await permissions(linked, farmA, true, false, "linked operator farm A");
await permissions(linked, farmB, false, false, "linked operator farm B");
await permissions(unlinked, farmA, false, false, "unlinked operator farm A");

expectStatus(await call(`/goatfarms/${farmA}/goats`, { method: "POST", token: ownerA.accessToken, body: goatPayload("OWNERA") }), 201, "owner A operational create");
expectStatus(await call(`/goatfarms/${farmB}/goats`, { method: "POST", token: ownerA.accessToken, body: goatPayload("CROSSA") }), 403, "owner A cross-farm create");
expectStatus(await call(`/goatfarms/${farmA}/goats`, { method: "POST", token: linked.accessToken, body: goatPayload("LINKED") }), 201, "linked operator operational create");
expectStatus(await call(`/goatfarms/${farmB}/goats`, { method: "POST", token: linked.accessToken, body: goatPayload("CROSSL") }), 403, "linked operator cross-farm create");
expectStatus(await call(`/goatfarms/${farmA}/goats`, { method: "POST", token: unlinked.accessToken, body: goatPayload("UNLINK") }), 403, "unlinked operator operational create");
expectStatus(await call(`/goatfarms/${farmA}/goats`, { method: "POST", token: admin.accessToken, body: goatPayload("ADMINA") }), 201, "admin farm A create");
expectStatus(await call(`/goatfarms/${farmB}/goats`, { method: "POST", token: admin.accessToken, body: goatPayload("ADMINB") }), 201, "admin farm B create");
expectStatus(await call(`/goatfarms/${farmB}/goats`, { method: "POST", token: ownerB.accessToken, body: goatPayload("OWNERB") }), 201, "owner B farm B create");
expectStatus(await call(`/goatfarms/${farmA}/goats`, { method: "POST", token: ownerB.accessToken, body: goatPayload("CROSSB") }), 403, "owner B cross-farm create");

expectStatus(await call("/auth/me"), 401, "anonymous private read");
expectStatus(await call(`/goatfarms/${farmA}`), 200, "anonymous public farm read");

console.log("F0.1 full-stack auth/RBAC smoke: PASS (synthetic disposable environment)");
