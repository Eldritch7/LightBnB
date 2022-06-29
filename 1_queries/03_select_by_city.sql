SELECT properties.id, title, cost_per_night, avg(property_reviews.rating) as average_rating
FROM properties
LEFT JOIN property_reviews ON properties.id = property_id
WHERE city LIKE '%ancouv%'
GROUP BY properties.id
HAVING avg(property_reviews.rating) >= 4
ORDER BY cost_per_night
LIMIT 10;



-- FIRST TRY:
-- SELECT properties.id AS id, properties.title AS title, cost_per_night, AVG(property_reviews.rating) AS average_rating
-- FROM properties JOIN property_reviews ON property_id = properties.id
-- WHERE properties.city = 'Vancouver'
-- GROUP BY properties.id
-- HAVING AVG(property_reviews.rating) >= 4
-- ORDER BY cost_per_night DESC
-- LIMIT 10;