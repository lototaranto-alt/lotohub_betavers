const fs = require('fs');
let file = fs.readFileSync('app/(tabs)/index.tsx', 'utf8');

if (!file.includes('import i18n from')) {
  file = file.replace("import { useTheme } from '../../context/ThemeContext';", "import { useTheme } from '../../context/ThemeContext';\nimport i18n from '../../locales/i18n';");
}

const replacements = [
  { old: ">Indizi Trovati<", new: ">{i18n.t('dashboardClues')}<" },
  { old: ">Impatto & Punti<", new: ">{i18n.t('dashboardImpact')}<" },
  { old: ">Archivio Storico<", new: ">{i18n.t('dashboardArchive')}<" },
  { old: ">Documenti Storici<", new: ">{i18n.t('dashboardDocs')}<" },
  { old: ">Esplora i segreti rivelati<", new: ">{i18n.t('dashboardExplore')}<" },
  { old: ">Traguardi<", new: ">{i18n.t('dashboardMilestones')}<" },
  { old: " Badge Sbloccati<", new: " {i18n.t('dashboardBadges')}<" },
  { old: ">Sfida attiva: Sfida Mappatura Civica<", new: ">{i18n.t('dashboardChallenge')}<" },
  { old: ">EVENTI IN CORSO<", new: ">{i18n.t('sectionEvents')}<" },
  { old: ">METE CONSIGLIATE<", new: ">{i18n.t('sectionSpots')}<" },
  { old: ">Nessuna meta disponibile in questa categoria.<", new: ">{i18n.t('noSpots')}<" },
  { old: ">SBLOCCA AL LIV 2<", new: ">{i18n.t('unlockLv2')}<" },
  { old: ">LIVELLO ", new: ">{i18n.t('levelPrefix')} " },
];

for (const rep of replacements) {
  file = file.split(rep.old).join(rep.new);
}

fs.writeFileSync('app/(tabs)/index.tsx', file, 'utf8');
