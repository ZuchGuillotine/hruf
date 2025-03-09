// Handle streaming response
  if (req.query.stream === 'true') {
    // Set appropriate headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx
    
    // Begin streaming response
    return await queryWithAI(contextualizedMessages, userId, res);
  }
  
  // For non-streaming responses, continue with standard approach
  const { response } = await queryWithAI(contextualizedMessages, userId);
  
  // If user is authenticated, store the query in query_chats table (not qualitative_logs)
  if (userId) {
    await db
      .insert(queryChats)
      .values({
        userId,
        messages: contextualizedMessages.concat({ role: 'assistant', content: response }),
        metadata: {
          savedAt: new Date().toISOString(),
          query: userQuery
        }
      });
  }