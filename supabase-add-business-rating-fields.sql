-- Add three new rating fields for business reviews: payCompetitive, workload, flexibility
-- These replace the single starRating for business reviews

-- Add columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Review' AND column_name = 'payCompetitive') THEN
    ALTER TABLE "Review" ADD COLUMN "payCompetitive" INTEGER CHECK ("payCompetitive" >= 1 AND "payCompetitive" <= 5);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Review' AND column_name = 'workload') THEN
    ALTER TABLE "Review" ADD COLUMN "workload" INTEGER CHECK ("workload" >= 1 AND "workload" <= 5);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'Review' AND column_name = 'flexibility') THEN
    ALTER TABLE "Review" ADD COLUMN "flexibility" INTEGER CHECK ("flexibility" >= 1 AND "flexibility" <= 5);
  END IF;
END $$;
