export COMPOSER_CARD=admin@smartquora-bna
export COMPOSER_NAMESPACES=always
export COMPOSER_AUTHENTICATION=true
export COMPOSER_TLS=true
export COMPOSER_WEBSOCKETS=true
export COMPOSER_PROVIDERS='{
  "github": {
    "provider": "github",
    "module": "passport-github",
    "clientID": "911100f6d993f0b6e0fa",
    "clientSecret": "725fd98c2cf66c7bbc933f4f67cdb61b8e375a1d",
    "authPath": "/auth/github",
    "callbackURL": "/auth/github/callback",
    "successRedirect": "/",
    "failureRedirect": "/"
  }
}'
#composer-rest-server -c admin@grants-bna -n always -w true -t true -a true &
#nohup composer-rest-server &
composer-rest-server 

