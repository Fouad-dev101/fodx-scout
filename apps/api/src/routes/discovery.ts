import { Router } from "express";
import { DiscoverySearchInput } from "@fodx/shared";
import { previewDiscovery, importPreview } from "../modules/discovery/service.js";

export const discoveryRouter = Router();

discoveryRouter.post("/preview", async (req, res, next) => {
  try {
    const input = DiscoverySearchInput.parse(req.body);
    const preview = await previewDiscovery(input);
    res.json(preview);
  } catch (err) { next(err); }
});

discoveryRouter.post("/import", (req, res, next) => {
  try {
    const { searchId, selectedSourceIds } = req.body as { searchId: string; selectedSourceIds: string[] };
    if (!searchId) throw new Error("searchId required");
    const result = importPreview(searchId, selectedSourceIds ?? []);
    res.json(result);
  } catch (err) { next(err); }
});