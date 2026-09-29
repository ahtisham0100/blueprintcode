/* Options for the enquiry form's Country and Time zone dropdowns. The two
   choices are joined into the single `location` field on submit
   ("United Kingdom, GMT+00:00"), so the API and admin email are unchanged. */

export const COUNTRIES: string[] = [
  'Afghanistan', 'Åland Islands', 'Albania', 'Algeria', 'American Samoa', 'Andorra', 'Angola', 'Anguilla',
  'Antarctica', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Aruba', 'Australia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bermuda', 'Bhutan',
  'Bolivia', 'Bonaire, Sint Eustatius and Saba', 'Bosnia and Herzegovina', 'Botswana', 'Bouvet Island', 'Brazil',
  'British Indian Ocean Territory', 'British Virgin Islands', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Cayman Islands', 'Central African Republic', 'Chad', 'Chile',
  'China', 'Christmas Island', 'Cocos (Keeling) Islands', 'Colombia', 'Comoros', 'Congo', 'Congo (DRC)',
  'Cook Islands', 'Costa Rica', 'Côte d’Ivoire', 'Croatia', 'Cuba', 'Curaçao', 'Cyprus', 'Czechia', 'Denmark',
  'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea',
  'Estonia', 'Eswatini', 'Ethiopia', 'Falkland Islands', 'Faroe Islands', 'Fiji', 'Finland', 'France',
  'French Guiana', 'French Polynesia', 'French Southern Territories', 'Gabon', 'Gambia', 'Georgia', 'Germany',
  'Ghana', 'Gibraltar', 'Greece', 'Greenland', 'Grenada', 'Guadeloupe', 'Guam', 'Guatemala', 'Guernsey', 'Guinea',
  'Guinea-Bissau', 'Guyana', 'Haiti', 'Heard Island and McDonald Islands', 'Honduras', 'Hong Kong', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Isle of Man', 'Israel', 'Italy', 'Jamaica', 'Japan',
  'Jersey', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia',
  'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macao', 'Madagascar',
  'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Martinique', 'Mauritania', 'Mauritius',
  'Mayotte', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Montserrat', 'Morocco',
  'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Caledonia', 'New Zealand', 'Nicaragua',
  'Niger', 'Nigeria', 'Niue', 'Norfolk Island', 'North Korea', 'North Macedonia', 'Northern Mariana Islands',
  'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
  'Philippines', 'Pitcairn Islands', 'Poland', 'Portugal', 'Puerto Rico', 'Qatar', 'Réunion', 'Romania', 'Russia',
  'Rwanda', 'Saint Barthélemy', 'Saint Helena, Ascension and Tristan da Cunha', 'Saint Kitts and Nevis',
  'Saint Lucia', 'Saint Martin', 'Saint Pierre and Miquelon', 'Saint Vincent and the Grenadines', 'Samoa',
  'San Marino', 'São Tomé and Príncipe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone',
  'Singapore', 'Sint Maarten', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
  'South Georgia and the South Sandwich Islands', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan',
  'Suriname', 'Svalbard and Jan Mayen', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
  'Thailand', 'Timor-Leste', 'Togo', 'Tokelau', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Türkiye',
  'Turkmenistan', 'Turks and Caicos Islands', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'United States Minor Outlying Islands', 'Uruguay', 'US Virgin Islands',
  'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Wallis and Futuna', 'Western Sahara', 'Yemen',
  'Zambia', 'Zimbabwe',
];

/* Every UTC offset in use across the year, with a few places on each as a guide. */
export const GMT_OFFSETS: { value: string; places: string }[] = [
  { value: 'GMT−12:00', places: 'Baker Island' },
  { value: 'GMT−11:00', places: 'American Samoa, Niue' },
  { value: 'GMT−10:00', places: 'Hawaii, Cook Islands' },
  { value: 'GMT−09:30', places: 'Marquesas Islands' },
  { value: 'GMT−09:00', places: 'Alaska' },
  { value: 'GMT−08:00', places: 'Los Angeles, Vancouver, Tijuana' },
  { value: 'GMT−07:00', places: 'Denver, Phoenix, Calgary' },
  { value: 'GMT−06:00', places: 'Chicago, Mexico City, Central America' },
  { value: 'GMT−05:00', places: 'New York, Toronto, Bogotá, Lima' },
  { value: 'GMT−04:00', places: 'Halifax, Caracas, Santiago, Caribbean' },
  { value: 'GMT−03:30', places: 'Newfoundland' },
  { value: 'GMT−03:00', places: 'São Paulo, Buenos Aires, Montevideo' },
  { value: 'GMT−02:30', places: 'Newfoundland (summer)' },
  { value: 'GMT−02:00', places: 'South Georgia, Greenland (Nuuk)' },
  { value: 'GMT−01:00', places: 'Azores, Cabo Verde' },
  { value: 'GMT+00:00', places: 'London, Dublin, Lisbon, Accra' },
  { value: 'GMT+01:00', places: 'Paris, Berlin, Madrid, Lagos' },
  { value: 'GMT+02:00', places: 'Athens, Helsinki, Cairo, Johannesburg' },
  { value: 'GMT+03:00', places: 'Istanbul, Moscow, Riyadh, Nairobi' },
  { value: 'GMT+03:30', places: 'Tehran' },
  { value: 'GMT+04:00', places: 'Dubai, Baku, Mauritius' },
  { value: 'GMT+04:30', places: 'Kabul' },
  { value: 'GMT+05:00', places: 'Karachi, Tashkent, Maldives' },
  { value: 'GMT+05:30', places: 'India, Sri Lanka' },
  { value: 'GMT+05:45', places: 'Nepal' },
  { value: 'GMT+06:00', places: 'Dhaka, Almaty, Bishkek' },
  { value: 'GMT+06:30', places: 'Yangon, Cocos Islands' },
  { value: 'GMT+07:00', places: 'Bangkok, Jakarta, Ho Chi Minh City' },
  { value: 'GMT+08:00', places: 'Singapore, Hong Kong, Beijing, Perth' },
  { value: 'GMT+08:45', places: 'Eucla' },
  { value: 'GMT+09:00', places: 'Tokyo, Seoul' },
  { value: 'GMT+09:30', places: 'Adelaide, Darwin' },
  { value: 'GMT+10:00', places: 'Sydney, Melbourne, Brisbane, Guam' },
  { value: 'GMT+10:30', places: 'Lord Howe Island' },
  { value: 'GMT+11:00', places: 'Solomon Islands, New Caledonia' },
  { value: 'GMT+12:00', places: 'Auckland, Fiji' },
  { value: 'GMT+12:45', places: 'Chatham Islands' },
  { value: 'GMT+13:00', places: 'Tonga, Samoa, Auckland (summer)' },
  { value: 'GMT+13:45', places: 'Chatham Islands (summer)' },
  { value: 'GMT+14:00', places: 'Kiribati (Line Islands)' },
];

/* The visitor's current offset as one of the GMT_OFFSETS values. */
export function browserGmtOffset(): string {
  const mins = -new Date().getTimezoneOffset();
  const abs = Math.abs(mins);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `GMT${mins < 0 ? '−' : '+'}${hh}:${mm}`;
}

/* Each country's IANA time zone(s); the first is its default. Countries that
   span several zones list the others so a visitor already in one of them
   keeps their own offset (Chicago → United States stays on Central time). */
export const COUNTRY_ZONES: Record<string, string[]> = {
  'Afghanistan': ['Asia/Kabul'], 'Åland Islands': ['Europe/Mariehamn'], 'Albania': ['Europe/Tirane'],
  'Algeria': ['Africa/Algiers'], 'American Samoa': ['Pacific/Pago_Pago'], 'Andorra': ['Europe/Andorra'],
  'Angola': ['Africa/Luanda'], 'Anguilla': ['America/Anguilla'],
  'Antarctica': ['Antarctica/McMurdo', 'Antarctica/Casey', 'Antarctica/Davis', 'Antarctica/Mawson', 'Antarctica/Palmer', 'Antarctica/Rothera', 'Antarctica/Syowa', 'Antarctica/Troll', 'Antarctica/Vostok'],
  'Antigua and Barbuda': ['America/Antigua'], 'Argentina': ['America/Argentina/Buenos_Aires'],
  'Armenia': ['Asia/Yerevan'], 'Aruba': ['America/Aruba'],
  'Australia': ['Australia/Sydney', 'Australia/Brisbane', 'Australia/Adelaide', 'Australia/Darwin', 'Australia/Perth', 'Australia/Eucla', 'Australia/Lord_Howe'],
  'Austria': ['Europe/Vienna'], 'Azerbaijan': ['Asia/Baku'], 'Bahamas': ['America/Nassau'], 'Bahrain': ['Asia/Bahrain'],
  'Bangladesh': ['Asia/Dhaka'], 'Barbados': ['America/Barbados'], 'Belarus': ['Europe/Minsk'],
  'Belgium': ['Europe/Brussels'], 'Belize': ['America/Belize'], 'Benin': ['Africa/Porto-Novo'],
  'Bermuda': ['Atlantic/Bermuda'], 'Bhutan': ['Asia/Thimphu'], 'Bolivia': ['America/La_Paz'],
  'Bonaire, Sint Eustatius and Saba': ['America/Kralendijk'], 'Bosnia and Herzegovina': ['Europe/Sarajevo'],
  'Botswana': ['Africa/Gaborone'], 'Bouvet Island': ['Europe/Oslo'],
  'Brazil': ['America/Sao_Paulo', 'America/Manaus', 'America/Rio_Branco', 'America/Noronha'],
  'British Indian Ocean Territory': ['Indian/Chagos'], 'British Virgin Islands': ['America/Tortola'],
  'Brunei': ['Asia/Brunei'], 'Bulgaria': ['Europe/Sofia'], 'Burkina Faso': ['Africa/Ouagadougou'],
  'Burundi': ['Africa/Bujumbura'], 'Cabo Verde': ['Atlantic/Cape_Verde'], 'Cambodia': ['Asia/Phnom_Penh'],
  'Cameroon': ['Africa/Douala'],
  'Canada': ['America/Toronto', 'America/Vancouver', 'America/Edmonton', 'America/Winnipeg', 'America/Regina', 'America/Halifax', 'America/St_Johns'],
  'Cayman Islands': ['America/Cayman'], 'Central African Republic': ['Africa/Bangui'], 'Chad': ['Africa/Ndjamena'],
  'Chile': ['America/Santiago', 'Pacific/Easter'], 'China': ['Asia/Shanghai'], 'Christmas Island': ['Indian/Christmas'],
  'Cocos (Keeling) Islands': ['Indian/Cocos'], 'Colombia': ['America/Bogota'], 'Comoros': ['Indian/Comoro'],
  'Congo': ['Africa/Brazzaville'], 'Congo (DRC)': ['Africa/Kinshasa', 'Africa/Lubumbashi'],
  'Cook Islands': ['Pacific/Rarotonga'], 'Costa Rica': ['America/Costa_Rica'], 'Côte d’Ivoire': ['Africa/Abidjan'],
  'Croatia': ['Europe/Zagreb'], 'Cuba': ['America/Havana'], 'Curaçao': ['America/Curacao'], 'Cyprus': ['Asia/Nicosia'],
  'Czechia': ['Europe/Prague'], 'Denmark': ['Europe/Copenhagen'], 'Djibouti': ['Africa/Djibouti'],
  'Dominica': ['America/Dominica'], 'Dominican Republic': ['America/Santo_Domingo'],
  'Ecuador': ['America/Guayaquil', 'Pacific/Galapagos'], 'Egypt': ['Africa/Cairo'], 'El Salvador': ['America/El_Salvador'],
  'Equatorial Guinea': ['Africa/Malabo'], 'Eritrea': ['Africa/Asmara'], 'Estonia': ['Europe/Tallinn'],
  'Eswatini': ['Africa/Mbabane'], 'Ethiopia': ['Africa/Addis_Ababa'], 'Falkland Islands': ['Atlantic/Stanley'],
  'Faroe Islands': ['Atlantic/Faroe'], 'Fiji': ['Pacific/Fiji'], 'Finland': ['Europe/Helsinki'], 'France': ['Europe/Paris'],
  'French Guiana': ['America/Cayenne'], 'French Polynesia': ['Pacific/Tahiti', 'Pacific/Marquesas', 'Pacific/Gambier'],
  'French Southern Territories': ['Indian/Kerguelen'], 'Gabon': ['Africa/Libreville'], 'Gambia': ['Africa/Banjul'],
  'Georgia': ['Asia/Tbilisi'], 'Germany': ['Europe/Berlin'], 'Ghana': ['Africa/Accra'], 'Gibraltar': ['Europe/Gibraltar'],
  'Greece': ['Europe/Athens'], 'Greenland': ['America/Nuuk', 'America/Danmarkshavn', 'America/Scoresbysund', 'America/Thule'],
  'Grenada': ['America/Grenada'], 'Guadeloupe': ['America/Guadeloupe'], 'Guam': ['Pacific/Guam'],
  'Guatemala': ['America/Guatemala'], 'Guernsey': ['Europe/Guernsey'], 'Guinea': ['Africa/Conakry'],
  'Guinea-Bissau': ['Africa/Bissau'], 'Guyana': ['America/Guyana'], 'Haiti': ['America/Port-au-Prince'],
  'Heard Island and McDonald Islands': ['Indian/Kerguelen'], 'Honduras': ['America/Tegucigalpa'],
  'Hong Kong': ['Asia/Hong_Kong'], 'Hungary': ['Europe/Budapest'], 'Iceland': ['Atlantic/Reykjavik'],
  'India': ['Asia/Kolkata'], 'Indonesia': ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'], 'Iran': ['Asia/Tehran'],
  'Iraq': ['Asia/Baghdad'], 'Ireland': ['Europe/Dublin'], 'Isle of Man': ['Europe/Isle_of_Man'],
  'Israel': ['Asia/Jerusalem'], 'Italy': ['Europe/Rome'], 'Jamaica': ['America/Jamaica'], 'Japan': ['Asia/Tokyo'],
  'Jersey': ['Europe/Jersey'], 'Jordan': ['Asia/Amman'], 'Kazakhstan': ['Asia/Almaty', 'Asia/Aqtobe'],
  'Kenya': ['Africa/Nairobi'], 'Kiribati': ['Pacific/Tarawa', 'Pacific/Kanton', 'Pacific/Kiritimati'],
  'Kosovo': ['Europe/Belgrade'], 'Kuwait': ['Asia/Kuwait'], 'Kyrgyzstan': ['Asia/Bishkek'], 'Laos': ['Asia/Vientiane'],
  'Latvia': ['Europe/Riga'], 'Lebanon': ['Asia/Beirut'], 'Lesotho': ['Africa/Maseru'], 'Liberia': ['Africa/Monrovia'],
  'Libya': ['Africa/Tripoli'], 'Liechtenstein': ['Europe/Vaduz'], 'Lithuania': ['Europe/Vilnius'],
  'Luxembourg': ['Europe/Luxembourg'], 'Macao': ['Asia/Macau'], 'Madagascar': ['Indian/Antananarivo'],
  'Malawi': ['Africa/Blantyre'], 'Malaysia': ['Asia/Kuala_Lumpur'], 'Maldives': ['Indian/Maldives'],
  'Mali': ['Africa/Bamako'], 'Malta': ['Europe/Malta'], 'Marshall Islands': ['Pacific/Majuro'],
  'Martinique': ['America/Martinique'], 'Mauritania': ['Africa/Nouakchott'], 'Mauritius': ['Indian/Mauritius'],
  'Mayotte': ['Indian/Mayotte'],
  'Mexico': ['America/Mexico_City', 'America/Tijuana', 'America/Hermosillo', 'America/Mazatlan', 'America/Cancun'],
  'Micronesia': ['Pacific/Pohnpei', 'Pacific/Chuuk'], 'Moldova': ['Europe/Chisinau'], 'Monaco': ['Europe/Monaco'],
  'Mongolia': ['Asia/Ulaanbaatar', 'Asia/Hovd'], 'Montenegro': ['Europe/Podgorica'], 'Montserrat': ['America/Montserrat'],
  'Morocco': ['Africa/Casablanca'], 'Mozambique': ['Africa/Maputo'], 'Myanmar': ['Asia/Yangon'],
  'Namibia': ['Africa/Windhoek'], 'Nauru': ['Pacific/Nauru'], 'Nepal': ['Asia/Kathmandu'],
  'Netherlands': ['Europe/Amsterdam'], 'New Caledonia': ['Pacific/Noumea'],
  'New Zealand': ['Pacific/Auckland', 'Pacific/Chatham'], 'Nicaragua': ['America/Managua'], 'Niger': ['Africa/Niamey'],
  'Nigeria': ['Africa/Lagos'], 'Niue': ['Pacific/Niue'], 'Norfolk Island': ['Pacific/Norfolk'],
  'North Korea': ['Asia/Pyongyang'], 'North Macedonia': ['Europe/Skopje'], 'Northern Mariana Islands': ['Pacific/Saipan'],
  'Norway': ['Europe/Oslo'], 'Oman': ['Asia/Muscat'], 'Pakistan': ['Asia/Karachi'], 'Palau': ['Pacific/Palau'],
  'Palestine': ['Asia/Gaza'], 'Panama': ['America/Panama'], 'Papua New Guinea': ['Pacific/Port_Moresby', 'Pacific/Bougainville'],
  'Paraguay': ['America/Asuncion'], 'Peru': ['America/Lima'], 'Philippines': ['Asia/Manila'],
  'Pitcairn Islands': ['Pacific/Pitcairn'], 'Poland': ['Europe/Warsaw'], 'Portugal': ['Europe/Lisbon', 'Atlantic/Azores'],
  'Puerto Rico': ['America/Puerto_Rico'], 'Qatar': ['Asia/Qatar'], 'Réunion': ['Indian/Reunion'],
  'Romania': ['Europe/Bucharest'],
  'Russia': ['Europe/Moscow', 'Europe/Kaliningrad', 'Europe/Samara', 'Asia/Yekaterinburg', 'Asia/Omsk', 'Asia/Novosibirsk', 'Asia/Krasnoyarsk', 'Asia/Irkutsk', 'Asia/Yakutsk', 'Asia/Vladivostok', 'Asia/Magadan', 'Asia/Kamchatka'],
  'Rwanda': ['Africa/Kigali'], 'Saint Barthélemy': ['America/St_Barthelemy'],
  'Saint Helena, Ascension and Tristan da Cunha': ['Atlantic/St_Helena'], 'Saint Kitts and Nevis': ['America/St_Kitts'],
  'Saint Lucia': ['America/St_Lucia'], 'Saint Martin': ['America/Marigot'], 'Saint Pierre and Miquelon': ['America/Miquelon'],
  'Saint Vincent and the Grenadines': ['America/St_Vincent'], 'Samoa': ['Pacific/Apia'], 'San Marino': ['Europe/San_Marino'],
  'São Tomé and Príncipe': ['Africa/Sao_Tome'], 'Saudi Arabia': ['Asia/Riyadh'], 'Senegal': ['Africa/Dakar'],
  'Serbia': ['Europe/Belgrade'], 'Seychelles': ['Indian/Mahe'], 'Sierra Leone': ['Africa/Freetown'],
  'Singapore': ['Asia/Singapore'], 'Sint Maarten': ['America/Lower_Princes'], 'Slovakia': ['Europe/Bratislava'],
  'Slovenia': ['Europe/Ljubljana'], 'Solomon Islands': ['Pacific/Guadalcanal'], 'Somalia': ['Africa/Mogadishu'],
  'South Africa': ['Africa/Johannesburg'], 'South Georgia and the South Sandwich Islands': ['Atlantic/South_Georgia'],
  'South Korea': ['Asia/Seoul'], 'South Sudan': ['Africa/Juba'], 'Spain': ['Europe/Madrid', 'Atlantic/Canary'],
  'Sri Lanka': ['Asia/Colombo'], 'Sudan': ['Africa/Khartoum'], 'Suriname': ['America/Paramaribo'],
  'Svalbard and Jan Mayen': ['Arctic/Longyearbyen'], 'Sweden': ['Europe/Stockholm'], 'Switzerland': ['Europe/Zurich'],
  'Syria': ['Asia/Damascus'], 'Taiwan': ['Asia/Taipei'], 'Tajikistan': ['Asia/Dushanbe'], 'Tanzania': ['Africa/Dar_es_Salaam'],
  'Thailand': ['Asia/Bangkok'], 'Timor-Leste': ['Asia/Dili'], 'Togo': ['Africa/Lome'], 'Tokelau': ['Pacific/Fakaofo'],
  'Tonga': ['Pacific/Tongatapu'], 'Trinidad and Tobago': ['America/Port_of_Spain'], 'Tunisia': ['Africa/Tunis'],
  'Türkiye': ['Europe/Istanbul'], 'Turkmenistan': ['Asia/Ashgabat'], 'Turks and Caicos Islands': ['America/Grand_Turk'],
  'Tuvalu': ['Pacific/Funafuti'], 'Uganda': ['Africa/Kampala'], 'Ukraine': ['Europe/Kyiv'],
  'United Arab Emirates': ['Asia/Dubai'], 'United Kingdom': ['Europe/London'],
  'United States': ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu'],
  'United States Minor Outlying Islands': ['Pacific/Midway', 'Pacific/Wake'], 'Uruguay': ['America/Montevideo'],
  'US Virgin Islands': ['America/St_Thomas'], 'Uzbekistan': ['Asia/Tashkent'], 'Vanuatu': ['Pacific/Efate'],
  'Vatican City': ['Europe/Vatican'], 'Venezuela': ['America/Caracas'], 'Vietnam': ['Asia/Ho_Chi_Minh'],
  'Wallis and Futuna': ['Pacific/Wallis'], 'Western Sahara': ['Africa/El_Aaiun'], 'Yemen': ['Asia/Aden'],
  'Zambia': ['Africa/Lusaka'], 'Zimbabwe': ['Africa/Harare'],
};

/* A zone's offset right now (summer time included) as a GMT_OFFSETS value,
   or '' if the browser can't resolve it. */
export function zoneGmtOffset(timeZone: string, at: Date = new Date()): string {
  try {
    const name = new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'longOffset' })
      .formatToParts(at)
      .find((p) => p.type === 'timeZoneName')?.value;
    if (!name) return '';
    return name === 'GMT' ? 'GMT+00:00' : name.replace('-', '−');
  } catch {
    return '';
  }
}

/* Default time zone for a country: the visitor's own offset if the country
   spans it (so they aren't moved off their own time), otherwise the
   country's main zone. */
export function countryGmtOffset(country: string): string {
  const offsets = (COUNTRY_ZONES[country] ?? []).map((z) => zoneGmtOffset(z)).filter(Boolean);
  const mine = browserGmtOffset();
  return offsets.includes(mine) ? mine : offsets[0] ?? '';
}
