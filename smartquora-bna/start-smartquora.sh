export COMPOSER_CARD=admin@smartquora-bna
export COMPOSER_NAMESPACES=always
export COMPOSER_AUTHENTICATION=true
export COMPOSER_TLS=true
export COMPOSER_WEBSOCKETS=true
export COMPOSER_MULTIUSER=true
export COMPOSER_PROVIDERS='{
  "google": {
    "provider": "google",
    "module": "passport-google-oauth2",
    "clientID": "your-client-id",
    "clientSecret": "your-client-secret",
    "authPath": "/auth/google",
    "callbackURL": "/auth/google/callback",
    "scope": "https://www.googleapis.com/auth/plus.login",
    "successRedirect": "http://your-host:8081/index.html",
    "failureRedirect": "/"
  }
}'
export COMPOSER_DATASOURCES='{
    "db": {
        "name": "db",
        "connector": "mongodb",
        "host": "yourhost.mlab.com",
        "port": "31740",
	"database": "smartquora",
	"user": "quora-admin",
	"password": "your-password"
    }
}'
nohup composer-rest-server & 

