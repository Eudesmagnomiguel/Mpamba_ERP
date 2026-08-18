-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasCustomModuleAccess" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "UserModule" (
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "UserModule_pkey" PRIMARY KEY ("userId","moduleId")
);

-- AddForeignKey
ALTER TABLE "UserModule" ADD CONSTRAINT "UserModule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserModule" ADD CONSTRAINT "UserModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

