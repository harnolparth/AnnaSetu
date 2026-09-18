-- SQL queries for lab/practical demonstration.
SELECT donor_id,name,email,phone,donor_type FROM donor;
SELECT ngo_id,ngo_name,email,phone,address FROM ngo;
SELECT volunteer_id,name,email,phone,vehicle,availability FROM volunteer;

SELECT * FROM food_donation
WHERE status='Available' AND available_from<=NOW() AND available_until>=NOW() AND expiry_date>NOW();

SELECT r.request_id,n.ngo_name,d.name AS donor_name,fd.food_name,r.request_date,r.status
FROM request r JOIN ngo n ON n.ngo_id=r.ngo_id
JOIN food_donation fd ON fd.donation_id=r.donation_id
JOIN donor d ON d.donor_id=fd.donor_id
ORDER BY r.request_id DESC;

SELECT dl.delivery_id,dl.status,v.name AS volunteer_name,fd.food_name,n.ngo_name
FROM delivery dl JOIN request r ON r.request_id=dl.request_id
JOIN food_donation fd ON fd.donation_id=r.donation_id
JOIN ngo n ON n.ngo_id=r.ngo_id
LEFT JOIN volunteer v ON v.volunteer_id=dl.volunteer_id
ORDER BY dl.delivery_id DESC;

SELECT * FROM delivery WHERE status='Delivered';
SELECT COUNT(*) AS total_donations FROM food_donation;
SELECT COUNT(*) AS completed_deliveries FROM delivery WHERE status='Delivered';

SELECT DATE_TRUNC('month',delivery_time) AS month,COUNT(*) AS completed_deliveries,SUM(fd.no_of_meals) AS meals_delivered
FROM delivery dl JOIN request r ON r.request_id=dl.request_id
JOIN food_donation fd ON fd.donation_id=r.donation_id
WHERE dl.status='Delivered'
GROUP BY DATE_TRUNC('month',delivery_time) ORDER BY month;
