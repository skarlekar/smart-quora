export COMPOSER_CARD=admin@smartquora-bna
export COMPOSER_NAMESPACES=always
export COMPOSER_AUTHENTICATION=true
export COMPOSER_TLS=true
export COMPOSER_WEBSOCKETS=true
export COMPOSER_PROVIDERS='{
  "google": {
    "provider": "google",
    "module": "passport-google-oauth2",
    "clientID": "1031107078869-2dp65tgof4esu4jjh2agi0a23gu42u2v.apps.googleusercontent.com",
    "clientSecret": "5ohTUSSXytinCfzoX7rTC0PI",
    "authPath": "/auth/google",
    "callbackURL": "/auth/google/callback",
    "scope": "https://www.googleapis.com/auth/plus.login",
    "successRedirect": "/",
    "failureRedirect": "/"
  }
}'
composer-rest-server

