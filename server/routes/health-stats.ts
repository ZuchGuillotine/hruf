// other imports and code ...

// Assuming this code is within a POST route handler for saving health stats
const healthStatsData = {
        userId: req.user.id,
        weight: req.body.weight || null,
        height: req.body.height || null,
        gender: req.body.gender || null,
        ethnicity: req.body.ethnicity || null,
        dateOfBirth: req.body.dateOfBirth || null,
        averageSleep: totalMinutes > 0 ? totalMinutes : null,
        profilePhotoUrl: req.body.profilePhotoUrl || null,
        allergies: req.body.allergies?.trim() || null,
        lastUpdated: new Date()
      };

// Log the data being saved
console.log('Saving health stats:', healthStatsData);

// Use upsert to either update or insert
await db
  .insert(healthStats)
  .values(healthStatsData)
  .onConflictDoUpdate({
    target: healthStats.userId,
    set: healthStatsData
  });

// ... rest of the route handler code to save healthStatsData ...


// ... rest of the file ...