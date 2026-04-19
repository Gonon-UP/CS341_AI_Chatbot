module.exports = function requireAuthPage(req, res, next) {
  // allow auth endpoints + login page
  if (
    req.path === '/login' ||
    req.path === '/signup' ||
    req.path.startsWith('/api/auth/')
  ) return next();

  // allow static assets
  if (
    req.path.startsWith('/stylesheets/') ||
    req.path.startsWith('/javascripts/') ||
    req.path.startsWith('/images/') ||
    req.path.startsWith('/uploads/')
  ) return next();

  const loggedIn = !!(req.session && req.session.userId);
  if (loggedIn) return next();

  // If it's an API call, return JSON 401 (don't redirect to HTML)
  const wantsJSON =
    req.path.startsWith('/api/') ||
    req.headers.accept?.includes('application/json') ||
    req.xhr;

  if (wantsJSON) {
    return res.status(401).json({ error: 'Not signed in' });
  }

  return res.redirect('/login');
};
