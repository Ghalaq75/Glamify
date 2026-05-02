function getHealth(req, res) {
  res.json({ success: true, data: { status: 'ok' }, message: 'Server is healthy' });
}

module.exports = { getHealth };
