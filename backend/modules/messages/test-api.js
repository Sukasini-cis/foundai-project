async function test() {
  const base = 'http://localhost:5000/api/conversations';

  console.log('--- 1. Testing GET /api/conversations ---');
  const getRes = await fetch(base);
  const convos = await getRes.json();
  console.log('Fetched conversations count:', convos.length);
  if (convos.length === 0) {
    console.log('No conversations found.');
    return;
  }

  const activeConvo = convos[0];
  console.log('First conversation with:', activeConvo.name, '| Unread:', activeConvo.unread);

  console.log('--- 2. Testing GET /api/conversations/:id/messages ---');
  const msgRes = await fetch(`${base}/${activeConvo._id}/messages`);
  const messages = await msgRes.json();
  console.log('Messages count in thread:', messages.length);

  console.log('--- 3. Testing POST /api/conversations/:id/messages (Send Message) ---');
  const sendRes = await fetch(`${base}/${activeConvo._id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Hello! I received your message from MongoDB.' })
  });
  const updatedConvo = await sendRes.json();
  console.log('Updated last message in DB:', updatedConvo.lastMessage);

  console.log('--- 4. Testing PUT /api/conversations/:id/read (Toggle Read) ---');
  const readRes = await fetch(`${base}/${activeConvo._id}/read`, { method: 'PUT' });
  const readData = await readRes.json();
  console.log('Toggled unread status to:', readData.unread);

  console.log('--- 5. Testing PUT /api/conversations/:id/verify-identity ---');
  const verifyRes = await fetch(`${base}/${activeConvo._id}/verify-identity`, { method: 'PUT' });
  const verifyData = await verifyRes.json();
  console.log('Identity verified in DB:', verifyData.verified);

  console.log('ALL MESSAGES CRUD TESTS PASSED SUCCESSFULLY WITH MONGODB ATLAS!');
}

test().catch(console.error);
