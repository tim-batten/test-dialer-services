import { Router, Request, Response } from "express";
import { CampaignGroupDefinition } from "navient-common/lib/models/campaign-group";
import { makeAuth } from "../auth/auth";
import { campaignConfigDb, campaignGroupConfigManager, redisClientPool, scheduleManager } from "../globals";
import { CrudAction, makeConfigRouter } from "./config-entity-route-builder";

export function makeCampaignGroupRouter(): Router {
  const router = makeConfigRouter(
    campaignGroupConfigManager,
    CampaignGroupDefinition.from,
    "campaign_group",
    "campaign_groups"
  );

  router.get(
    "/campaign_groups/:id/campaign_ids",
    makeAuth(CrudAction.READ, ...scheduleManager.validReadRoles),
    async (req: Request, res: Response) => {
      const groupId = req.params.id;
      const [group, campaignIds] = await redisClientPool.runForcePipeline((pipeline) => Promise.all([
        campaignGroupConfigManager.get(groupId, pipeline),
        campaignGroupConfigManager.getCampaignIds(groupId, pipeline),
      ]))
      if (!group) {
        return res.status(404).send();
      }
      return res.send({
        group,
        campaign_ids: campaignIds,
      });
    }
  );

  router.get(
    "/campaign_groups/:id/campaigns",
    makeAuth(CrudAction.READ, ...scheduleManager.validReadRoles),
    async (req: Request, res: Response) => {
      const groupId = req.params.id;
      const [group, campaignIds] = await redisClientPool.runForcePipeline((pipeline) =>
        Promise.all([
          campaignGroupConfigManager.get(groupId, pipeline),
          campaignGroupConfigManager.getCampaignIds(groupId, pipeline),
        ])
      );
      if (!group) {
        return res.send(404);
      }
      let campaigns = campaignIds && campaignIds.length > 0 ? await campaignConfigDb.mgetList(campaignIds) : [];
      return res.send({
        group,
        campaigns,
      });
    }
  );

  return router;
}
