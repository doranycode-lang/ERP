import { Router, type IRouter } from "express";
import healthRouter from "./health";
import settingsRouter from "./settings";
import productsRouter from "./products";
import clientsRouter from "./clients";
import documentsRouter from "./documents";
import dashboardRouter from "./dashboard";
import pacientesRouter from "./pacientes";
import resultadosRouter from "./resultados";
import examesCustomRouter from "./exames-custom";
import reagentesRouter from "./reagentes";
import labAdminRouter from "./lab-admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(settingsRouter);
router.use(productsRouter);
router.use(clientsRouter);
router.use(documentsRouter);
router.use(dashboardRouter);
router.use(pacientesRouter);
router.use(resultadosRouter);
router.use(examesCustomRouter);
router.use(reagentesRouter);
  router.use(labAdminRouter);

export default router;
