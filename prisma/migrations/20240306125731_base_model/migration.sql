-- CreateEnum
CREATE TYPE "AddonCategory" AS ENUM ('VISUALISATION', 'MACHINE_LEARNING', 'DATA_SOURCE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addon" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" "AddonCategory" NOT NULL,

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AddonToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_AddonToUser_AB_unique" ON "_AddonToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_AddonToUser_B_index" ON "_AddonToUser"("B");

-- AddForeignKey
ALTER TABLE "_AddonToUser" ADD CONSTRAINT "_AddonToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Addon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AddonToUser" ADD CONSTRAINT "_AddonToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
