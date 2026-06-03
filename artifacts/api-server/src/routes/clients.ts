import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, clientsTable } from "@workspace/db";
import {
  ListClientsQueryParams,
  CreateClientBody,
  GetClientParams,
  UpdateClientParams,
  UpdateClientBody,
  DeleteClientParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const PIPELINE_STAGES = [
  "Lead",
  "Contacted",
  "Proposal Sent",
  "Demo",
  "Paid",
  "In Progress",
  "Completed",
];

router.get("/clients", async (req, res): Promise<void> => {
  const query = ListClientsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db.select().from(clientsTable).$dynamic();

  if (query.data.status) {
    dbQuery = dbQuery.where(eq(clientsTable.status, query.data.status));
  }

  const clients = await dbQuery.orderBy(desc(clientsTable.createdAt));
  res.json(clients);
});

router.post("/clients", async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [client] = await db.insert(clientsTable).values(parsed.data).returning();
  res.status(201).json(client);
});

router.get("/clients/pipeline", async (req, res): Promise<void> => {
  const allClients = await db
    .select()
    .from(clientsTable)
    .orderBy(desc(clientsTable.createdAt));

  const stages = PIPELINE_STAGES.map((stage) => {
    const stageClients = allClients.filter((c) => c.status === stage);
    const value = stageClients.reduce((sum, c) => sum + (c.projectValue ?? 0), 0);
    return { stage, count: stageClients.length, value, clients: stageClients };
  });

  const totalValue = allClients.reduce((sum, c) => sum + (c.projectValue ?? 0), 0);

  res.json({ stages, totalValue });
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, params.data.id));

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json(client);
});

router.patch("/clients/:id", async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [client] = await db
    .update(clientsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(clientsTable.id, params.data.id))
    .returning();

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.json(client);
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const params = DeleteClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [client] = await db
    .delete(clientsTable)
    .where(eq(clientsTable.id, params.data.id))
    .returning();

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
