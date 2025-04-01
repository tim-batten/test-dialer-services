import { Router } from "express";
import { CampaignDefinition } from "navient-common/lib/models/campaign";
import { campaignManager } from "../globals";
import { makeConfigRouter } from "./config-entity-route-builder";

export function makeCampaignRouter(): Router {
    const router = makeConfigRouter(campaignManager, CampaignDefinition.crudFrom, 'campaign', 'campaigns')
    return router
}