# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Report Builder is a DHIS2 web application for creating, managing, and generating custom reports. It integrates with DHIS2's analytics API, data store, and tracker system to provide dynamic report generation with legends, SMS configurations, and template-based designs.

**Technology Stack:**
- DHIS2 App Platform (v9.0.1) with `@dhis2/cli-app-scripts`
- React with DHIS2 UI components (`@dhis2/ui`, `@dhis2/analytics`, `@dhis2/app-runtime`)
- Additional UI: Ant Design (antd), NextUI, react-icons
- Data visualization: Chart.js (embedded in legends)
- Utilities: axios, dayjs, uuid, react-color

## Development Commands

### Start Development Server
```bash
yarn start
```
Opens development server at http://localhost:3000 with hot reload enabled.

### Run Tests
```bash
yarn test
```
Launches test runner for all tests in `/src`.

### Build Production Bundle
```bash
yarn build
```
Creates production build, generates manifest, and packages as `report-builder.zip` in `/build` directory.

**Build Process Details:**
1. Runs `d2-app-scripts build`
2. Generates `manifest.webapp` from package.json
3. Creates deployable ZIP file with manifest included
4. Cleans intermediate build artifacts

### Deploy to DHIS2 Instance
```bash
yarn deploy
```
Deploys built app to a DHIS2 instance. Prompts for server URL, username, and password. Must run `yarn build` first.

### Quick Production Build
```bash
yarn prod
```
Alias for `yarn build`.

## Architecture

### Application Structure

```
src/
├── App.js                          # Main application component & state management
├── api.routes.js                   # API endpoint definitions
├── Components/                     # Page-level components
│   ├── DesignsPage.js             # Report template designer (HTML editor with Summernote)
│   ├── ReportsPage.js             # Report generation & viewing
│   ├── LegendPage.js              # Legend configuration (color/image/label mappings)
│   ├── SmsConfigPage.js           # SMS notification configuration
│   ├── Filter.js                  # Org unit, period, and dimension filtering
│   ├── OrganisationUnitsTree.js   # Hierarchical org unit selector
│   ├── Period.js                  # Period selector component
│   ├── TrackerDimensionsDialog.js # Tracker dimension configuration
│   └── MyNotification.js          # Toast notification component
└── utils/
    ├── constants.js               # Application constants & enums
    └── fonctions.js               # Core utility functions
```

### Core Application Logic (App.js)

**State Management Pattern:**
- Centralized state in App.js with useState hooks
- State passed down to child components via props
- No Redux or external state management
- Key state includes: reports, legends, orgUnits, dataValues, selectedReport, renderPage

**Main Pages (controlled by `renderPage` state):**
- `PAGE_REPORT`: Report generation and viewing
- `PAGE_DESIGN`: Report template design/editing
- `PAGE_LEGEND`: Legend configuration
- `PAGE_SMS_CONFIG`: SMS notification setup

### Data Flow

**DHIS2 Data Store Integration:**
- All persistent data stored in DHIS2 Data Store with namespace `report-builder`
- Keys: `reports`, `legends`, `smsConfigs`, `images`
- Functions in `utils/fonctions.js`:
  - `loadDataStore(key, loadingFn, setDataFn, defaultValue)` - Load from data store
  - `saveDataToDataStore(key, data, loadingFn, successFn, errorFn)` - Save to data store
  - `deleteKeyFromDataStore(key, loadingFn, successFn, errorFn)` - Delete from data store

**Analytics Integration:**
- Routes: `ANALYTICS_ROUTE`, `TEIS_ROUTE` (tracker entities)
- Functions:
  - `getAggregateDimensionsList()` - Fetch dimensions for aggregate data
  - `cleanAggrateDimensionData()` - Process analytics response
  - `injectDataIntoHtml()` - Inject aggregate values into report HTML
  - `inject_tei_into_html()` - Inject tracker entity data into report HTML

### Report Generation Workflow

1. **Design Phase (DesignsPage.js):**
   - HTML template creation using Summernote WYSIWYG editor
   - Dimension selection (data elements, indicators, program indicators)
   - Special placeholders: `[[ORG_UNIT_NAME]]`, `[[PERIOD]]`, `[[OTHER_ELEMENTS]]`
   - Report configuration: data type (aggregate/tracker), dimensions, styling

2. **Filter Phase (Filter.js):**
   - Organisation unit selection (tree or group-based)
   - Period selection (year, month, quarter, etc.)
   - Program selection (for tracker reports)

3. **Generation Phase (ReportsPage.js):**
   - Fetch data from DHIS2 Analytics API
   - Apply legends to data values (color, image, or label)
   - Inject data into HTML template
   - Render final report with print capability

### Legend System (LegendPage.js)

**Purpose:** Map numeric data values to visual representations (colors, images, labels)

**Legend Structure:**
- Each legend has multiple periods (allows time-based legend variations)
- Each period contains value ranges with associated representations
- Types: `COLOR`, `IMAGE`, `LABEL`
- Default values for missing/not-applicable data

**Legend Application:**
- Function: `drawCamember()` for chart-based legends
- Function: `findTheRightLegend()` for period-specific legend selection
- Legends applied during data injection phase

### Conditional Comparison Indicators

**Purpose:** Compare two indicators across different time periods with conditional logic and legend mapping for visual representation.

**Two Modes:**

1. **SIMPLE Mode:** Single comparison operation (A > B, A < B, A = B)
   - Example: Compare current month enrollment vs last month enrollment
   - Result: Numeric difference or boolean result

2. **CONDITIONAL Mode:** IF/ELSE IF/ELSE branch logic with multiple conditions
   - Example: IF current > previous THEN 1, ELSE IF current < previous THEN -1, ELSE 0
   - Result: Mapped numeric value based on first matching condition
   - Single shared legend applies to all branches

**Architecture:**

- **Modal Component:** `ComparisonDimensionModal.js` - Configuration interface for comparison setup
- **Injection Logic:** `DesignsPage.js` - Inserts comparison elements into report HTML templates
- **Evaluation Functions:** `comparisonFunctions.js` - Contains comparison logic
  - `evaluateSimpleComparison()` - Evaluates SIMPLE mode comparisons
  - `evaluateConditionalComparison()` - Evaluates CONDITIONAL mode with branch logic
- **Data Fetching:** `App.js` - Extracts comparison dimensions and fetches data with period offsets
  - `getComparisonDimensionsListWithOffsets()` - Extracts comparison configs from HTML
- **Legend Application:** `fonctions.js` - Applies legends to comparison results
  - `processComparisonElement()` - Main comparison processing and legend application
  - `getOrgUnitParentFromHtml()` - Extracts org units from both aggregate and comparison elements

**Data Flow:**

1. **Design Phase (ComparisonDimensionModal.js):**
   - User selects primary indicator and period offset (e.g., 0 for current period)
   - User selects comparison indicator and period offset (e.g., -1 for previous period)
   - For SIMPLE mode: Select comparison operator and optional legend
   - For CONDITIONAL mode: Define IF/ELSE IF/ELSE conditions with mapped values, select single shared legend
   - Configuration stored in modal state

2. **HTML Injection (DesignsPage.js):**
   - Modal configuration converted to HTML data attributes
   - Comparison element inserted into report template with all config as attributes
   - Element has class `comparison-indicator-simple` or `comparison-indicator-conditional`
   - No inline styling applied (renders same as regular indicators)

3. **Report Generation (App.js):**
   - `getComparisonDimensionsListWithOffsets()` extracts all comparison configs from HTML
   - Builds dimension list with period offsets for DHIS2 Analytics API
   - Fetches data for both primary and comparison indicators across all required periods
   - Passes fetched data to injection functions

4. **Evaluation (comparisonFunctions.js):**
   - For SIMPLE mode: Compares primary vs comparison values using operator
   - For CONDITIONAL mode: Evaluates conditions in order, returns mapped value for first match
   - Returns numeric result ready for legend matching

5. **Rendering (fonctions.js):**
   - If legend configured: Passes result through legend matching logic
   - Legend types supported: COLOR, LABEL, IMAGE, PIE chart
   - If no legend: Displays raw numeric result
   - Final value injected into HTML element

**HTML Data Attributes:**

All comparison configuration stored as data attributes on the span element:

```html
<span
  id="unique-id"
  data-type="AGGREGATE_COMPARISON"
  data-comparison-mode="SIMPLE|CONDITIONAL"
  data-primary-id="indicator-uid"
  data-primary-offset="0"
  data-comparison-id="indicator-uid"
  data-comparison-offset="-1"
  data-conditions='[{"operator":"GREATER_THAN","mappedValue":1}]'
  data-legend-id="legend-uid"
  data-legend-type="color|label|image|pie"
  data-ou-level="Level 3"
  class="comparison-indicator-simple|comparison-indicator-conditional"
>
  Indicator Name
</span>
```

**Key Functions:**

- `getComparisonDimensionsListWithOffsets(html)` - Parses HTML to extract all comparison configurations and build dimension list with period offsets
- `evaluateSimpleComparison(primaryValue, comparisonValue, operator)` - Returns boolean or numeric result based on comparison
- `evaluateConditionalComparison(primaryValue, comparisonValue, conditions)` - Evaluates IF/ELSE IF/ELSE logic and returns mapped value
- `processComparisonElement(compEl, dataValues, period, ...)` - Main processing function that fetches values, evaluates comparison, applies legend
- `getOrgUnitParentFromHtml(selectedOU, orgUnits, orgUnitLevels)` - Extracts org unit IDs from both regular aggregate elements AND comparison elements for Analytics API

**Comparison Operators (SIMPLE mode):**
- `GREATER_THAN`: Primary > Comparison
- `LESS_THAN`: Primary < Comparison
- `EQUAL`: Primary = Comparison
- `GREATER_OR_EQUAL`: Primary >= Comparison
- `LESS_OR_EQUAL`: Primary <= Comparison

**Conditional Logic (CONDITIONAL mode):**
- Conditions evaluated in order (IF, ELSE IF, ELSE IF, ...)
- First matching condition returns its mapped value
- Mapped values are numeric and matched against legend ranges
- All conditions share single legend (selected at modal level)

**Known Issues & Fixes:**

✅ **Fixed (v1.9.9):** Comparison-only reports now properly extract org units for Analytics API
- Issue: Reports with ONLY comparison elements (no regular aggregate elements) failed with HTTP 409 "Organisation unit is not valid"
- Root cause: `getOrgUnitParentFromHtml()` only checked for `data-type='AGGREGATE'` elements
- Fix: Extended function to also process `data-type='AGGREGATE_COMPARISON'` elements and extract their `data-ou-level` attribute

✅ **Fixed (v1.9.9):** Comparison indicators render without background tint (use class names only)
- Issue: Comparison indicators had orange/blue background colors making them visually distinct from regular indicators
- Root cause: Inline styles with `background-color` in HTML injection code
- Fix: Removed all inline styling, replaced with minimal class names

✅ **Fixed (v1.9.9):** Reports with only comparison elements now enable UI buttons
- Issue: First two reports in dropdown didn't trigger "Update report" button to appear
- Root cause: `handleSelectReport` only checked for `AGGREGATE` and `TRACKER` element types, not `AGGREGATE_COMPARISON`
- Fix: Updated Filter.js to recognize comparison elements as valid aggregate data type

✅ **Fixed (v1.9.9):** CONDITIONAL mode JSON parsing now handles HTML entity encoding

- Issue: CONDITIONAL mode comparison indicators failed with `JSON.parse: expected property name or '}'` error
- Root cause: jQuery's `attr()` automatically HTML-encodes special characters when setting attributes (e.g., `"` becomes `&quot;`). When the HTML is saved to Data Store and read back, the encoded values persist, breaking JSON.parse
- Fix location: [fonctions.js:658-670](src/utils/fonctions.js#L658-L670)
- Fix: Added HTML entity decoding before JSON.parse:

  ```javascript
  const decoded = conditionsJson
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')  // Must be last to avoid double-decoding

  conditions = JSON.parse(decoded)
  ```

✅ **Fixed (v1.9.9):** Restored blocking UI for programs/legends loading to fix browser freeze

- Issue: App completely froze and hijacked browser after attempting non-blocking loading indicators
- Root cause: Multiple compounding performance issues:
  - Non-blocking indicator calculated percentage on every render (not memoized)
  - Percentage calculation in JSX: `calculatePercentage(legendContents.length || 0, legends.length || 0)`
  - Caused constant re-renders during legend loading, creating render loops
  - Removing blocking conditional exposed race conditions with incomplete data
- Fix location: [Filter.js:507-511](src/Components/Filter.js#L507-L511)
- Fix: Reverted to simple blocking conditional:

  ```javascript
  loadingPrograms || loadingLegendContents ? (
    <div className='mt-2'>
      <CircularLoader small /> <span>Loading...</span>
    </div>
  ) : (
    <div>{/* Form content */}</div>
  )
  ```

- Result: Programs/legends load with blocking UI (acceptable - fast enough), org units load in background with button disabled

⚠️ **Known Issue (v1.9.9):** Data fetching performance needs optimization

- Issue: Loading times for programs, legends, and org units are longer than optimal
- Current behavior: Programs and legends block entire UI during load, org units disable button during load
- User feedback: "the waiting time and fetching methods need work"
- Impact: User experience during initial report setup is slower than expected
- Next steps: Investigate and optimize data fetching strategies, consider:
  - Parallel data fetching where possible
  - Caching strategies for frequently accessed data
  - Chunked/paginated loading for large datasets
  - Better loading state management to allow partial UI interactivity

### Environment Variables (.env)

Required environment variables:
```
REACT_APP_DATA_STORE_NAME='report-builder'
REACT_APP_REPORTS_KEY='reports'
REACT_APP_LEGENDS_KEY='legends'
REACT_APP_SMS_CONFIG_KEY='smsConfigs'
REACT_APP_IMAGES_KEY='images'
REACT_APP_USER_GROUP='Report Builder admin group'
REACT_APP_VERSION="1.9.9"
```

### API Routes (api.routes.js)

**Base URL Construction:**
- Dynamically extracts base URL from `window.location.href`
- Pattern: `/api/apps/report-builder/`
- Constructs all DHIS2 API endpoints relative to base

**Key Endpoints:**
- Analytics: `/analytics/dataValueSet.json`
- Tracker: `/trackedEntityInstances.json`
- Data Store: `/dataStore`
- Organisation Units: `/organisationUnits.json`
- SMS: `/sms/outbound`

### Common Patterns

**Loading States:**
- Boolean flags for each async operation (e.g., `loadingReports`, `loadingOrganisationUnits`)
- Displayed with `<CircularLoader>` from `@dhis2/ui`

**Notifications:**
- State: `{ show: boolean, message: string, type: string }`
- Types: `NOTIFICATON_SUCCESS`, `NOTIFICATON_CRITICAL`, `NOTIFICATON_WARNING`
- Component: `MyNotification.js`

**HTML Injection:**
- Use `document.getElementById()` or `document.querySelectorAll()` to target elements
- Function: `injectFromId(id, value)` for simple value injection
- Data attributes in HTML templates matched with dimension IDs

**Date Handling:**
- Library: dayjs
- Functions: `formatPeriodForAnalytic()` converts user selections to DHIS2 period format

### DHIS2 Integration Notes

**Authentication:**
- Relies on DHIS2 platform authentication
- Uses `ME_ROUTE` to fetch current user info and authorities

**Permissions:**
- User group restriction: `REACT_APP_USER_GROUP`
- Function: `initAppUserGroup()` checks user membership

**Data Store Best Practices:**
- Always provide default values when loading
- Handle errors gracefully with try/catch
- Use loading states to prevent race conditions

## Testing

- Test files: `*.test.js` in `/src`
- Currently minimal test coverage (App.test.js is placeholder)
- Run with `yarn test`

## Build Configuration

**DHIS2 Config (d2.config.js):**
```javascript
{
  type: 'app',
  name: "report-builder",
  title: "Report Builder",
  entryPoints: { app: './src/App.js' }
}
```

**Manifest Generation:**
- Automatically created from package.json during build
- Includes version, name, description, developer info, icons



## Common Pitfalls and Known Issues

### Data and Configuration Issues
1. **Data Store Initialization:** App requires data store keys to exist. Use `initDataStore()` on first load.
2. **Period Format:** DHIS2 analytics requires specific period formats (e.g., `202301` for Jan 2023). Use `formatPeriodForAnalytic()`.
3. **HTML Template IDs:** Element IDs in HTML templates must match dimension IDs exactly for data injection.
4. **Legend Period Matching:** Legends must have matching period configurations to apply correctly.
5. **Organisation Unit Levels:** Track min/max levels for proper org unit filtering.

### Performance Issues (CRITICAL)

#### Organisation Unit Tree Loading Freeze
**Symptom:** App appears frozen when clicking the organisation unit picker button.

**Root Cause:** There were **two copies** of the `generateTreeFromOrgUnits` function:
- [fonctions.js:731](src/utils/fonctions.js#L731) - Exported version (FIXED)
- [OrganisationUnitsTree.js:7](src/Components/OrganisationUnitsTree.js#L7) - Local copy (FIXED)

Both were calling `setLoading(true)` on every tree generation, even though org units are already loaded at app startup in [Filter.js:156-181](src/Components/Filter.js#L156-L181).

**Fix Applied:** Removed `setLoading(true)` calls from both copies. Org units are loaded once at startup and cached in state. The loading state should only be set during the initial fetch in `loadOrganisationUnits`, not during tree generation.

**Files Changed:**
- `src/utils/fonctions.js:732` - Removed `setLoading && setLoading(true)`
- `src/Components/OrganisationUnitsTree.js:8` - Already fixed in previous session

**Why This Works:** Organisation units are fetched once via `loadOrgUnitLevels()` → `loadOrganisationUnits()` during app initialization. The tree generation function is purely a data transformation and should not trigger loading states.

#### Indicator Data Fetching Issues
**Symptom:** Indicators not returning data or fetching appears to fail silently.

**Investigation Areas:**
1. **Metadata Route:** [api.routes.js:22](src/api.routes.js#L22) - `INDICATORS_METADATA_ROUTE` includes `numerator,denominator,indicatorType`
2. **Fetch Logic:** [App.js:180-238](src/App.js#L180-L238) - Fetches indicator metadata to detect period offsets
3. **Error Handling:** Errors are caught and logged but may not surface to user

**Debugging Steps:**
- Check browser console for `[Report Builder]` prefixed logs
- Look for indicator metadata fetch errors
- Verify `INDICATORS_METADATA_ROUTE` returns valid data
- Check Analytics API route construction at [App.js:294-300](src/App.js#L294-L300)

**Common Causes:**
- API permissions: User may not have access to indicators API
- Network timeout: Large indicator sets may timeout
- Invalid indicator IDs in HTML template
- Period offset calculation errors in `buildPeriodRangeForOffset()`

**Error Logging:**
The app includes comprehensive logging for indicator fetching:
```javascript
console.log(`[Report Builder] Fetching ${indicators.length} indicators:`, indicators)
console.log(`[Report Builder] Fetching indicator metadata from: ${metadataRoute}`)
// ... detailed offset detection summary
```

Check browser console for these logs to diagnose issues.

## Local Development Setup

### Development Server Issues (KNOWN ISSUE)

**React Duplicate Instance Error in Dev Mode:**
- Development mode (`yarn start`) shows "Invalid hook call" error from `@nextui-org/react`
- Root cause: `.d2/shell` bundles two React instances (shell's React + app's React)
- Production build (`yarn build`) works perfectly - automatically deduplicates
- **Workaround:** Use `yarn dev:watch` instead of `yarn start` (see below)

**Local Development Proxy Setup (FIXED):**
- d2.config.js includes proxy configuration (lines 9-12)
- `.d2/shell/src/setupProxy.js` configures API proxying via http-proxy-middleware
- API calls to `/api/*` properly proxy to DHIS2 instance

### Recommended Development Workflow

**Use `yarn dev:watch` for local development:**
```bash
yarn dev:watch
```

**What it does:**
- Watches `src/` directory for file changes
- Automatically rebuilds on changes using production bundling (no React duplication)
- Serves the built app on http://localhost:3001 with full API proxy support
- Connects to remote DHIS2 instance (`https://dev.emisuganda.org/emisdev`)

**How it works:**
1. `nodemon` watches `src/` and triggers `yarn build:dev` on changes
2. `dev-server.js` (custom Express server) serves the built app
3. API requests to `/api/*` are proxied to DHIS2 instance
4. Authentication requests to `/dhis-web-commons-security/*` are also proxied

**Why this works:**
- Production bundling automatically deduplicates React dependencies
- Avoids the React duplicate instance error from dev server
- Fast rebuild times (typically 10-15 seconds)
- Full API proxy support (unlike `yarn start` port 3000)
- Near-instant page reload in browser

**Dev server configuration:**
- Server file: `dev-server.js` in project root
- Target instance: `https://dev.emisuganda.org/emisdev`
- To change target, edit `DHIS2_INSTANCE` in `dev-server.js`

**Alternative - Traditional Dev Server:**
```bash
yarn start  # Opens on port 3000, but has React error with NextUI
```
Note: `yarn start` still has the React duplicate instance issue. Use `yarn dev:watch` instead for a better development experience.

## Version Information

Current version: 1.9.9

Update version in both:
- package.json: `"version": "1.9.9"`
- package.json: `"manifest.webapp": { "version": "1.9.9" }`
- .env: `REACT_APP_VERSION="1.9.9"`

