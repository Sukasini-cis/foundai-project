const express = require('express');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

const router = express.Router();

const ONLINE_WINDOW_MS = 2 * 60 * 1000;

// ---------- helpers ----------
const isId = (v) => mongoose.Types.ObjectId.isValid(v);
const same = (a, b) => String(a) === String(b);

function avatarFor(user) {
  const seed = String((user && (user._id || user.username || user.fullName)) || 'x');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 70;
  return 'https://i.pravatar.cc/80?img=' + (hash + 1);
}

function isOnline(user) {
  return !!(user && user.online && user.lastSeen &&
    Date.now() - new Date(user.lastSeen).getTime() < ONLINE_WINDOW_MS);
}

function unreadFor(convo, userId) {
  const row = (convo.unread || []).find((u) => same(u.user, userId));
  return row ? row.count : 0;
}

function setUnread(convo, userId, count) {
  const row = (convo.unread || []).find((u) => same(u.user, userId));
  if (row) row.count = count;
  else convo.unread.push({ user: userId, count });
}

function mapMessage(m, userId) {
  return {
    _id: m._id,
    sender: same(m.senderId, userId) ? 'me' : 'them',
    text: m.text,
    time: m.time,
    itemMatch: m.itemMatch,
    verification: m.verification
  };
}

// Shape a conversation the way the messages page expects, from `userId`'s side.
// `users` is a map of id -> User doc for the participants.
function present(convo, userId, users, withMessages) {
  const peerId = convo.participants.find((p) => !same(p, userId));
  const peer = users[String(peerId)];
  const count = unreadFor(convo, userId);

  const out = {
    _id: convo._id,
    name: peer ? peer.fullName : 'Deleted user',
    avatar: avatarFor(peer || { _id: peerId }),
    peer: peer ? {
      _id: peer._id,
      fullName: peer.fullName,
      username: peer.username,
      online: isOnline(peer)
    } : null,
    online: isOnline(peer),
    lastMessage: convo.lastMessage,
    lastMessageTime: convo.lastMessageTime,
    lastMessageIsMine: convo.lastSenderId ? same(convo.lastSenderId, userId) : false,
    unread: count > 0,
    unreadCount: count,
    identityVerified: convo.identityVerified,
    createdAt: convo.createdAt
  };
  if (withMessages) out.messages = convo.messages.map((m) => mapMessage(m, userId));
  return out;
}

async function loadUsers(convos) {
  const ids = new Set();
  convos.forEach((c) => c.participants.forEach((p) => ids.add(String(p))));
  const docs = await User.find({ _id: { $in: [...ids] } })
    .select('fullName username organization department online lastSeen');
  const map = {};
  docs.forEach((u) => { map[String(u._id)] = u; });
  return map;
}

// Loads a conversation and makes sure `userId` is actually part of it.
async function getMyConversation(req, res) {
  const userId = req.body.userId || req.query.userId;
  if (!isId(userId)) {
    res.status(400).json({ error: 'A valid userId is required.' });
    return null;
  }
  if (!isId(req.params.id)) {
    res.status(404).json({ error: 'Conversation not found.' });
    return null;
  }
  const convo = await Conversation.findById(req.params.id);
  if (!convo) {
    res.status(404).json({ error: 'Conversation not found.' });
    return null;
  }
  if (!convo.participants.some((p) => same(p, userId))) {
    res.status(403).json({ error: 'You are not part of this conversation.' });
    return null;
  }
  return { convo, userId };
}

// ---------- GET /api/conversations/people?userId= ----------
// Every registered user except me (from the DB), with online status and the
// id of any existing thread with them.
router.get('/people', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!isId(userId)) return res.status(400).json({ error: 'A valid userId is required.' });

    const users = await User.find({ _id: { $ne: userId } })
      .select('fullName username organization department online lastSeen')
      .sort({ fullName: 1 });

    const convos = await Conversation.find({ participants: userId }).select('participants');
    const threadWith = {};
    convos.forEach((c) => {
      const other = c.participants.find((p) => !same(p, userId));
      if (other) threadWith[String(other)] = c._id;
    });

    res.json(users.map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      username: u.username,
      organization: u.organization,
      department: u.department,
      avatar: avatarFor(u),
      online: isOnline(u),
      conversationId: threadWith[String(u._id)] || null
    })));
  } catch (error) {
    console.error('Error fetching people:', error);
    res.status(500).json({ error: 'Failed to fetch people.' });
  }
});

// ---------- GET /api/conversations?userId= ----------
// My inbox only.
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!isId(userId)) return res.status(400).json({ error: 'A valid userId is required.' });

    const convos = await Conversation.find({
      participants: userId,
      hiddenFor: { $ne: userId }
    }).sort({ lastMessageTime: -1 });

    const users = await loadUsers(convos);
    res.json(convos.map((c) => present(c, userId, users, false)));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

// ---------- POST /api/conversations/start ----------
// Body: { userId, participantId } -> find or create the private thread.
router.post('/start', async (req, res) => {
  try {
    const { userId, participantId } = req.body;
    if (!isId(userId) || !isId(participantId)) {
      return res.status(400).json({ error: 'userId and participantId are required.' });
    }
    if (same(userId, participantId)) {
      return res.status(400).json({ error: 'You cannot message yourself.' });
    }

    const [me, other] = await Promise.all([User.findById(userId), User.findById(participantId)]);
    if (!me || !other) return res.status(404).json({ error: 'User not found.' });

    const pairKey = [String(userId), String(participantId)].sort().join('_');

    let convo = await Conversation.findOne({ pairKey });
    if (!convo) {
      try {
        convo = await Conversation.create({
          participants: [userId, participantId],
          pairKey,
          unread: [{ user: userId, count: 0 }, { user: participantId, count: 0 }],
          // empty threads stay hidden from the other person until a message is sent
          hiddenFor: [participantId]
        });
      } catch (e) {
        if (e.code === 11000) convo = await Conversation.findOne({ pairKey }); // race
        else throw e;
      }
    }

    // Re-opening a thread I had removed brings it back for me.
    convo.hiddenFor = convo.hiddenFor.filter((u) => !same(u, userId));
    await convo.save();

    const users = await loadUsers([convo]);
    res.status(200).json(present(convo, userId, users, true));
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ error: 'Failed to start conversation.' });
  }
});

// ---------- GET /api/conversations/:id/messages?userId=&since= ----------
router.get('/:id/messages', async (req, res) => {
  try {
    const ctx = await getMyConversation(req, res);
    if (!ctx) return;
    const { convo, userId } = ctx;

    let msgs = convo.messages;
    if (req.query.since) {
      const since = new Date(req.query.since);
      if (!isNaN(since.getTime())) msgs = msgs.filter((m) => new Date(m.time) >= since);
    }

    res.json({
      messages: msgs.map((m) => mapMessage(m, userId)),
      lastMessageTime: convo.lastMessageTime
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// ---------- POST /api/conversations/:id/messages ----------
// Body: { userId, text }. The other participant gets it in their inbox.
router.post('/:id/messages', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const ctx = await getMyConversation(req, res);
    if (!ctx) return;
    const { convo, userId } = ctx;

    const clean = String(text).trim();
    const now = new Date();

    convo.messages.push({ senderId: userId, text: clean, time: now });
    convo.lastMessage = clean;
    convo.lastMessageTime = now;
    convo.lastSenderId = userId;

    // The recipient gets +1 unread and the thread (re)appears in their inbox.
    const peerId = convo.participants.find((p) => !same(p, userId));
    setUnread(convo, peerId, unreadFor(convo, peerId) + 1);
    setUnread(convo, userId, 0);
    convo.hiddenFor = [];

    await convo.save();

    const users = await loadUsers([convo]);
    res.status(201).json(present(convo, userId, users, true));
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// ---------- PUT /api/conversations/:id/read ----------
// Marks the thread read for ME only.
router.put('/:id/read', async (req, res) => {
  try {
    const ctx = await getMyConversation(req, res);
    if (!ctx) return;
    const { convo, userId } = ctx;

    setUnread(convo, userId, 0);
    await convo.save();

    const users = await loadUsers([convo]);
    res.json(present(convo, userId, users, false));
  } catch (error) {
    console.error('Error updating read status:', error);
    res.status(500).json({ error: 'Failed to update read status.' });
  }
});

// ---------- PUT /api/conversations/:id/verify-identity ----------
router.put('/:id/verify-identity', async (req, res) => {
  try {
    const ctx = await getMyConversation(req, res);
    if (!ctx) return;
    const { convo, userId } = ctx;

    convo.identityVerified = true;
    await convo.save();

    const users = await loadUsers([convo]);
    res.json({ verified: true, conversation: present(convo, userId, users, false) });
  } catch (error) {
    console.error('Error validating identity:', error);
    res.status(500).json({ error: 'Failed to validate identity.' });
  }
});

// ---------- DELETE /api/conversations/:id?userId= ----------
// Removes the thread from MY inbox only; the other person keeps it.
router.delete('/:id', async (req, res) => {
  try {
    const ctx = await getMyConversation(req, res);
    if (!ctx) return;
    const { convo, userId } = ctx;

    if (!convo.hiddenFor.some((u) => same(u, userId))) convo.hiddenFor.push(userId);
    setUnread(convo, userId, 0);
    await convo.save();

    res.json({ message: 'Conversation removed from your inbox.', id: req.params.id });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation.' });
  }
});

module.exports = router;
