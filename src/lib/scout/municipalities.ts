export type MunicipalityRecord = {
  name: string;
  aliases: string[];
  schemeCode: string;
  schemeTitle: string;
};

export const MUNICIPALITIES: MunicipalityRecord[] = [
  { name: "Yarra", aliases: ["yarra city", "city of yarra"], schemeCode: "yarra", schemeTitle: "Yarra" },
  { name: "Melbourne", aliases: ["city of melbourne"], schemeCode: "melb", schemeTitle: "Melbourne" },
  { name: "Port Phillip", aliases: ["city of port phillip"], schemeCode: "port", schemeTitle: "Port Phillip" },
  { name: "Stonnington", aliases: ["city of stonnington"], schemeCode: "ston", schemeTitle: "Stonnington" },
  { name: "Boroondara", aliases: ["city of boroondara"], schemeCode: "boro", schemeTitle: "Boroondara" },
  { name: "Merri-bek", aliases: ["moreland", "moreland city"], schemeCode: "merri", schemeTitle: "Merri-bek" },
  { name: "Darebin", aliases: ["city of darebin"], schemeCode: "dare", schemeTitle: "Darebin" },
  { name: "Moonee Valley", aliases: ["moonee valley city"], schemeCode: "moon", schemeTitle: "Moonee Valley" },
  { name: "Maribyrnong", aliases: ["city of maribyrnong"], schemeCode: "mari", schemeTitle: "Maribyrnong" },
  { name: "Hobsons Bay", aliases: ["hobsons bay city"], schemeCode: "hbay", schemeTitle: "Hobsons Bay" },
  { name: "Wyndham", aliases: ["wyndham city"], schemeCode: "wynd", schemeTitle: "Wyndham" },
  { name: "Melton", aliases: ["city of melton"], schemeCode: "melt", schemeTitle: "Melton" },
  { name: "Brimbank", aliases: ["city of brimbank"], schemeCode: "brim", schemeTitle: "Brimbank" },
  { name: "Hume", aliases: ["hume city"], schemeCode: "hume", schemeTitle: "Hume" },
  { name: "Whittlesea", aliases: ["city of whittlesea"], schemeCode: "whit", schemeTitle: "Whittlesea" },
  { name: "Nillumbik", aliases: ["nillumbik shire"], schemeCode: "nill", schemeTitle: "Nillumbik" },
  { name: "Banyule", aliases: ["banyule city"], schemeCode: "bany", schemeTitle: "Banyule" },
  { name: "Manningham", aliases: ["manningham city"], schemeCode: "mann", schemeTitle: "Manningham" },
  { name: "Whitehorse", aliases: ["whitehorse city"], schemeCode: "whse", schemeTitle: "Whitehorse" },
  { name: "Monash", aliases: ["city of monash"], schemeCode: "mona", schemeTitle: "Monash" },
  { name: "Glen Eira", aliases: ["glen eira city"], schemeCode: "glen", schemeTitle: "Glen Eira" },
  { name: "Bayside", aliases: ["bayside city"], schemeCode: "bays", schemeTitle: "Bayside" },
  { name: "Kingston", aliases: ["kingston city"], schemeCode: "king", schemeTitle: "Kingston" },
  { name: "Greater Dandenong", aliases: ["dandenong"], schemeCode: "gdan", schemeTitle: "Greater Dandenong" },
  { name: "Casey", aliases: ["city of casey"], schemeCode: "case", schemeTitle: "Casey" },
  { name: "Frankston", aliases: ["frankston city"], schemeCode: "fran", schemeTitle: "Frankston" },
  { name: "Mornington Peninsula", aliases: ["mornington"], schemeCode: "morn", schemeTitle: "Mornington Peninsula" },
  { name: "Knox", aliases: ["knox city"], schemeCode: "knox", schemeTitle: "Knox" },
  { name: "Maroondah", aliases: ["maroondah city"], schemeCode: "mnda", schemeTitle: "Maroondah" },
  { name: "Yarra Ranges", aliases: ["yarra ranges shire"], schemeCode: "yara", schemeTitle: "Yarra Ranges" },
  { name: "Cardinia", aliases: ["cardinia shire"], schemeCode: "card", schemeTitle: "Cardinia" },
  { name: "Greater Geelong", aliases: ["geelong"], schemeCode: "ggel", schemeTitle: "Greater Geelong" },
  { name: "Ballarat", aliases: ["city of ballarat"], schemeCode: "ball", schemeTitle: "Ballarat" },
  { name: "Greater Bendigo", aliases: ["bendigo"], schemeCode: "gbend", schemeTitle: "Greater Bendigo" },
  { name: "Greater Shepparton", aliases: ["shepparton"], schemeCode: "gshep", schemeTitle: "Greater Shepparton" },
  { name: "Latrobe", aliases: ["latrobe city"], schemeCode: "latr", schemeTitle: "Latrobe" },
  { name: "Wodonga", aliases: ["wodonga city"], schemeCode: "wodo", schemeTitle: "Wodonga" },
];

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/city of /g, "")
    .replace(/shire of /g, "")
    .replace(/planning scheme/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();
}

export function resolveMunicipality(input: string): MunicipalityRecord | null {
  const needle = normalise(input);
  if (!needle) {
    return null;
  }
  for (const row of MUNICIPALITIES) {
    const names = [row.name, row.schemeTitle, ...row.aliases].map(normalise);
    if (names.some((name) => name === needle || name.includes(needle) || needle.includes(name))) {
      return row;
    }
  }
  return null;
}

export function localAmendmentsUrl(record: MunicipalityRecord): string {
  return `https://planning-schemes.app.planning.vic.gov.au/${encodeURIComponent(record.schemeTitle)}/amendments`;
}
