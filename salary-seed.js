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

// Seed data is kept empty so that the dashboard stays at zero until users enter their compensation
const SEED_DATA = [];
