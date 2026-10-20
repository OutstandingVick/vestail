import "server-only";

import { createHash } from "node:crypto";
import path from "node:path";

import type { TesterApplication } from "@/lib/tester-application-schema";

export type SaveTesterResult = "created" | "duplicate_email" | "duplicate_wallet";

const localFile = () => path.resolve(process.env.VESTAIL_TESTER_APPLICATIONS_FILE || ".data/tester-applications.jsonl");
const digest = (value: string) => createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
const emailKey = (email: string) => `vestail:tester_applications:email:${digest(email)}`;
const walletKey = (wallet: string) => `vestail:tester_applications:wallet:${digest(wallet)}`;
const rowKey = (row: TesterApplication) => `vestail:tester_applications:row:${row.created_at}:${digest(row.email).slice(0, 12)}`;
