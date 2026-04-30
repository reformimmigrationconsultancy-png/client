const mongoose = require('mongoose');
const { Conversation } = require('./server/src/models/Conversation');
require('dotenv').config({ path: './server/.env' });

async function checkConversations() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const conversations = await Conversation.find({}).limit(10);
    console.log('Conversations sample:');
    conversations.forEach(c => {
      console.log(`ID: ${c._id}, Platform: ${c.platform}, Last Message: ${c.lastMessage}`);
    });
    
    const whatsappConversations = await Conversation.find({ platform: 'whatsapp' });
    console.log(`\nWhatsApp Conversations count: ${whatsappConversations.length}`);
    whatsappConversations.forEach(c => {
      console.log(`ID: ${c._id}, Platform: ${c.platform}, Last Message: ${c.lastMessage}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkConversations();
