import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AppError } from "../../infra/errors";
import { getServer } from "../servers/servers.service";
import { create, list, remove, update } from "./alerts.repository";
import type { AlertMetric } from "./alerts.schema";

const serialize = <T extends { createdAt: Date; updatedAt: Date }>(row: T) => ({
	...row,
	createdAt: row.createdAt.toISOString(),
	updatedAt: row.updatedAt.toISOString(),
});

export const getAlertRules = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
) => {
	const alertRulesList = await list(db, orgId);
	return alertRulesList.map(serialize);
};

export const createAlertRule = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	data: {
		serverId: number;
		metric: AlertMetric;
		threshold: number;
		enabled: boolean;
	},
) => {
	await getServer(db, orgId, data.serverId); // org 소유 아니면 404
	try {
		const [createdRule] = await create(db, data);
		if (!createdRule) {
			throw new AppError(
				500,
				"INSERT_FAILED",
				"Insert returned no rows", // 실제로는 도달 불가
			);
		}
		return serialize(createdRule);
	} catch (e) {
		const code =
			(e as { code?: string }).code ??
			(e as { cause?: { code?: string } }).cause?.code;
		if (code === "23505") {
			throw new AppError(
				409,
				"DUPLICATE_RULE",
				"Rule for this server+metric exists",
			);
		}
		throw e;
	}
};

export const updateAlertRule = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	id: number,
	data: { metric?: AlertMetric; threshold?: number; enabled?: boolean },
) => {
	const [modifiedRule] = await update(db, orgId, id, data);
	if (!modifiedRule) {
		throw new AppError(
			404,
			"ALERT_RULE_NOT_FOUND",
			`Alert rule with id ${id} not found`,
		);
	}
	return serialize(modifiedRule);
};

export const removeAlertRule = async (
	db: NodePgDatabase<Record<string, unknown>>,
	orgId: string,
	id: number,
) => {
	const [deletedRule] = await remove(db, orgId, id);
	if (!deletedRule) {
		throw new AppError(
			404,
			"ALERT_RULE_NOT_FOUND",
			`Alert rule with id ${id} not found`,
		);
	}
	return serialize(deletedRule);
};
