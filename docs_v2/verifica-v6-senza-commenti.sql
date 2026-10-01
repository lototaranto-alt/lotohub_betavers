BEGIN;
SELECT set_config('request.jwt.claim.sub', (SELECT id::text FROM public.profiles LIMIT 1), true);
SELECT public.process_esg_impact(1.0, 1, 1, 1, false, 999999, 'test_hash');
SELECT co2_saved, liters_saved, tokens_earned, xp_earned, party_size_reported, created_at FROM public.impact_transactions ORDER BY created_at DESC LIMIT 1;
ROLLBACK;
