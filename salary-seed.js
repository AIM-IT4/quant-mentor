// Quant Salary Explorer - Seed Data & Region/City Config
// Region -> Country -> Cities mapping
const REGION_DATA = {
  "US": { countries: { "United States": ["New York", "Chicago", "San Francisco", "Boston", "Greenwich", "Austin", "Miami"] }},
  "UK": { countries: { "United Kingdom": ["London", "Edinburgh", "Cambridge", "Oxford", "Manchester"] }},
  "EU": { countries: { "France": ["Paris", "Lyon"], "Germany": ["Frankfurt", "Munich", "Berlin"], "Netherlands": ["Amsterdam", "Rotterdam"], "Switzerland": ["Zurich", "Geneva"], "Ireland": ["Dublin"], "Luxembourg": ["Luxembourg City"] }},
  "APAC": { countries: { "Singapore": ["Singapore"], "Hong Kong": ["Hong Kong"], "Japan": ["Tokyo"], "Australia": ["Sydney", "Melbourne"], "China": ["Shanghai", "Beijing", "Shenzhen"], "India": ["Mumbai", "Bangalore", "Hyderabad", "Pune", "Gurgaon", "Chennai"] }},
  "EMEA": { countries: { "UAE": ["Dubai", "Abu Dhabi"], "Saudi Arabia": ["Riyadh"], "South Africa": ["Johannesburg", "Cape Town"], "Israel": ["Tel Aviv"], "Qatar": ["Doha"] }}
};

const ROLES = ["Quant Developer","Quant Researcher","Quant Trader","Risk Quant","Model Validation","Algo Trader","Data Scientist - Quant"];
const LEVELS = ["Intern","Junior / Analyst","Mid / Associate","Senior / VP","Lead / Director","Principal / MD"];
const EDUCATION = ["PhD","Masters","Bachelors","Self-Taught"];
const CURRENCIES = { "US":"USD","UK":"GBP","EU":"EUR","APAC":"USD","EMEA":"USD" };

// Seed entries (~80 realistic data points)
const SEED_DATA = [
  // --- US ---
  {region:"US",country:"United States",city:"New York",firm:"Citadel",role:"Quant Researcher",level:"Junior / Analyst",yoe:1,base:200000,bonus:150000,equity:50000,currency:"USD",education:"PhD"},
  {region:"US",country:"United States",city:"New York",firm:"Jane Street",role:"Quant Trader",level:"Junior / Analyst",yoe:1,base:250000,bonus:200000,equity:0,currency:"USD",education:"Masters"},
  {region:"US",country:"United States",city:"New York",firm:"Two Sigma",role:"Quant Developer",level:"Mid / Associate",yoe:4,base:225000,bonus:175000,equity:75000,currency:"USD",education:"PhD"},
  {region:"US",country:"United States",city:"Chicago",firm:"Jump Trading",role:"Algo Trader",level:"Mid / Associate",yoe:3,base:200000,bonus:250000,equity:0,currency:"USD",education:"Masters"},
  {region:"US",country:"United States",city:"New York",firm:"D.E. Shaw",role:"Quant Researcher",level:"Senior / VP",yoe:8,base:300000,bonus:400000,equity:100000,currency:"USD",education:"PhD"},
  {region:"US",country:"United States",city:"Greenwich",firm:"AQR Capital",role:"Quant Researcher",level:"Mid / Associate",yoe:5,base:200000,bonus:150000,equity:50000,currency:"USD",education:"PhD"},
  {region:"US",country:"United States",city:"New York",firm:"Goldman Sachs",role:"Quant Developer",level:"Senior / VP",yoe:10,base:250000,bonus:200000,equity:80000,currency:"USD",education:"Masters"},
  {region:"US",country:"United States",city:"New York",firm:"Morgan Stanley",role:"Risk Quant",level:"Mid / Associate",yoe:5,base:180000,bonus:100000,equity:40000,currency:"USD",education:"Masters"},
  {region:"US",country:"United States",city:"New York",firm:"JP Morgan",role:"Model Validation",level:"Senior / VP",yoe:9,base:220000,bonus:130000,equity:50000,currency:"USD",education:"PhD"},
  {region:"US",country:"United States",city:"Chicago",firm:"Optiver",role:"Quant Trader",level:"Junior / Analyst",yoe:1,base:200000,bonus:180000,equity:0,currency:"USD",education:"Masters"},
  {region:"US",country:"United States",city:"San Francisco",firm:"Two Sigma",role:"Data Scientist - Quant",level:"Mid / Associate",yoe:4,base:210000,bonus:140000,equity:80000,currency:"USD",education:"PhD"},
  {region:"US",country:"United States",city:"New York",firm:"Millennium",role:"Quant Researcher",level:"Lead / Director",yoe:14,base:350000,bonus:600000,equity:150000,currency:"USD",education:"PhD"},
  {region:"US",country:"United States",city:"Boston",firm:"State Street",role:"Risk Quant",level:"Mid / Associate",yoe:6,base:160000,bonus:60000,equity:20000,currency:"USD",education:"Masters"},
  {region:"US",country:"United States",city:"New York",firm:"Barclays",role:"Quant Developer",level:"Junior / Analyst",yoe:2,base:150000,bonus:50000,equity:15000,currency:"USD",education:"Masters"},
  {region:"US",country:"United States",city:"Chicago",firm:"Citadel Securities",role:"Quant Developer",level:"Senior / VP",yoe:7,base:275000,bonus:350000,equity:100000,currency:"USD",education:"PhD"},
  {region:"US",country:"United States",city:"New York",firm:"HRT",role:"Quant Researcher",level:"Mid / Associate",yoe:3,base:250000,bonus:300000,equity:0,currency:"USD",education:"PhD"},
  // --- UK ---
  {region:"UK",country:"United Kingdom",city:"London",firm:"Citadel",role:"Quant Researcher",level:"Junior / Analyst",yoe:1,base:120000,bonus:80000,equity:20000,currency:"GBP",education:"PhD"},
  {region:"UK",country:"United Kingdom",city:"London",firm:"G-Research",role:"Quant Researcher",level:"Mid / Associate",yoe:4,base:130000,bonus:100000,equity:30000,currency:"GBP",education:"PhD"},
  {region:"UK",country:"United Kingdom",city:"London",firm:"Man Group",role:"Quant Developer",level:"Senior / VP",yoe:9,base:160000,bonus:120000,equity:40000,currency:"GBP",education:"Masters"},
  {region:"UK",country:"United Kingdom",city:"London",firm:"Goldman Sachs",role:"Risk Quant",level:"Mid / Associate",yoe:5,base:110000,bonus:60000,equity:25000,currency:"GBP",education:"Masters"},
  {region:"UK",country:"United Kingdom",city:"London",firm:"Barclays",role:"Model Validation",level:"Senior / VP",yoe:8,base:120000,bonus:50000,equity:20000,currency:"GBP",education:"PhD"},
  {region:"UK",country:"United Kingdom",city:"London",firm:"JP Morgan",role:"Quant Developer",level:"Junior / Analyst",yoe:2,base:85000,bonus:30000,equity:10000,currency:"GBP",education:"Masters"},
  {region:"UK",country:"United Kingdom",city:"London",firm:"Marshall Wace",role:"Quant Researcher",level:"Senior / VP",yoe:10,base:180000,bonus:200000,equity:50000,currency:"GBP",education:"PhD"},
  {region:"UK",country:"United Kingdom",city:"London",firm:"Winton",role:"Data Scientist - Quant",level:"Mid / Associate",yoe:4,base:100000,bonus:50000,equity:15000,currency:"GBP",education:"PhD"},
  {region:"UK",country:"United Kingdom",city:"Edinburgh",firm:"Baillie Gifford",role:"Quant Developer",level:"Mid / Associate",yoe:5,base:80000,bonus:25000,equity:10000,currency:"GBP",education:"Masters"},
  {region:"UK",country:"United Kingdom",city:"London",firm:"HSBC",role:"Risk Quant",level:"Junior / Analyst",yoe:2,base:70000,bonus:15000,equity:5000,currency:"GBP",education:"Masters"},
  {region:"UK",country:"United Kingdom",city:"London",firm:"Jane Street",role:"Quant Trader",level:"Junior / Analyst",yoe:1,base:150000,bonus:120000,equity:0,currency:"GBP",education:"Masters"},
  {region:"UK",country:"United Kingdom",city:"Cambridge",firm:"Cantab Capital",role:"Quant Researcher",level:"Mid / Associate",yoe:6,base:110000,bonus:70000,equity:20000,currency:"GBP",education:"PhD"},
  // --- EU ---
  {region:"EU",country:"Switzerland",city:"Zurich",firm:"UBS",role:"Quant Developer",level:"Senior / VP",yoe:10,base:180000,bonus:100000,equity:30000,currency:"EUR",education:"Masters"},
  {region:"EU",country:"France",city:"Paris",firm:"BNP Paribas",role:"Quant Researcher",level:"Mid / Associate",yoe:5,base:85000,bonus:35000,equity:10000,currency:"EUR",education:"PhD"},
  {region:"EU",country:"Germany",city:"Frankfurt",firm:"Deutsche Bank",role:"Risk Quant",level:"Senior / VP",yoe:8,base:110000,bonus:50000,equity:15000,currency:"EUR",education:"Masters"},
  {region:"EU",country:"Netherlands",city:"Amsterdam",firm:"Optiver",role:"Quant Trader",level:"Junior / Analyst",yoe:1,base:100000,bonus:80000,equity:0,currency:"EUR",education:"Masters"},
  {region:"EU",country:"Netherlands",city:"Amsterdam",firm:"Flow Traders",role:"Algo Trader",level:"Mid / Associate",yoe:3,base:95000,bonus:90000,equity:0,currency:"EUR",education:"Masters"},
  {region:"EU",country:"Switzerland",city:"Geneva",firm:"Pictet",role:"Quant Researcher",level:"Mid / Associate",yoe:6,base:160000,bonus:60000,equity:20000,currency:"EUR",education:"PhD"},
  {region:"EU",country:"France",city:"Paris",firm:"Societe Generale",role:"Model Validation",level:"Mid / Associate",yoe:4,base:75000,bonus:25000,equity:5000,currency:"EUR",education:"Masters"},
  {region:"EU",country:"Ireland",city:"Dublin",firm:"Susquehanna (SIG)",role:"Quant Trader",level:"Junior / Analyst",yoe:1,base:80000,bonus:60000,equity:0,currency:"EUR",education:"Bachelors"},
  {region:"EU",country:"Germany",city:"Munich",firm:"Allianz",role:"Risk Quant",level:"Mid / Associate",yoe:5,base:90000,bonus:30000,equity:10000,currency:"EUR",education:"Masters"},
  {region:"EU",country:"Switzerland",city:"Zurich",firm:"Credit Suisse",role:"Quant Developer",level:"Mid / Associate",yoe:4,base:150000,bonus:70000,equity:20000,currency:"EUR",education:"Masters"},
  // --- APAC ---
  {region:"APAC",country:"Singapore",city:"Singapore",firm:"Citadel",role:"Quant Researcher",level:"Mid / Associate",yoe:4,base:180000,bonus:120000,equity:30000,currency:"USD",education:"PhD"},
  {region:"APAC",country:"Hong Kong",city:"Hong Kong",firm:"Millennium",role:"Quant Trader",level:"Senior / VP",yoe:8,base:250000,bonus:350000,equity:50000,currency:"USD",education:"Masters"},
  {region:"APAC",country:"Singapore",city:"Singapore",firm:"DBS Bank",role:"Risk Quant",level:"Mid / Associate",yoe:5,base:100000,bonus:30000,equity:10000,currency:"USD",education:"Masters"},
  {region:"APAC",country:"Japan",city:"Tokyo",firm:"Goldman Sachs",role:"Quant Developer",level:"Senior / VP",yoe:9,base:200000,bonus:100000,equity:40000,currency:"USD",education:"PhD"},
  {region:"APAC",country:"Hong Kong",city:"Hong Kong",firm:"HSBC",role:"Model Validation",level:"Mid / Associate",yoe:4,base:130000,bonus:40000,equity:10000,currency:"USD",education:"Masters"},
  {region:"APAC",country:"Australia",city:"Sydney",firm:"Macquarie",role:"Quant Developer",level:"Mid / Associate",yoe:5,base:140000,bonus:50000,equity:15000,currency:"USD",education:"Masters"},
  {region:"APAC",country:"Singapore",city:"Singapore",firm:"Jane Street",role:"Quant Trader",level:"Junior / Analyst",yoe:1,base:180000,bonus:150000,equity:0,currency:"USD",education:"Masters"},
  {region:"APAC",country:"Hong Kong",city:"Hong Kong",firm:"JP Morgan",role:"Quant Developer",level:"Junior / Analyst",yoe:2,base:120000,bonus:40000,equity:10000,currency:"USD",education:"Masters"},
  {region:"APAC",country:"China",city:"Shanghai",firm:"CICC",role:"Quant Researcher",level:"Mid / Associate",yoe:5,base:80000,bonus:40000,equity:10000,currency:"USD",education:"PhD"},
  {region:"APAC",country:"India",city:"Mumbai",firm:"Goldman Sachs",role:"Quant Developer",level:"Mid / Associate",yoe:4,base:40000,bonus:15000,equity:5000,currency:"USD",education:"Masters"},
  {region:"APAC",country:"India",city:"Bangalore",firm:"Morgan Stanley",role:"Risk Quant",level:"Junior / Analyst",yoe:2,base:25000,bonus:8000,equity:3000,currency:"USD",education:"Masters"},
  {region:"APAC",country:"India",city:"Mumbai",firm:"JP Morgan",role:"Model Validation",level:"Senior / VP",yoe:9,base:55000,bonus:25000,equity:10000,currency:"USD",education:"PhD"},
  {region:"APAC",country:"India",city:"Hyderabad",firm:"Deutsche Bank",role:"Quant Developer",level:"Mid / Associate",yoe:5,base:35000,bonus:12000,equity:5000,currency:"USD",education:"Masters"},
  {region:"APAC",country:"India",city:"Gurgaon",firm:"Tower Research",role:"Algo Trader",level:"Junior / Analyst",yoe:1,base:30000,bonus:20000,equity:0,currency:"USD",education:"Bachelors"},
  {region:"APAC",country:"India",city:"Pune",firm:"Barclays",role:"Risk Quant",level:"Mid / Associate",yoe:4,base:28000,bonus:10000,equity:3000,currency:"USD",education:"Masters"},
  {region:"APAC",country:"India",city:"Mumbai",firm:"Citadel",role:"Quant Researcher",level:"Junior / Analyst",yoe:2,base:45000,bonus:20000,equity:5000,currency:"USD",education:"PhD"},
  {region:"APAC",country:"Australia",city:"Melbourne",firm:"ANZ",role:"Risk Quant",level:"Mid / Associate",yoe:5,base:110000,bonus:30000,equity:10000,currency:"USD",education:"Masters"},
  {region:"APAC",country:"Singapore",city:"Singapore",firm:"Two Sigma",role:"Quant Researcher",level:"Senior / VP",yoe:8,base:220000,bonus:180000,equity:50000,currency:"USD",education:"PhD"},
  // --- EMEA ---
  {region:"EMEA",country:"UAE",city:"Dubai",firm:"Mubadala",role:"Quant Researcher",level:"Senior / VP",yoe:10,base:200000,bonus:100000,equity:30000,currency:"USD",education:"PhD"},
  {region:"EMEA",country:"UAE",city:"Dubai",firm:"ADIA",role:"Quant Developer",level:"Mid / Associate",yoe:5,base:160000,bonus:60000,equity:20000,currency:"USD",education:"Masters"},
  {region:"EMEA",country:"UAE",city:"Abu Dhabi",firm:"First Abu Dhabi Bank",role:"Risk Quant",level:"Mid / Associate",yoe:4,base:120000,bonus:40000,equity:10000,currency:"USD",education:"Masters"},
  {region:"EMEA",country:"Israel",city:"Tel Aviv",firm:"Tower Research",role:"Algo Trader",level:"Mid / Associate",yoe:3,base:110000,bonus:80000,equity:20000,currency:"USD",education:"Bachelors"},
  {region:"EMEA",country:"South Africa",city:"Johannesburg",firm:"Standard Bank",role:"Quant Developer",level:"Senior / VP",yoe:8,base:80000,bonus:30000,equity:10000,currency:"USD",education:"Masters"},
  {region:"EMEA",country:"Qatar",city:"Doha",firm:"Qatar Investment Authority",role:"Quant Researcher",level:"Mid / Associate",yoe:5,base:150000,bonus:70000,equity:15000,currency:"USD",education:"PhD"},
  {region:"EMEA",country:"UAE",city:"Dubai",firm:"Goldman Sachs",role:"Quant Developer",level:"Junior / Analyst",yoe:2,base:130000,bonus:50000,equity:10000,currency:"USD",education:"Masters"},
  {region:"EMEA",country:"Saudi Arabia",city:"Riyadh",firm:"Saudi Aramco",role:"Data Scientist - Quant",level:"Mid / Associate",yoe:4,base:130000,bonus:50000,equity:15000,currency:"USD",education:"PhD"},
  {region:"EMEA",country:"South Africa",city:"Cape Town",firm:"Allan Gray",role:"Quant Researcher",level:"Mid / Associate",yoe:5,base:70000,bonus:25000,equity:8000,currency:"USD",education:"Masters"},
  // Extra entries for depth
  {region:"US",country:"United States",city:"New York",firm:"Point72",role:"Quant Researcher",level:"Senior / VP",yoe:7,base:280000,bonus:350000,equity:80000,currency:"USD",education:"PhD"},
  {region:"US",country:"United States",city:"Austin",firm:"Virtu Financial",role:"Algo Trader",level:"Mid / Associate",yoe:4,base:180000,bonus:160000,equity:30000,currency:"USD",education:"Masters"},
  {region:"UK",country:"United Kingdom",city:"London",firm:"Brevan Howard",role:"Quant Researcher",level:"Senior / VP",yoe:12,base:200000,bonus:300000,equity:60000,currency:"GBP",education:"PhD"},
  {region:"US",country:"United States",city:"New York",firm:"Bank of America",role:"Risk Quant",level:"Junior / Analyst",yoe:2,base:130000,bonus:40000,equity:10000,currency:"USD",education:"Masters"},
  {region:"EU",country:"Luxembourg",city:"Luxembourg City",firm:"Euroclear",role:"Risk Quant",level:"Mid / Associate",yoe:5,base:95000,bonus:30000,equity:10000,currency:"EUR",education:"Masters"},
  {region:"APAC",country:"Japan",city:"Tokyo",firm:"Nomura",role:"Quant Developer",level:"Mid / Associate",yoe:5,base:130000,bonus:50000,equity:15000,currency:"USD",education:"Masters"},
  {region:"US",country:"United States",city:"Miami",firm:"Schonfeld",role:"Quant Trader",level:"Mid / Associate",yoe:4,base:200000,bonus:200000,equity:40000,currency:"USD",education:"Masters"},
  {region:"UK",country:"United Kingdom",city:"London",firm:"BlueCrest",role:"Quant Researcher",level:"Lead / Director",yoe:15,base:250000,bonus:500000,equity:100000,currency:"GBP",education:"PhD"},
  {region:"US",country:"United States",city:"New York",firm:"Cubist (Point72)",role:"Quant Developer",level:"Mid / Associate",yoe:5,base:230000,bonus:200000,equity:60000,currency:"USD",education:"Masters"},
  {region:"APAC",country:"Hong Kong",city:"Hong Kong",firm:"Citadel",role:"Quant Researcher",level:"Senior / VP",yoe:7,base:220000,bonus:280000,equity:60000,currency:"USD",education:"PhD"},
  {region:"US",country:"United States",city:"Chicago",firm:"Wolverine Trading",role:"Quant Trader",level:"Junior / Analyst",yoe:1,base:150000,bonus:100000,equity:0,currency:"USD",education:"Bachelors"},
  {region:"EU",country:"Netherlands",city:"Amsterdam",firm:"IMC",role:"Quant Trader",level:"Mid / Associate",yoe:3,base:100000,bonus:100000,equity:0,currency:"EUR",education:"Masters"},
  {region:"UK",country:"United Kingdom",city:"London",firm:"Qube Research",role:"Quant Researcher",level:"Mid / Associate",yoe:4,base:140000,bonus:110000,equity:25000,currency:"GBP",education:"PhD"},
  {region:"APAC",country:"India",city:"Chennai",firm:"BNP Paribas",role:"Quant Developer",level:"Junior / Analyst",yoe:2,base:18000,bonus:5000,equity:2000,currency:"USD",education:"Masters"},
  {region:"EMEA",country:"Israel",city:"Tel Aviv",firm:"IMC",role:"Quant Developer",level:"Mid / Associate",yoe:4,base:120000,bonus:70000,equity:15000,currency:"USD",education:"Masters"},
];

// Add total_comp and id to seed data
SEED_DATA.forEach((d, i) => { d.total_comp = d.base + d.bonus + d.equity; d.id = 'seed-' + i; d.is_seed = true; });
