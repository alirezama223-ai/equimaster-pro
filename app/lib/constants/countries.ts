export type Continent =
  | "Africa"
  | "Antarctica"
  | "Asia"
  | "Europe"
  | "North America"
  | "Oceania"
  | "South America";

export type Country = {
  /** Canonical English display name (stored in listings and profiles). */
  name: string;
  alpha2: string;
  alpha3: string;
  flag: string;
  continent: Continent;
};

/** All ISO 3166-1 recognised countries and territories, sorted by name. */
export const COUNTRIES: readonly Country[] = [
  {
    "name": "Afghanistan",
    "alpha2": "AF",
    "alpha3": "AFG",
    "flag": "🇦🇫",
    "continent": "Asia"
  },
  {
    "name": "Aland Islands",
    "alpha2": "AX",
    "alpha3": "ALA",
    "flag": "🇦🇽",
    "continent": "Europe"
  },
  {
    "name": "Albania",
    "alpha2": "AL",
    "alpha3": "ALB",
    "flag": "🇦🇱",
    "continent": "Europe"
  },
  {
    "name": "Algeria",
    "alpha2": "DZ",
    "alpha3": "DZA",
    "flag": "🇩🇿",
    "continent": "Africa"
  },
  {
    "name": "American Samoa",
    "alpha2": "AS",
    "alpha3": "ASM",
    "flag": "🇦🇸",
    "continent": "Oceania"
  },
  {
    "name": "Andorra",
    "alpha2": "AD",
    "alpha3": "AND",
    "flag": "🇦🇩",
    "continent": "Europe"
  },
  {
    "name": "Angola",
    "alpha2": "AO",
    "alpha3": "AGO",
    "flag": "🇦🇴",
    "continent": "Africa"
  },
  {
    "name": "Anguilla",
    "alpha2": "AI",
    "alpha3": "AIA",
    "flag": "🇦🇮",
    "continent": "North America"
  },
  {
    "name": "Antarctica",
    "alpha2": "AQ",
    "alpha3": "ATA",
    "flag": "🇦🇶",
    "continent": "Antarctica"
  },
  {
    "name": "Antigua and Barbuda",
    "alpha2": "AG",
    "alpha3": "ATG",
    "flag": "🇦🇬",
    "continent": "North America"
  },
  {
    "name": "Argentina",
    "alpha2": "AR",
    "alpha3": "ARG",
    "flag": "🇦🇷",
    "continent": "South America"
  },
  {
    "name": "Armenia",
    "alpha2": "AM",
    "alpha3": "ARM",
    "flag": "🇦🇲",
    "continent": "Asia"
  },
  {
    "name": "Aruba",
    "alpha2": "AW",
    "alpha3": "ABW",
    "flag": "🇦🇼",
    "continent": "North America"
  },
  {
    "name": "Australia",
    "alpha2": "AU",
    "alpha3": "AUS",
    "flag": "🇦🇺",
    "continent": "Oceania"
  },
  {
    "name": "Austria",
    "alpha2": "AT",
    "alpha3": "AUT",
    "flag": "🇦🇹",
    "continent": "Europe"
  },
  {
    "name": "Azerbaijan",
    "alpha2": "AZ",
    "alpha3": "AZE",
    "flag": "🇦🇿",
    "continent": "Asia"
  },
  {
    "name": "Bahamas",
    "alpha2": "BS",
    "alpha3": "BHS",
    "flag": "🇧🇸",
    "continent": "North America"
  },
  {
    "name": "Bahrain",
    "alpha2": "BH",
    "alpha3": "BHR",
    "flag": "🇧🇭",
    "continent": "Asia"
  },
  {
    "name": "Bangladesh",
    "alpha2": "BD",
    "alpha3": "BGD",
    "flag": "🇧🇩",
    "continent": "Asia"
  },
  {
    "name": "Barbados",
    "alpha2": "BB",
    "alpha3": "BRB",
    "flag": "🇧🇧",
    "continent": "North America"
  },
  {
    "name": "Belarus",
    "alpha2": "BY",
    "alpha3": "BLR",
    "flag": "🇧🇾",
    "continent": "Europe"
  },
  {
    "name": "Belgium",
    "alpha2": "BE",
    "alpha3": "BEL",
    "flag": "🇧🇪",
    "continent": "Europe"
  },
  {
    "name": "Belize",
    "alpha2": "BZ",
    "alpha3": "BLZ",
    "flag": "🇧🇿",
    "continent": "North America"
  },
  {
    "name": "Benin",
    "alpha2": "BJ",
    "alpha3": "BEN",
    "flag": "🇧🇯",
    "continent": "Africa"
  },
  {
    "name": "Bermuda",
    "alpha2": "BM",
    "alpha3": "BMU",
    "flag": "🇧🇲",
    "continent": "North America"
  },
  {
    "name": "Bhutan",
    "alpha2": "BT",
    "alpha3": "BTN",
    "flag": "🇧🇹",
    "continent": "Asia"
  },
  {
    "name": "Bolivia",
    "alpha2": "BO",
    "alpha3": "BOL",
    "flag": "🇧🇴",
    "continent": "South America"
  },
  {
    "name": "Bonaire, Sint Eustatius and Saba",
    "alpha2": "BQ",
    "alpha3": "BES",
    "flag": "🇧🇶",
    "continent": "North America"
  },
  {
    "name": "Bosnia and Herzegovina",
    "alpha2": "BA",
    "alpha3": "BIH",
    "flag": "🇧🇦",
    "continent": "Europe"
  },
  {
    "name": "Botswana",
    "alpha2": "BW",
    "alpha3": "BWA",
    "flag": "🇧🇼",
    "continent": "Africa"
  },
  {
    "name": "Bouvet Island",
    "alpha2": "BV",
    "alpha3": "BVT",
    "flag": "🇧🇻",
    "continent": "Antarctica"
  },
  {
    "name": "Brazil",
    "alpha2": "BR",
    "alpha3": "BRA",
    "flag": "🇧🇷",
    "continent": "South America"
  },
  {
    "name": "British Indian Ocean Territory",
    "alpha2": "IO",
    "alpha3": "IOT",
    "flag": "🇮🇴",
    "continent": "Asia"
  },
  {
    "name": "Brunei Darussalam",
    "alpha2": "BN",
    "alpha3": "BRN",
    "flag": "🇧🇳",
    "continent": "Asia"
  },
  {
    "name": "Bulgaria",
    "alpha2": "BG",
    "alpha3": "BGR",
    "flag": "🇧🇬",
    "continent": "Europe"
  },
  {
    "name": "Burkina Faso",
    "alpha2": "BF",
    "alpha3": "BFA",
    "flag": "🇧🇫",
    "continent": "Africa"
  },
  {
    "name": "Burundi",
    "alpha2": "BI",
    "alpha3": "BDI",
    "flag": "🇧🇮",
    "continent": "Africa"
  },
  {
    "name": "Cabo Verde",
    "alpha2": "CV",
    "alpha3": "CPV",
    "flag": "🇨🇻",
    "continent": "Africa"
  },
  {
    "name": "Cambodia",
    "alpha2": "KH",
    "alpha3": "KHM",
    "flag": "🇰🇭",
    "continent": "Asia"
  },
  {
    "name": "Cameroon",
    "alpha2": "CM",
    "alpha3": "CMR",
    "flag": "🇨🇲",
    "continent": "Africa"
  },
  {
    "name": "Canada",
    "alpha2": "CA",
    "alpha3": "CAN",
    "flag": "🇨🇦",
    "continent": "North America"
  },
  {
    "name": "Cayman Islands",
    "alpha2": "KY",
    "alpha3": "CYM",
    "flag": "🇰🇾",
    "continent": "North America"
  },
  {
    "name": "Central African Republic",
    "alpha2": "CF",
    "alpha3": "CAF",
    "flag": "🇨🇫",
    "continent": "Africa"
  },
  {
    "name": "Chad",
    "alpha2": "TD",
    "alpha3": "TCD",
    "flag": "🇹🇩",
    "continent": "Africa"
  },
  {
    "name": "Chile",
    "alpha2": "CL",
    "alpha3": "CHL",
    "flag": "🇨🇱",
    "continent": "South America"
  },
  {
    "name": "China",
    "alpha2": "CN",
    "alpha3": "CHN",
    "flag": "🇨🇳",
    "continent": "Asia"
  },
  {
    "name": "Christmas Island",
    "alpha2": "CX",
    "alpha3": "CXR",
    "flag": "🇨🇽",
    "continent": "Asia"
  },
  {
    "name": "Cocos (Keeling) Islands",
    "alpha2": "CC",
    "alpha3": "CCK",
    "flag": "🇨🇨",
    "continent": "Asia"
  },
  {
    "name": "Colombia",
    "alpha2": "CO",
    "alpha3": "COL",
    "flag": "🇨🇴",
    "continent": "South America"
  },
  {
    "name": "Comoros",
    "alpha2": "KM",
    "alpha3": "COM",
    "flag": "🇰🇲",
    "continent": "Africa"
  },
  {
    "name": "Congo",
    "alpha2": "CG",
    "alpha3": "COG",
    "flag": "🇨🇬",
    "continent": "Africa"
  },
  {
    "name": "Congo, Democratic Republic of the",
    "alpha2": "CD",
    "alpha3": "COD",
    "flag": "🇨🇩",
    "continent": "Africa"
  },
  {
    "name": "Cook Islands",
    "alpha2": "CK",
    "alpha3": "COK",
    "flag": "🇨🇰",
    "continent": "Oceania"
  },
  {
    "name": "Costa Rica",
    "alpha2": "CR",
    "alpha3": "CRI",
    "flag": "🇨🇷",
    "continent": "North America"
  },
  {
    "name": "Cote d'Ivoire",
    "alpha2": "CI",
    "alpha3": "CIV",
    "flag": "🇨🇮",
    "continent": "Africa"
  },
  {
    "name": "Croatia",
    "alpha2": "HR",
    "alpha3": "HRV",
    "flag": "🇭🇷",
    "continent": "Europe"
  },
  {
    "name": "Cuba",
    "alpha2": "CU",
    "alpha3": "CUB",
    "flag": "🇨🇺",
    "continent": "North America"
  },
  {
    "name": "Curacao",
    "alpha2": "CW",
    "alpha3": "CUW",
    "flag": "🇨🇼",
    "continent": "North America"
  },
  {
    "name": "Cyprus",
    "alpha2": "CY",
    "alpha3": "CYP",
    "flag": "🇨🇾",
    "continent": "Asia"
  },
  {
    "name": "Czechia",
    "alpha2": "CZ",
    "alpha3": "CZE",
    "flag": "🇨🇿",
    "continent": "Europe"
  },
  {
    "name": "Denmark",
    "alpha2": "DK",
    "alpha3": "DNK",
    "flag": "🇩🇰",
    "continent": "Europe"
  },
  {
    "name": "Djibouti",
    "alpha2": "DJ",
    "alpha3": "DJI",
    "flag": "🇩🇯",
    "continent": "Africa"
  },
  {
    "name": "Dominica",
    "alpha2": "DM",
    "alpha3": "DMA",
    "flag": "🇩🇲",
    "continent": "North America"
  },
  {
    "name": "Dominican Republic",
    "alpha2": "DO",
    "alpha3": "DOM",
    "flag": "🇩🇴",
    "continent": "North America"
  },
  {
    "name": "Ecuador",
    "alpha2": "EC",
    "alpha3": "ECU",
    "flag": "🇪🇨",
    "continent": "South America"
  },
  {
    "name": "Egypt",
    "alpha2": "EG",
    "alpha3": "EGY",
    "flag": "🇪🇬",
    "continent": "Africa"
  },
  {
    "name": "El Salvador",
    "alpha2": "SV",
    "alpha3": "SLV",
    "flag": "🇸🇻",
    "continent": "North America"
  },
  {
    "name": "Equatorial Guinea",
    "alpha2": "GQ",
    "alpha3": "GNQ",
    "flag": "🇬🇶",
    "continent": "Africa"
  },
  {
    "name": "Eritrea",
    "alpha2": "ER",
    "alpha3": "ERI",
    "flag": "🇪🇷",
    "continent": "Africa"
  },
  {
    "name": "Estonia",
    "alpha2": "EE",
    "alpha3": "EST",
    "flag": "🇪🇪",
    "continent": "Europe"
  },
  {
    "name": "Eswatini",
    "alpha2": "SZ",
    "alpha3": "SWZ",
    "flag": "🇸🇿",
    "continent": "Africa"
  },
  {
    "name": "Ethiopia",
    "alpha2": "ET",
    "alpha3": "ETH",
    "flag": "🇪🇹",
    "continent": "Africa"
  },
  {
    "name": "Falkland Islands (Malvinas)",
    "alpha2": "FK",
    "alpha3": "FLK",
    "flag": "🇫🇰",
    "continent": "South America"
  },
  {
    "name": "Faroe Islands",
    "alpha2": "FO",
    "alpha3": "FRO",
    "flag": "🇫🇴",
    "continent": "Europe"
  },
  {
    "name": "Fiji",
    "alpha2": "FJ",
    "alpha3": "FJI",
    "flag": "🇫🇯",
    "continent": "Oceania"
  },
  {
    "name": "Finland",
    "alpha2": "FI",
    "alpha3": "FIN",
    "flag": "🇫🇮",
    "continent": "Europe"
  },
  {
    "name": "France",
    "alpha2": "FR",
    "alpha3": "FRA",
    "flag": "🇫🇷",
    "continent": "Europe"
  },
  {
    "name": "French Guiana",
    "alpha2": "GF",
    "alpha3": "GUF",
    "flag": "🇬🇫",
    "continent": "South America"
  },
  {
    "name": "French Polynesia",
    "alpha2": "PF",
    "alpha3": "PYF",
    "flag": "🇵🇫",
    "continent": "Oceania"
  },
  {
    "name": "French Southern Territories",
    "alpha2": "TF",
    "alpha3": "ATF",
    "flag": "🇹🇫",
    "continent": "Antarctica"
  },
  {
    "name": "Gabon",
    "alpha2": "GA",
    "alpha3": "GAB",
    "flag": "🇬🇦",
    "continent": "Africa"
  },
  {
    "name": "Gambia",
    "alpha2": "GM",
    "alpha3": "GMB",
    "flag": "🇬🇲",
    "continent": "Africa"
  },
  {
    "name": "Georgia",
    "alpha2": "GE",
    "alpha3": "GEO",
    "flag": "🇬🇪",
    "continent": "Asia"
  },
  {
    "name": "Germany",
    "alpha2": "DE",
    "alpha3": "DEU",
    "flag": "🇩🇪",
    "continent": "Europe"
  },
  {
    "name": "Ghana",
    "alpha2": "GH",
    "alpha3": "GHA",
    "flag": "🇬🇭",
    "continent": "Africa"
  },
  {
    "name": "Gibraltar",
    "alpha2": "GI",
    "alpha3": "GIB",
    "flag": "🇬🇮",
    "continent": "Europe"
  },
  {
    "name": "Greece",
    "alpha2": "GR",
    "alpha3": "GRC",
    "flag": "🇬🇷",
    "continent": "Europe"
  },
  {
    "name": "Greenland",
    "alpha2": "GL",
    "alpha3": "GRL",
    "flag": "🇬🇱",
    "continent": "North America"
  },
  {
    "name": "Grenada",
    "alpha2": "GD",
    "alpha3": "GRD",
    "flag": "🇬🇩",
    "continent": "North America"
  },
  {
    "name": "Guadeloupe",
    "alpha2": "GP",
    "alpha3": "GLP",
    "flag": "🇬🇵",
    "continent": "North America"
  },
  {
    "name": "Guam",
    "alpha2": "GU",
    "alpha3": "GUM",
    "flag": "🇬🇺",
    "continent": "Oceania"
  },
  {
    "name": "Guatemala",
    "alpha2": "GT",
    "alpha3": "GTM",
    "flag": "🇬🇹",
    "continent": "North America"
  },
  {
    "name": "Guernsey",
    "alpha2": "GG",
    "alpha3": "GGY",
    "flag": "🇬🇬",
    "continent": "Europe"
  },
  {
    "name": "Guinea",
    "alpha2": "GN",
    "alpha3": "GIN",
    "flag": "🇬🇳",
    "continent": "Africa"
  },
  {
    "name": "Guinea-Bissau",
    "alpha2": "GW",
    "alpha3": "GNB",
    "flag": "🇬🇼",
    "continent": "Africa"
  },
  {
    "name": "Guyana",
    "alpha2": "GY",
    "alpha3": "GUY",
    "flag": "🇬🇾",
    "continent": "South America"
  },
  {
    "name": "Haiti",
    "alpha2": "HT",
    "alpha3": "HTI",
    "flag": "🇭🇹",
    "continent": "North America"
  },
  {
    "name": "Heard Island and McDonald Islands",
    "alpha2": "HM",
    "alpha3": "HMD",
    "flag": "🇭🇲",
    "continent": "Antarctica"
  },
  {
    "name": "Holy See",
    "alpha2": "VA",
    "alpha3": "VAT",
    "flag": "🇻🇦",
    "continent": "Europe"
  },
  {
    "name": "Honduras",
    "alpha2": "HN",
    "alpha3": "HND",
    "flag": "🇭🇳",
    "continent": "North America"
  },
  {
    "name": "Hong Kong",
    "alpha2": "HK",
    "alpha3": "HKG",
    "flag": "🇭🇰",
    "continent": "Asia"
  },
  {
    "name": "Hungary",
    "alpha2": "HU",
    "alpha3": "HUN",
    "flag": "🇭🇺",
    "continent": "Europe"
  },
  {
    "name": "Iceland",
    "alpha2": "IS",
    "alpha3": "ISL",
    "flag": "🇮🇸",
    "continent": "Europe"
  },
  {
    "name": "India",
    "alpha2": "IN",
    "alpha3": "IND",
    "flag": "🇮🇳",
    "continent": "Asia"
  },
  {
    "name": "Indonesia",
    "alpha2": "ID",
    "alpha3": "IDN",
    "flag": "🇮🇩",
    "continent": "Asia"
  },
  {
    "name": "Iran, Islamic Republic of",
    "alpha2": "IR",
    "alpha3": "IRN",
    "flag": "🇮🇷",
    "continent": "Asia"
  },
  {
    "name": "Iraq",
    "alpha2": "IQ",
    "alpha3": "IRQ",
    "flag": "🇮🇶",
    "continent": "Asia"
  },
  {
    "name": "Ireland",
    "alpha2": "IE",
    "alpha3": "IRL",
    "flag": "🇮🇪",
    "continent": "Europe"
  },
  {
    "name": "Isle of Man",
    "alpha2": "IM",
    "alpha3": "IMN",
    "flag": "🇮🇲",
    "continent": "Europe"
  },
  {
    "name": "Israel",
    "alpha2": "IL",
    "alpha3": "ISR",
    "flag": "🇮🇱",
    "continent": "Asia"
  },
  {
    "name": "Italy",
    "alpha2": "IT",
    "alpha3": "ITA",
    "flag": "🇮🇹",
    "continent": "Europe"
  },
  {
    "name": "Jamaica",
    "alpha2": "JM",
    "alpha3": "JAM",
    "flag": "🇯🇲",
    "continent": "North America"
  },
  {
    "name": "Japan",
    "alpha2": "JP",
    "alpha3": "JPN",
    "flag": "🇯🇵",
    "continent": "Asia"
  },
  {
    "name": "Jersey",
    "alpha2": "JE",
    "alpha3": "JEY",
    "flag": "🇯🇪",
    "continent": "Europe"
  },
  {
    "name": "Jordan",
    "alpha2": "JO",
    "alpha3": "JOR",
    "flag": "🇯🇴",
    "continent": "Asia"
  },
  {
    "name": "Kazakhstan",
    "alpha2": "KZ",
    "alpha3": "KAZ",
    "flag": "🇰🇿",
    "continent": "Asia"
  },
  {
    "name": "Kenya",
    "alpha2": "KE",
    "alpha3": "KEN",
    "flag": "🇰🇪",
    "continent": "Africa"
  },
  {
    "name": "Kiribati",
    "alpha2": "KI",
    "alpha3": "KIR",
    "flag": "🇰🇮",
    "continent": "Oceania"
  },
  {
    "name": "Korea, Democratic People's Republic of",
    "alpha2": "KP",
    "alpha3": "PRK",
    "flag": "🇰🇵",
    "continent": "Asia"
  },
  {
    "name": "Korea, Republic of",
    "alpha2": "KR",
    "alpha3": "KOR",
    "flag": "🇰🇷",
    "continent": "Asia"
  },
  {
    "name": "Kuwait",
    "alpha2": "KW",
    "alpha3": "KWT",
    "flag": "🇰🇼",
    "continent": "Asia"
  },
  {
    "name": "Kyrgyzstan",
    "alpha2": "KG",
    "alpha3": "KGZ",
    "flag": "🇰🇬",
    "continent": "Asia"
  },
  {
    "name": "Lao People's Democratic Republic",
    "alpha2": "LA",
    "alpha3": "LAO",
    "flag": "🇱🇦",
    "continent": "Asia"
  },
  {
    "name": "Latvia",
    "alpha2": "LV",
    "alpha3": "LVA",
    "flag": "🇱🇻",
    "continent": "Europe"
  },
  {
    "name": "Lebanon",
    "alpha2": "LB",
    "alpha3": "LBN",
    "flag": "🇱🇧",
    "continent": "Asia"
  },
  {
    "name": "Lesotho",
    "alpha2": "LS",
    "alpha3": "LSO",
    "flag": "🇱🇸",
    "continent": "Africa"
  },
  {
    "name": "Liberia",
    "alpha2": "LR",
    "alpha3": "LBR",
    "flag": "🇱🇷",
    "continent": "Africa"
  },
  {
    "name": "Libya",
    "alpha2": "LY",
    "alpha3": "LBY",
    "flag": "🇱🇾",
    "continent": "Africa"
  },
  {
    "name": "Liechtenstein",
    "alpha2": "LI",
    "alpha3": "LIE",
    "flag": "🇱🇮",
    "continent": "Europe"
  },
  {
    "name": "Lithuania",
    "alpha2": "LT",
    "alpha3": "LTU",
    "flag": "🇱🇹",
    "continent": "Europe"
  },
  {
    "name": "Luxembourg",
    "alpha2": "LU",
    "alpha3": "LUX",
    "flag": "🇱🇺",
    "continent": "Europe"
  },
  {
    "name": "Macao",
    "alpha2": "MO",
    "alpha3": "MAC",
    "flag": "🇲🇴",
    "continent": "Asia"
  },
  {
    "name": "Madagascar",
    "alpha2": "MG",
    "alpha3": "MDG",
    "flag": "🇲🇬",
    "continent": "Africa"
  },
  {
    "name": "Malawi",
    "alpha2": "MW",
    "alpha3": "MWI",
    "flag": "🇲🇼",
    "continent": "Africa"
  },
  {
    "name": "Malaysia",
    "alpha2": "MY",
    "alpha3": "MYS",
    "flag": "🇲🇾",
    "continent": "Asia"
  },
  {
    "name": "Maldives",
    "alpha2": "MV",
    "alpha3": "MDV",
    "flag": "🇲🇻",
    "continent": "Asia"
  },
  {
    "name": "Mali",
    "alpha2": "ML",
    "alpha3": "MLI",
    "flag": "🇲🇱",
    "continent": "Africa"
  },
  {
    "name": "Malta",
    "alpha2": "MT",
    "alpha3": "MLT",
    "flag": "🇲🇹",
    "continent": "Europe"
  },
  {
    "name": "Marshall Islands",
    "alpha2": "MH",
    "alpha3": "MHL",
    "flag": "🇲🇭",
    "continent": "Oceania"
  },
  {
    "name": "Martinique",
    "alpha2": "MQ",
    "alpha3": "MTQ",
    "flag": "🇲🇶",
    "continent": "North America"
  },
  {
    "name": "Mauritania",
    "alpha2": "MR",
    "alpha3": "MRT",
    "flag": "🇲🇷",
    "continent": "Africa"
  },
  {
    "name": "Mauritius",
    "alpha2": "MU",
    "alpha3": "MUS",
    "flag": "🇲🇺",
    "continent": "Africa"
  },
  {
    "name": "Mayotte",
    "alpha2": "YT",
    "alpha3": "MYT",
    "flag": "🇾🇹",
    "continent": "Africa"
  },
  {
    "name": "Mexico",
    "alpha2": "MX",
    "alpha3": "MEX",
    "flag": "🇲🇽",
    "continent": "North America"
  },
  {
    "name": "Micronesia, Federated States of",
    "alpha2": "FM",
    "alpha3": "FSM",
    "flag": "🇫🇲",
    "continent": "Oceania"
  },
  {
    "name": "Moldova, Republic of",
    "alpha2": "MD",
    "alpha3": "MDA",
    "flag": "🇲🇩",
    "continent": "Europe"
  },
  {
    "name": "Monaco",
    "alpha2": "MC",
    "alpha3": "MCO",
    "flag": "🇲🇨",
    "continent": "Europe"
  },
  {
    "name": "Mongolia",
    "alpha2": "MN",
    "alpha3": "MNG",
    "flag": "🇲🇳",
    "continent": "Asia"
  },
  {
    "name": "Montenegro",
    "alpha2": "ME",
    "alpha3": "MNE",
    "flag": "🇲🇪",
    "continent": "Europe"
  },
  {
    "name": "Montserrat",
    "alpha2": "MS",
    "alpha3": "MSR",
    "flag": "🇲🇸",
    "continent": "North America"
  },
  {
    "name": "Morocco",
    "alpha2": "MA",
    "alpha3": "MAR",
    "flag": "🇲🇦",
    "continent": "Africa"
  },
  {
    "name": "Mozambique",
    "alpha2": "MZ",
    "alpha3": "MOZ",
    "flag": "🇲🇿",
    "continent": "Africa"
  },
  {
    "name": "Myanmar",
    "alpha2": "MM",
    "alpha3": "MMR",
    "flag": "🇲🇲",
    "continent": "Asia"
  },
  {
    "name": "Namibia",
    "alpha2": "NA",
    "alpha3": "NAM",
    "flag": "🇳🇦",
    "continent": "Africa"
  },
  {
    "name": "Nauru",
    "alpha2": "NR",
    "alpha3": "NRU",
    "flag": "🇳🇷",
    "continent": "Oceania"
  },
  {
    "name": "Nepal",
    "alpha2": "NP",
    "alpha3": "NPL",
    "flag": "🇳🇵",
    "continent": "Asia"
  },
  {
    "name": "Netherlands, Kingdom of the",
    "alpha2": "NL",
    "alpha3": "NLD",
    "flag": "🇳🇱",
    "continent": "Europe"
  },
  {
    "name": "New Caledonia",
    "alpha2": "NC",
    "alpha3": "NCL",
    "flag": "🇳🇨",
    "continent": "Oceania"
  },
  {
    "name": "New Zealand",
    "alpha2": "NZ",
    "alpha3": "NZL",
    "flag": "🇳🇿",
    "continent": "Oceania"
  },
  {
    "name": "Nicaragua",
    "alpha2": "NI",
    "alpha3": "NIC",
    "flag": "🇳🇮",
    "continent": "North America"
  },
  {
    "name": "Niger",
    "alpha2": "NE",
    "alpha3": "NER",
    "flag": "🇳🇪",
    "continent": "Africa"
  },
  {
    "name": "Nigeria",
    "alpha2": "NG",
    "alpha3": "NGA",
    "flag": "🇳🇬",
    "continent": "Africa"
  },
  {
    "name": "Niue",
    "alpha2": "NU",
    "alpha3": "NIU",
    "flag": "🇳🇺",
    "continent": "Oceania"
  },
  {
    "name": "Norfolk Island",
    "alpha2": "NF",
    "alpha3": "NFK",
    "flag": "🇳🇫",
    "continent": "Oceania"
  },
  {
    "name": "North Macedonia",
    "alpha2": "MK",
    "alpha3": "MKD",
    "flag": "🇲🇰",
    "continent": "Europe"
  },
  {
    "name": "Northern Mariana Islands",
    "alpha2": "MP",
    "alpha3": "MNP",
    "flag": "🇲🇵",
    "continent": "Oceania"
  },
  {
    "name": "Norway",
    "alpha2": "NO",
    "alpha3": "NOR",
    "flag": "🇳🇴",
    "continent": "Europe"
  },
  {
    "name": "Oman",
    "alpha2": "OM",
    "alpha3": "OMN",
    "flag": "🇴🇲",
    "continent": "Asia"
  },
  {
    "name": "Pakistan",
    "alpha2": "PK",
    "alpha3": "PAK",
    "flag": "🇵🇰",
    "continent": "Asia"
  },
  {
    "name": "Palau",
    "alpha2": "PW",
    "alpha3": "PLW",
    "flag": "🇵🇼",
    "continent": "Oceania"
  },
  {
    "name": "Palestine, State of",
    "alpha2": "PS",
    "alpha3": "PSE",
    "flag": "🇵🇸",
    "continent": "Asia"
  },
  {
    "name": "Panama",
    "alpha2": "PA",
    "alpha3": "PAN",
    "flag": "🇵🇦",
    "continent": "North America"
  },
  {
    "name": "Papua New Guinea",
    "alpha2": "PG",
    "alpha3": "PNG",
    "flag": "🇵🇬",
    "continent": "Oceania"
  },
  {
    "name": "Paraguay",
    "alpha2": "PY",
    "alpha3": "PRY",
    "flag": "🇵🇾",
    "continent": "South America"
  },
  {
    "name": "Peru",
    "alpha2": "PE",
    "alpha3": "PER",
    "flag": "🇵🇪",
    "continent": "South America"
  },
  {
    "name": "Philippines",
    "alpha2": "PH",
    "alpha3": "PHL",
    "flag": "🇵🇭",
    "continent": "Asia"
  },
  {
    "name": "Pitcairn",
    "alpha2": "PN",
    "alpha3": "PCN",
    "flag": "🇵🇳",
    "continent": "Oceania"
  },
  {
    "name": "Poland",
    "alpha2": "PL",
    "alpha3": "POL",
    "flag": "🇵🇱",
    "continent": "Europe"
  },
  {
    "name": "Portugal",
    "alpha2": "PT",
    "alpha3": "PRT",
    "flag": "🇵🇹",
    "continent": "Europe"
  },
  {
    "name": "Puerto Rico",
    "alpha2": "PR",
    "alpha3": "PRI",
    "flag": "🇵🇷",
    "continent": "North America"
  },
  {
    "name": "Qatar",
    "alpha2": "QA",
    "alpha3": "QAT",
    "flag": "🇶🇦",
    "continent": "Asia"
  },
  {
    "name": "Reunion",
    "alpha2": "RE",
    "alpha3": "REU",
    "flag": "🇷🇪",
    "continent": "Africa"
  },
  {
    "name": "Romania",
    "alpha2": "RO",
    "alpha3": "ROU",
    "flag": "🇷🇴",
    "continent": "Europe"
  },
  {
    "name": "Russian Federation",
    "alpha2": "RU",
    "alpha3": "RUS",
    "flag": "🇷🇺",
    "continent": "Europe"
  },
  {
    "name": "Rwanda",
    "alpha2": "RW",
    "alpha3": "RWA",
    "flag": "🇷🇼",
    "continent": "Africa"
  },
  {
    "name": "Saint Barthelemy",
    "alpha2": "BL",
    "alpha3": "BLM",
    "flag": "🇧🇱",
    "continent": "North America"
  },
  {
    "name": "Saint Helena, Ascension and Tristan da Cunha",
    "alpha2": "SH",
    "alpha3": "SHN",
    "flag": "🇸🇭",
    "continent": "Africa"
  },
  {
    "name": "Saint Kitts and Nevis",
    "alpha2": "KN",
    "alpha3": "KNA",
    "flag": "🇰🇳",
    "continent": "North America"
  },
  {
    "name": "Saint Lucia",
    "alpha2": "LC",
    "alpha3": "LCA",
    "flag": "🇱🇨",
    "continent": "North America"
  },
  {
    "name": "Saint Martin (French part)",
    "alpha2": "MF",
    "alpha3": "MAF",
    "flag": "🇲🇫",
    "continent": "North America"
  },
  {
    "name": "Saint Pierre and Miquelon",
    "alpha2": "PM",
    "alpha3": "SPM",
    "flag": "🇵🇲",
    "continent": "North America"
  },
  {
    "name": "Saint Vincent and the Grenadines",
    "alpha2": "VC",
    "alpha3": "VCT",
    "flag": "🇻🇨",
    "continent": "North America"
  },
  {
    "name": "Samoa",
    "alpha2": "WS",
    "alpha3": "WSM",
    "flag": "🇼🇸",
    "continent": "Oceania"
  },
  {
    "name": "San Marino",
    "alpha2": "SM",
    "alpha3": "SMR",
    "flag": "🇸🇲",
    "continent": "Europe"
  },
  {
    "name": "Sao Tome and Principe",
    "alpha2": "ST",
    "alpha3": "STP",
    "flag": "🇸🇹",
    "continent": "Africa"
  },
  {
    "name": "Saudi Arabia",
    "alpha2": "SA",
    "alpha3": "SAU",
    "flag": "🇸🇦",
    "continent": "Asia"
  },
  {
    "name": "Senegal",
    "alpha2": "SN",
    "alpha3": "SEN",
    "flag": "🇸🇳",
    "continent": "Africa"
  },
  {
    "name": "Serbia",
    "alpha2": "RS",
    "alpha3": "SRB",
    "flag": "🇷🇸",
    "continent": "Europe"
  },
  {
    "name": "Seychelles",
    "alpha2": "SC",
    "alpha3": "SYC",
    "flag": "🇸🇨",
    "continent": "Africa"
  },
  {
    "name": "Sierra Leone",
    "alpha2": "SL",
    "alpha3": "SLE",
    "flag": "🇸🇱",
    "continent": "Africa"
  },
  {
    "name": "Singapore",
    "alpha2": "SG",
    "alpha3": "SGP",
    "flag": "🇸🇬",
    "continent": "Asia"
  },
  {
    "name": "Sint Maarten (Dutch part)",
    "alpha2": "SX",
    "alpha3": "SXM",
    "flag": "🇸🇽",
    "continent": "North America"
  },
  {
    "name": "Slovakia",
    "alpha2": "SK",
    "alpha3": "SVK",
    "flag": "🇸🇰",
    "continent": "Europe"
  },
  {
    "name": "Slovenia",
    "alpha2": "SI",
    "alpha3": "SVN",
    "flag": "🇸🇮",
    "continent": "Europe"
  },
  {
    "name": "Solomon Islands",
    "alpha2": "SB",
    "alpha3": "SLB",
    "flag": "🇸🇧",
    "continent": "Oceania"
  },
  {
    "name": "Somalia",
    "alpha2": "SO",
    "alpha3": "SOM",
    "flag": "🇸🇴",
    "continent": "Africa"
  },
  {
    "name": "South Africa",
    "alpha2": "ZA",
    "alpha3": "ZAF",
    "flag": "🇿🇦",
    "continent": "Africa"
  },
  {
    "name": "South Georgia and the South Sandwich Islands",
    "alpha2": "GS",
    "alpha3": "SGS",
    "flag": "🇬🇸",
    "continent": "Antarctica"
  },
  {
    "name": "South Sudan",
    "alpha2": "SS",
    "alpha3": "SSD",
    "flag": "🇸🇸",
    "continent": "Africa"
  },
  {
    "name": "Spain",
    "alpha2": "ES",
    "alpha3": "ESP",
    "flag": "🇪🇸",
    "continent": "Europe"
  },
  {
    "name": "Sri Lanka",
    "alpha2": "LK",
    "alpha3": "LKA",
    "flag": "🇱🇰",
    "continent": "Asia"
  },
  {
    "name": "Sudan",
    "alpha2": "SD",
    "alpha3": "SDN",
    "flag": "🇸🇩",
    "continent": "Africa"
  },
  {
    "name": "Suriname",
    "alpha2": "SR",
    "alpha3": "SUR",
    "flag": "🇸🇷",
    "continent": "South America"
  },
  {
    "name": "Svalbard and Jan Mayen",
    "alpha2": "SJ",
    "alpha3": "SJM",
    "flag": "🇸🇯",
    "continent": "Europe"
  },
  {
    "name": "Sweden",
    "alpha2": "SE",
    "alpha3": "SWE",
    "flag": "🇸🇪",
    "continent": "Europe"
  },
  {
    "name": "Switzerland",
    "alpha2": "CH",
    "alpha3": "CHE",
    "flag": "🇨🇭",
    "continent": "Europe"
  },
  {
    "name": "Syrian Arab Republic",
    "alpha2": "SY",
    "alpha3": "SYR",
    "flag": "🇸🇾",
    "continent": "Asia"
  },
  {
    "name": "Taiwan, Province of China",
    "alpha2": "TW",
    "alpha3": "TWN",
    "flag": "🇹🇼",
    "continent": "Asia"
  },
  {
    "name": "Tajikistan",
    "alpha2": "TJ",
    "alpha3": "TJK",
    "flag": "🇹🇯",
    "continent": "Asia"
  },
  {
    "name": "Tanzania, United Republic of",
    "alpha2": "TZ",
    "alpha3": "TZA",
    "flag": "🇹🇿",
    "continent": "Africa"
  },
  {
    "name": "Thailand",
    "alpha2": "TH",
    "alpha3": "THA",
    "flag": "🇹🇭",
    "continent": "Asia"
  },
  {
    "name": "Timor-Leste",
    "alpha2": "TL",
    "alpha3": "TLS",
    "flag": "🇹🇱",
    "continent": "Asia"
  },
  {
    "name": "Togo",
    "alpha2": "TG",
    "alpha3": "TGO",
    "flag": "🇹🇬",
    "continent": "Africa"
  },
  {
    "name": "Tokelau",
    "alpha2": "TK",
    "alpha3": "TKL",
    "flag": "🇹🇰",
    "continent": "Oceania"
  },
  {
    "name": "Tonga",
    "alpha2": "TO",
    "alpha3": "TON",
    "flag": "🇹🇴",
    "continent": "Oceania"
  },
  {
    "name": "Trinidad and Tobago",
    "alpha2": "TT",
    "alpha3": "TTO",
    "flag": "🇹🇹",
    "continent": "North America"
  },
  {
    "name": "Tunisia",
    "alpha2": "TN",
    "alpha3": "TUN",
    "flag": "🇹🇳",
    "continent": "Africa"
  },
  {
    "name": "Turkiye",
    "alpha2": "TR",
    "alpha3": "TUR",
    "flag": "🇹🇷",
    "continent": "Asia"
  },
  {
    "name": "Turkmenistan",
    "alpha2": "TM",
    "alpha3": "TKM",
    "flag": "🇹🇲",
    "continent": "Asia"
  },
  {
    "name": "Turks and Caicos Islands",
    "alpha2": "TC",
    "alpha3": "TCA",
    "flag": "🇹🇨",
    "continent": "North America"
  },
  {
    "name": "Tuvalu",
    "alpha2": "TV",
    "alpha3": "TUV",
    "flag": "🇹🇻",
    "continent": "Oceania"
  },
  {
    "name": "Uganda",
    "alpha2": "UG",
    "alpha3": "UGA",
    "flag": "🇺🇬",
    "continent": "Africa"
  },
  {
    "name": "Ukraine",
    "alpha2": "UA",
    "alpha3": "UKR",
    "flag": "🇺🇦",
    "continent": "Europe"
  },
  {
    "name": "United Arab Emirates",
    "alpha2": "AE",
    "alpha3": "ARE",
    "flag": "🇦🇪",
    "continent": "Asia"
  },
  {
    "name": "United Kingdom",
    "alpha2": "GB",
    "alpha3": "GBR",
    "flag": "🇬🇧",
    "continent": "Europe"
  },
  {
    "name": "United States Minor Outlying Islands",
    "alpha2": "UM",
    "alpha3": "UMI",
    "flag": "🇺🇲",
    "continent": "Oceania"
  },
  {
    "name": "United States of America",
    "alpha2": "US",
    "alpha3": "USA",
    "flag": "🇺🇸",
    "continent": "North America"
  },
  {
    "name": "Uruguay",
    "alpha2": "UY",
    "alpha3": "URY",
    "flag": "🇺🇾",
    "continent": "South America"
  },
  {
    "name": "Uzbekistan",
    "alpha2": "UZ",
    "alpha3": "UZB",
    "flag": "🇺🇿",
    "continent": "Asia"
  },
  {
    "name": "Vanuatu",
    "alpha2": "VU",
    "alpha3": "VUT",
    "flag": "🇻🇺",
    "continent": "Oceania"
  },
  {
    "name": "Venezuela, Bolivarian Republic of",
    "alpha2": "VE",
    "alpha3": "VEN",
    "flag": "🇻🇪",
    "continent": "South America"
  },
  {
    "name": "Viet Nam",
    "alpha2": "VN",
    "alpha3": "VNM",
    "flag": "🇻🇳",
    "continent": "Asia"
  },
  {
    "name": "Virgin Islands (British)",
    "alpha2": "VG",
    "alpha3": "VGB",
    "flag": "🇻🇬",
    "continent": "North America"
  },
  {
    "name": "Virgin Islands (U.S.)",
    "alpha2": "VI",
    "alpha3": "VIR",
    "flag": "🇻🇮",
    "continent": "North America"
  },
  {
    "name": "Wallis and Futuna",
    "alpha2": "WF",
    "alpha3": "WLF",
    "flag": "🇼🇫",
    "continent": "Oceania"
  },
  {
    "name": "Western Sahara",
    "alpha2": "EH",
    "alpha3": "ESH",
    "flag": "🇪🇭",
    "continent": "Africa"
  },
  {
    "name": "Yemen",
    "alpha2": "YE",
    "alpha3": "YEM",
    "flag": "🇾🇪",
    "continent": "Asia"
  },
  {
    "name": "Zambia",
    "alpha2": "ZM",
    "alpha3": "ZMB",
    "flag": "🇿🇲",
    "continent": "Africa"
  },
  {
    "name": "Zimbabwe",
    "alpha2": "ZW",
    "alpha3": "ZWE",
    "flag": "🇿🇼",
    "continent": "Africa"
  }
] as const;

export const COUNTRY_NAMES: readonly string[] = COUNTRIES.map((country) => country.name);

export function findCountryByName(name: string): Country | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  return COUNTRIES.find((country) => country.name === trimmed);
}

export function findCountryByAlpha2(code: string): Country | undefined {
  const upper = code.trim().toUpperCase();
  if (!upper) return undefined;
  return COUNTRIES.find((country) => country.alpha2 === upper);
}

export function isValidCountryName(name: string): boolean {
  return Boolean(findCountryByName(name));
}

export function formatCountryLabel(country: Country): string {
  return `${country.flag} ${country.name}`;
}

export function getCountrySelectOptions(): {
  value: string;
  label: string;
  searchText: string;
}[] {
  return COUNTRIES.map((country) => ({
    value: country.name,
    label: formatCountryLabel(country),
    searchText: [country.name, country.alpha2, country.alpha3, country.continent].join(" "),
  }));
}
