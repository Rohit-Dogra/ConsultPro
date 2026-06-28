import AgoraRTC from 'agora-rtc-sdk-ng';

// This function can be called from the browser console to test Agora connectivity
export async function testAgoraConnection() {
  try {
    console.log("Testing Agora connection...");
    
    // Create client
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    console.log("Client created");
    
    // Generate random channel name and UID
    const channelName = "test-" + Math.random().toString(36).substring(7);
    const uid = Math.floor(Math.random() * 10000);
    
    console.log(`Requesting token for channel: ${channelName} with UID: ${uid}`);
    
    // Request token from server with better error handling
    let response;
    try {
      response = await fetch('/api/agora/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelName,
          uid
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server responded with status: ${response.status}`);
        console.error(`Response body: ${errorText}`);
        throw new Error(`Failed to get token from server: ${response.status} ${errorText}`);
      }
    } catch (fetchError) {
      console.error("Fetch error details:", fetchError);
      throw fetchError;
    }
    
    const data = await response.json();
    console.log("Token response data:", data);
    
    if (!data.token) {
      throw new Error('Token not found in server response');
    }
    
    const token = data.token;
    
    console.log(`Token received, joining channel: ${channelName} with UID: ${uid}`);
    
    // Join channel with token
    await client.join('1586fac71f52450497da9c0b5e998a15', channelName, token, uid);
    console.log("Join successful!");
    
    // Leave channel
    await client.leave();
    console.log("Left channel");
    
    return {
      success: true,
      message: "Agora connection test successful"
    };
  } catch (error) {
    console.error("Agora connection test failed:", error);
    
    return {
      success: false,
      message: `Agora connection test failed: ${error.message}`,
      error: error
    };
  }
}

// For testing without server (temporary)
export async function testAgoraConnectionWithoutServer() {
  try {
    console.log("Testing Agora connection without server...");
    
    // Create client
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    console.log("Client created");
    
    // Generate random channel name and UID
    const channelName = "test-" + Math.random().toString(36).substring(7);
    const uid = Math.floor(Math.random() * 10000);
    
    console.log(`Requesting token for channel: ${channelName} with UID: ${uid}`);
    
    // Request token from server using the existing endpoint
    const response = await fetch('/api/agora/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channelName,
        uid
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get token from server');
    }
    
    const data = await response.json();
    const token = data.token;
    
    console.log(`Token received, joining channel: ${channelName} with UID: ${uid}`);
    
    // Join channel with token
    await client.join('1586fac71f52450497da9c0b5e998a15', channelName, token, uid);
    console.log("Join successful!");
    
    // Leave channel
    await client.leave();
    console.log("Left channel");
    
    return {
      success: true,
      message: "Agora connection test successful"
    };
  } catch (error) {
    console.error("Agora connection test failed:", error);
    
    return {
      success: false,
      message: `Agora connection test failed: ${error.message}`,
      error: error
    };
  }
}

// Add this function for testing with a temporary token
export async function testAgoraWithStaticToken() {
  try {
    console.log("Testing Agora with static token...");
    
    // Create client
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    console.log("Client created");
    
    // Generate random channel name and UID
    const channelName = "test-" + Math.random().toString(36).substring(7);
    const uid = Math.floor(Math.random() * 10000);
    
    //  only for testing Generate this token from the Agora Console
    //  Project > Temp Token Generator bha ja kar generate karlo
    const tempToken = "007eJxTYDA/2BwYbvI0z1hHbnbI5EtMkhoamhEvekR4VvfyzLCX+avAYGhqYZaWmGxumGZqZGJqYGJpnpJomWyQZJpqaWmRaGj6Pks3oyGQkcEpjpWFkQECQXwehpLU4hLd5IzEvLzUHAYGAPjaHe8=";
    
    console.log(`Using static token for channel: ${channelName} with UID: ${uid}`);
    
    // Join channel with token
    await client.join('1586fac71f52450497da9c0b5e998a15', channelName, tempToken, uid);
    console.log("Join successful!");
    
    // Leave channel
    await client.leave();
    console.log("Left channel");
    
    return {
      success: true,
      message: "Agora connection test successful"
    };
  } catch (error) {
    console.error("Agora connection test failed:", error);
    
    return {
      success: false,
      message: `Agora connection test failed: ${error.message}`,
      error: error
    };
  }
}

// Make it available globally for testing
window.testAgoraConnection = testAgoraConnection;
window.testAgoraConnectionWithoutServer = testAgoraConnectionWithoutServer;
window.testAgoraWithStaticToken = testAgoraWithStaticToken;

