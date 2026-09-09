const fs = require('fs');
let file = fs.readFileSync('C:\\Users\\Sem\\.gemini\\antigravity\\brain\\edf3a8e6-785a-4c0a-adf8-ccecfa355d1b\\SUPABASE_DEPLOYMENT.md', 'utf8');

const newContent = `

## 4. Motore Co-Experience (L.O.T.O. Squads)

Struttura per sincronizzare due utenti temporaneamente.

\`\`\`sql
CREATE TABLE IF NOT EXISTS public.loto_squads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Un utente può avere una sola sessione attiva come member
    UNIQUE(member_id) 
);

ALTER TABLE public.loto_squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utenti vedono le loro squad" 
ON public.loto_squads FOR SELECT 
USING (auth.uid() = leader_id OR auth.uid() = member_id);

CREATE POLICY "Utenti possono creare squad" 
ON public.loto_squads FOR INSERT 
WITH CHECK (auth.uid() = member_id OR auth.uid() = leader_id);

-- RPC per unirsi a una squad
CREATE OR REPLACE FUNCTION public.join_squad(p_leader_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_id UUID;
BEGIN
    v_member_id := auth.uid();
    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'Utente non autenticato';
    END IF;

    IF v_member_id = p_leader_id THEN
        RAISE EXCEPTION 'Non puoi unirti alla tua stessa squad';
    END IF;

    -- Disattiva squad precedenti per questo membro
    UPDATE public.loto_squads 
    SET is_active = false 
    WHERE member_id = v_member_id AND is_active = true;

    -- Crea nuova squad
    INSERT INTO public.loto_squads (leader_id, member_id, is_active, expires_at)
    VALUES (p_leader_id, v_member_id, true, NOW() + INTERVAL '2 hours');

    RETURN jsonb_build_object('status', 'success', 'message', 'Sincronizzazione completata');
END;
$$;
\`\`\`
`;

file = file + newContent;
fs.writeFileSync('C:\\Users\\Sem\\.gemini\\antigravity\\brain\\edf3a8e6-785a-4c0a-adf8-ccecfa355d1b\\SUPABASE_DEPLOYMENT.md', file, 'utf8');
