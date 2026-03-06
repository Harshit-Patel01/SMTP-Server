UPDATE mails
SET receiver = LOWER(TRIM((regexp_match(receiver, '<([^<>]+@[^<>]+)>'))[1]))
WHERE receiver ~ '<[^<>]+@[^<>]+>';
