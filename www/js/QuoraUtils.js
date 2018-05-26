async function getData(url, qid, accessToken) {
  var config = {
    "headers": {
      "X-Access-Token": accessToken
    }
  }
  let data = await (await fetch(url + qid, config)).json();
  return data;
}

async function postData(url, json) {
  let config = {
    "method": "POST",
    "body": JSON.stringify(json)
  };
  let data = await (await fetch(url, config));
  return data;
}

function authenticationRedirect(accessToken, pingurl, loginurl) {
  var config = {
    "headers": {
      "X-Access-Token": accessToken
    }
  }
  console.log("config: "+ JSON.stringify(config, null,2));
  fetch(pingurl, config)
    .then(function(response) {
      console.log("Auth Check Response Status: " + response.status);
      if (response.status == '401')
        window.location.href = loginurl;
      return response;
    });
}
