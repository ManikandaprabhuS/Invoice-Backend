const mongoose = require('mongoose');
const dns = require('node:dns');

module.exports = async () => {
  const dnsServers = process.env.DNS_SERVERS
    ?.split(',')
    .map(server => server.trim())
    .filter(Boolean);

  if (dnsServers?.length) {
    dns.setServers(dnsServers);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('[DB] MongoDB connected'); // ✅ log output
};
