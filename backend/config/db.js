const mongoose = require('mongoose');
const dns = require('dns');

// On Windows, Node's default c-ares DNS resolver can fail with querySrv ECONNREFUSED for SRV records.
// Setting public DNS servers (Google / Cloudflare) ensures reliable Atlas SRV resolution.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  // Fallback to system default if setting custom servers is restricted
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || !uri.trim()) {
    console.error('Error: MONGO_URI is missing. Please define MONGO_URI in backend/.env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
