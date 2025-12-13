import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeDeleteToProjectRelations1734096000000 implements MigrationInterface {
    name = 'AddCascadeDeleteToProjectRelations1734096000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing foreign keys
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "FK_reviews_projectId"`);
        await queryRunner.query(`ALTER TABLE "review_comments" DROP CONSTRAINT IF EXISTS "FK_review_comments_reviewId"`);
        
        // Add foreign keys with CASCADE delete
        await queryRunner.query(`
            ALTER TABLE "reviews" 
            ADD CONSTRAINT "FK_reviews_projectId" 
            FOREIGN KEY ("projectId") 
            REFERENCES "projects"("id") 
            ON DELETE CASCADE
        `);
        
        await queryRunner.query(`
            ALTER TABLE "review_comments" 
            ADD CONSTRAINT "FK_review_comments_reviewId" 
            FOREIGN KEY ("reviewId") 
            REFERENCES "reviews"("id") 
            ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop CASCADE foreign keys
        await queryRunner.query(`ALTER TABLE "review_comments" DROP CONSTRAINT IF EXISTS "FK_review_comments_reviewId"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "FK_reviews_projectId"`);
        
        // Restore original foreign keys without CASCADE
        await queryRunner.query(`
            ALTER TABLE "reviews" 
            ADD CONSTRAINT "FK_reviews_projectId" 
            FOREIGN KEY ("projectId") 
            REFERENCES "projects"("id")
        `);
        
        await queryRunner.query(`
            ALTER TABLE "review_comments" 
            ADD CONSTRAINT "FK_review_comments_reviewId" 
            FOREIGN KEY ("reviewId") 
            REFERENCES "reviews"("id")
        `);
    }
}
