# Biomarker Chart Debugging Guide

## Overview
The biomarker chart is not populating data. This guide will help you systematically identify and fix the issue.

## Step-by-Step Debugging Process

### 1. **Check Browser Console**
Open your browser's Developer Tools (F12) and go to the Console tab. Look for these debug messages:

#### Expected Log Messages:
- `🔍 Fetching lab chart data from /api/labs/chart-data`
- `📡 API Response: {status: 200, ...}`
- `📊 Raw API Data: {success: true, dataLength: X, ...}`
- `🔍 BiomarkerFilter - Data State: {isLoading: false, hasData: true, ...}`
- `📊 BiomarkerHistoryChart - Received series: {seriesCount: X, ...}`

#### Common Error Patterns:
- **401 Unauthorized**: Authentication issue
- **500 Internal Server Error**: Server-side database or processing error
- **CORS Error**: Cross-origin request blocked
- **Network Error**: Connection issue

### 2. **Test API Endpoints Directly**

#### Test Authentication:
```bash
curl -X GET "https://your-app-domain.com/api/labs/chart-data" \
  -H "Content-Type: application/json" \
  -b "cookie_string_from_browser"
```

#### Test Debug Endpoint:
```bash
curl -X GET "https://your-app-domain.com/api/labs/chart-data/debug" \
  -H "Content-Type: application/json" \
  -b "cookie_string_from_browser"
```

### 3. **Check Network Tab**
In browser DevTools → Network tab:
1. Refresh the /labs page
2. Look for the request to `/api/labs/chart-data`
3. Check the response status and data

### 4. **Common Issues and Solutions**

#### Issue 1: 401 Unauthorized
**Symptoms**: API returns 401, user not authenticated
**Solution**: Check session/cookie issues, may need to re-login

#### Issue 2: Empty Data Array
**Symptoms**: API returns `{success: true, data: []}`
**Causes**: 
- No biomarker data in database
- User has no lab results
- Biomarker processing failed

#### Issue 3: CORS Issues
**Symptoms**: Browser blocks request, CORS error in console
**Solution**: Check server CORS configuration in `server/index.ts`

#### Issue 4: Database Connection Issues
**Symptoms**: 500 errors, database connection failures in logs
**Solution**: Check AWS RDS connection, environment variables

### 5. **Server-Side Debugging**

#### Check Server Logs:
Look for these patterns in your App Runner logs:
- `Retrieving biomarker chart data`
- `Retrieved biomarker data`
- Database connection errors
- Authentication middleware logs

#### Manual Database Check:
If you have database access, run:
```sql
-- Check if user has lab results
SELECT COUNT(*) FROM lab_results WHERE user_id = YOUR_USER_ID;

-- Check if user has biomarker data
SELECT COUNT(*) FROM biomarker_results br
JOIN lab_results lr ON br.lab_result_id = lr.id
WHERE lr.user_id = YOUR_USER_ID;

-- Check processing status
SELECT * FROM biomarker_processing_status bps
JOIN lab_results lr ON bps.lab_result_id = lr.id
WHERE lr.user_id = YOUR_USER_ID;
```

### 6. **Frontend Component Flow**

The data flows through these components:
1. `useLabChartData()` hook fetches from `/api/labs/chart-data`
2. `BiomarkerFilter` displays available biomarkers
3. `BiomarkerHistoryChart` renders selected biomarkers
4. URL state manages selected biomarkers

### 7. **Quick Fixes to Try**

#### Force Refetch:
1. Open browser console
2. Go to /labs page
3. Run: `window.location.reload()`
4. Check console for new debug messages

#### Clear Cache:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear site data in DevTools → Application → Storage

#### Test with Different User:
1. Login with different account
2. Check if problem persists
3. This helps isolate user-specific vs. system-wide issues

## Expected Behavior

### When Working Correctly:
1. Page loads → API call to `/api/labs/chart-data`
2. Returns data array with biomarkers
3. Filter shows buttons for each biomarker
4. Selecting biomarkers updates URL and chart
5. Chart renders with data points

### Debug Output Example:
```javascript
// Console should show:
🔍 Fetching lab chart data from /api/labs/chart-data
📡 API Response: {status: 200, statusText: "OK"}
📊 Raw API Data: {success: true, dataLength: 45, sampleData: [...]}
🔍 BiomarkerFilter - Data State: {isLoading: false, hasData: true, allBiomarkers: 12}
📊 BiomarkerHistoryChart - Received series: {seriesCount: 2, seriesNames: ["Glucose", "Cholesterol"]}
```

## Next Steps

1. **Check browser console first** - this will show you exactly where the failure occurs
2. **Test API endpoints directly** - isolate frontend vs backend issues  
3. **Check server logs** - identify database or authentication problems
4. **Compare with working environment** - if you have a working local/staging environment

## Contact Information

If you continue to have issues, provide:
- Browser console output
- Network tab screenshots
- Server log excerpts
- Steps taken from this guide 