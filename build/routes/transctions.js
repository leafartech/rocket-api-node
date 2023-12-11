"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/routes/transctions.ts
var transctions_exports = {};
__export(transctions_exports, {
  transactionsRoutes: () => transactionsRoutes
});
module.exports = __toCommonJS(transctions_exports);
var import_zod = require("zod");
var import_knex = require("knex");
var import_node_crypto = __toESM(require("crypto"));

// src/middlewares/check-session-id-exists.ts
async function checkSessionIdExists(request, reply) {
  const sessionId = request.cookies.sessionId;
  if (!sessionId) {
    return reply.status(401).send({
      error: "Unauthorized"
    });
  }
}

// src/routes/transctions.ts
async function transactionsRoutes(app) {
  const knexInstance = (0, import_knex.knex)({
    client: "sqlite3",
    connection: {
      filename: "./db/app.db"
      // Substitua pelo caminho do seu banco de dados SQLite
    },
    useNullAsDefault: true
  });
  app.get("/", {
    preHandler: [checkSessionIdExists]
  }, async (request) => {
    const { sessionId } = request.cookies;
    const transactions = await knexInstance("transactions").where("session_id", sessionId).select();
    return {
      transactions
    };
  });
  app.get("/:id", {
    preHandler: [checkSessionIdExists]
  }, async (request) => {
    const getTransactionParamsSchema = import_zod.z.object({
      id: import_zod.z.string().uuid()
    });
    const { sessionId } = request.cookies;
    const { id } = getTransactionParamsSchema.parse(request.params);
    const transactions = await knexInstance("transactions").where({
      session_id: sessionId,
      id
    }).first();
    return {
      transactions
    };
  });
  app.get("/summary", {
    preHandler: [checkSessionIdExists]
  }, async (request) => {
    const { sessionId } = request.cookies;
    const summary = await knexInstance("transactions").where("session_id", sessionId).sum("amount", { as: "amount" }).first();
    return {
      summary
    };
  });
  app.post("/", async (request, reply) => {
    const createTransactionBodySchema = import_zod.z.object({
      title: import_zod.z.string(),
      amount: import_zod.z.number(),
      type: import_zod.z.enum(["credit", "debit"])
    });
    const { amount, title, type } = createTransactionBodySchema.parse(
      request.body
    );
    let sessionId = request.cookies.sessionId;
    if (!sessionId) {
      sessionId = import_node_crypto.default.randomUUID();
      reply.cookie("sessionId", sessionId, {
        httpOnly: true,
        path: "/",
        maxAge: 1e3 * 60 * 60 * 24 * 7
        // 7 days
      });
    }
    await knexInstance("transactions").insert({
      id: import_node_crypto.default.randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId
    });
    return reply.status(201).send();
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  transactionsRoutes
});
