// Curated mock-test answer key. Source IDs MX01–MX50 were provided by
// students. AX01–AX12 are additional Akay practice items.
// Question scores are based on this reviewed key, NOT live checker output.
export const PRACTICE_CATEGORY = Object.freeze({
  SPELLING: 'Baybay',
  GRAMMAR: 'Gramatika',
  PUNCTUATION: 'Bantas at Malaking Titik',
});

const B = PRACTICE_CATEGORY.SPELLING;
const G = PRACTICE_CATEGORY.GRAMMAR;
const P = PRACTICE_CATEGORY.PUNCTUATION;

// [ID, category, incorrect, reference correction, explanation, optional metadata]
const data = [
  ['MX01', B, 'Sya ay pumunta sa paaralan kahapon.', 'Siya ay pumunta sa paaralan kahapon.', 'Gamitin ang buong baybay na “siya” sa pormal na pagsulat.'],
  ['MX02', B, 'Gusto ko lng sumama sayo.', 'Gusto ko lang sumama sa iyo.', 'Isulat ang “lang” at paghiwalayin ang “sa iyo” sa pormal na pagsulat.'],
  ['MX03', B, 'Kc mahal kita kaya ako naghihintay.', 'Kasi mahal kita kaya ako naghihintay.', 'Hindi pamantayang baybay ang text abbreviation na “kc”. Isulat ang “kasi”.'],
  ['MX04', B, 'Pumunta ako dto kahapon.', 'Pumunta ako dito kahapon.', 'Gamitin ang buong baybay na “dito”.'],
  ['MX05', B, 'Nuon pa man gusto ko nang maging guro.', 'Noon pa man gusto ko nang maging guro.', 'Ang karaniwang wastong baybay ay “noon”.'],
  ['MX06', B, 'Anung oras ka darating mamaya?', 'Anong oras ka darating mamaya?', 'Ang wastong anyo sa pangungusap ay “anong”.'],
  ['MX07', B, 'Pakitignan naman ang gawa kong sanaysay.', 'Pakitingnan naman ang gawa kong sanaysay.', 'Gamitin ang “pakitingnan” sa halip na “pakitignan”.'],
  ['MX08', B, 'Mayruon akong dalawang aso sa bahay.', 'Mayroon akong dalawang aso sa bahay.', 'Ang wastong baybay ay “mayroon”.'],
  ['MX09', B, 'Dapat tayong magaral nang mabuti para sa pagsusulit.', 'Dapat tayong mag-aral nang mabuti para sa pagsusulit.', 'Gumamit ng gitling sa “mag-aral”.'],
  ['MX10', B, 'Nagaalala ako sa kalagayan ng aking lola.', 'Nag-aalala ako sa kalagayan ng aking lola.', 'Gamitin ang gitling sa “nag-aalala”.'],
  ['MX11', B, 'Malaki ang pagibig ng magulang sa anak.', 'Malaki ang pag-ibig ng magulang sa anak.', 'Gamitin ang gitling sa “pag-ibig”.'],
  ['MX12', B, 'Patuloy siyang nagaaral kahit gabi na.', 'Patuloy siyang nag-aaral kahit gabi na.', 'Gamitin ang gitling sa “nag-aaral”.'],
  ['MX13', B, 'Araw araw akong pumapasok sa trabaho.', 'Araw-araw akong pumapasok sa trabaho.', 'Gumamit ng gitling sa pag-uulit ng salita: “araw-araw”.'],
  ['MX14', B, 'Maraming paruparo ang nakita namin sa hardin.', 'Maraming paru-paro ang nakita namin sa hardin.', 'Gumamit ng gitling sa baybay na “paru-paro”.'],
  ['MX15', B, 'Taontaon kaming bumibisita sa probinsya.', 'Taun-taon kaming bumibisita sa probinsya.', 'Gamitin ang baybay na “taun-taon”.'],
  ['MX16', B, 'Unti unti niyang natutunan ang leksyon.', 'Unti-unti niyang natutunan ang leksyon.', 'Gamitin ang gitling sa “unti-unti”.'],
  ['MX17', B, 'Masmalaki ang bahay nila kaysa sa amin.', 'Mas malaki ang bahay nila kaysa sa amin.', 'Paghiwalayin ang “mas” at “malaki”.'],
  ['MX18', B, 'Sakanya ko ibibigay ang liham na ito.', 'Sa kanya ko ibibigay ang liham na ito.', 'Paghiwalayin ang pang-ukol na “sa” at “kanya”.'],
  ['MX19', B, 'Kahitpaano ay tatapusin ko ang proyekto.', 'Kahit paano ay tatapusin ko ang proyekto.', 'Paghiwalayin ang “kahit” at “paano”.'],
  ['MX20', B, 'Napakaganda ng tanawin sakabundukan.', 'Napakaganda ng tanawin sa kabundukan.', 'Paghiwalayin ang “sa” at “kabundukan”.'],
  ['MX21', B, 'Dapat tayong maging makadiyos at mapagmahal sa kapwa.', 'Dapat tayong maging maka-Diyos at mapagmahal sa kapwa.', 'Gamitin ang gitling at malaking titik sa “maka-Diyos”.'],
  ['MX22', B, 'Tinawag siyang kapilipino dahil sa kanyang pagmamahal sa bansa.', 'Tinawag siyang ka-Pilipino dahil sa kanyang pagmamahal sa bansa.', 'Kailangang ipasuri ang kahulugan at gamit ng “ka-Pilipino” bago gamitin sa awtomatikong pagmamarka.', { approved: false, reviewReason: 'Uncertain intended meaning and idiomaticity of ka-Pilipino in the full sentence.' }],
  ['MX23', B, 'Ipinagmalaki niya ang kanyang pagiging kaamerikana dahil sa lahi ng kanyang ama.', 'Ipinagmalaki niya ang kanyang pagiging ka-Amerikana dahil sa lahi ng kanyang ama.', 'Kailangang ipasuri ang kahulugan at gamit ng “ka-Amerikana” bago gamitin sa awtomatikong pagmamarka.', { approved: false, reviewReason: 'Uncertain intended meaning and idiomaticity of pagiging ka-Amerikana.' }],
  ['MX24', G, 'Kumain rin ako ng tinapay kaninang umaga.', 'Kumain din ako ng tinapay kaninang umaga.', 'Karaniwang “din” ang ginagamit pagkatapos ng katinig maliban sa w at y.'],
  ['MX25', G, 'Sumama din si Ben sa paglalakbay namin.', 'Sumama rin si Ben sa paglalakbay namin.', 'Karaniwang “rin” ang ginagamit pagkatapos ng patinig.'],
  ['MX26', G, 'Natutuwa din ang mag-aaral sa laro.', 'Natutuwa rin ang mag-aaral sa laro.', 'Karaniwang “rin” ang ginagamit pagkatapos ng patinig.'],
  ['MX27', G, 'Pupunta din kami sa pista mamaya.', 'Pupunta rin kami sa pista mamaya.', 'Karaniwang “rin” ang ginagamit pagkatapos ng patinig.'],
  ['MX28', G, 'Gusto din niyang sumali sa paligsahan.', 'Gusto rin niyang sumali sa paligsahan.', 'Karaniwang “rin” ang ginagamit pagkatapos ng patinig.'],
  ['MX29', G, 'Pupunta daw si Ana sa bahay namin.', 'Pupunta raw si Ana sa bahay namin.', 'Karaniwang “raw” ang ginagamit pagkatapos ng patinig.'],
  ['MX30', G, 'Masarap raw ang luto ni Ben kagabi.', 'Masarap daw ang luto ni Ben kagabi.', 'Karaniwang “daw” ang ginagamit pagkatapos ng katinig maliban sa w at y.'],
  ['MX31', G, 'Aalis raw ang mag-aaral bukas ng umaga.', 'Aalis daw ang mag-aaral bukas ng umaga.', 'Karaniwang “daw” ang ginagamit pagkatapos ng katinig maliban sa w at y.'],
  ['MX32', G, 'Maganda daw ang pelikula kagabi.', 'Maganda raw ang pelikula kagabi.', 'Karaniwang “raw” ang ginagamit pagkatapos ng patinig.'],
  ['MX33', G, 'Uuwi daw si Rosa sa probinsya bukas.', 'Uuwi raw si Rosa sa probinsya bukas.', 'Karaniwang “raw” ang ginagamit pagkatapos ng patinig.'],
  ['MX34', G, 'Si Ana at Ben ang nagluto ng hapunan.', 'Sina Ana at Ben ang nagluto ng hapunan.', 'Gamitin ang “sina” kapag dalawa o higit pang tao ang tinutukoy.'],
  ['MX35', G, 'Si Maria, Juan, at Pedro ang sumali sa laro.', 'Sina Maria, Juan, at Pedro ang sumali sa laro.', 'Gamitin ang “sina” kapag maraming pangalan ang kasama.', { accepted: ['Sina Maria, Juan at Pedro ang sumali sa laro.'] }],
  ['MX36', G, 'Bumisita si Lola at Lolo sa amin kahapon.', 'Bumisita sina Lola at Lolo sa amin kahapon.', 'Gamitin ang “sina” kapag dalawa ang tinutukoy na tao.'],
  ['MX37', G, 'Kasama ni Ana at Rosa sa pagsasanay.', 'Kasama nina Ana at Rosa sa pagsasanay.', 'Gamitin ang “nina” kapag higit sa isang pangalan ang kasunod ng “ni”.'],
  ['MX38', P, 'bumili ako ng gulay sa palengke.', 'Bumili ako ng gulay sa palengke.', 'Gumamit ng malaking titik sa simula ng pangungusap.'],
  ['MX39', P, 'masaya ang bati ng mga bata sa pista.', 'Masaya ang bati ng mga bata sa pista.', 'Gumamit ng malaking titik sa simula ng pangungusap.'],
  ['MX40', P, 'pumunta kami sa simbahan tuwing linggo.', 'Pumunta kami sa simbahan tuwing Linggo.', 'Gumamit ng malaking titik sa simula ng pangungusap at sa pangalan ng araw.'],
  ['MX41', P, 'Magsisimula ang klase sa buwan ng hunyo.', 'Magsisimula ang klase sa buwan ng Hunyo.', 'Gumamit ng malaking titik sa pangalan ng buwan.'],
  ['MX42', P, 'Ang kapistahan ay gaganapin tuwing setyembre.', 'Ang kapistahan ay gaganapin tuwing Setyembre.', 'Gumamit ng malaking titik sa pangalan ng buwan.'],
  ['MX43', P, 'Magkikita kami tuwing lunes ng hapon.', 'Magkikita kami tuwing Lunes ng hapon.', 'Gumamit ng malaking titik sa pangalan ng araw.'],
  ['MX44', P, 'Bumili ako ng mangga sa palengke', 'Bumili ako ng mangga sa palengke.', 'Lagyan ng tuldok ang hulihan ng pangungusap na pasalaysay.'],
  ['MX45', P, 'Saan ka pupunta mamaya', 'Saan ka pupunta mamaya?', 'Gumamit ng tandang pananong sa tuwirang tanong.'],
  ['MX46', P, 'Bumili ako ng gatas kaninang umaga', 'Bumili ako ng gatas kaninang umaga.', 'Lagyan ng tuldok ang hulihan ng pangungusap na pasalaysay.'],
  ['MX47', P, 'Bumili ako ng mangga saging at ubas.', 'Bumili ako ng mangga, saging, at ubas.', 'Paghiwalayin ng kuwit ang mga bagay sa isang listahan.', { accepted: ['Bumili ako ng mangga, saging at ubas.'] }],
  ['MX48', P, 'Kumain kami ng kanin itlog at tinapay.', 'Kumain kami ng kanin, itlog, at tinapay.', 'Paghiwalayin ng kuwit ang mga bagay sa isang listahan.', { accepted: ['Kumain kami ng kanin, itlog at tinapay.'] }],
  ['MX49', P, 'Bibili ako ng papel lapis at pantasa.', 'Bibili ako ng papel, lapis, at pantasa.', 'Paghiwalayin ng kuwit ang mga bagay sa isang listahan.', { accepted: ['Bibili ako ng papel, lapis at pantasa.'] }],
  ['MX50', P, 'Dumalo sa pulong sina Ana Ben at Carlo.', 'Dumalo sa pulong sina Ana, Ben, at Carlo.', 'Paghiwalayin ng kuwit ang magkakasunod na pangalan.', { accepted: ['Dumalo sa pulong sina Ana, Ben at Carlo.'] }],
  // Additional carefully scoped exercises to widen category coverage.
  ['AX01', B, 'Mahalaga ang pagaaral sa buhay.', 'Mahalaga ang pag-aaral sa buhay.', 'Gumamit ng gitling sa “pag-aaral”.'],
  ['AX02', B, 'Nakatira sila sa aming baranggay.', 'Nakatira sila sa aming barangay.', 'Ang wastong baybay ay “barangay”.'],
  ['AX03', B, 'Sama sama tayong maglinis ng paligid.', 'Sama-sama tayong maglinis ng paligid.', 'Gumamit ng gitling sa pag-uulit na “sama-sama”.'],
  ['AX04', B, 'Masipag ang mga magaaral sa klase.', 'Masipag ang mga mag-aaral sa klase.', 'Gumamit ng gitling sa “mag-aaral”.'],
  ['AX05', G, 'Naglaro din kami sa parke.', 'Naglaro rin kami sa parke.', 'Karaniwang “rin” ang ginagamit pagkatapos ng patinig.'],
  ['AX06', G, 'Nagsalita daw ang punong-guro.', 'Nagsalita raw ang punong-guro.', 'Karaniwang “raw” ang ginagamit pagkatapos ng patinig.'],
  ['AX07', G, 'Nag-aral siya ng mabuti.', 'Nag-aral siya nang mabuti.', 'Gamitin ang “nang” kapag inilalarawan kung paano isinagawa ang kilos.'],
  ['AX08', G, 'Kumain ako nang tinapay.', 'Kumain ako ng tinapay.', 'Gamitin ang “ng” upang ipakilala ang tuwirang layon ng kilos.'],
  ['AX09', P, 'sabay kaming umuwi.', 'Sabay kaming umuwi.', 'Gumamit ng malaking titik sa simula ng pangungusap.'],
  ['AX10', P, 'May dalang lapis papel at pambura si Juan.', 'May dalang lapis, papel, at pambura si Juan.', 'Paghiwalayin ng kuwit ang mga bagay sa isang listahan.', { accepted: ['May dalang lapis, papel at pambura si Juan.'] }],
  ['AX11', P, 'Natapos ang klase noong biyernes.', 'Natapos ang klase noong Biyernes.', 'Gumamit ng malaking titik sa pangalan ng araw.'],
  ['AX12', P, 'Sino ang sasama sa iyo mamaya', 'Sino ang sasama sa iyo mamaya?', 'Gumamit ng tandang pananong sa tuwirang tanong.'],
];

export const PRACTICE_QUESTIONS = Object.freeze(
  data.map(([id, category, incorrect, correct, explanation, options = {}]) => Object.freeze({
    id, category, incorrect, correct, explanation,
    accepted: Object.freeze(options.accepted ?? []),
    approved: options.approved !== false,
    reviewReason: options.reviewReason ?? null,
  })),
);

export const APPROVED_PRACTICE_QUESTIONS = Object.freeze(
  PRACTICE_QUESTIONS.filter((item) => item.approved),
);
