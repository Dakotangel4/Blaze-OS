import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import tradesRouter from "./trades";
import analyticsRouter from "./analytics";
import clientsRouter from "./clients";
import notesRouter from "./notes";
import calendarRouter from "./calendar";
import financesRouter from "./finances";
import settingsRouter from "./settings";
import aiRouter from "./ai";
import screenshotsRouter from "./screenshots";
import playbooksRouter from "./playbooks";
import accountsRouter from "./accounts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(analyticsRouter);
router.use(tradesRouter);
router.use(clientsRouter);
router.use(notesRouter);
router.use(calendarRouter);
router.use(financesRouter);
router.use(settingsRouter);
router.use(aiRouter);
router.use(screenshotsRouter);
router.use(playbooksRouter);
router.use(accountsRouter);

export default router;
