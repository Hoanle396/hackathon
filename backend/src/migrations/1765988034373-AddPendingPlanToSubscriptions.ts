import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPendingPlanToSubscriptions1765988034373 implements MigrationInterface {
    name = 'AddPendingPlanToSubscriptions1765988034373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_pendingplan_enum" AS ENUM('free', 'starter', 'professional', 'enterprise')`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "pendingPlan" "public"."subscriptions_pendingplan_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "pendingPlan"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_pendingplan_enum"`);
    }

}
