// Timestamp tests expect Central European time regardless of the machine/CI timezone
module.exports = async () => {
  process.env.TZ = 'Europe/Berlin';
};
