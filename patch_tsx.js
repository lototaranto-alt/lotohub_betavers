const fs = require('fs');
let file = fs.readFileSync('components/ProfileModal.tsx', 'utf8');

const target = `                  <Text style={[styles.privacyText, { color: theme.textMuted }]}>Zero PII: la sincronia è 100% anonima e dura 2 ore.</Text>\n                </View>\n              </View>\n            )}`;
const replacement = `                  <Text style={[styles.privacyText, { color: theme.textMuted }]}>Zero PII: la sincronia è 100% anonima e dura 2 ore.</Text>\n                </View>\n                  </>\n                )}\n              </View>\n            )}`;

file = file.replace(target, replacement);
fs.writeFileSync('components/ProfileModal.tsx', file, 'utf8');
