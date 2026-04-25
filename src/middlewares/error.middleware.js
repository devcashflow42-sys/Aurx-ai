const errorHandler = (err, req, res, _next) => {
  const status  = err.statusCode || err.status || 500;
  const isProd  = process.env.NODE_ENV === 'production';

  // En producción, los errores 500 no exponen el mensaje interno
  const message = (status < 500 || !isProd)
    ? (err.message || 'Internal Server Error')
    : 'Internal Server Error';

  if (!isProd) console.error('[Error]', err);

  res.status(status).json({ success: false, message });
};

export default errorHandler;
