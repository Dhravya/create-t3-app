#!/usr/bin/env node
import type { PackageJson } from "type-fest";
import path from "path";
import fs from "fs-extra";
import prompts, { type PromptObject } from "prompts";
import { createProject } from "./helpers/create";
import { initializeGit } from "./helpers/init-git";
import { logNextSteps } from "./helpers/log-next-steps";
import { logger } from "./helpers/logger";
import { installers, type Installer } from "./installers";

type AvailablePackages = "tailwind" | "trpc" | "prisma" | "nextAuth";
export type Packages = {
  [pkg in AvailablePackages]: {
    inUse: boolean;
    installer: Installer;
  };
};

const DEFAULT_PROJECT_NAME = "my-t3-app";

const promts: PromptObject[] = [
  {
    name: "name",
    type: "text",
    message: "What will your project be called?",
    format: (name: string) => {
      if (name === "") {
        logger.warn(`Using default name: ${DEFAULT_PROJECT_NAME}`);
        return DEFAULT_PROJECT_NAME;
      }
      return name.trim();
    },
  },
  {
    name: "language",
    type: "select",
    message: "Will you be using JavaScript or TypeScript?",
    instructions: false,
    choices: [
      {
        title: "TypeScript",
        value: "typescript",
      },
      {
        title: "JavaScript",
        value: "javascript",
      },
    ],
    format: (language: string) => {
      if (language === "javascript") {
        logger.error("Wrong answer, using TypeScript instead...");
      } else {
        logger.success("Good choice! Using TypeScript!");
      }
      return;
    },
  },
  {
    name: "useTailwind",
    type: "toggle",
    message: "Would you like to use Tailwind?",
    initial: true,
    active: "Yes",
    inactive: "No",
  },
  {
    name: "useTrpc",
    type: "toggle",
    message: "Would you like to use tRPC?",
    initial: true,
    active: "Yes",
    inactive: "No",
  },
  {
    name: "usePrisma",
    type: "toggle",
    message: "Would you like to use Prisma?",
    initial: true,
    active: "Yes",
    inactive: "No",
  },
  {
    name: "useNextAuth",
    type: "toggle",
    message: "Would you like to use Next Auth?",
    initial: true,
    active: "Yes",
    inactive: "No",
  },
];

const main = async () => {
  logger.error("Welcome to the create-t3-app !");

  // FIXME: Look into if the type can be inferred
  const { name, useTailwind, useTrpc, usePrisma, useNextAuth } = (await prompts(
    promts,
  )) as {
    name: string;
    useTailwind: boolean;
    useTrpc: boolean;
    usePrisma: boolean;
    useNextAuth: boolean;
  };

  const packages: Packages = {
    tailwind: { inUse: useTailwind, installer: installers.tailwind },
    trpc: { inUse: useTrpc, installer: installers.trpc },
    prisma: { inUse: usePrisma, installer: installers.prisma },
    nextAuth: { inUse: useNextAuth, installer: installers.nextAuth },
  };

  const projectDir = await createProject(name, packages);

  await initializeGit(projectDir);

  logNextSteps(name, packages);

  const pkgJson = (await fs.readJSON(
    path.join(projectDir, "package.json"),
  )) as PackageJson;
  pkgJson.name = name;
  await fs.writeJSON(path.join(projectDir, "package.json"), pkgJson, {
    spaces: 2,
  });

  process.exit(0);
};

main().catch((err) => {
  if (err instanceof Error) {
    console.error(err);
  }
});
