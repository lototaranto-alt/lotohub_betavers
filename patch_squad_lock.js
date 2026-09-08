const fs = require('fs');
let file = fs.readFileSync('components/ProfileModal.tsx', 'utf8');

// Modifichiamo il contenuto del tab SQUAD per mostrare un lucchetto se il livello < 20
const squadSectionOld = `<Text style={[styles.squadTitle, { color: theme.text }]}>Sincronia di Squadra</Text>`;
const squadSectionNew = `
                {computedLevel < 20 ? (
                  <View style={{ alignItems: 'center', padding: 20, marginTop: 40 }}>
                    <MaterialIcons name="lock" size={60} color={theme.textMuted} />
                    <Text style={[styles.squadTitle, { color: theme.text, marginTop: 20 }]}>Sincronia Bloccata</Text>
                    <Text style={[styles.squadDesc, { color: theme.textMuted }]}>
                      La Co-Experience  un privilegio riservato ai Cittadini di L.O.T.O. Raggiungi il Livello 20 per sbloccare la sincronizzazione di gruppo e moltiplicare i tuoi Punti.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.squadTitle, { color: theme.text }]}>Sincronia di Squadra</Text>
`;

file = file.replace(squadSectionOld, squadSectionNew);

// Chiudiamo il ternario alla fine della SQUAD section
const privacyNoteOld = `<Text style={[styles.privacyText, { color: theme.textMuted }]}>Zero PII: la sincronia è 100% anonima e dura 24 ore.</Text>\n                  </View>`;
const privacyNoteNew = `<Text style={[styles.privacyText, { color: theme.textMuted }]}>Zero PII: la sincronia è 100% anonima e dura 24 ore.</Text>\n                  </View>\n                  </>\n                )}`;

file = file.replace(privacyNoteOld, privacyNoteNew);

fs.writeFileSync('components/ProfileModal.tsx', file, 'utf8');
