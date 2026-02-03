-- Identify and delete duplicate customers, keeping the most recently updated one

WITH Duplicates AS (
    SELECT 
        id,
        name,
        updated_at,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(TRIM(name)) 
            ORDER BY updated_at DESC, created_at DESC
        ) as row_num
    FROM 
        customers
)
DELETE FROM customers
WHERE id IN (
    SELECT id 
    FROM Duplicates 
    WHERE row_num > 1
);
