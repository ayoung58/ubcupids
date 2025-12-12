-- CreateTable
CREATE TABLE "QuestionnaireResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "importance" JSONB,
    "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionnaireResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireResponse_userId_key" ON "QuestionnaireResponse"("userId");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_userId_idx" ON "QuestionnaireResponse"("userId");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_isSubmitted_idx" ON "QuestionnaireResponse"("isSubmitted");

-- AddForeignKey
ALTER TABLE "QuestionnaireResponse" ADD CONSTRAINT "QuestionnaireResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
