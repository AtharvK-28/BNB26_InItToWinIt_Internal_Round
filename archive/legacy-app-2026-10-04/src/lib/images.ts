/**
 * Curated Unsplash photography (Unsplash License). Every ID was checked to resolve,
 * and photos showing real-world brand logos were left out — all brands in the app are fictional.
 */
const IDS = {
  // people & workspaces
  team: "1522202176988-66273c2fd55f",
  studyGroup: "1523240795612-9a054b0db644",
  office: "1556761175-b413da4baf72",
  deskWindow: "1593642632559-0c6d3fc62b89",
  codeLaptop: "1498050108023-c5249f4df085",
  typing: "1515378791036-0648a3ef77b2",
  meetingLaptops: "1551434678-e076c223a692",
  coworkers: "1543269865-cbf427effbad",
  laptopDesk: "1501504905252-473c47e087f8",
  phoneLaptop: "1563986768609-322da13575f3",
  highFive: "1600880292203-757bb62b4baf",
  handsTogether: "1600880292089-90a7e086ee0c",
  // tech
  headphonesYellow: "1505740420928-5e560c06d30e",
  headphonesWhite: "1583394838336-acd977736f90",
  headphonesBlack: "1585298723682-7115561c51b7",
  headphonesCloseup: "1484704849700-f032a568e944",
  smartwatchBlack: "1546868871-7041f2a55e12",
  smartwatchWhite: "1523275335684-37898b6baf30",
  laptopGlow: "1531297484001-80022131f5a1",
  circuit: "1518770660439-4636190af475",
  macbookWood: "1541807084-5c52b6b3adef",
  laptopWave: "1611078489935-0cb964de46d6",
  codeScreen: "1517694712202-14dd9538aa97",
  reactCode: "1633356122544-f134324a6cee",
  keyboard: "1587829741301-dc798b83add3",
  vr: "1593508512255-86ab42a8e620",
  dashboard: "1460925895917-afdab827c52f",
  analytics: "1551288049-bebda4e38f71",
  uiDesign: "1609921212029-bb5a28e60960",
  videoEdit: "1574717024653-61fd2cf4d44d",
  // cameras & audio
  instantCamera: "1526170375885-4d8ecf77b99f",
  cameraLenses: "1516035069371-29a1b244cc32",
  photographerPeak: "1492691527719-9d1e07e534b4",
  vintageMic: "1511671782779-c97d3d27a1d4",
  studioMic: "1478737270239-2f02b77fc618",
  podcastMic: "1590602847861-f357a9332bbc",
  travelFlatlay: "1488646953014-85cb44e25828",
  // gaming
  controllerNeon: "1612287230202-1ff1d85d1bdf",
  retroGaming: "1550745165-9bc0b252726f",
  gamingSetup: "1598550476439-6847785fcea6",
  // fitness & wellness
  barbell: "1517836357463-d25dfeac3438",
  situps: "1571019613454-1cb2f99b2d8b",
  yogaSunset: "1544367567-0f2fcb009e0b",
  meditation: "1506126613408-eca07ce68773",
  // food & coffee
  steakBowls: "1504674900247-0877df9cc836",
  salad: "1540189549336-e6e99c3679fe",
  pizza: "1565299624946-b28f40a0ae38",
  buddhaBowl: "1512621776951-a57141f2eefd",
  cooking: "1556911220-e15b29be8c8f",
  brunch: "1504754524776-8f4f37790ca0",
  frenchToast: "1484723091739-30a097e8f929",
  veggies: "1498837167922-ddd27525d352",
  coupleCooking: "1556909114-f6e7ad7d3136",
  latteCheers: "1495474472287-4d71bcdd2085",
  lattePlants: "1509042239860-f550ce710b93",
  coffeeBeans: "1497935586351-b67a49e012bf",
  // travel
  lakeBoat: "1476514525535-07fb3b4ae5f1",
  roadTrip: "1469854523086-cc02fe5d8800",
  beach: "1507525428034-b723cf961d3e",
  airport: "1530521954074-e64f6810b32d",
  tokyoNight: "1528360983277-13d401cdc186",
  milkyWay: "1519681393784-d120267933ba",
  // beauty
  makeupFlatlay: "1596462502278-27bfdc403348",
  facial: "1570172619644-dfd03ed5d881",
  serumDropper: "1608571423902-eed4a5ad8108",
  creamTube: "1620916566398-39f1143ab7be",
  hempSerum: "1611930022073-b7a4ba5fcccd",
  skincareStones: "1612817288484-6f916006741a",
  whiteBottles: "1631729371254-42c2892f0e6e",
  amberBottles: "1627384113743-6bd5a479fffd",
  hairDryer: "1621607512214-68297480165e",
  // finance
  stockChart: "1611974789855-9c2a0a7236a3",
  cardPayment: "1556742049-0cfed4f6a45d",
  revenueLaptop: "1559526324-4b87b5e36e44",
  taxDesk: "1554224155-6726b3ff858f",
  goldBars: "1610375461246-83df859d849d",
  // fashion
  shoppingBags: "1483985988355-763728e1935b",
  yellowTracksuit: "1515886657613-9f3515b0c78f",
  clothesRack: "1490481651871-ab68de25d43d",
  pinkWall: "1503342217505-b0a15ec3261c",
  leatherJacket: "1520975954732-35dd22299614",
  suit: "1617137968427-85924c800a22",
  printTee: "1576566588028-4147f3842f27",
  // family
  kidPaint: "1503454537195-1dcabb73ffb9",
  familySunset: "1511895426328-dc8714191300",
  // lecture
  lectureHall: "1606761568499-6d2451b23c66",
  // abstract gradients
  gradWave: "1618005182384-a83a8bd57fbe",
  gradMarble: "1557672172-298e090bd0f1",
  gradPastel: "1579546929518-9e396f3cc809",
  gradPurple: "1557682250-33bd709cbe85",
  gradOrange: "1604079628040-94301bb21b91",
  gradNeon: "1579547945413-497e1b99dac0",
  gradBlue: "1557683316-973673baf926",
  gradPink: "1620641788421-7a1c342ea42e",
  // portraits
  pMaya: "1494790108377-be9c29b29330",
  pMarcus: "1507003211169-0a1dd7228f2d",
  pAva: "1438761681033-6461ffad8d80",
  pDaniel: "1500648767791-00dcc994a43e",
  pLena: "1534528741775-53994a69daeb",
  pSofia: "1544005313-94ddf0286df2",
  pTheo: "1570295999919-56ceb5ecca61",
  pNadia: "1531746020798-e6953c6e8e04",
  pChloe: "1524504388940-b1c1722653e1",
  pIsla: "1529626455594-4ff0802cfb7e",
  pJune: "1517841905240-472988babdf9",
  pEli: "1539571696357-5a69c17a67c6",
  pPriya: "1488426862026-3ee34a7d66df",
  pKai: "1502823403499-6ccfcf4fb453",
  pOmar: "1527980965255-d3b416303d12",
  pRosa: "1580489944761-15a19d654956",
  pBen: "1599566150163-29194dcaad36",
  pZara: "1607746882042-944635dfe10e",
  pLeo: "1633332755192-727a05c4013d",
  pSam: "1564564321837-a57b7070ac4f",
  pDev: "1519085360753-af0119f7cbe7",
  pGrace: "1573497019940-1c28c88b4f3e",
  pAndre: "1521119989659-a83eee488004",
} as const;

export type ImageKey = keyof typeof IDS;

export function img(key: ImageKey, w = 720, h?: number) {
  const size = h ? `&w=${w}&h=${h}&fit=crop` : `&w=${w}`;
  return `https://images.unsplash.com/photo-${IDS[key]}?auto=format&q=75${size}`;
}

export function avatar(key: ImageKey, size = 160) {
  return img(key, size, size) + "&crop=faces";
}
