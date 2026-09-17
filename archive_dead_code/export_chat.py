import json

transcript_path = r'C:\Users\Sem\.gemini\antigravity\brain\edf3a8e6-785a-4c0a-adf8-ccecfa355d1b\.system_generated\logs\transcript.jsonl'
output_path = r'C:\Users\Sem\.gemini\antigravity\worktrees\loto-app-fresh\fix-conversation-stuck-issue\docs\storico_chat_vecchia.md'

with open(transcript_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(output_path, 'w', encoding='utf-8') as out:
    out.write('# Storico Chat: Conversazione Esaurita\n\n')
    for line in lines:
        try:
            data = json.loads(line.strip())
            step_type = data.get('type')
            content = data.get('content', '')
            
            if step_type == 'USER_INPUT':
                out.write(f'## USER\n\n{content}\n\n---\n\n')
            elif step_type == 'PLANNER_RESPONSE':
                if content.strip():
                    out.write(f'## AGENT\n\n{content}\n\n---\n\n')
        except Exception as e:
            pass

print("Estrazione completata!")
