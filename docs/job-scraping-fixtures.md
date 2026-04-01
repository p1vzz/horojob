# Job Scraping Fixtures (Manual QA)
**Version:** 1.0  
**Status:** Active  
**Owner:** Backend + QA

## 0. Repo Topology and DB Access
- Backend server code is located in `../horojob-server`.
- MongoDB access is configured through a Mongo connection string in the server `.env` file.

## 1. Glassdoor
### Success (detail pages)
- `https://www.glassdoor.com/job-listing/software-engineer-mercor-JV_IC2671300_KO0,17_KE18,24.htm?jl=1010065389530`
- `https://www.glassdoor.com/job-listing/software-engineer-m-f-d-apple-JV_KO0,23_KE24,29.htm?jl=1010061162334`
- Expected behavior: both URLs should pass URL validation as `glassdoor` vacancy pages and go through `http -> parse -> browser fallback` when needed.

### Partial (typical)
- Any Glassdoor job page with login modal overlay and incomplete server HTML.

### Problematic (not a job page)
- `https://www.glassdoor.com/Interview/new-grad-software-engineer-interview-questions-SRCH_KO0,26.htm`

## 2. Indeed
### Success
- `https://www.indeed.com/viewjob?jk=ea5a0adad4ffe016`
- `https://www.indeed.com/viewjob?jk=7b814b5727f77f9b`

### Potentially problematic
- `https://www.indeed.com/viewjob?jk=4867ce86a78d5c66`

## 3. Wellfound
### Success
- `https://wellfound.com/jobs/3886025-software-engineer-poland`
- `https://wellfound.com/jobs/3975868-developer-success`

### Complex
- `https://wellfound.com/jobs/3982699-senior-software-engineer-2-marketing-tools-and-landing-pages`

## 4. Expected Automation Rules
- If `title` is missing -> `parse_fail`.
- If `description` is missing -> `browser_fallback` (if source policy allows).
- If `company` is missing -> retry path or partial classification.
- `salary` missing is allowed (optional field for MVP).
- Wellfound browser fallback is disabled by default (manual/debug only).

## 5. Notes
- Fixtures are for manual regression and parser tuning.
- Some links may change behavior over time due to source anti-bot protections and page updates.
