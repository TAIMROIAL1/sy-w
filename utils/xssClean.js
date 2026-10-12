// Same behaviour as the unmaintained xss-clean package: escape "<" in body, query and params.
const clean = data => {
  if(data && typeof data === 'object') return JSON.parse(JSON.stringify(data).replace(/</g, '&lt;').trim());
  return typeof data === 'string' ? data.replace(/</g, '&lt;').trim() : data;
};

module.exports = () => (req, res, next) => {
  if(req.body) req.body = clean(req.body);
  if(req.query) req.query = clean(req.query);
  if(req.params) req.params = clean(req.params);
  next();
};
