export COMPOSER_CARD=admin@smartquora-bna
export COMPOSER_NAMESPACES=always
export COMPOSER_AUTHENTICATION=true
export COMPOSER_TLS=true
export COMPOSER_WEBSOCKETS=true
export COMPOSER_PROVIDERS='{
  "auth0": {
    "provider": "auth0",
    "module": "passport-auth0",
    "domain": "smartquora.auth0.com",
    "clientID": "KBVVrYYF9V19zAFNe4Tj7NRs8WoqXsKL",
    "clientSecret": "xNGbYZXdnQpqJQGw6kJkTjnX-9W7OzQZn3mxsA2eC_ShPyAzzYd3nsT7FjVLJY1B",
    "authPath": "/auth/auth0",
    "callbackURL": "/auth/auth0/callback",
    "successRedirect": "/",
    "failureRedirect": "/",
    "scope": "openid email",
    "audience": "https://smartquora.auth0.com/api/V2/"
  }
}'
composer-rest-server

