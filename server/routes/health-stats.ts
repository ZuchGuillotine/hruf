// other imports and code ...

// Assuming this code is within a POST route handler for saving health stats
const healthStatsData = {
        weight: req.body.weight || null,
        height: req.body.height || null,
        gender: req.body.gender || null,
        dateOfBirth: req.body.dateOfBirth || null,
        averageSleep: totalMinutes > 0 ? totalMinutes : null,
        profilePhotoUrl: req.body.profilePhotoUrl || null,
        allergies: req.body.allergies || null,
        lastUpdated: new Date()
      };

// ... rest of the route handler code to save healthStatsData ...


// ... rest of the file ...