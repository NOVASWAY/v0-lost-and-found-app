-- UniqueConstraint: One claim per item per claimant
CREATE UNIQUE INDEX "Claim_itemId_claimantId_key" ON "Claim"("itemId", "claimantId");
