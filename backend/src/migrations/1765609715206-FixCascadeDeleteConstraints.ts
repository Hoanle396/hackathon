import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCascadeDeleteConstraints1765609715206 implements MigrationInterface {
    name = 'FixCascadeDeleteConstraints1765609715206'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "review_comments" DROP CONSTRAINT "FK_f7eb91a4c1d977a9b468e10ca55"`);
        await queryRunner.query(`ALTER TABLE "review_comments" DROP CONSTRAINT "FK_review_comments_reviewId"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_ee90086bb783380da5453d240b9"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_reviews_projectId"`);
        await queryRunner.query(`ALTER TABLE "review_comments" ADD CONSTRAINT "FK_f7eb91a4c1d977a9b468e10ca55" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_ee90086bb783380da5453d240b9" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_ee90086bb783380da5453d240b9"`);
        await queryRunner.query(`ALTER TABLE "review_comments" DROP CONSTRAINT "FK_f7eb91a4c1d977a9b468e10ca55"`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_projectId" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_ee90086bb783380da5453d240b9" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review_comments" ADD CONSTRAINT "FK_review_comments_reviewId" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review_comments" ADD CONSTRAINT "FK_f7eb91a4c1d977a9b468e10ca55" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
